import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApiResponseUtil } from '../utils/api-response.util';

// 1. Helmet Security Headers Config
export const helmetSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.gstatic.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://maps.googleapis.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// 2. General API Rate Limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponseUtil.error(res, 'Too many requests from this IP, please try again after 15 minutes', 429, 'RATE_LIMIT_EXCEEDED');
  },
});

// 3. Strict Rate Limiter for Authentication & Sensitive Endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 login/register requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponseUtil.error(res, 'Too many authentication attempts. Please try again after 15 minutes', 429, 'AUTH_RATE_LIMIT_EXCEEDED');
  },
});
