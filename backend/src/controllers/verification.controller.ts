import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { VerificationService } from '../services/verification.service';

export class VerificationController {
  static async getTenantVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const tenantId = (req.params.tenantId as string) || req.user.userId;
      const result = await VerificationService.getTenantVerification(tenantId, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Tenant verification details retrieved', result);
    } catch (err) {
      next(err);
    }
  }

  static async submitVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { documentType, documentNumber, notes } = req.body;
      if (!documentType) {
        ApiResponseUtil.error(res, 'documentType is required', 400, 'BAD_REQUEST');
        return;
      }

      const verification = await VerificationService.submitVerification(
        req.user.userId,
        documentType,
        documentNumber,
        notes
      );
      ApiResponseUtil.success(res, 'Verification information submitted securely for review', verification, 201);
    } catch (err) {
      next(err);
    }
  }

  static async reviewVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { status, rejectionReason } = req.body;
      const tenantId = req.params.tenantId as string;

      const result = await VerificationService.reviewVerification(
        tenantId,
        req.user.userId,
        req.user.role,
        status,
        rejectionReason
      );

      ApiResponseUtil.success(res, `Verification review updated to ${status}`, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminQueue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const queue = await VerificationService.getAdminVerificationQueue(req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Admin verification queue retrieved', queue);
    } catch (err) {
      next(err);
    }
  }
}
