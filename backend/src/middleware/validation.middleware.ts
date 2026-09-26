import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '../utils/api-response.util';
import mongoose from 'mongoose';

export class ValidationMiddleware {
  /**
   * Validate MongoDB ObjectId parameter
   */
  static validateObjectIdParam(paramName: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const idRaw = req.params[paramName];
      const id = typeof idRaw === 'string' ? idRaw.trim() : (Array.isArray(idRaw) ? idRaw[0]?.trim() : '');

      if (!id || id.length === 0) {
        ApiResponseUtil.error(res, `Missing resource identifier for parameter: ${paramName}`, 400, 'MISSING_ID');
        return;
      }
      next();
    };
  }

  /**
   * Validate and sanitize pagination query parameters
   */
  static validatePagination(req: Request, res: Response, next: NextFunction): void {
    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    if (req.query.page && (isNaN(page) || page < 1)) {
      ApiResponseUtil.error(res, 'Page parameter must be a positive integer >= 1', 400, 'INVALID_PAGINATION');
      return;
    }

    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      ApiResponseUtil.error(res, 'Limit parameter must be an integer between 1 and 100', 400, 'INVALID_PAGINATION');
      return;
    }

    next();
  }

  /**
   * Validate coordinates (lat, lng) if present in query or body
   */
  static validateCoordinates(req: Request, res: Response, next: NextFunction): void {
    const latRaw = req.query.lat || req.body?.lat || req.body?.coordinates?.lat;
    const lngRaw = req.query.lng || req.body?.lng || req.body?.coordinates?.lng;

    if (latRaw !== undefined) {
      const lat = parseFloat(latRaw as string);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        ApiResponseUtil.error(res, 'Latitude must be between -90 and 90 degrees', 400, 'INVALID_COORDINATES');
        return;
      }
    }

    if (lngRaw !== undefined) {
      const lng = parseFloat(lngRaw as string);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        ApiResponseUtil.error(res, 'Longitude must be between -180 and 180 degrees', 400, 'INVALID_COORDINATES');
        return;
      }
    }

    next();
  }
}
