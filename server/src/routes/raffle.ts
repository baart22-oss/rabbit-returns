import { Router } from "express";
const router = Router();
export default router;
import { Router } from "express";
const router = Router();
export default router;
import { Router } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import { uploadProof } from '../middleware/upload';
import { sendAdminNewProof } from '../services/email';

const router = Router();

const MAX_TICKETS = 500;
const TICKET_PRICE = 50;

router.get('/status', async (_req, res) => {
  try {
    const sold = await prisma.raffleTicket.count({
      where: { status: { in: ['active', 'pending'] } },
    });
    return res.json({ sold, max: MAX_TICKETS, price: TICKET_PRICE });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const tickets = await prisma.raffleTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/tickets', requireAuth, async (req, res) => {
  try {
    const total = await prisma.raffleTicket.count({
      where: { status: { in: ['active', 'pending'] } },
    });

    if (total >= MAX_TICKETS) {
      return res.status(409).json({ error: 'All raffle tickets have been sold' });
    }

    const { paymentReference } = req.body;

    const ticket = await prisma.raffleTicket.create({
      data: {
        userId: req.user!.id,
        status: 'pending',
        paymentReference: paymentReference ?? null,
      },
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/tickets/:id/proof', requireAuth, uploadProof, async (req, res) => {
  try {
    const ticket = await prisma.raffleTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket || ticket.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const updated = await prisma.raffleTicket.update({
      where: { id: req.params.id },
      data: { proofOfPayment: req.file.filename },
    });

    await sendAdminNewProof('raffle', req.user!.id, req.params.id).catch(console.error);

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
