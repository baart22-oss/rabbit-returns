import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';

const router = Router();

// GET: list raffle tickets or raffle entries
router.get('/', async (req: Request, res: Response) => {
  try {
    // list raffle ticket records
    const tickets = await prisma.raffleTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(tickets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to fetch raffle tickets' });
  }
});

// POST: create a raffle ticket (placeholder)
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { userId, ticketCount } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const ticket = await prisma.raffleTicket.create({
      data: {
        userId,
        // status defaults to 'pending' in schema
        // If you want to store quantity, add a field in schema; otherwise create one record per ticket
      }
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to create raffle ticket' });
  }
});

export default router;
