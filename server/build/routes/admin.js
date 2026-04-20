"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const accrual_1 = require("../services/accrual");
const packages_1 = require("./packages");
const router = (0, express_1.Router)();
const DEFAULT_MATURITY_DAYS = 180;
const REFERRAL_LEVELS = [
    { pct: 0.05, level: 1 },
    { pct: 0.03, level: 2 },
    { pct: 0.02, level: 3 },
];
/**
 * GET /api/admin/users
 */
router.get('/users', auth_1.requireAdmin, async (_req, res) => {
    try {
        const users = await client_1.default.user.findMany({
            include: { profile: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(users);
    }
    catch (err) {
        console.error('admin/users error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/admin/users/:id/promote
 */
router.patch('/users/:id/promote', auth_1.requireAdmin, async (req, res) => {
    try {
        const user = await client_1.default.user.update({
            where: { id: req.params.id },
            data: { role: 'admin' },
        });
        return res.json(user);
    }
    catch (err) {
        console.error('admin/promote error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/admin/investments
 */
router.get('/investments', auth_1.requireAdmin, async (_req, res) => {
    try {
        const investments = await client_1.default.investment.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(investments);
    }
    catch (err) {
        console.error('admin/investments error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/admin/investments/:id
 * Body: { status: 'active' | 'rejected' | 'pending', adminNote?: string }
 */
router.patch('/investments/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const investment = await client_1.default.investment.findUnique({
            where: { id: req.params.id },
            include: { user: { include: { profile: true } } },
        });
        if (!investment)
            return res.status(404).json({ error: 'Investment not found' });
        const now = new Date();
        if (status === 'active') {
            const startedAt = now;
            const meta = packages_1.PACKAGE_META[investment.packageName];
            const durationDays = meta ? meta.durationDays : DEFAULT_MATURITY_DAYS;
            const maturesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
            // create referral commissions inside transaction
            const commissionCreates = [];
            let currentUserId = investment.user.profile?.referredBy;
            let levelIndex = 0;
            while (currentUserId && levelIndex < REFERRAL_LEVELS.length) {
                const levelDef = REFERRAL_LEVELS[levelIndex];
                const earnerId = currentUserId;
                const amount = investment.amountRand * levelDef.pct;
                commissionCreates.push(client_1.default.referralCommission.create({
                    data: {
                        investmentId: investment.id,
                        earnerId,
                        referrerId: investment.userId,
                        level: levelDef.level,
                        amountRand: amount,
                    }
                }));
                const refProfile = await client_1.default.profile.findUnique({ where: { userId: currentUserId } });
                currentUserId = refProfile?.referredBy ?? null;
                levelIndex += 1;
            }
            const updated = await client_1.default.$transaction(async (tx) => {
                const inv = await tx.investment.update({
                    where: { id: investment.id },
                    data: {
                        status: 'active',
                        startedAt,
                        maturesAt,
                    },
                });
                for (const pc of commissionCreates) {
                    await pc;
                }
                return inv;
            });
            // notify user with package name + amount
            try {
                const userEmail = investment.user?.email;
                if (userEmail) {
                    await (0, email_1.sendUserInvestmentApproved)(userEmail, updated.packageName, updated.amountRand).catch(console.error);
                }
            }
            catch (e) {
                console.error('sendUserInvestmentApproved error', e);
            }
            return res.json(updated);
        }
        // handle other status transitions
        const updated = await client_1.default.investment.update({
            where: { id: investment.id },
            data: { status, updatedAt: new Date() },
        });
        if (status === 'rejected') {
            try {
                const userEmail = investment.user?.email;
                if (userEmail) {
                    await (0, email_1.sendUserInvestmentRejected)(userEmail, investment.packageName, adminNote).catch(console.error);
                }
            }
            catch (e) {
                console.error('sendUserInvestmentRejected error', e);
            }
        }
        return res.json(updated);
    }
    catch (err) {
        console.error('admin/patch investment error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/admin/withdrawals
 */
router.get('/withdrawals', auth_1.requireAdmin, async (_req, res) => {
    try {
        const withdrawals = await client_1.default.withdrawal.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(withdrawals);
    }
    catch (err) {
        console.error('admin/withdrawals error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/admin/withdrawals/:id
 */
router.patch('/withdrawals/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const updated = await client_1.default.withdrawal.update({
            where: { id: req.params.id },
            data: { status, adminNote },
        });
        // fetch user email to notify
        try {
            const user = await client_1.default.user.findUnique({ where: { id: updated.userId } });
            if (user && user.email) {
                await (0, email_1.sendUserWithdrawalUpdate)(user.email, updated.amountRand, updated.status, adminNote).catch(console.error);
            }
        }
        catch (e) {
            console.error('sendUserWithdrawalUpdate error', e);
        }
        return res.json(updated);
    }
    catch (err) {
        console.error('admin/patch withdrawal error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/admin/raffle
 */
router.get('/raffle', auth_1.requireAdmin, async (_req, res) => {
    try {
        const tickets = await client_1.default.raffleTicket.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(tickets);
    }
    catch (err) {
        console.error('admin/raffle error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/admin/raffle/:id
 */
router.patch('/raffle/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await client_1.default.raffleTicket.update({
            where: { id: req.params.id },
            data: { status },
        });
        // fetch user email to notify
        try {
            const user = await client_1.default.user.findUnique({ where: { id: updated.userId } });
            const userEmail = user?.email;
            if (status === 'active' && userEmail) {
                await (0, email_1.sendUserRaffleApproved)(userEmail).catch(console.error);
            }
            else if (status === 'rejected' && userEmail) {
                const reason = req.body.reason;
                await (0, email_1.sendUserRaffleRejected)(userEmail, reason).catch(console.error);
            }
        }
        catch (e) {
            console.error('sendUserRaffle notification error', e);
        }
        return res.json(updated);
    }
    catch (err) {
        console.error('admin/patch raffle error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * Admin: upload proof for an investment or ticket (admins may reupload/save)
 */
router.post('/proof', auth_1.requireAdmin, async (req, res) => {
    return res.status(501).json({ error: 'Not implemented' });
});
/**
 * GET /api/admin/dashboard
 * Summary information for admin overview.
 */
router.get('/dashboard', auth_1.requireAdmin, async (_req, res) => {
    try {
        const totalUsers = await client_1.default.user.count();
        const totalInvestments = await client_1.default.investment.count();
        const activeInvestments = await client_1.default.investment.count({ where: { status: 'active' } });
        const pendingInvestments = await client_1.default.investment.count({ where: { status: 'pending' } });
        const totalWithdrawals = await client_1.default.withdrawal.count();
        const totalRaffle = await client_1.default.raffleTicket.count();
        // sums
        const investedSumRes = await client_1.default.investment.aggregate({ _sum: { amountRand: true } });
        const totalInvested = investedSumRes._sum.amountRand ?? 0;
        const totalEarnedRes = await client_1.default.investment.aggregate({ _sum: { totalEarned: true } });
        const totalEarned = totalEarnedRes._sum.totalEarned ?? 0;
        const totalCommissionsRes = await client_1.default.referralCommission.aggregate({ _sum: { amountRand: true } });
        const totalCommissions = totalCommissionsRes._sum.amountRand ?? 0;
        const recentUsers = await client_1.default.user.findMany({
            include: { profile: true },
            orderBy: { createdAt: 'desc' },
            take: 8,
        });
        const recentInvestments = await client_1.default.investment.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
            take: 12,
        });
        return res.json({
            totalUsers,
            totalInvestments,
            activeInvestments,
            pendingInvestments,
            totalWithdrawals,
            totalRaffle,
            totalInvested,
            totalEarned,
            totalCommissions,
            recentUsers,
            recentInvestments,
        });
    }
    catch (err) {
        console.error('admin/dashboard error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/admin/run-accrual
 * Manual trigger for accrual. Protected by requireAdmin.
 * Accepts optional JSON body { force: true } or query ?force=true to bypass the 23-hour guard.
 */
router.post('/run-accrual', auth_1.requireAdmin, async (req, res) => {
    try {
        const force = Boolean(req.body?.force ?? req.query?.force === 'true');
        const result = await (0, accrual_1.runAccrual)({ force });
        return res.json({ ok: true, message: 'Accrual run triggered', result });
    }
    catch (err) {
        console.error('admin/run-accrual error', err);
        return res.status(500).json({ ok: false, error: 'Accrual failed' });
    }
});
exports.default = router;
