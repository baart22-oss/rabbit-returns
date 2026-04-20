import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { requireAdmin } from '../middleware/auth';
import {
  sendUserInvestmentApproved,
  sendUserInvestmentRejected,
  sendUserWithdrawalUpdate,
  sendUserRaffleApproved,
  sendUserRaffleRejected,
  sendAdminNewProof,
} from '../services/email';
import { runAccrual, AccrualResult } from '../services/accrual';
import { PACKAGE_META } from './packages';

const router = Router();

const DEFAULT_MATURITY_DAYS = 180;
const REFERRAL_LEVELS = [
  { pct: 0.05, level: 1 },
  { pct: 0.03, level: 2 },
  { pct: 0.02, level: 3 },
];

/**
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) {
    console.error('admin/users error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/promote
 */
router.patch('/users/:id/promote', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: 'admin' },
    });
    return res.json(user);
  } catch (err) {
    console.error('admin/promote error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/investments
 */
router.get('/investments', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const investments = await prisma.investment.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(investments);
  } catch (err) {
    console.error('admin/investments error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/investments/:id
 * Body: { status: 'active' | 'rejected' | 'pending', adminNote?: string }
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
      const meta = PACKAGE_META[investment.packageName];
      const durationDays = meta ? meta.durationDays : DEFAULT_MATURITY_DAYS;
      const maturesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // create referral commissions inside transaction
      const commissionCreates: Prisma.PrismaPromise<any>[] = [];
      let currentUserId: string | null | undefined = investment.user.profile?.referredBy;
      let levelIndex = 0;

      while (currentUserId && levelIndex < REFERRAL_LEVELS.length) {
        const levelDef = REFERRAL_LEVELS[levelIndex];
        const earnerId = currentUserId;

        const amount = investment.amountRand * levelDef.pct;
        commissionCreates.push(prisma.referralCommission.create({
          data: {
            investmentId: investment.id,
            earnerId,
            referrerId: investment.userId,
            level: levelDef.level,
            amountRand: amount,
          }
        }));

        const refProfile = await prisma.profile.findUnique({ where: { userId: currentUserId } });
        currentUserId = refProfile?.referredBy ?? null;
        levelIndex += 1;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.investment.update({
          where: { id: investment.id },
          data: {
            status: 'active',
            startedAt,
            maturesAt,
          },
        });

        for (const pc of commissionCreates) {
          await pc;
        }

        return inv;
      });

      // notify user with package name + amount
      try {
        const userEmail = investment.user?.email;
        if (userEmail) {
          await sendUserInvestmentApproved(userEmail, updated.packageName, updated.amountRand).catch(console.error);
        }
      } catch (e) {
        console.error('sendUserInvestmentApproved error', e);
      }

      return res.json(updated);
    }

    // handle other status transitions
    const updated = await prisma.investment.update({
      where: { id: investment.id },
      data: { status, updatedAt: new Date() },
    });

    if (status === 'rejected') {
      try {
        const userEmail = investment.user?.email;
        if (userEmail) {
          await sendUserInvestmentRejected(userEmail, investment.packageName, adminNote).catch(console.error);
        }
      } catch (e) {
        console.error('sendUserInvestmentRejected error', e);
      }
    }

    return res.json(updated);
  } catch (err) {
    console.error('admin/patch investment error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/withdrawals
 */
router.get('/withdrawals', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(withdrawals);
  } catch (err) {
    console.error('admin/withdrawals error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/withdrawals/:id
 */
router.patch('/withdrawals/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;
    const updated = await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: { status, adminNote },
    });

    // fetch user email to notify
    try {
      const user = await prisma.user.findUnique({ where: { id: updated.userId } });
      if (user && user.email) {
        await sendUserWithdrawalUpdate(user.email, updated.amountRand, updated.status, adminNote).catch(console.error);
      }
    } catch (e) {
      console.error('sendUserWithdrawalUpdate error', e);
    }

    return res.json(updated);
  } catch (err) {
    console.error('admin/patch withdrawal error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/raffle
 */
router.get('/raffle', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.raffleTicket.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  } catch (err) {
    console.error('admin/raffle error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/raffle/:id
 */
router.patch('/raffle/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await prisma.raffleTicket.update({
      where: { id: req.params.id },
      data: { status },
    });

    // fetch user email to notify
    try {
      const user = await prisma.user.findUnique({ where: { id: updated.userId } });
      const userEmail = user?.email;
      if (status === 'active' && userEmail) {
        await sendUserRaffleApproved(userEmail).catch(console.error);
      } else if (status === 'rejected' && userEmail) {
        const reason = (req.body as any).reason;
        await sendUserRaffleRejected(userEmail, reason).catch(console.error);
      }
    } catch (e) {
      console.error('sendUserRaffle notification error', e);
    }

    return res.json(updated);
  } catch (err) {
    console.error('admin/patch raffle error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Admin: upload proof for an investment or ticket (admins may reupload/save)
 */
router.post('/proof', requireAdmin, async (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/admin/dashboard
 * Summary information for admin overview.
 */
router.get('/dashboard', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalInvestments = await prisma.investment.count();
    const activeInvestments = await prisma.investment.count({ where: { status: 'active' }});
    const pendingInvestments = await prisma.investment.count({ where: { status: 'pending' }});
    const totalWithdrawals = await prisma.withdrawal.count();
    const totalRaffle = await prisma.raffleTicket.count();

    // sums
    const investedSumRes = await prisma.investment.aggregate({ _sum: { amountRand: true } });
    const totalInvested = investedSumRes._sum.amountRand ?? 0;

    const totalEarnedRes = await prisma.investment.aggregate({ _sum: { totalEarned: true } });
    const totalEarned = totalEarnedRes._sum.totalEarned ?? 0;

    const totalCommissionsRes = await prisma.referralCommission.aggregate({ _sum: { amountRand: true } });
    const totalCommissions = totalCommissionsRes._sum.amountRand ?? 0;

    const recentUsers = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const recentInvestments = await prisma.investment.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return res.json({
      totalUsers,
      totalInvestments,
      activeInvestments,
      pendingInvestments,
      totalWithdrawals,
      totalRaffle,
      totalInvested,
      totalEarned,
      totalCommissions,
      recentUsers,
      recentInvestments,
    });
  } catch (err) {
    console.error('admin/dashboard error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/run-accrual
 * Manual trigger for accrual. Protected by requireAdmin.
 * Accepts optional JSON body { force: true } or query ?force=true to bypass the 23-hour guard.
 */
router.post('/run-accrual', requireAdmin, async (req: Request, res: Response) => {
  try {
    const force = Boolean(req.body?.force ?? req.query?.force === 'true');
    const result: AccrualResult = await runAccrual({ force });
    return res.json({ ok: true, message: 'Accrual run triggered', result });
  } catch (err) {
    console.error('admin/run-accrual error', err);
    return res.status(500).json({ ok: false, error: 'Accrual failed' });
  }
});

export default router;
