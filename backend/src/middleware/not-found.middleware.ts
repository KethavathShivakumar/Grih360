import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/api-response.util';
import { config } from '../config/env';

export const notFoundHandler = (req: Request, res: Response): void => {
  const isProd = config.nodeEnv === 'production';
  const message = isProd ? 'Resource not found' : `Resource not found: ${req.originalUrl}`;
  ApiResponseUtil.error(res, message, 404, 'NOT_FOUND');
};
