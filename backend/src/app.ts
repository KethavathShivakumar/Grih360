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

// 1. Security Headers via Helmet
app.use(helmetSecurityHeaders);

// 2. Body Payload Limits & Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. CORS Configuration
const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (config.frontendUrl && origin === config.frontendUrl) return true;
  if (origin === 'https://nivas360.vercel.app') return true;
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i.test(origin)) return true;
  // Capacitor Android & iOS native WebView origins
  if (
    origin === 'https://localhost' ||
    origin === 'http://localhost' ||
    origin === 'capacitor://localhost' ||
    origin === 'ionic://localhost'
  ) {
    return true;
  }
  // Local development
  if (
    origin === 'http://localhost:4200' ||
    origin === 'http://127.0.0.1:4200' ||
    origin === 'http://localhost:3000' ||
    origin === 'http://127.0.0.1:3000' ||
    /^http:\/\/localhost:[0-9]+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:[0-9]+$/.test(origin)
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
    message: 'Welcome to Nivas360 REST API Server',
    healthCheck: `${config.apiVersion}/health`,
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
