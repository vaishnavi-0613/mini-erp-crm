import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthRequest, ApiError } from '../types';
import { generateChallanNumber } from '../utils/challanNumber';

// Creates a challan as DRAFT or CONFIRMED.
// - DRAFT: no stock impact yet, just reserves nothing.
// - CONFIRMED: stock is reduced immediately; fails with a clear error
//   if any line item would take stock negative.
// Product name/sku/price are snapshotted onto each ChallanItem so the
// challan remains accurate even if the product is later edited or deleted.
export async function createChallan(req: AuthRequest, res: Response) {
  const { customerId, status, items } = req.body as {
    customerId: string;
    status?: 'DRAFT' | 'CONFIRMED';
    items: { productId: string; quantity: number }[];
  };

  const finalStatus = status || 'DRAFT';

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Load all products referenced by the challan up front
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      if (finalStatus === 'CONFIRMED' && product.currentStock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}" (SKU ${product.sku}). Available: ${product.currentStock}, requested: ${item.quantity}`
        );
      }
    }

    const challanNumber = await generateChallanNumber();
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId,
        status: finalStatus,
        totalQuantity,
        createdById: req.user?.userId,
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              productName: product.name,
              productSku: product.sku,
              unitPrice: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true, customer: true },
    });

    // If confirmed at creation time, reduce stock and log the movement now
    if (finalStatus === 'CONFIRMED') {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: product.currentStock - item.quantity },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales challan ${challanNumber}`,
            createdById: req.user?.userId,
          },
        });
      }
    }

    return challan;
  }, {
    maxWait: 15000,
    timeout: 15000,
  });

  res.status(201).json({ success: true, data: result });
}

export async function listChallans(req: AuthRequest, res: Response) {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
  const status = req.query.status ? String(req.query.status) : undefined;
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
  const search = String(req.query.search || '').trim();

  const where: Prisma.ChallanWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(customerId ? { customerId } : {}),
    ...(search ? { challanNumber: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [total, challans] = await prisma.$transaction([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { customer: { select: { name: true, businessName: true } }, items: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: challans,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getChallan(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!challan) {
    throw new ApiError(404, 'Challan not found');
  }

  res.status(200).json({ success: true, data: challan });
}

// Transitions a challan's status.
// DRAFT -> CONFIRMED: reduces stock now (validated against current stock).
// DRAFT/CONFIRMED -> CANCELLED: if it was CONFIRMED, restores stock.
// CONFIRMED challans cannot be edited back to DRAFT (would misrepresent
// the stock ledger), so that transition is rejected.
export async function updateChallanStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status: newStatus } = req.body as { status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED' };

  const result = await prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) {
      throw new ApiError(404, 'Challan not found');
    }

    if (challan.status === 'CANCELLED') {
      throw new ApiError(400, 'Cancelled challans cannot be modified');
    }

    if (challan.status === 'CONFIRMED' && newStatus === 'DRAFT') {
      throw new ApiError(400, 'A confirmed challan cannot be moved back to draft');
    }

    // DRAFT -> CONFIRMED: reduce stock
    if (challan.status === 'DRAFT' && newStatus === 'CONFIRMED') {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new ApiError(404, `Product ${item.productName} no longer exists`);
        }
        if (product.currentStock < item.quantity) {
          throw new ApiError(
            400,
            `Insufficient stock for "${item.productName}" (SKU ${item.productSku}). Available: ${product.currentStock}, requested: ${item.quantity}`
          );
        }
      }
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: product!.currentStock - item.quantity },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales challan ${challan.challanNumber} confirmed`,
            createdById: req.user?.userId,
          },
        });
      }
    }

    // CONFIRMED -> CANCELLED: restore stock
    if (challan.status === 'CONFIRMED' && newStatus === 'CANCELLED') {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: (product?.currentStock ?? 0) + item.quantity },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Sales challan ${challan.challanNumber} cancelled - stock restored`,
            createdById: req.user?.userId,
          },
        });
      }
    }

    const updated = await tx.challan.update({
      where: { id },
      data: { status: newStatus },
      include: { items: true, customer: true },
    });

    return updated;
  }, {
    maxWait: 15000,
    timeout: 15000,
  });

  res.status(200).json({ success: true, data: result });
}
