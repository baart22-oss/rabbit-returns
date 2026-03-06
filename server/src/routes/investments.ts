import { Router } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import { sendAdminNewProof } from '../services/email';

const router = Router();

const VALID_PACKAGES: Record<string, number> = {
  'Bunny Starter': 200,
  'Rabbit Runner': 500,
  'Hare Hustler': 1000,
  'Warren Winner': 2000,
  'Burrow Boss': 5000,
  'Colony King': 10000,
};

// Multer config: store files in 'uploads/' directory; you may change dest as needed
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this path exists in your project!
  },
  filename: function (req, file, cb) {
    // Prevent name clashes; add timestamp + original name
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadProof = multer({ storage }).single('file');

router.get('/', requireAuth, async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(investments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { packageName, amountRand, paymentReference } = req.body;

    if (!packageName || !amountRand) {
      return res.status(400).json({ error: 'packageName and amountRand are required' });
    }

    if (!VALID_PACKAGES[packageName]) {
      return res.status(400).json({ error: 'Invalid package name' });
    }

    const investment = await prisma.investment.create({
      data: {
        userId: req.user!.id,
        packageName,
        amountRand: parseFloat(amountRand),
        status: 'pending',
        paymentReference: paymentReference ?? null,
      },
    });

    return res.status(201).json(investment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/proof', requireAuth, uploadProof, async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.id } });
    if (!investment || investment.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const updated = await prisma.investment.update({
      where: { id: req.params.id },
      data: { proofOfPayment: req.file.filename },
    });

    await sendAdminNewProof('investment', req.user!.id, req.params.id).catch(console.error);

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.id } });
    if (!investment || investment.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    return res.json(investment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
