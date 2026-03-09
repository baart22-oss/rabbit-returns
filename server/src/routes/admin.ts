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
import { runAccrual } from '../services/accrual';

const router = Router();

const MATURITY_DAYS = 180;
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

      // create referral commissions inside transaction
      const commissionCreates: Prisma.PrismaPromise<any>[] = [];
      let currentUserId: string | null | undefined = investment.user.profile?.referredBy;
      let levelIndex = 0;

      while (currentUserId && levelIndex < REFERRAL_LEVELS.length) {
        const levelDef = REFERRAL_LEVELS[levelIndex];
        const earnerId = currentUserId;

        // create a commission entry
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

        // walk up the referral chain
        const refProfile = await prisma.profile.findUnique({ where: { userId: currentUserId } });
        currentUserId = refProfile?.referredBy ?? null;
        levelIndex += 1;
      }

      const updated = await prisma.$transaction(async (tx) => {
        // update investment
        const inv = await tx.investment.update({
          where: { id: investment.id },
          data: {
            status: 'active',
            startedAt,
            maturesAt,
          },
        });

        // execute commission creates
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
 * Body: { status: 'approved'|'paid'|'rejected', adminNote?: string }
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
        // optionally allow a reason in req.body.reason
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
 * POST /api/admin/proof
 * Body form-data: file, model: 'investment'|'raffle', id
 */
router.post('/proof', requireAdmin, async (req: Request, res: Response) => {
  // This route is left as a placeholder. Your app already uses multer in investments/raffle routes
  // If you want admin to upload/replace proofs, implement multer storage here and update prisma records.
  return res.status(501).json({ error: 'Not implemented' });
});

/**
 * POST /api/admin/run-accrual
 * Manual trigger for accrual. Protected by requireAdmin.
 */
router.post('/run-accrual', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await runAccrual();
    return res.json({ ok: true, message: 'Accrual run triggered' });
  } catch (err) {
    console.error('admin/run-accrual error', err);
    return res.status(500).json({ ok: false, error: 'Accrual failed' });
  }
});

export default router;
