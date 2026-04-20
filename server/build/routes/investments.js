"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const uuid_1 = require("uuid");
const packages_1 = require("./packages"); // <- import central packages
const router = (0, express_1.Router)();
// Ensure uploads dir exists (same as app.ts)
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
try {
    if (!fs_1.default.existsSync(uploadsPath))
        fs_1.default.mkdirSync(uploadsPath, { recursive: true });
}
catch (err) {
    console.error('Unable to ensure uploads dir in investments route:', err);
}
// Multer config: store files in server/uploads directory (absolute path)
const storage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (_req, file, cb) {
        // Unique filename to avoid collisions
        cb(null, `${Date.now()}-${(0, uuid_1.v4)()}-${file.originalname}`);
    }
});
const uploadProof = (0, multer_1.default)({ storage }).single('file');
/**
 * GET /api/investments
 * Returns investments for the authenticated user
 */
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const investments = await client_1.default.investment.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(investments);
    }
    catch (err) {
        console.error('Error listing investments:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/investments
 * Create a new investment request (status: pending) or auto-activate from balance.
 */
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { packageName, amountRand, paymentReference, paymentMethod } = req.body;
        if (!packageName || !amountRand) {
            return res.status(400).json({ error: 'packageName and amountRand are required' });
        }
        if (!packages_1.PACKAGES[packageName]) {
            return res.status(400).json({ error: 'Invalid packageName' });
        }
        const amount = typeof amountRand === 'string' ? parseFloat(amountRand) : amountRand;
        if (Number.isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amountRand' });
        }
        if (paymentMethod === 'balance') {
            const userId = req.user.id;
            // Compute available balance (same logic as /api/banking/balance)
            const investmentsSumResult = await client_1.default.investment.aggregate({
                where: { userId, status: 'active' },
                _sum: { totalEarned: true },
            });
            const investmentsSum = Number(investmentsSumResult._sum.totalEarned ?? 0);
            const commissionsSumResult = await client_1.default.referralCommission.aggregate({
                where: { earnerId: userId },
                _sum: { amountRand: true },
            });
            const commissionsSum = Number(commissionsSumResult._sum.amountRand ?? 0);
            const paidWithdrawalsRes = await client_1.default.withdrawal.aggregate({
                where: { userId, status: 'paid' },
                _sum: { amountRand: true },
            });
            const totalWithdrawnPaid = Number(paidWithdrawalsRes._sum.amountRand ?? 0);
            const totalBalance = investmentsSum + commissionsSum - totalWithdrawnPaid;
            if (totalBalance < amount) {
                return res.status(400).json({
                    error: `Insufficient balance. Available: R${totalBalance.toFixed(2)}, required: R${amount}`,
                });
            }
            const now = new Date();
            const meta = packages_1.PACKAGE_META[packageName];
            const durationDays = meta ? meta.durationDays : 180;
            const maturesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
            // Fetch banking details to populate the deduction withdrawal record
            const bankingDetails = await client_1.default.bankingDetails.findUnique({ where: { userId } });
            const investment = await client_1.default.$transaction(async (tx) => {
                const inv = await tx.investment.create({
                    data: {
                        userId,
                        packageName,
                        amountRand: amount,
                        status: 'active',
                        startedAt: now,
                        maturesAt,
                        paymentReference: 'balance',
                    },
                });
                // Record balance deduction as a paid withdrawal
                await tx.withdrawal.create({
                    data: {
                        userId,
                        amountRand: amount,
                        status: 'paid',
                        bankName: bankingDetails?.bankName ?? 'Balance Payment',
                        accountHolder: bankingDetails?.accountHolder ?? 'Balance Payment',
                        accountNumber: bankingDetails?.accountNumber ?? '000000',
                        branchCode: bankingDetails?.branchCode ?? '000000',
                        accountType: bankingDetails?.accountType ?? 'CHEQUE',
                        adminNote: `Balance payment for ${packageName} investment`,
                    },
                });
                return inv;
            });
            return res.status(201).json(investment);
        }
        // Default: POP flow (status: pending)
        const investment = await client_1.default.investment.create({
            data: {
                userId: req.user.id,
                packageName,
                amountRand: amount,
                status: 'pending',
                paymentReference: paymentReference ?? null,
            },
        });
        return res.status(201).json(investment);
    }
    catch (err) {
        console.error('Error creating investment:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Upload proof for an investment
router.post('/:id/proof', auth_1.requireAuth, uploadProof, async (req, res) => {
    try {
        const investment = await client_1.default.investment.findUnique({ where: { id: req.params.id } });
        if (!investment || investment.userId !== req.user.id) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filename = req.file.filename;
        const updated = await client_1.default.investment.update({
            where: { id: req.params.id },
            data: { proofOfPayment: filename },
        });
        // Inform admins (pass filename so they can view /uploads/<filename>)
        await (0, email_1.sendAdminNewProof)('investment', req.user.id, req.params.id, filename).catch(console.error);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
