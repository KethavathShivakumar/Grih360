import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AgreementService } from '../services/agreement.service';

export class AgreementController {
  static async getAgreements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const agreements = await AgreementService.getUserAgreements(req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Agreements retrieved', agreements);
    } catch (err) {
      next(err);
    }
  }

  static async getAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const rentalId = req.params.rentalId as string;
      const agreement = await AgreementService.getAgreementByRentalId(rentalId, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Rental agreement retrieved', agreement);
    } catch (err) {
      next(err);
    }
  }

  static async getAgreementById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const agreementId = req.params.id as string;
      const agreement = await AgreementService.getAgreementById(agreementId, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Rental agreement retrieved', agreement);
    } catch (err) {
      next(err);
    }
  }

  static async tenantConfirmAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const id = (req.params.id || req.params.rentalId) as string;
      const agreement = await AgreementService.tenantConfirmAgreement(
        id,
        req.user.userId,
        req.user.role,
        req.body
      );
      ApiResponseUtil.success(res, 'Rental agreement confirmed by tenant', agreement);
    } catch (err) {
      next(err);
    }
  }

  static async confirmAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const id = (req.params.id || req.params.rentalId) as string;
      const agreement = await AgreementService.confirmAgreement(
        id,
        req.user.userId,
        req.user.role,
        req.body
      );
      ApiResponseUtil.success(res, 'Rental agreement confirmed and rental activated', agreement);
    } catch (err) {
      next(err);
    }
  }

  static async cancelAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const id = (req.params.id || req.params.rentalId) as string;
      const agreement = await AgreementService.cancelAgreement(
        id,
        req.user.userId,
        req.user.role,
        req.body.reason
      );
      ApiResponseUtil.success(res, 'Rental agreement cancelled', agreement);
    } catch (err) {
      next(err);
    }
  }
}

