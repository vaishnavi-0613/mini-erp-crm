import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string, password: string, role: Role) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: hashed, role },
  });
}

async function main() {
  console.log('Seeding test users for all roles...');

  await upsertUser('Admin User', 'admin@erp.test', 'Admin@123', Role.ADMIN);
  await upsertUser('Sales User', 'sales@erp.test', 'Sales@123', Role.SALES);
  await upsertUser('Warehouse User', 'warehouse@erp.test', 'Warehouse@123', Role.WAREHOUSE);
  await upsertUser('Accounts User', 'accounts@erp.test', 'Accounts@123', Role.ACCOUNTS);

  console.log('Seeding sample products...');
  const product1 = await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      name: 'A4 Copier Paper (Ream)',
      sku: 'SKU-001',
      category: 'Stationery',
      unitPrice: 250.0,
      currentStock: 100,
      minStockAlert: 20,
      location: 'Warehouse A',
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'SKU-002' },
    update: {},
    create: {
      name: 'Ballpoint Pen (Box of 50)',
      sku: 'SKU-002',
      category: 'Stationery',
      unitPrice: 350.0,
      currentStock: 60,
      minStockAlert: 10,
      location: 'Warehouse A',
    },
  });

  console.log('Seeding sample customer...');
  await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Ramesh Traders',
      mobile: '9876543210',
      email: 'ramesh@traders.test',
      businessName: 'Ramesh Traders Pvt Ltd',
      customerType: 'WHOLESALE',
      address: 'MG Road, Hyderabad',
      status: 'ACTIVE',
    },
  });

  console.log('Seed complete.');
  console.log({ product1: product1.sku, product2: product2.sku });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
