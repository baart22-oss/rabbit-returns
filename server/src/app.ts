import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

import prisma from './prisma/client';

// Routers (ensure these files exist at server/src/routes/*.ts)
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import bankingRouter from './routes/banking';
import investmentsRouter from './routes/investments';
import paymentsRouter from './routes/payments';
import raffleRouter from './routes/raffle';
import withdrawalsRouter from './routes/withdrawals';

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true
  })
);

// Route registration
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/banking', bankingRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/raffle', raffleRouter);
app.use('/api/withdrawals', withdrawalsRouter);

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
 * Idempotent: if ADMIN_EMAIL exists the creation is skipped.
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

    const hash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'admin',
        profile: {
          create: {
            fullName
          }
        }
      }
    });

    console.log(`Admin user ${email} created from environment variables.`);
  } catch (err) {
    console.error('Error ensuring admin user from env:', err);
  }
}

const PORT = Number(process.env.PORT || 3000);

(async () => {
  await ensureAdminFromEnv();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();

export default app;
