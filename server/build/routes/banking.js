"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET user's banking details
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const banking = await client_1.default.bankingDetails.findUnique({
            where: { userId: req.user.id },
        });
        if (!banking)
            return res.status(404).json({ error: 'No banking details found' });
        return res.json(banking);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Upsert user's banking details
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { accountHolder, bankName, accountNumber, branchCode, accountType, payfastEmail } = req.body;
        if (!accountHolder || !bankName || !accountNumber || !branchCode || !accountType) {
            return res.status(400).json({ error: 'accountHolder, bankName, accountNumber, branchCode, and accountType are required' });
        }
        const banking = await client_1.default.bankingDetails.upsert({
            where: { userId: req.user.id },
            update: { accountHolder, bankName, accountNumber, branchCode, accountType, payfastEmail: payfastEmail ?? null },
            create: {
                userId: req.user.id,
                accountHolder,
                bankName,
                accountNumber,
                branchCode,
                accountType,
                payfastEmail: payfastEmail ?? null,
            },
        });
        return res.json(banking);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/banking/balance
 * Returns computed balance = sum of active investments' totalEarned + referral commissions earned
 * minus any withdrawals already marked as 'paid'.
 */
router.get('/balance', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const investmentsSumResult = await client_1.default.investment.aggregate({
            where: { userId, status: 'active' },
            _sum: { totalEarned: true }
        });
        const investmentsSum = investmentsSumResult._sum.totalEarned ?? 0;
        const commissionsSumResult = await client_1.default.referralCommission.aggregate({
            where: { earnerId: userId },
            _sum: { amountRand: true }
        });
        const commissionsSum = commissionsSumResult._sum.amountRand ?? 0;
        // Sum of withdrawals already paid out to the user (these should reduce available balance).
        const paidWithdrawalsRes = await client_1.default.withdrawal.aggregate({
            where: { userId, status: 'paid' },
            _sum: { amountRand: true }
        });
        const totalWithdrawnPaid = paidWithdrawalsRes._sum.amountRand ?? 0;
        const totalBalance = investmentsSum + commissionsSum - totalWithdrawnPaid;
        return res.json({
            investmentsSum,
            commissionsSum,
            totalWithdrawnPaid,
            totalBalance
        });
    }
    catch (err) {
        console.error('Error getting balance:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
