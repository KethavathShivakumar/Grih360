import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';
import { AuditService } from '../services/audit.service';
import { ApiResponseUtil } from '../utils/api-response.util';

export class AdminController {
  static async getSystemStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      ApiResponseUtil.success(res, 'Admin system metrics retrieved successfully', stats);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch admin stats', err.statusCode || 500);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, role, isActive, page, limit } = req.query;
      const result = await AdminService.getUsers({
        search: search as string,
        role: role as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Users retrieved successfully', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch users', err.statusCode || 500);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await AdminService.getUserById(req.params.id as string);
      ApiResponseUtil.success(res, 'User details retrieved', user);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch user', err.statusCode || 500);
    }
  }

  static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        ApiResponseUtil.error(res, 'isActive boolean flag is required', 400);
        return;
      }
      const updated = await AdminService.updateUserStatus(req.params.id as string, isActive, req.user);
      ApiResponseUtil.success(res, `User status updated to ${isActive ? 'active' : 'inactive'}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update user status', err.statusCode || 500);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.body;
      if (!role) {
        ApiResponseUtil.error(res, 'role parameter is required', 400);
        return;
      }
      const updated = await AdminService.updateUserRole(req.params.id as string, role, req.user);
      ApiResponseUtil.success(res, `User role updated to ${role}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update user role', err.statusCode || 500);
    }
  }

  static async getProperties(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, status, city, page, limit } = req.query;
      const result = await AdminService.getProperties({
        search: search as string,
        status: status as string,
        city: city as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Properties retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch properties', err.statusCode || 500);
    }
  }

  static async getPropertyById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const property = await AdminService.getPropertyById(req.params.id as string);
      ApiResponseUtil.success(res, 'Property details retrieved', property);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch property', err.statusCode || 500);
    }
  }

  static async updatePropertyStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!status) {
        ApiResponseUtil.error(res, 'status parameter is required', 400);
        return;
      }
      const updated = await AdminService.updatePropertyStatus(req.params.id as string, status, req.user);
      ApiResponseUtil.success(res, `Property status updated to ${status}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update property status', err.statusCode || 500);
    }
  }

  static async getApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, search, page, limit } = req.query;
      const result = await AdminService.getApplications({
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Applications retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch applications', err.statusCode || 500);
    }
  }

  static async getApplicationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const application = await AdminService.getApplicationById(req.params.id as string);
      ApiResponseUtil.success(res, 'Application details retrieved', application);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch application', err.statusCode || 500);
    }
  }

  static async getRentals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;
      const result = await AdminService.getRentals({
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Rentals retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch rentals', err.statusCode || 500);
    }
  }

  static async getRentalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rental = await AdminService.getRentalById(req.params.id as string);
      ApiResponseUtil.success(res, 'Rental details retrieved', rental);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch rental', err.statusCode || 500);
    }
  }

  static async getVerifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;
      const result = await AdminService.getVerifications({
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Verifications retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch verifications', err.statusCode || 500);
    }
  }

  static async getVerificationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const verif = await AdminService.getVerificationById(req.params.id as string);
      ApiResponseUtil.success(res, 'Verification details retrieved', verif);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch verification', err.statusCode || 500);
    }
  }

  static async updateVerificationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, rejectionReason } = req.body;
      if (!status) {
        ApiResponseUtil.error(res, 'status parameter is required', 400);
        return;
      }
      const updated = await AdminService.updateVerificationStatus(req.params.id as string, status, req.user, rejectionReason);
      ApiResponseUtil.success(res, `Verification status updated to ${status}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update verification status', err.statusCode || 500);
    }
  }

  static async getProfessionals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, verificationStatus, page, limit } = req.query;
      const result = await AdminService.getProfessionals({
        status: status as string,
        verificationStatus: verificationStatus as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Professionals retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch professionals', err.statusCode || 500);
    }
  }

  static async getProfessionalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pro = await AdminService.getProfessionalById(req.params.id as string);
      ApiResponseUtil.success(res, 'Professional details retrieved', pro);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch professional', err.statusCode || 500);
    }
  }

  static async updateProfessionalStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        ApiResponseUtil.error(res, 'isActive boolean flag is required', 400);
        return;
      }
      const updated = await AdminService.updateProfessionalStatus(req.params.id as string, isActive, req.user);
      ApiResponseUtil.success(res, `Professional status updated to ${isActive ? 'active' : 'inactive'}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update professional status', err.statusCode || 500);
    }
  }

  static async updateProfessionalVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { verificationStatus } = req.body;
      if (!verificationStatus) {
        ApiResponseUtil.error(res, 'verificationStatus parameter is required', 400);
        return;
      }
      const updated = await AdminService.updateProfessionalVerification(req.params.id as string, verificationStatus, req.user);
      ApiResponseUtil.success(res, `Professional verification updated to ${verificationStatus}`, updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update professional verification', err.statusCode || 500);
    }
  }

  static async getServiceRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category, status, page, limit } = req.query;
      const result = await AdminService.getServiceRequests({
        category: category as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      ApiResponseUtil.success(res, 'Service requests retrieved for admin', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch service requests', err.statusCode || 500);
    }
  }

  static async getServiceRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestObj = await AdminService.getServiceRequestById(req.params.id as string);
      ApiResponseUtil.success(res, 'Service request details retrieved', requestObj);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch service request', err.statusCode || 500);
    }
  }

  static async reassignServiceRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { professionalId } = req.body;
      if (!professionalId) {
        ApiResponseUtil.error(res, 'professionalId parameter is required', 400);
        return;
      }
      const updated = await AdminService.reassignServiceRequest(req.params.id as string, professionalId, req.user);
      ApiResponseUtil.success(res, 'Service request reassigned successfully', updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to reassign service request', err.statusCode || 500);
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notifications = await AdminService.getNotifications();
      ApiResponseUtil.success(res, 'Admin notifications retrieved', notifications);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch notifications', err.statusCode || 500);
    }
  }

  static async broadcastNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, message, targetRole } = req.body;
      if (!title || !message) {
        ApiResponseUtil.error(res, 'title and message are required', 400);
        return;
      }
      const result = await AdminService.broadcastNotification(title, message, targetRole || 'ALL', req.user);
      ApiResponseUtil.success(res, 'Broadcast announcement sent', result);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to send broadcast', err.statusCode || 500);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, action, limit } = req.query;
      const logs = await AuditService.getLogs({
        entityType: entityType as string,
        action: action as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      ApiResponseUtil.success(res, 'Audit logs retrieved', logs);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch audit logs', err.statusCode || 500);
    }
  }

  static async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const health = AdminService.getSystemHealth();
      ApiResponseUtil.success(res, 'System health metrics', health);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch system health', err.statusCode || 500);
    }
  }

  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await AdminService.getSettings();
      ApiResponseUtil.success(res, 'Platform settings retrieved', settings);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to fetch settings', err.statusCode || 500);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateSettings(req.body, req.user);
      ApiResponseUtil.success(res, 'Platform settings updated successfully', updated);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to update settings', err.statusCode || 500);
    }
  }
}

