import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Import your routers (all routes in /api/... namespace)
import authRouter from './routes/auth';
import raffleRouter from './routes/raffle';
import withdrawalRouter from './routes/withdrawals';
import investmentsRouter from './routes/investments';
import adminRouter from './routes/admin';
// ...other routers as needed

const app = express();

// Global middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount routers with proper paths
app.use('/api/auth', authRouter);           // POST /api/auth/login, etc
app.use('/api/raffle', raffleRouter);       // GET/POST /api/raffle/tickets
app.use('/api/withdrawals', withdrawalRouter); // GET/POST /api/withdrawals
app.use('/api/investments', investmentsRouter); // GET/POST /api/investments
app.use('/api/admin', adminRouter);         // Admin-specific routes

// Optional: static files/proof uploads
app.use('/uploads', express.static('uploads'));

// Fallback 404 handler (typed)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler (typed)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error:", err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

export default app;
