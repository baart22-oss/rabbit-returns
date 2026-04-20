"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const BCRYPT_ROUNDS = 12;
function generateReferralCode() {
    return (0, uuid_1.v4)().replace(/-/g, '').slice(0, 8).toUpperCase();
}
function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is required');
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
}
// === ADMIN LOGIN ===
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password, adminSecretKey } = req.body;
        if (!email || !password || !adminSecretKey) {
            return res.status(400).json({ error: "email, password and adminSecretKey are required" });
        }
        if (adminSecretKey !== process.env.API_SECRET_KEY) {
            return res.status(401).json({ error: "Invalid admin secret key" });
        }
        const user = await client_1.default.user.findUnique({
            where: { email },
            include: { profile: true }
        });
        if (!user || user.role !== "admin") {
            return res.status(401).json({ error: "Admin not found" });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }
        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role
        });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// === SIGNUP ===
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName, referralCode: referredByCode } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'email, password, and fullName are required' });
        }
        const existing = await client_1.default.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
        const code = generateReferralCode();
        let referredBy;
        if (referredByCode) {
            const ref = await client_1.default.profile.findUnique({ where: { referralCode: referredByCode } });
            if (ref)
                referredBy = ref.userId;
        }
        const user = await client_1.default.user.create({
            data: {
                email,
                passwordHash,
                profile: {
                    create: {
                        fullName,
                        referralCode: code,
                        referredBy,
                    },
                },
            },
            include: { profile: true },
        });
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// === LOGIN ===
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const user = await client_1.default.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return res.json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// === ME ===
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const user = await client_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { profile: true },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        return res.json({ id: user.id, email: user.email, role: user.role, profile: user.profile });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
