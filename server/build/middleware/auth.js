"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is required');
    return secret;
}
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, getJwtSecret());
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    });
}
