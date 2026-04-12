import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/environment';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import apiRoutes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available to controllers
app.set('io', io);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(
  morgan(env.isDevelopment ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// Rate limiting
app.use('/api', defaultLimiter);

// Routes
app.use('/api/v1', apiRoutes);

// Root health check
app.get('/', (_req, res) => {
  res.json({
    name: 'Smart POS API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join-room', (room: string) => {
    void socket.join(room);
    logger.debug(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

async function start(): Promise<void> {
  try {
    await connectDatabase();

    httpServer.listen(env.port, () => {
      logger.info(`🚀 Smart POS API running on port ${env.port} (${env.nodeEnv})`);
      logger.info(`📡 Socket.io enabled`);
      logger.info(`🤖 AI features: ${env.features.aiEnabled ? 'enabled' : 'disabled'}`);
      logger.info(`💬 WhatsApp: ${env.features.whatsappEnabled ? 'enabled' : 'disabled'}`);
      logger.info(`📱 SMS: ${env.features.smsEnabled ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Graceful shutdown started...`);
  httpServer.close(async () => {
    await disconnectDatabase();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

void start();

export { app, io };
