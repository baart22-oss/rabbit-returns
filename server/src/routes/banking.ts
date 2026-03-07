import { Router } from "express";
const router = Router();
export default router;
import { Router } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
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

router.post('/', requireAuth, async (req, res) => {
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

export default router;
