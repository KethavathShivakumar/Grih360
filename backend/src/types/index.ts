export * from './auth.types';
export * from './property.types';
export * from './rental.types';
export * from './service.types';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
  timestamp?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
  mongodb: {
    connected: boolean;
  };
  database: string;
  secrets: string;
  email: string;
  envStatus?: {
    hasJwtAccessSecret: boolean;
    hasJwtRefreshSecret: boolean;
    hasMongodbUri: boolean;
    hasFrontendUrl: boolean;
    nodeEnv: string;
  };
}

