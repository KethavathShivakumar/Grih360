import { getMongoStatus } from '../config/database';
import { config } from '../config/env';
import { HealthCheckResponse } from '../types';

export const getHealthStatus = (isAdmin = false): HealthCheckResponse => {
  const mongoState = getMongoStatus();

  const response: HealthCheckResponse = {
    success: true,
    message: 'Grih360 API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    mongodb: {
      connected: mongoState === 'connected',
    },
  };

  if (isAdmin) {
    response.envStatus = {
      hasJwtAccessSecret: Boolean(config.jwtAccessSecret || process.env.JWT_ACCESS_SECRET),
      hasJwtRefreshSecret: Boolean(config.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET),
      hasMongodbUri: Boolean(config.mongodbUri || process.env.MONGODB_URI),
      hasFrontendUrl: Boolean(config.frontendUrl || process.env.FRONTEND_URL),
      nodeEnv: config.nodeEnv,
    };
  }

  return response;
};

