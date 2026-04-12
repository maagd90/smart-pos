import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err: Error) => {
  console.error('Redis error:', err.message);
});

export default redis;
