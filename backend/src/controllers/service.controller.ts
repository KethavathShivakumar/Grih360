import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { ServiceRequestService } from '../services/service-request.service';

export class ServiceController {
  /**
   * GET /api/v1/services/categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ServiceRequestService.getCategories();
      ApiResponseUtil.success(res, 'Home service categories retrieved successfully', categories);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch categories', 500);
    }
  }

  /**
   * POST /api/v1/services/requests
   */
  static async createServiceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const request = await ServiceRequestService.createServiceRequest(req.user.userId, req.body);
      ApiResponseUtil.success(res, 'Service request submitted successfully', request, 201);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to submit service request', 400);
    }
  }

  /**
   * GET /api/v1/services/requests
   */
  static async getUserRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const status = req.query.status as string | undefined;
      const requests = await ServiceRequestService.getUserRequests(req.user.userId, req.user.role, status);
      ApiResponseUtil.success(res, 'Service requests retrieved successfully', requests);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to fetch service requests', 500);
    }
  }

  /**
   * GET /api/v1/services/requests/:id
   */
  static async getRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const requestId = req.params.id as string;
      const data = await ServiceRequestService.getRequestById(requestId, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Service request details retrieved', data);
    } catch (error: any) {
      const statusCode = error.message?.includes('Unauthorized') ? 403 : error.message?.includes('not found') ? 404 : 400;
      ApiResponseUtil.error(res, error.message || 'Failed to fetch service request', statusCode);
    }
  }

  /**
   * PATCH /api/v1/services/requests/:id/status
   */
  static async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const { status, notes } = req.body;
      if (!status) {
        ApiResponseUtil.error(res, 'Target status is required', 400);
        return;
      }

      const requestId = req.params.id as string;
      const request = await ServiceRequestService.updateRequestStatus(
        requestId,
        req.user.userId,
        req.user.role,
        status,
        notes
      );
      ApiResponseUtil.success(res, `Service request status updated to ${status}`, request);
    } catch (error: any) {
      const statusCode = error.message?.includes('Invalid status transition') ? 400 : error.message?.includes('Only the assigned') ? 403 : 400;
      ApiResponseUtil.error(res, error.message || 'Failed to update service request status', statusCode);
    }
  }

  /**
   * POST /api/v1/services/requests/:id/cancel
   */
  static async cancelServiceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const { reason } = req.body;
      const requestId = req.params.id as string;
      const request = await ServiceRequestService.cancelServiceRequest(
        requestId,
        req.user.userId,
        req.user.role,
        reason
      );
      ApiResponseUtil.success(res, 'Service request cancelled successfully', request);
    } catch (error: any) {
      const statusCode = error.message?.includes('Unauthorized') ? 403 : 400;
      ApiResponseUtil.error(res, error.message || 'Failed to cancel service request', statusCode);
    }
  }

  /**
   * POST /api/v1/services/requests/:id/images
   */
  static async uploadServiceImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const { images } = req.body;
      if (!Array.isArray(images) || images.length === 0) {
        ApiResponseUtil.error(res, 'Images array is required', 400);
        return;
      }

      const requestId = req.params.id as string;
      const request = await ServiceRequestService.addServiceImages(
        requestId,
        req.user.userId,
        req.user.role,
        images
      );
      ApiResponseUtil.success(res, 'Service request images uploaded successfully', request);
    } catch (error: any) {
      ApiResponseUtil.error(res, error.message || 'Failed to upload service images', 400);
    }
  }

  /**
   * POST /api/v1/services/requests/:id/review
   */
  static async submitServiceReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Unauthorized', 401);
        return;
      }

      const { rating, comment } = req.body;
      if (!rating || !comment) {
        ApiResponseUtil.error(res, 'Rating (1-5) and comment are required', 400);
        return;
      }

      const requestId = req.params.id as string;
      const review = await ServiceRequestService.submitServiceReview(
        requestId,
        req.user.userId,
        Number(rating),
        comment
      );
      ApiResponseUtil.success(res, 'Service review submitted successfully', review, 201);
    } catch (error: any) {
      const statusCode = error.message?.includes('already submitted') ? 409 : 400;
      ApiResponseUtil.error(res, error.message || 'Failed to submit service review', statusCode);
    }
  }
}

