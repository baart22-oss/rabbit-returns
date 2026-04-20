"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// storage same uploads dir
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
try {
    if (!fs_1.default.existsSync(uploadsPath))
        fs_1.default.mkdirSync(uploadsPath, { recursive: true });
}
catch (e) {
    console.error(e);
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsPath),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${(0, uuid_1.v4)()}-${file.originalname}`)
});
const uploadProof = (0, multer_1.default)({ storage }).single('file');
/**
 * GET /api/raffle/tickets
 * List tickets for the authenticated user
 */
router.get('/tickets', auth_1.requireAuth, async (req, res) => {
    try {
        const tickets = await client_1.default.raffleTicket.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(tickets);
    }
    catch (err) {
        console.error('Error listing raffle tickets:', err);
        return res.status(500).json({ error: 'Unable to fetch raffle tickets' });
    }
});
/**
 * GET /api/raffle/status
 * Returns simple raffle status: sold, max, price
 */
router.get('/status', async (_req, res) => {
    try {
        const sold = await client_1.default.raffleTicket.count();
        const max = parseInt(process.env.RAFFLE_MAX ?? '500', 10);
        const price = parseFloat(process.env.RAFFLE_PRICE ?? '50');
        return res.json({ sold, max, price });
    }
    catch (err) {
        console.error('Error fetching raffle status:', err);
        return res.status(500).json({ error: 'Unable to fetch raffle status' });
    }
});
/**
 * POST /api/raffle/tickets
 * Create a raffle ticket for the authenticated user
 */
router.post('/tickets', auth_1.requireAuth, async (req, res) => {
    try {
        const { paymentReference } = req.body;
        const ticket = await client_1.default.raffleTicket.create({
            data: {
                userId: req.user.id,
                paymentReference: paymentReference ?? null,
                status: 'pending',
            }
        });
        return res.status(201).json(ticket);
    }
    catch (err) {
        console.error('Error creating raffle ticket:', err);
        return res.status(500).json({ error: 'Unable to create raffle ticket' });
    }
});
/**
 * POST /api/raffle/tickets/:id/proof
 * Upload proof file for a raffle ticket
 */
router.post('/tickets/:id/proof', auth_1.requireAuth, uploadProof, async (req, res) => {
    try {
        const ticket = await client_1.default.raffleTicket.findUnique({ where: { id: req.params.id } });
        if (!ticket || ticket.userId !== req.user.id)
            return res.status(404).json({ error: 'Ticket not found' });
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        const filename = req.file.filename;
        const updated = await client_1.default.raffleTicket.update({
            where: { id: req.params.id },
            data: { proofOfPayment: filename }
        });
        await (0, email_1.sendAdminNewProof)('raffle', req.user.id, req.params.id, filename).catch(console.error);
        return res.json(updated);
    }
    catch (err) {
        console.error('Error uploading raffle proof:', err);
        return res.status(500).json({ error: 'Unable to upload proof' });
    }
});
exports.default = router;
