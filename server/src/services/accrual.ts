import prisma from '../prisma/client';

const DAILY_RATE = 0.02; // 2% per day
const TWENTY_THREE_HOURS_MS = 23 * 60 * 60 * 1000;

export type AccrualResult = {
  updated: number;
  matured: number;
  skipped: number;
  totalChecked: number;
};

/**
 * runAccrual
 * - opts.force: if true, bypasses the 23-hour guard and accrues immediately for active investments.
 */
export async function runAccrual(opts?: { force?: boolean }): Promise<AccrualResult> {
  const now = new Date();
  let updated = 0;
  let matured = 0;
  let skipped = 0;

  const force = !!opts?.force;

  const investments = await prisma.investment.findMany({
    where: { status: 'active' },
  });

  for (const inv of investments) {
    // defensive: skip if no maturesAt set
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

    // If not forcing, enforce the 23-hour window since last accrual
    if (!force) {
      const lastAccrued = inv.lastAccruedAt;
      if (lastAccrued && now.getTime() - lastAccrued.getTime() < TWENTY_THREE_HOURS_MS) {
        skipped += 1;
        continue;
      }
    }

    // perform accrual
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

  console.log(`runAccrual: updated=${updated} matured=${matured} skipped=${skipped} totalInvestmentsChecked=${investments.length} force=${force}`);

  return { updated, matured, skipped, totalChecked: investments.length };
}
