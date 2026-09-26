import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const notifications = await NotificationService.getUserNotifications(req.user.userId);
      ApiResponseUtil.success(res, 'Notifications retrieved', notifications);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const notification = await NotificationService.markAsRead(req.params.id as string, req.user.userId);
      ApiResponseUtil.success(res, 'Notification marked as read', notification);
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const result = await NotificationService.markAllAsRead(req.user.userId);
      ApiResponseUtil.success(res, 'All notifications marked as read', result);
    } catch (err) {
      next(err);
    }
  }
}
