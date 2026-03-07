import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';

const router = Router();

// GET: list raffles or tickets
router.get('/', async (req: Request, res: Response) => {
  try {
    const raffles = await prisma.raffle.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(raffles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to fetch raffles' });
  }
});

// POST: purchase ticket (placeholder)
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { userId, raffleId, ticketCount } = req.body;
    if (!userId || !raffleId) return res.status(400).json({ error: 'Missing userId or raffleId' });

    // Placeholder ticket creation; adapt to your real logic
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        raffleId,
        quantity: Number(ticketCount || 1)
      }
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to create ticket' });
  }
});

export default router;
