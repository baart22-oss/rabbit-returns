import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET user's banking details
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const banking = await prisma.bankingDetails.findUnique({
      where: { userId: req.user!.id },
    });
    if (!banking) return res.status(404).json({ error: 'No banking details found' });
    return res.json(banking);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upsert user's banking details
router.post('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { accountHolder, bankName, accountNumber, branchCode, accountType, payfastEmail } = req.body;

    if (!accountHolder || !bankName || !accountNumber || !branchCode || !accountType) {
      return res.status(400).json({ error: 'accountHolder, bankName, accountNumber, branchCode, and accountType are required' });
    }

    const banking = await prisma.bankingDetails.upsert({
      where: { userId: req.user!.id },
      update: { accountHolder, bankName, accountNumber, branchCode, accountType, payfastEmail: payfastEmail ?? null },
      create: {
        userId: req.user!.id,
        accountHolder,
        bankName,
        accountNumber,
        branchCode,
        accountType,
        payfastEmail: payfastEmail ?? null,
      },
    });

    return res.json(banking);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/banking/balance
 * Returns computed balance = sum of active investments' totalEarned + referral commissions earned
 * minus any withdrawals already marked as 'paid'.
 */
router.get('/balance', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user!.id;

    const investmentsSumResult = await prisma.investment.aggregate({
      where: { userId, status: 'active' },
      _sum: { totalEarned: true }
    });
    const investmentsSum = investmentsSumResult._sum.totalEarned ?? 0;

    const commissionsSumResult = await prisma.referralCommission.aggregate({
      where: { earnerId: userId },
      _sum: { amountRand: true }
    });
    const commissionsSum = commissionsSumResult._sum.amountRand ?? 0;

    // Sum of withdrawals already paid out to the user (these should reduce available balance).
    const paidWithdrawalsRes = await prisma.withdrawal.aggregate({
      where: { userId, status: 'paid' },
      _sum: { amountRand: true }
    });
    const totalWithdrawnPaid = paidWithdrawalsRes._sum.amountRand ?? 0;

    const totalBalance = investmentsSum + commissionsSum - totalWithdrawnPaid;

    return res.json({
      investmentsSum,
      commissionsSum,
      totalWithdrawnPaid,
      totalBalance
    });
  } catch (err) {
    console.error('Error getting balance:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
