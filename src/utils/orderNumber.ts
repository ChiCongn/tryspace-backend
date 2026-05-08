import { prisma } from "../lib/prisma";

function formatDatePart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export async function generate(): Promise<string> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const sequence = String(count + 1).padStart(4, "0");

  return `TS-${formatDatePart(now)}-${sequence}`;
}
