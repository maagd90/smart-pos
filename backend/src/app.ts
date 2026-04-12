import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { generalLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';

import authRoutes from './routes/auth';
import shopPlatformRoutes from './routes/shops';
import staffRoutes from './routes/staff';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import messagingRoutes from './routes/messaging';
import offerRoutes from './routes/offers';
import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';
import shortcutRoutes from './routes/shortcuts';
import orderRoutes from './routes/orders';

const app = express();

// ─── Security: CORS ───────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Security: Helmet with CSP ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Audit Logging ────────────────────────────────────────────────────────────
app.use('/api', auditLogger);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/platform/shops', shopPlatformRoutes);

// Shop-scoped routes
app.use('/api/shops/:shopId/staff', staffRoutes);
app.use('/api/shops/:shopId/products', productRoutes);
app.use('/api/shops/:shopId/customers', customerRoutes);
app.use('/api/shops/:shopId/messaging', messagingRoutes);
app.use('/api/shops/:shopId/offers', offerRoutes);
app.use('/api/shops/:shopId/orders', orderRoutes);
app.use('/api/shops/:shopId/analytics', analyticsRoutes);
app.use('/api/shops/:shopId/audit', auditRoutes);
app.use('/api/shops/:shopId/shortcuts', shortcutRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
