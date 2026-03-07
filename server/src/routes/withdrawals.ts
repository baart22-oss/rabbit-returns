import { Router } from "express";
const router = Router();
export default router;
import { Router } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(withdrawals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { amountRand, bankName, accountHolder, accountNumber, branchCode, accountType } = req.body;

    if (!amountRand || !bankName || !accountHolder || !accountNumber || !branchCode || !accountType) {
      return res.status(400).json({ error: 'All banking fields are required' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user!.id,
        amountRand: parseFloat(amountRand),
        status: 'pending',
        bankName,
        accountHolder,
        accountNumber,
        branchCode,
        accountType,
      },
    });

    return res.status(201).json(withdrawal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
