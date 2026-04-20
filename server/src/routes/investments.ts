import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import { sendAdminNewProof } from '../services/email';
import { v4 as uuidv4 } from 'uuid';
import { PACKAGES, PACKAGE_META } from './packages'; // <- import central packages

const router = Router();

const BALANCE_PAYMENT_PLACEHOLDER = 'Balance Payment';
const PLACEHOLDER_ACCOUNT_NUMBER = '000000';
const PLACEHOLDER_BRANCH_CODE = '000000';

/** Compute a user's available balance (mirrors /api/banking/balance logic). */
async function getUserBalance(userId: string): Promise<number> {
  const investmentsSumResult = await prisma.investment.aggregate({
    where: { userId, status: 'active' },
    _sum: { totalEarned: true },
  });
  const investmentsSum = Number(investmentsSumResult._sum.totalEarned ?? 0);

  const commissionsSumResult = await prisma.referralCommission.aggregate({
    where: { earnerId: userId },
    _sum: { amountRand: true },
  });
  const commissionsSum = Number(commissionsSumResult._sum.amountRand ?? 0);

  const paidWithdrawalsRes = await prisma.withdrawal.aggregate({
    where: { userId, status: 'paid' },
    _sum: { amountRand: true },
  });
  const totalWithdrawnPaid = Number(paidWithdrawalsRes._sum.amountRand ?? 0);

  return investmentsSum + commissionsSum - totalWithdrawnPaid;
}

// Ensure uploads dir exists (same as app.ts)
const uploadsPath = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
} catch (err) {
  console.error('Unable to ensure uploads dir in investments route:', err);
}

// Multer config: store files in server/uploads directory (absolute path)
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (_req, file, cb) {
    // Unique filename to avoid collisions
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
  }
});
const uploadProof = multer({ storage }).single('file');

/**
 * GET /api/investments
 * Returns investments for the authenticated user
 */
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(investments);
  } catch (err) {
    console.error('Error listing investments:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/investments
 * Create a new investment request (status: pending) or auto-activate from balance.
 */
router.post('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { packageName, amountRand, paymentReference, paymentMethod } = req.body;

    if (!packageName || !amountRand) {
      return res.status(400).json({ error: 'packageName and amountRand are required' });
    }

    if (!PACKAGES[packageName]) {
      return res.status(400).json({ error: 'Invalid packageName' });
    }

    const amount = typeof amountRand === 'string' ? parseFloat(amountRand) : amountRand;
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amountRand' });
    }

    if (paymentMethod === 'balance') {
      const userId = req.user!.id;

      const totalBalance = await getUserBalance(userId);

      if (totalBalance < amount) {
        return res.status(400).json({
          error: `Insufficient balance. Available: R${totalBalance.toFixed(2)}, required: R${amount}`,
        });
      }

      const now = new Date();
      const meta = PACKAGE_META[packageName];
      const durationDays = meta ? meta.durationDays : 180;
      const maturesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Fetch banking details to populate the deduction withdrawal record
      const bankingDetails = await prisma.bankingDetails.findUnique({ where: { userId } });

      const investment = await prisma.$transaction(async (tx) => {
        const inv = await tx.investment.create({
          data: {
            userId,
            packageName,
            amountRand: amount,
            status: 'active',
            startedAt: now,
            maturesAt,
            paymentReference: 'balance',
          },
        });

        // Record balance deduction as a paid withdrawal
        await tx.withdrawal.create({
          data: {
            userId,
            amountRand: amount,
            status: 'paid',
            bankName: bankingDetails?.bankName ?? BALANCE_PAYMENT_PLACEHOLDER,
            accountHolder: bankingDetails?.accountHolder ?? BALANCE_PAYMENT_PLACEHOLDER,
            accountNumber: bankingDetails?.accountNumber ?? PLACEHOLDER_ACCOUNT_NUMBER,
            branchCode: bankingDetails?.branchCode ?? PLACEHOLDER_BRANCH_CODE,
            accountType: bankingDetails?.accountType ?? 'CHEQUE',
            adminNote: `Balance payment for ${packageName} investment`,
          },
        });

        return inv;
      });

      return res.status(201).json(investment);
    }

    // Default: POP flow (status: pending)
    const investment = await prisma.investment.create({
      data: {
        userId: req.user!.id,
        packageName,
        amountRand: amount,
        status: 'pending',
        paymentReference: paymentReference ?? null,
      },
    });

    return res.status(201).json(investment);
  } catch (err) {
    console.error('Error creating investment:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload proof for an investment
router.post('/:id/proof', requireAuth, uploadProof, async (req: Request & { user?: any }, res: Response) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.id } });
    if (!investment || investment.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;

    const updated = await prisma.investment.update({
      where: { id: req.params.id },
      data: { proofOfPayment: filename },
    });

    // Inform admins (pass filename so they can view /uploads/<filename>)
    await sendAdminNewProof('investment', req.user!.id, req.params.id, filename).catch(console.error);

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
