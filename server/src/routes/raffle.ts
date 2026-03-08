import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { sendAdminNewProof } from '../services/email';

const router = Router();

// storage same uploads dir
const uploadsPath = path.join(process.cwd(), 'uploads');
try { if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true }); } catch (e) { console.error(e); }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsPath),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`)
});
const uploadProof = multer({ storage }).single('file');

/**
 * GET /api/raffle/tickets
 * List tickets for the authenticated user
 */
router.get('/tickets', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const tickets = await prisma.raffleTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  } catch (err) {
    console.error('Error listing raffle tickets:', err);
    return res.status(500).json({ error: 'Unable to fetch raffle tickets' });
  }
});

/**
 * GET /api/raffle/status
 * Returns simple raffle status: sold, max, price
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const sold = await prisma.raffleTicket.count();
    const max = parseInt(process.env.RAFFLE_MAX ?? '500', 10);
    const price = parseFloat(process.env.RAFFLE_PRICE ?? '50');
    return res.json({ sold, max, price });
  } catch (err) {
    console.error('Error fetching raffle status:', err);
    return res.status(500).json({ error: 'Unable to fetch raffle status' });
  }
});

/**
 * POST /api/raffle/tickets
 * Create a raffle ticket for the authenticated user
 */
router.post('/tickets', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { paymentReference } = req.body;
    const ticket = await prisma.raffleTicket.create({
      data: {
        userId: req.user!.id,
        paymentReference: paymentReference ?? null,
        status: 'pending',
      }
    });
    return res.status(201).json(ticket);
  } catch (err) {
    console.error('Error creating raffle ticket:', err);
    return res.status(500).json({ error: 'Unable to create raffle ticket' });
  }
});

/**
 * POST /api/raffle/tickets/:id/proof
 * Upload proof file for a raffle ticket
 */
router.post('/tickets/:id/proof', requireAuth, uploadProof, async (req: Request & { user?: any }, res: Response) => {
  try {
    const ticket = await prisma.raffleTicket.findUnique({ where: { id: req.params.id }});
    if (!ticket || ticket.userId !== req.user!.id) return res.status(404).json({ error: 'Ticket not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = req.file.filename;
    const updated = await prisma.raffleTicket.update({
      where: { id: req.params.id },
      data: { proofOfPayment: filename }
    });

    await sendAdminNewProof('raffle', req.user!.id, req.params.id, filename).catch(console.error);
    return res.json(updated);
  } catch (err) {
    console.error('Error uploading raffle proof:', err);
    return res.status(500).json({ error: 'Unable to upload proof' });
  }
});

export default router;
