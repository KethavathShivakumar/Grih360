import mongoose from 'mongoose';
import { getMongoStatus, getLastMongoError } from '../config/database';
import { config } from '../config/env';
import { HealthCheckResponse } from '../types';

export const getHealthStatus = (): HealthCheckResponse => {
  const mongoState = getMongoStatus();
  const dbConnection = mongoose.connection;
  const lastErr = getLastMongoError();

  return {
    success: true,
    message: 'Nivas360 API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    mongodb: {
      status: mongoState,
      ...(mongoState === 'connected'
        ? {
            host: dbConnection.host,
            name: dbConnection.name,
          }
        : {
            diagnostics: lastErr || (!config.mongodbUri ? 'MONGODB_URI is not set in environment' : 'Connecting or unreachable'),
          }),
    },
    envStatus: {
      hasJwtAccessSecret: Boolean(process.env.JWT_ACCESS_SECRET),
      hasJwtRefreshSecret: Boolean(process.env.JWT_REFRESH_SECRET),
      hasMongodbUri: Boolean(process.env.MONGODB_URI),
      hasFrontendUrl: Boolean(process.env.FRONTEND_URL),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };
};
