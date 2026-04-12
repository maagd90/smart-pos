import 'dotenv/config';
import app from './app';
import prisma from './config/database';
import { redis } from './config/redis';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Database connected');

    // Attempt Redis connection (non-fatal if unavailable)
    try {
      await redis.connect();
    } catch {
      console.warn('Redis unavailable, continuing without cache');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

start();
