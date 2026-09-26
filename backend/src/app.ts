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
const allowedOrigins = [config.frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Origin not allowed by Nivas360 Security Architecture'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

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
