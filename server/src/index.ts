import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import investmentsRouter from './routes/investments';
import raffleRouter from './routes/raffle';
import withdrawalsRouter from './routes/withdrawals';
import bankingRouter from './routes/banking';
import adminRouter from './routes/admin';
import paymentsRouter from './routes/payments';
import { runAccrual } from './services/accrual';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
app.use('/uploads', express.static(uploadDir));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/investments', apiLimiter, investmentsRouter);
app.use('/api/raffle', apiLimiter, raffleRouter);
app.use('/api/withdrawals', apiLimiter, withdrawalsRouter);
app.use('/api/banking', apiLimiter, bankingRouter);
app.use('/api/admin', apiLimiter, adminRouter);
app.use('/api/payments', paymentsRouter);

cron.schedule('0 2 * * *', () => {
  runAccrual().catch(console.error);
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
