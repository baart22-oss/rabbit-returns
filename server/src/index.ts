import 'dotenv/config'; // loads .env variables
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import investmentsRouter from './routes/investments';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Route registration
app.use('/api/auth', authRouter);
app.use('/api/investments', investmentsRouter);

app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
