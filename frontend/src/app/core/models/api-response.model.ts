export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface HealthCheckStatus {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
  mongodb: {
    connected: boolean;
    status?: string;
  };
}

