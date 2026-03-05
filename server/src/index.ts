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

// TRUST PROXY - required when running behind a proxy (Render sets X-Forwarded-For)
// Prevents express-rate-limit error: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// Default: trust the first proxy (1). You can set TRUST_PROXY env to '1', 'true', '0', 'false', or a number.
const rawTrustProxy = process.env.TRUST_PROXY ?? '1';

let trustProxyValue: boolean | number | string = rawTrustProxy;
if (rawTrustProxy === 'true') trustProxyValue = true;
else if (rawTrustProxy === 'false') trustProxyValue = false;
else if (!Number.isNaN(Number(rawTrustProxy))) trustProxyValue = Number(rawTrustProxy);

app.set('trust proxy', trustProxyValue);
console.log(`trust proxy set to: ${String(trustProxyValue)}`);

// --- CORS BLOCK (single canonical block) ---
const allowedOrigins: string[] = ['http://localhost:5173', 'http://localhost:3000'];

// If CLIENT_ORIGIN env is provided, merge comma-separated origins into the list
if (process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN.split(',').forEach((o) => {
    const origin = o.trim().replace(/\/$/, '');
    if (origin && !allowedOrigins.includes(origin)) allowedOrigins.push(origin);
  });
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin)
    if (!origin) return callback(null, true);

    const cleaned = origin.trim().replace(/\/$/, '');

    // Exact matches from allowedOrigins
    if (allowedOrigins.includes(cleaned)) {
      return callback(null, true);
    }

    // Allow Vercel preview hosts (any origin ending with ".vercel.app")
    try {
      const url = new URL(cleaned);
      if (url.hostname.endsWith('.vercel.app')) {
        console.log(`CORS Allowed (vercel preview): ${cleaned}`);
        return callback(null, true);
      }
    } catch (err) {
      // ignore parse errors and fall through to reject
    }

    console.error(`CORS Blocked: Request from ${cleaned} is not in allowed list.`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware (single use)
app.use(cors(corsOptions));

// Force explicit response for ALL preflight (OPTIONS) requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(String(origin).replace(/\/$/, ''))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(200);
});
// --- END CORS BLOCK ---

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

// Routes
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
