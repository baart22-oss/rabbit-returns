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

// Build allowed origins from env — supports comma-separated list
const allowedOrigins: string[] = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN.split(',').forEach((o) => allowedOrigins.push(o.trim()));
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin requests (health checks, curl, mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Handle all preflight OPTIONS requests
app.options('*', cors(corsOptions));
app.use(express.json());

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});
