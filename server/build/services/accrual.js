"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAccrual = runAccrual;
const client_1 = __importDefault(require("../prisma/client"));
const packages_1 = require("../routes/packages");
const DEFAULT_DAILY_RATE = 0.02; // 2% per day (fallback for packages without meta)
const TWENTY_THREE_HOURS_MS = 23 * 60 * 60 * 1000;
/**
 * runAccrual
 * - opts.force: if true, bypasses the 23-hour guard and accrues immediately for active investments.
 */
async function runAccrual(opts) {
    const now = new Date();
    let updated = 0;
    let matured = 0;
    let skipped = 0;
    const force = !!opts?.force;
    const investments = await client_1.default.investment.findMany({
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
            await client_1.default.investment.update({
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
        const meta = packages_1.PACKAGE_META[inv.packageName];
        const dailyRate = meta ? meta.dailyRate : DEFAULT_DAILY_RATE;
        const earned = inv.amountRand * dailyRate;
        await client_1.default.investment.update({
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
