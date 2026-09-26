import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { ApiResponseUtil } from '../utils/api-response.util';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  name: string;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID_FORMAT';
    message = `Invalid format for field '${err.path}'`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((e: any) => e.message).join(', ');
  }

  // Handle Mongo duplicate key error (11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  const isProd = config.nodeEnv === 'production';
  const finalMessage = isProd && statusCode === 500 ? 'An unexpected error occurred. Please try again later.' : message;
  const stackDetails = !isProd && err.stack ? err.stack : undefined;

  console.error(`[Error] ${req.method} ${req.originalUrl} (${statusCode}):`, message);

  ApiResponseUtil.error(res, finalMessage, statusCode, code, stackDetails);
};
