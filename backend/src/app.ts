import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import { optionalAuth } from './middleware/auth.middleware.js';

import reposRouter from './routes/repos.routes.js';
import scansRouter from './routes/scans.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(optionalAuth);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/repos', reposRouter);
app.use('/api/scans', scansRouter);

app.use(errorHandler);

export default app;
