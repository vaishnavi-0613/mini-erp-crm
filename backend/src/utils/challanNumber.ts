import { prisma } from '../config/db';

// Generates challan numbers like CH-2026-000123.
// Uses the count of challans created so far in the current year
// as the running sequence. Wrapped in a transaction by the caller
// when used alongside the challan insert to reduce race conditions.
export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const countThisYear = await prisma.challan.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
  });

  const nextSeq = countThisYear + 1;
  const padded = String(nextSeq).padStart(6, '0');
  return `CH-${year}-${padded}`;
}
