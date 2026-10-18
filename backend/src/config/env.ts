import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: (process.env.JWT_ACCESS_SECRET || '').trim(),
  jwtRefreshSecret: (process.env.JWT_REFRESH_SECRET || '').trim(),
  otpHmacSecret: (process.env.OTP_HMAC_SECRET || '').trim(),
  siteUrl: (process.env.SITE_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://grih360.vercel.app' : 'http://localhost:4200')).trim(),
  frontendUrl: (process.env.SITE_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://grih360.vercel.app' : 'http://localhost:4200')).trim(),
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://grih360.vercel.app' : 'http://localhost:5000'),
  googleMapsApiKey: (process.env.GOOGLE_MAPS_API_KEY || '').trim(),
  googleWebClientId: (process.env.GOOGLE_WEB_CLIENT_ID || '').trim(),
  apiVersion: '/api/v1',

  // Gmail SMTP Delivery Configuration
  smtpHost: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: (process.env.SMTP_USER || 'grih360@gmail.com').trim(),
  smtpPass: (process.env.SMTP_PASS || '').trim(),
  emailFrom: (process.env.EMAIL_FROM || 'Grih360 <grih360@gmail.com>').trim(),
  emailOtpExpiryMinutes: parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES || '10', 10),
  emailOtpLength: parseInt(process.env.EMAIL_OTP_LENGTH || '6', 10),
};

// Environment validation
export const validateEnv = (): void => {
  if (!config.mongodbUri) {
    console.error('FATAL CONFIG ERROR: Missing required environment variable: MONGODB_URI');
    process.exit(1);
  }

  // In production, the backend must strictly refuse to start ONLY if truly required authentication secrets are missing
  if (config.nodeEnv === 'production') {
    const missing: string[] = [];
    if (!config.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET');
    if (!config.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET');

    if (missing.length > 0) {
      console.error(`FATAL CONFIG ERROR: Missing required production environment variable(s): ${missing.join(', ')}`);
      console.error('The backend refuses to start in production mode without explicit authentication secrets.');
      process.exit(1);
    }

    if (!config.otpHmacSecret) {
      console.warn('[Startup Notice] OTP_HMAC_SECRET is not configured; using JWT_ACCESS_SECRET for OTP keyed HMAC operations.');
    }

    if (!config.googleWebClientId) {
      console.warn('[Startup Notice] GOOGLE_WEB_CLIENT_ID is not configured; Google sign-in endpoint will return 503 SERVICE_UNAVAILABLE.');
    }

    if (!config.smtpPass || !config.smtpUser) {
      console.warn('[Startup Notice] SMTP_USER or SMTP_PASS is not configured; email dispatch will return 503 SERVICE_UNAVAILABLE.');
    }
  }
};
