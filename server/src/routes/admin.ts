import { Router } from 'express';
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

router.get('/users', requireAdmin, async (_req, res) => {
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

router.patch('/users/:id/promote', requireAdmin, async (req, res) => {
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

router.get('/investments', requireAdmin, async (_req, res) => {
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

router.patch('/investments/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const investment = await prisma.investment.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { profile: true } } },
    });

    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    const now = new Date();
    const data: Record<string, unknown> = { status };
    if (adminNote !== undefined) data.adminNote = adminNote;

    if (status === 'active') {
      data.startedAt = now;
      data.maturesAt = new Date(now.getTime() + MATURITY_DAYS * 24 * 60 * 60 * 1000);

      // Generate referral commissions
      let currentUserId: string | null | undefined = investment.user.profile?.referredBy;
      for (const { pct, level } of REFERRAL_LEVELS) {
        if (!currentUserId) break;
        const referrer = await prisma.profile.findFirst({ where: { userId: currentUserId } });
        if (!referrer) break;

        await prisma.referralCommission.create({
          data: {
            investmentId: investment.id,
            earnerId: currentUserId,
            referrerId: investment.userId,
            level,
            amountRand: investment.amountRand * pct,
          },
        });

        currentUserId = referrer.referredBy;
      }

      await sendUserInvestmentApproved(
        investment.user.email,
        investment.packageName,
        investment.amountRand
      ).catch(console.error);
    } else if (status === 'rejected') {
      await sendUserInvestmentRejected(
        investment.user.email,
        investment.packageName,
        adminNote
      ).catch(console.error);
    }

    const updated = await prisma.investment.update({
      where: { id: req.params.id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/withdrawals', requireAdmin, async (_req, res) => {
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

router.patch('/withdrawals/:id', requireAdmin, async (req, res) => {
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

router.get('/raffle', requireAdmin, async (_req, res) => {
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

router.patch('/raffle/:id', requireAdmin, async (req, res) => {
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

router.get('/dashboard', requireAdmin, async (_req, res) => {
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
