import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { ProfessionalService } from '../services/professional.service';
import { ReviewModel } from '../models/review.model';

export class ProfessionalController {
  /**
   * GET /api/v1/professionals/me
   */
  static async getMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const profile = await ProfessionalService.getProfileByUserId(req.user.userId);
      ApiResponseUtil.success(res, 'Professional profile retrieved successfully', profile);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch professional profile', 500);
    }
  }

  /**
   * PATCH /api/v1/professionals/me
   */
  static async updateMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const profile = await ProfessionalService.updateProfile(req.user.userId, req.body);
      ApiResponseUtil.success(res, 'Professional profile updated successfully', profile);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to update professional profile', 400);
    }
  }

  /**
   * PATCH /api/v1/professionals/me/availability
   */
  static async toggleAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const { isAvailable } = req.body;
      if (typeof isAvailable !== 'boolean') {
        ApiResponseUtil.error(res, 'isAvailable boolean is required', 400);
        return;
      }

      const profile = await ProfessionalService.toggleAvailability(req.user.userId, isAvailable);
      ApiResponseUtil.success(res, `Availability updated to ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`, profile);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to update availability', 400);
    }
  }

  /**
   * GET /api/v1/professionals/me/dashboard
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const dashboard = await ProfessionalService.getDashboardStats(req.user.userId);
      ApiResponseUtil.success(res, 'Professional dashboard metrics retrieved', dashboard);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch dashboard stats', 500);
    }
  }

  /**
   * GET /api/v1/professionals/me/requests
   */
  static async getAssignedRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const status = req.query.status as string | undefined;
      const requests = await ProfessionalService.getAssignedRequests(req.user.userId, status);
      ApiResponseUtil.success(res, 'Assigned service requests retrieved', requests);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch assigned requests', 500);
    }
  }

  /**
   * GET /api/v1/professionals/me/reviews
   */
  static async getMyReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const reviews = await ProfessionalService.getReviewsForProfessional(req.user.userId);
      ApiResponseUtil.success(res, 'Professional reviews retrieved successfully', reviews);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch reviews', 500);
    }
  }

  /**
   * GET /api/v1/professionals/:id/reviews
   */
  static async getProfessionalReviews(req: Request, res: Response): Promise<void> {
    try {
      const proUserId = req.params.id as string;
      const reviews = await ProfessionalService.getReviewsForProfessional(proUserId);
      ApiResponseUtil.success(res, 'Professional reviews retrieved successfully', reviews);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch professional reviews', 500);
    }
  }

  /**
   * GET /api/v1/admin/professionals
   */
  static async adminGetAllProfessionals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const list = await ProfessionalService.adminGetAllProfessionals();
      ApiResponseUtil.success(res, 'All professional profiles retrieved for admin', list);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch professionals for admin', 500);
    }
  }

  /**
   * PATCH /api/v1/admin/professionals/:id/verify
   */
  static async adminVerifyProfessional(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { verificationStatus } = req.body;
      if (!['NOT_VERIFIED', 'PENDING', 'VERIFIED'].includes(verificationStatus)) {
        ApiResponseUtil.error(res, 'Valid verificationStatus is required', 400);
        return;
      }

      const profileId = req.params.id as string;
      const profile = await ProfessionalService.adminVerifyProfessional(profileId, verificationStatus);
      ApiResponseUtil.success(res, `Professional verification status updated to ${verificationStatus}`, profile);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to verify professional', 400);
    }
  }

  /**
   * PATCH /api/v1/admin/professionals/:id/status
   */
  static async adminToggleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        ApiResponseUtil.error(res, 'isActive boolean is required', 400);
        return;
      }

      const profileId = req.params.id as string;
      const profile = await ProfessionalService.adminToggleStatus(profileId, isActive);
      ApiResponseUtil.success(res, `Professional active status updated to ${isActive}`, profile);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to update professional active status', 400);
    }
  }
}

