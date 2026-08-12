import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { initPostgresDatabase } from './backend/src/config/db';
import { seedDatabase } from './backend/src/services/seed';

import authRouter from './backend/src/routes/auth';
import depositsRouter from './backend/src/routes/deposits';
import ordersRouter from './backend/src/routes/orders';
import servicesRouter from './backend/src/routes/services';
import supportRouter from './backend/src/routes/support';
import notificationsRouter from './backend/src/routes/notifications';
import profileRouter from './backend/src/routes/profile';
import walletRouter from './backend/src/routes/wallet';
import adminRouter from './backend/src/routes/admin';
import uploadsRouter from './backend/src/routes/uploads';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Static uploads serving
  const uploadDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Initialize PostgreSQL Database and Seed
  try {
    await initPostgresDatabase();
    await seedDatabase();
  } catch (err) {
    console.error('[PostgreSQL Initialization Error]:', err);
  }

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
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'PostgreSQL', timestamp: new Date().toISOString() });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SuperPanel Server] Express server with PostgreSQL running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
