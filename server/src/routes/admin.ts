import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { requireAdmin } from '../middleware/auth';
import {
  sendUserInvestmentApproved,
  sendUserInvestmentRejected,
  sendUserWithdrawalUpdate,
  sendUserRaffleApproved,
  sendUserRaffleRejected,
} from '../services/email';

const router = Router();

const MATURITY_DAYS = 180;
const REFERRAL_LEVELS = [
  { pct: 0.05, level: 1 },
  { pct: 0.03, level: 2 },
  { pct: 0.02, level: 3 },
];

router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/users/:id/promote', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: 'admin' },
    });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/investments', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const investments = await prisma.investment.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(investments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/investments/:id
 * Body: { status: 'active' | 'rejected' | 'pending', adminNote?: string }
 *
 * When activating we:
 *  - compute startedAt, maturesAt
 *  - create referral commissions for referral chain
 *  - update investment status/start/matures
 * All done in a transaction to avoid partial state.
 */
router.patch('/investments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;

    const investment = await prisma.investment.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { profile: true } } },
    });

    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    const now = new Date();

    if (status === 'active') {
      const startedAt = now;
      const maturesAt = new Date(now.getTime() + MATURITY_DAYS * 24 * 60 * 60 * 1000);

      // Build commission create operations
      const commissionCreates: Array<Promise<any>> = [];
      let currentUserId: string | null | undefined = investment.user.profile?.referredBy;

      while (currentUserId) {
        // find the profile matching the currentUserId
        const refProfile = await prisma.profile.findUnique({ where: { userId: currentUserId } });
        if (!refProfile) break;

        // determine level based on length of commissionCreates
        const levelIndex = commissionCreates.length;
        if (levelIndex >= REFERRAL_LEVELS.length) break;

        const { pct, level } = REFERRAL_LEVELS[levelIndex];
        const amountRand = investment.amountRand * pct;

        commissionCreates.push(
          prisma.referralCommission.create({
            data: {
              investmentId: investment.id,
              earnerId: currentUserId,
              referrerId: investment.userId,
              level,
              amountRand,
            },
          })
        );

        currentUserId = refProfile.referredBy;
      }

      try {
        // Transaction: create commissions then update investment
        const txResults = await prisma.$transaction([
          ...commissionCreates,
          prisma.investment.update({
            where: { id: investment.id },
            data: {
              status: 'active',
              startedAt,
              maturesAt,
              adminNote: adminNote ?? undefined,
            },
          }),
        ]);

        const updatedInvestment = txResults[txResults.length - 1];

        // Notify user outside transaction
        await sendUserInvestmentApproved(
          investment.user.email,
          investment.packageName,
          investment.amountRand
        ).catch(console.error);

        return res.json(updatedInvestment);
      } catch (err) {
        console.error('Error activating investment (transaction):', err);
        return res.status(500).json({ error: 'Failed to activate investment' });
      }
    } else if (status === 'rejected') {
      // handle rejection
      const updated = await prisma.investment.update({
        where: { id: investment.id },
        data: { status: 'rejected', adminNote: adminNote ?? undefined },
      });

      await sendUserInvestmentRejected(
        investment.user.email,
        investment.packageName,
        adminNote
      ).catch(console.error);

      return res.json(updated);
    } else {
      // generic update (e.g., set pending)
      const updated = await prisma.investment.update({
        where: { id: investment.id },
        data: { status: status ?? investment.status, adminNote: adminNote ?? undefined },
      });
      return res.json(updated);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/withdrawals', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(withdrawals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/withdrawals/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    const updated = await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote ?? null },
    });

    await sendUserWithdrawalUpdate(
      withdrawal.user.email,
      withdrawal.amountRand,
      status,
      adminNote
    ).catch(console.error);

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Raffle endpoints and dashboard left unchanged...
router.get('/raffle', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.raffleTicket.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/raffle/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const ticket = await prisma.raffleTicket.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const updated = await prisma.raffleTicket.update({
      where: { id: req.params.id },
      data: { status },
    });

    if (status === 'active') {
      await sendUserRaffleApproved(ticket.user.email).catch(console.error);
    } else if (status === 'rejected') {
      await sendUserRaffleRejected(ticket.user.email).catch(console.error);
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalInvestments,
      totalRaffleTickets,
      pendingInvestments,
      pendingWithdrawals,
      pendingRaffle,
      withdrawn,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.investment.count(),
      prisma.raffleTicket.count({ where: { status: 'active' } }),
      prisma.investment.count({ where: { status: 'pending' } }),
      prisma.withdrawal.count({ where: { status: 'pending' } }),
      prisma.raffleTicket.count({ where: { status: 'pending' } }),
      prisma.withdrawal.aggregate({ where: { status: 'paid' }, _sum: { amountRand: true } }),
    ]);

    return res.json({
      totalUsers,
      totalInvestments,
      totalRaffleTickets,
      totalWithdrawn: withdrawn._sum.amountRand ?? 0,
      pendingInvestments,
      pendingWithdrawals,
      pendingRaffle,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
