import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error-handler.js';
import { optionalAuth } from './middleware/auth.middleware.js';

import authRouter from './routes/auth.routes.js';
import reposRouter from './routes/repos.routes.js';
import scansRouter from './routes/scans.routes.js';
import reportsRouter from './routes/reports.routes.js';

const app = express();
app.set('trust proxy', true);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(optionalAuth);

console.log('FRONTEND_URL at boot:', process.env.FRONTEND_URL);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/scans', scansRouter);
app.use('/api/reports', reportsRouter);


app.use(errorHandler);

export default app;
