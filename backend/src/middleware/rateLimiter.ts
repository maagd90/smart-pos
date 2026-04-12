import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter: 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

/**
 * Strict rate limiter for authentication endpoints:
 * 5 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  skipSuccessfulRequests: true,
});
