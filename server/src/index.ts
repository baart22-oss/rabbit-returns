import 'dotenv/config'; // loads .env variables
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
// Add other router imports here
// import adminRouter from './routes/admin';
// import investmentsRouter from './routes/investments';
// import bankingRouter from './routes/banking';
// import raffleRouter from './routes/raffle';
// import withdrawalsRouter from './routes/withdrawals';
// import paymentsRouter from './routes/payments';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Route registration
app.use('/api/auth', authRouter);
// Uncomment these as needed
// app.use('/api/admin', adminRouter);
// app.use('/api/investments', investmentsRouter);
// app.use('/api/banking', bankingRouter);
// app.use('/api/raffle', raffleRouter);
// app.use('/api/withdrawals', withdrawalsRouter);
// app.use('/api/payments', paymentsRouter);

// Example default route
app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
