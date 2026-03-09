import prisma from '../prisma/client';

const DAILY_RATE = 0.02; // 2% per day
const TWENTY_THREE_HOURS_MS = 23 * 60 * 60 * 1000;

export type AccrualResult = {
  updated: number;
  matured: number;
  skipped: number;
};

export async function runAccrual(): Promise<AccrualResult> {
  const now = new Date();
  let updated = 0;
  let matured = 0;
  let skipped = 0;

  const investments = await prisma.investment.findMany({
    where: { status: 'active' },
  });

  for (const inv of investments) {
    // if no maturesAt set, skip (defensive)
    if (!inv.maturesAt) {
      skipped += 1;
      continue;
    }

    // If it's past maturity, mark as matured
    if (inv.maturesAt <= now) {
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: 'matured' },
      });
      matured += 1;
      continue;
    }

    const lastAccrued = inv.lastAccruedAt;
    if (lastAccrued && now.getTime() - lastAccrued.getTime() < TWENTY_THREE_HOURS_MS) {
      // Not time to accrue again yet
      skipped += 1;
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
    updated += 1;
  }

  // For traceability, log a short summary
  console.log(`runAccrual: updated=${updated} matured=${matured} skipped=${skipped} totalInvestmentsChecked=${investments.length}`);

  return { updated, matured, skipped };
}
