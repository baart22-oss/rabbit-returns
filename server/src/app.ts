import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

import prisma from './prisma/client';
import { runAccrual } from './services/accrual';

// Routers
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import bankingRouter from './routes/banking';
import investmentsRouter from './routes/investments';
import paymentsRouter from './routes/payments';
import raffleRouter from './routes/raffle';
import withdrawalsRouter from './routes/withdrawals';
import packagesRouter from './routes/packages';
import referralsRouter from './routes/referrals';

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true
  })
);

// Ensure uploads directory exists and is writable
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at', uploadsDir);
  }
} catch (err) {
  console.error('Failed to create uploads directory:', err);
}

// Serve uploaded files at /uploads/*
app.use('/uploads', express.static(uploadsDir));

// Fallback route to serve bare filenames from uploads (in case frontend requests bare filename)
app.get('/:filename', (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params;

  if (!filename) return next();
  if (filename.startsWith('api') || filename.startsWith('uploads') || filename.includes('/')) {
    return next();
  }

  const allowedExt = /\.(png|jpg|jpeg|gif|webp|pdf|txt)$/i;
  if (!allowedExt.test(filename)) return next();

  const filePath = path.join(uploadsDir, filename);
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) return next();
    return res.sendFile(filePath);
  });
});

// Route registration (API routes)
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/banking', bankingRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/raffle', raffleRouter);
app.use('/api/withdrawals', withdrawalsRouter);

// Newly added routes
app.use('/api/packages', packagesRouter);
app.use('/api/referrals', referralsRouter);

app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Typed 404 handler
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: 'Not found' });
});

// Typed global error handler
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Ensure admin user exists using environment variables.
 * This is idempotent: if ADMIN_EMAIL exists, it will not create a duplicate.
 */
async function ensureAdminFromEnv(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULLNAME || 'Admin';

  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin creation.');
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== 'admin') {
        console.log(`User ${email} exists but is not admin. Skipping creation.`);
      } else {
        console.log(`Admin user ${email} already exists. Skipping creation.`);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate referralCode (schema requires it for Profile)
    const referralCode = `ADM${uuidv4().replace(/-/g, '').slice(0, 5).toUpperCase()}`;

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin',
        profile: {
          create: {
            fullName,
            referralCode
          }
        }
      }
    });

    console.log(`Admin user ${email} created from environment variables.`);
  } catch (err) {
    console.error('Error ensuring admin user from env:', err);
    // Do not throw so server can still start
  }
}

const PORT = Number(process.env.PORT || 3000);

(async () => {
  await ensureAdminFromEnv();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

 // Replace the existing cron.schedule(...) block with this

const CRON_TZ = process.env.CRON_TZ || 'Africa/Johannesburg';

// Run accrual once at startup (helps with testing)
runAccrual().catch(err => console.error('Initial accrual error:', err));

// Schedule accrual daily at 00:01 in the configured timezone
// '1 0 * * *' => minute=1 hour=0 every day
cron.schedule('1 0 * * *', () => {
  console.log(`Running scheduled accrual at 00:01 (${CRON_TZ})`);
  runAccrual().catch(err => console.error('Scheduled accrual error:', err));
}, {
  timezone: CRON_TZ
});
