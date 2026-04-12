import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authRouter } from './api/auth';
import { posRouter } from './api/pos';
import { inventoryRouter } from './api/inventory';
import { customersRouter } from './api/customers';
import { aiRouter } from './api/ai';
import { messagingRouter } from './api/messaging';
import { analyticsRouter } from './api/analytics';
import { adminRouter } from './api/admin';
import { settingsRouter } from './api/settings';
import { setupSocket } from './socket/socketHandler';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/auth';
import { logger } from './utils/constants';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/pos', posRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/messaging', messagingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorHandler);

// Setup Socket.io
setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Smart POS Server running on port ${PORT}`);
});

export { io };
