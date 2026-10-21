import { getMongoStatus } from '../config/database';
import { config } from '../config/env';
import { HealthCheckResponse } from '../types';
import { EmailService } from './email.service';

export const getHealthStatus = async (isAdmin = false): Promise<HealthCheckResponse> => {
  const mongoState = getMongoStatus();

  const hasJwtAccess = Boolean(config.jwtAccessSecret || process.env.JWT_ACCESS_SECRET);
  const hasJwtRefresh = Boolean(config.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET);
  const hasOtpSecret = Boolean(config.otpHmacSecret || process.env.OTP_HMAC_SECRET);
  const hasSecrets = hasJwtAccess && hasJwtRefresh && hasOtpSecret;

  const hasSmtpUser = Boolean(config.smtpUser || process.env.SMTP_USER);
  const hasSmtpPass = Boolean(config.smtpPass || process.env.SMTP_PASS);
  const hasEmail = hasSmtpUser && hasSmtpPass;

  // Real SMTP verify check
  const smtpStatus = await EmailService.getHealthSmtpStatus();

  const googleConfigured = Boolean((config.googleWebClientId || process.env.GOOGLE_WEB_CLIENT_ID || '').trim());
  let commitHash = (process.env.VERCEL_GIT_COMMIT_SHA || '').substring(0, 7);
  if (!commitHash) {
    try {
      commitHash = require('child_process').execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      commitHash = 'unknown';
    }
  }

  const response: HealthCheckResponse = {
    success: true,
    message: 'Grih360 API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    mongodb: {
      connected: mongoState === 'connected',
    },
    database: mongoState === 'connected' ? 'ok' : 'disconnected',
    secrets: hasSecrets ? 'ok' : 'incomplete',
    email: hasEmail ? 'ok' : 'incomplete',
    smtp: smtpStatus,
    googleConfigured,
    commitHash,
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

