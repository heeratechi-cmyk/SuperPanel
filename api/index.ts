import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { initPostgresDatabase } from '../backend/src/config/db';
import { seedDatabase } from '../backend/src/services/seed';

import authRouter from '../backend/src/routes/auth';
import depositsRouter from '../backend/src/routes/deposits';
import ordersRouter from '../backend/src/routes/orders';
import servicesRouter from '../backend/src/routes/services';
import supportRouter from '../backend/src/routes/support';
import notificationsRouter from '../backend/src/routes/notifications';
import profileRouter from '../backend/src/routes/profile';
import walletRouter from '../backend/src/routes/wallet';
import adminRouter from '../backend/src/routes/admin';
import uploadsRouter from '../backend/src/routes/uploads';

dotenv.config();

const app = express();

// Parse JSON and form data safely
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads serving
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const uploadDir = path.join(isServerless ? '/tmp' : process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Ensure database initialization on serverless invocation
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabase() {
  if (dbInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initPostgresDatabase();
        await seedDatabase();
        dbInitialized = true;
      } catch (err) {
        console.error('[Vercel DB Init Error]:', err);
        // Allow subsequent retry on next request if failed
        initPromise = null;
      }
    })();
  }
  await initPromise;
}

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureDatabase();
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/deposits', depositsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/support', supportRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: isServerless ? 'Vercel Serverless Function' : 'Node Express',
    timestamp: new Date().toISOString()
  });
});

// Explicit JSON 404 handler for API routes to prevent HTML error responses
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    code: 'NOT_FOUND'
  });
});

// Global JSON error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    code: err.code || 'INTERNAL_ERROR'
  });
});

export default app;
