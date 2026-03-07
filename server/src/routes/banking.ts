import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

// existing upsert/list endpoints may remain (not repeated here)

// GET /api/banking/balance
// Returns computed balance: earnings from investments + referral commissions
router.get('/balance', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user!.id;

    // Sum totalEarned from investments (optionally only active investments)
    const investmentsSumResult = await prisma.investment.aggregate({
      where: { userId, status: 'active' },
      _sum: { totalEarned: true }
    });
    const investmentsSum = investmentsSumResult._sum.totalEarned ?? 0;

    // Sum referral commissions earned by user
    const commissionsSumResult = await prisma.referralCommission.aggregate({
      where: { earnerId: userId },
      _sum: { amountRand: true }
    });
    const commissionsSum = commissionsSumResult._sum.amountRand ?? 0;

    // Optionally include other sources (e.g., direct payments)
    const totalBalance = investmentsSum + commissionsSum;

    return res.json({
      investmentsSum,
      commissionsSum,
      totalBalance
    });
  } catch (err) {
    console.error('Error getting balance:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
