router.post('/admin-login', async (req, res) => {
  const { adminSecretKey } = req.body;

  if (!adminSecretKey) {
    return res.status(400).json({ error: 'adminSecretKey is required' });
  }

  if (adminSecretKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid admin secret key' });
  }

  // Sign a token for the admin, you can customize payload as needed
  const token = signToken({ id: 'admin', email: 'admin@example.com', role: 'admin' });
  return res.json({ token, user: { id: 'admin', email: 'admin@example.com', role: 'admin' } });
});
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const BCRYPT_ROUNDS = 12;

function generateReferralCode(): string {
  return uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function signToken(payload: { id: string; email: string; role: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, referralCode: referredByCode } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password, and fullName are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const code = generateReferralCode();

    let referredBy: string | undefined;
    if (referredByCode) {
      const ref = await prisma.profile.findUnique({ where: { referralCode: referredByCode } });
      if (ref) referredBy = ref.userId;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            fullName,
            referralCode: code,
            referredBy,
          },
        },
      },
      include: { profile: true },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ id: user.id, email: user.email, role: user.role, profile: user.profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
