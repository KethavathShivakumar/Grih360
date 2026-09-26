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
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDSkelUvGii5waZT4Edk2n8wsAg7tlEI54',
  apiVersion: '/api/v1',
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
