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
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://nivas360.vercel.app' : 'http://localhost:5000'),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDSkelUvGii5waZT4Edk2n8wsAg7tlEI54',
  apiVersion: '/api/v1',
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  googleRedirectUri: (process.env.GOOGLE_REDIRECT_URI || '').trim(),
  gmailRefreshToken: (process.env.GMAIL_REFRESH_TOKEN || '').trim(),
  gmailSenderEmail: (process.env.GMAIL_SENDER_EMAIL || 'grih360@gmail.com').trim(),
  oauthSetupKey: (process.env.OAUTH_SETUP_KEY || 'nivas360_secure_oauth_setup_key_2026').trim(),
};

/**
 * Returns the effective Google OAuth2 redirect URI.
 * Priority:
 * 1. Explicit GOOGLE_REDIRECT_URI environment variable
 * 2. Constructed from BACKEND_URL + /api/v1/auth/google/callback
 * 3. Default fallback based on NODE_ENV (https://nivas360.vercel.app or http://localhost:5000)
 */
export const getEffectiveGoogleRedirectUri = (): string => {
  if (config.googleRedirectUri) {
    return config.googleRedirectUri;
  }
  const base = (config.backendUrl || 'https://nivas360.vercel.app').replace(/\/+$/, '');
  return `${base}${config.apiVersion}/auth/google/callback`;
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
