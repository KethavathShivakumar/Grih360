import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { VerificationService } from '../services/verification.service';

export class VerificationController {
  /**
   * Get verification details linked to a specific application
   */
  static async getByApplicationId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const applicationId = String(req.params.applicationId);
      const result = await VerificationService.getVerificationByApplicationId(
        applicationId,
        req.user.userId,
        req.user.role
      );

      ApiResponseUtil.success(res, 'Application verification retrieved', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant submits verification details and documents for an application
   */
  static async submitForApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const applicationId = String(req.params.applicationId);
      const result = await VerificationService.submitVerificationForApplication(
        applicationId,
        req.user.userId,
        req.body
      );

      ApiResponseUtil.success(res, 'Verification steps submitted. Status is now PENDING review.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Owner requests verification for an application
   */
  static async requestForApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const applicationId = String(req.params.applicationId);
      const result = await VerificationService.requestVerification(
        applicationId,
        req.user.userId,
        req.user.role
      );

      ApiResponseUtil.success(res, 'Verification requested for applicant', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single verification record by verification ID
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const id = String(req.params.id);
      const result = await VerificationService.getVerificationById(id, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Verification record retrieved', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin verification queue listing
   */
  static async getAdminQueue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const status = req.query.status ? String(req.query.status) : undefined;
      const queue = await VerificationService.getAdminVerificationQueue(req.user.userId, req.user.role, {
        status,
      });

      ApiResponseUtil.success(res, 'Admin verification queue retrieved', queue);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin reviews verification (Approve / Reject)
   */
  static async reviewVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { status, rejectionReason, adminNotes } = req.body;
      const targetId = String(req.params.id || req.params.tenantId);

      const result = await VerificationService.reviewVerification(
        targetId,
        req.user.userId,
        req.user.role,
        status,
        rejectionReason,
        adminNotes
      );

      ApiResponseUtil.success(res, `Verification review updated to ${status}`, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy tenant verification retrieval
   */
  static async getTenantVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const tenantId = req.params.tenantId ? String(req.params.tenantId) : req.user.userId;
      const result = await VerificationService.getTenantVerification(tenantId, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Tenant verification details retrieved', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy submit verification
   */
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
}
