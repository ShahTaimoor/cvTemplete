import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

export const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  mongoSanitize(),
];

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

// Credential-guessing surface — kept strict. /me is deliberately NOT covered
// by this (or any dedicated) limiter: it's a read-only, already-authenticated
// check (a valid JWT is required to call it at all) called on every page
// load/refresh, not something an attacker can brute-force guess their way
// into, so it only needs the blanket apiLimiter applied to all of /api.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later' },
});

// Account creation is a spam/abuse concern, not a brute-force one — a
// separate, more generous budget so it isn't throttled by (or throttling)
// login attempts from the same IP.
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many registration attempts, please try again later' },
});

export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { message: 'Export limit reached, try again later' },
});
