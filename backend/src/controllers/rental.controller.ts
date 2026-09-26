import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { RentalService } from '../services/rental.service';

export class RentalController {
  static async getRentals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const rentals = await RentalService.getOwnerRentals(req.user.userId);
      ApiResponseUtil.success(res, 'Rentals list retrieved', rentals);
    } catch (err) {
      next(err);
    }
  }

  static async getRentalByPropertyId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const rental = await RentalService.getRentalByPropertyId(
        req.params.propertyId as string,
        req.user.userId,
        req.user.role
      );
      ApiResponseUtil.success(res, 'Rental details retrieved', rental);
    } catch (err) {
      next(err);
    }
  }

  static async getTenantDetailsForProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const tenantDetails = await RentalService.getTenantDetailsForProperty(
        req.params.propertyId as string,
        req.user.userId,
        req.user.role
      );
      ApiResponseUtil.success(res, 'Tenant details retrieved', tenantDetails);
    } catch (err) {
      next(err);
    }
  }

  static async getRentRecordsForProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const records = await RentalService.getRentRecordsByPropertyId(
        req.params.propertyId as string,
        req.user.userId,
        req.user.role
      );
      ApiResponseUtil.success(res, 'Rent tracking records retrieved', records);
    } catch (err) {
      next(err);
    }
  }

  static async activateRental(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const rental = await RentalService.activateRental(
        req.params.id as string,
        req.user.userId,
        req.user.role
      );
      ApiResponseUtil.success(res, 'Rental activated successfully', rental);
    } catch (err) {
      next(err);
    }
  }

  static async terminateRental(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const rental = await RentalService.terminateRental(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body.reason
      );
      ApiResponseUtil.success(res, 'Rental terminated', rental);
    } catch (err) {
      next(err);
    }
  }
}
