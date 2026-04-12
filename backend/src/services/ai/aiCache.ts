import NodeCache from 'node-cache';
import { prisma } from '../../db/prismaClient';
import { AI_CACHE_TTL, logger } from '../../utils/constants';

const memCache = new NodeCache({ stdTTL: AI_CACHE_TTL });

export async function getCachedAI(key: string): Promise<unknown | null> {
  // Check memory cache first
  const mem = memCache.get<unknown>(key);
  if (mem !== undefined) return mem;

  // Check DB cache
  const cached = await prisma.aICache.findUnique({ where: { cacheKey: key } });
  if (cached && cached.expiresAt > new Date()) {
    memCache.set(key, cached.data);
    return cached.data;
  }

  // Clean up expired
  if (cached) {
    await prisma.aICache.delete({ where: { cacheKey: key } }).catch(() => null);
  }

  return null;
}

export async function setCachedAI(key: string, data: unknown, ttlSeconds = AI_CACHE_TTL): Promise<void> {
  memCache.set(key, data, ttlSeconds);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  try {
    await prisma.aICache.upsert({
      where: { cacheKey: key },
      update: { data: data as Parameters<typeof prisma.aICache.upsert>[0]['update']['data'], expiresAt },
      create: { cacheKey: key, data: data as Parameters<typeof prisma.aICache.create>[0]['data']['data'], expiresAt },
    });
  } catch (err) {
    logger.error('AI cache write error', err);
  }
}

export function buildCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}:${JSON.stringify(params[k])}`)
    .join('|');
  return `${prefix}:${sorted}`;
}
