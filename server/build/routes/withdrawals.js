"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Helper: compute available balance for a user:
 *  - sum totalEarned from active investments (and matured if you want)
 *  - sum referralCommission.amountRand where earnerId = userId
 *  - subtract sum of withdrawals that are pending/paid (to prevent double-spend)
 */
async function computeAvailableBalance(userId) {
    const invSum = await client_1.default.investment.aggregate({
        where: { userId },
        _sum: { totalEarned: true },
    });
    const commissions = await client_1.default.referralCommission.aggregate({
        where: { earnerId: userId },
        _sum: { amountRand: true },
    });
    // Subtract already-requested/paid amounts (status not 'rejected')
    const withdrawalsAgg = await client_1.default.withdrawal.aggregate({
        where: { userId, status: { not: 'rejected' } },
        _sum: { amountRand: true },
    });
    const investmentsSum = invSum._sum.totalEarned ?? 0;
    const commissionsSum = commissions._sum.amountRand ?? 0;
    const withdrawalsSum = withdrawalsAgg._sum.amountRand ?? 0;
    const available = investmentsSum + commissionsSum - withdrawalsSum;
    return Math.max(0, available);
}
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const withdrawals = await client_1.default.withdrawal.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(withdrawals);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { amountRand, bankName, accountHolder, accountNumber, branchCode, accountType, } = req.body;
        // Basic validation
        if (amountRand === undefined ||
            !bankName ||
            !accountHolder ||
            !accountNumber ||
            !branchCode ||
            !accountType) {
            return res.status(400).json({
                error: 'All fields are required: amountRand, bankName, accountHolder, accountNumber, branchCode, accountType',
            });
        }
        const amount = typeof amountRand === 'string' ? parseFloat(amountRand) : amountRand;
        if (Number.isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amountRand' });
        }
        // Compute available balance and prevent over-withdrawal
        const available = await computeAvailableBalance(req.user.id);
        if (amount > available) {
            return res.status(400).json({
                error: `Insufficient balance. Available: R${available.toFixed(2)}.`,
            });
        }
        // Create withdrawal request
        const withdrawal = await client_1.default.withdrawal.create({
            data: {
                userId: req.user.id,
                amountRand: amount,
                status: 'pending',
                bankName,
                accountHolder,
                accountNumber,
                branchCode,
                accountType,
            },
        });
        return res.status(201).json(withdrawal);
    }
    catch (err) {
        console.error('Error creating withdrawal:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
