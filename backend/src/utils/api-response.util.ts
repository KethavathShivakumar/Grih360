import { Response } from 'express';
import { ApiResponse } from '../types';

export class ApiResponseUtil {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: { page?: number; limit?: number; total?: number; [key: string]: any }
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errorCode: string = 'BAD_REQUEST',
    details?: any
  ): Response {
    const payload: ApiResponse = {
      success: false,
      message,
      error: {
        code: errorCode,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(payload);
  }
}
