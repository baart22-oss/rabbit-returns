import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/referrals
 * Returns referral commissions summary and list for the authenticated user.
 */
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user!.id;

    const commissions = await prisma.referralCommission.findMany({
      where: { earnerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const total = commissions.reduce((acc, c) => acc + (c.amountRand ?? 0), 0);

    // group by level
    const byLevel: Record<string, { count: number; total: number }> = {};
    for (const c of commissions) {
      const lvl = String(c.level ?? 0);
      byLevel[lvl] = byLevel[lvl] || { count: 0, total: 0 };
      byLevel[lvl].count += 1;
      byLevel[lvl].total += c.amountRand ?? 0;
    }

    return res.json({ total, byLevel, list: commissions });
  } catch (err) {
    console.error('Error fetching referrals:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
