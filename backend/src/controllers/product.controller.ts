import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthRequest, ApiError } from '../types';

export async function createProduct(req: AuthRequest, res: Response) {
  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      category: category || null,
      unitPrice,
      currentStock: currentStock ?? 0,
      minStockAlert: minStockAlert ?? 0,
      location: location || null,
    },
  });

  // If the product was created with opening stock, log it as an IN movement
  if (product.currentStock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: product.currentStock,
        movementType: 'IN',
        reason: 'Opening stock',
        createdById: req.user?.userId,
      },
    });
  }

  res.status(201).json({ success: true, data: product });
}

export async function listProducts(req: AuthRequest, res: Response) {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
  const search = String(req.query.search || '').trim();
  const category = req.query.category ? String(req.query.category) : undefined;
  const lowStock = req.query.lowStock === 'true';

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const filtered = lowStock ? products.filter((p) => p.currentStock <= p.minStockAlert) : products;

  res.status(200).json({
    success: true,
    data: filtered,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getProduct(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json({ success: true, data: product });
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Product not found');
  }

  const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(sku !== undefined ? { sku } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(unitPrice !== undefined ? { unitPrice } : {}),
      ...(minStockAlert !== undefined ? { minStockAlert } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
    },
  });

  res.status(200).json({ success: true, data: product });
}

// Records a manual stock movement (IN or OUT) and adjusts currentStock.
// Used by the warehouse team for stock adjustments outside of the sales
// challan flow (e.g. purchase order receipt, damage write-off).
export async function recordStockMovement(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { quantity, movementType, reason } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const delta = movementType === 'IN' ? quantity : -quantity;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      throw new ApiError(400, `Insufficient stock. Current stock is ${product.currentStock}, cannot remove ${quantity}`);
    }

    const updated = await tx.product.update({
      where: { id },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: id,
        quantity,
        movementType,
        reason: reason || null,
        createdById: req.user?.userId,
      },
    });

   return { product: updated, movement };
  }, {
    maxWait: 15000,
    timeout: 15000,
  });

  res.status(201).json({ success: true, data: result });
}
