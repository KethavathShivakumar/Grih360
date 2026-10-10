import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'default_dev_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_dev_refresh_secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://grih360.vercel.app' : 'http://localhost:5000'),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDSkelUvGii5waZT4Edk2n8wsAg7tlEI54',
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
};
