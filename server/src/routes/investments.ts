import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import { sendAdminNewProof } from '../services/email';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Investment packages map (ensure this matches your frontend)
const VALID_PACKAGES: Record<string, number> = {
  'Hare Hustler': 1000,
  'Warren Winner': 2000,
  'Burrow Boss': 5000,
  'Colony King': 10000,
};

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

// ... other endpoints (list/create) remain unchanged

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
