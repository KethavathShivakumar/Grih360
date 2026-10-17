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
    console.error('FATAL CONFIG ERROR: MONGODB_URI environment variable is not defined.');
    console.error('Please create a .env file with MONGODB_URI set.');
    // Fail clearly as specified in requirements
    process.exit(1);
  }

  // In production, the backend must strictly refuse to start if any required secret is missing
  if (config.nodeEnv === 'production') {
    const missing: string[] = [];
    if (!config.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET');
    if (!config.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET');
    if (!config.otpHmacSecret) missing.push('OTP_HMAC_SECRET');

    if (missing.length > 0) {
      console.error(`FATAL SECURITY ERROR: Missing required production secret(s): ${missing.join(', ')}`);
      console.error('The backend refuses to start in production mode without explicit environment secrets.');
      process.exit(1);
    }
  }
};
