import { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ApplicationController {
  static async submitApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const application = await ApplicationService.submitApplication(req.user.userId, req.body);
      ApiResponseUtil.success(res, 'Rental application submitted successfully', application, 201);
    } catch (err) {
      next(err);
    }
  }

  static async listApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const applications = await ApplicationService.getApplicationsForUser(req.user.userId, req.user.role);
      ApiResponseUtil.success(res, 'Applications retrieved', applications);
    } catch (err) {
      next(err);
    }
  }

  static async getApplicationById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const application = await ApplicationService.getApplicationById(
        req.params.id as string,
        req.user.userId,
        req.user.role
      );
      ApiResponseUtil.success(res, 'Application retrieved successfully', application);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const application = await ApplicationService.updateStatus(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body.status
      );
      ApiResponseUtil.success(res, 'Application status updated', application);
    } catch (err) {
      next(err);
    }
  }
}
