import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/api-response.util';

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponseUtil.error(res, `Resource not found: ${req.originalUrl}`, 404, 'NOT_FOUND');
};
