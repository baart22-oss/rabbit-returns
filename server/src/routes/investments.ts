import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

import prisma from './prisma/client';

// Routers
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

// Fallback route that will serve files directly when frontend requests the bare filename
// Example: frontend requests "/1772805370726-....jpeg" (no /uploads prefix).
// This middleware will check uploads/ for the file and serve it if present.
// It will not interfere with API routes (paths starting with /api) or other static paths.
app.get('/:filename', (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params;

  // Skip common prefixes so we don't accidentally capture API or other routes
  if (!filename) return next();
  if (filename.startsWith('api') || filename.startsWith('uploads') || filename.includes('/')) {
    return next();
  }

  // Allow typical image/file extensions
  const allowedExt = /\.(png|jpg|jpeg|gif|webp|pdf|txt)$/i;
  if (!allowedExt.test(filename)) return next();

  const filePath = path.join(uploadsDir, filename);
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) return next(); // file doesn't exist -> let other routes handle (404)
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
})();

export default app;
