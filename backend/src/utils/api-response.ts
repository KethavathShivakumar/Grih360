import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  message: string,
  data?: T,
  extraProps: Record<string, unknown> = {}
): ApiResponse<T> & Record<string, unknown> => {
  return {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    timestamp: new Date().toISOString(),
    ...extraProps,
  };
};

export const sendError = (
  message: string,
  errorDetails?: any
): ApiResponse => {
  return {
    success: false,
    message,
    error: {
      code: 'ERROR',
      details: errorDetails,
    },
    timestamp: new Date().toISOString(),
  };
};
