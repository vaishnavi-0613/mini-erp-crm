import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthRequest, ApiError } from '../types';

export async function createCustomer(req: AuthRequest, res: Response) {
  const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate } = req.body;

  const customer = await prisma.customer.create({
    data: {
      name,
      mobile,
      email: email || null,
      businessName: businessName || null,
      gstNumber: gstNumber || null,
      customerType: customerType || 'RETAIL',
      address: address || null,
      status: status || 'LEAD',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  res.status(201).json({ success: true, data: customer });
}

export async function listCustomers(req: AuthRequest, res: Response) {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
  const search = String(req.query.search || '').trim();
  const status = req.query.status ? String(req.query.status) : undefined;
  const customerType = req.query.customerType ? String(req.query.customerType) : undefined;

  const where: Prisma.CustomerWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(customerType ? { customerType: customerType as any } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCustomer(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  res.status(200).json({ success: true, data: customer });
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Customer not found');
  }

  const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate } = req.body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(mobile !== undefined ? { mobile } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(businessName !== undefined ? { businessName: businessName || null } : {}),
      ...(gstNumber !== undefined ? { gstNumber: gstNumber || null } : {}),
      ...(customerType !== undefined ? { customerType } : {}),
      ...(address !== undefined ? { address: address || null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(followUpDate !== undefined ? { followUpDate: followUpDate ? new Date(followUpDate) : null } : {}),
    },
  });

  res.status(200).json({ success: true, data: customer });
}

export async function addCustomerNote(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { note } = req.body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const created = await prisma.customerNote.create({
    data: {
      customerId: id,
      note,
      createdById: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: created });
}
