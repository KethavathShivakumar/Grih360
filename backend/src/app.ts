import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { helmetSecurityHeaders, apiRateLimiter } from './middleware/security.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ValidationMiddleware } from './middleware/validation.middleware';
import routes from './routes';

const app: Express = express();

// Trust reverse proxy (Vercel / Cloudflare) to ensure accurate client IP resolution
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(helmetSecurityHeaders);

// 2. Body Payload Limits & Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. CORS Configuration
const normalizeOrigin = (url?: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  const norm = normalizeOrigin(origin);

  // Exact current Vercel production URL
  if (norm === 'https://grih360.vercel.app') {
    return true;
  }

  // Allow dynamically configured domain via SITE_URL / FRONTEND_URL environment variable
  if (config.siteUrl && norm === normalizeOrigin(config.siteUrl)) return true;
  if (config.frontendUrl && norm === normalizeOrigin(config.frontendUrl)) return true;

  // Exact Capacitor Android native WebView origins
  if (
    norm === 'https://localhost' ||
    norm === 'capacitor://localhost'
  ) {
    return true;
  }
  // Local development
  if (
    norm === 'http://localhost:4200' ||
    norm === 'http://127.0.0.1:4200' ||
    norm === 'http://localhost:3000' ||
    norm === 'http://127.0.0.1:3000' ||
    /^http:\/\/localhost:[0-9]+$/.test(norm) ||
    /^http:\/\/127\.0\.0\.1:[0-9]+$/.test(norm)
  ) {
    return true;
  }
  return false;
};


const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 4. Rate Limiting
app.use(apiRateLimiter);

// 5. Request Logging & Query Sanitization
app.use(requestLogger);
app.use(ValidationMiddleware.validatePagination);

// 6. Mount API v1 routes
app.use(config.apiVersion, routes);

// Root fallback route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Grih360 REST API Server',
    healthCheck: `${config.apiVersion}/health`,
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
