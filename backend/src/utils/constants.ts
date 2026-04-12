import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const BCRYPT_ROUNDS = 10;

export const MAX_MESSAGES_PER_MONTH = parseInt(
  process.env.MAX_MESSAGES_PER_MONTH || '4',
  10
);
export const MESSAGE_GAP_DAYS = parseInt(process.env.MESSAGE_GAP_DAYS || '7', 10);

export const AI_CACHE_TTL = parseInt(process.env.AI_CACHE_TTL || '86400', 10);

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const LOYALTY_POINTS_PER_DOLLAR = 1;
export const LOYALTY_REDEEM_RATE = 0.01; // 1 point = $0.01
