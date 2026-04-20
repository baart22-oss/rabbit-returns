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
 * GET /api/referrals
 * Returns referral commissions summary and list for the authenticated user.
 */
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const commissions = await client_1.default.referralCommission.findMany({
            where: { earnerId: userId },
            orderBy: { createdAt: 'desc' },
        });
        const total = commissions.reduce((acc, c) => acc + (c.amountRand ?? 0), 0);
        // group by level
        const byLevel = {};
        for (const c of commissions) {
            const lvl = String(c.level ?? 0);
            byLevel[lvl] = byLevel[lvl] || { count: 0, total: 0 };
            byLevel[lvl].count += 1;
            byLevel[lvl].total += c.amountRand ?? 0;
        }
        return res.json({ total, byLevel, list: commissions });
    }
    catch (err) {
        console.error('Error fetching referrals:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
