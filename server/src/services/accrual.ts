import prisma from '../prisma/client';

const DAILY_RATE = 0.02; // 2% per day (use only if you intend 2% each day)
const TWENTY_THREE_HOURS_MS = 23 * 60 * 60 * 1000;

export async function runAccrual(): Promise<void> {
  const now = new Date();

  const investments = await prisma.investment.findMany({
    where: { status: 'active' },
  });

  for (const inv of investments) {
    if (!inv.maturesAt) continue;

    if (inv.maturesAt <= now) {
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: 'matured' },
      });
      continue;
    }

    const lastAccrued = inv.lastAccruedAt;
    if (lastAccrued && now.getTime() - lastAccrued.getTime() < TWENTY_THREE_HOURS_MS) {
      continue;
    }

    const earned = inv.amountRand * DAILY_RATE;

    await prisma.investment.update({
      where: { id: inv.id },
      data: {
        totalEarned: { increment: earned },
        lastAccruedAt: now,
      },
    });
  }
}
