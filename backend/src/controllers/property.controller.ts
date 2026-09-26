import { Request, Response, NextFunction } from 'express';
import { PropertyService } from '../services/property.service';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class PropertyController {
  static async searchProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { properties, page, limit, total } = await PropertyService.searchProperties(req.query as any);
      ApiResponseUtil.success(res, 'Properties retrieved successfully', properties, 200, { page, limit, total });
    } catch (err) {
      next(err);
    }
  }

  static async getPropertyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await PropertyService.getPropertyById(req.params.id as string);
      ApiResponseUtil.success(res, 'Property details retrieved', property);
    } catch (err) {
      next(err);
    }
  }

  static async createProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.createProperty(req.user.userId, req.body);
      ApiResponseUtil.success(res, 'Property created successfully', property, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.updateProperty(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body
      );
      ApiResponseUtil.success(res, 'Property updated successfully', property);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const result = await PropertyService.deleteProperty(req.params.id as string, req.user.userId, req.user.role);
      ApiResponseUtil.success(res, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async getMyProperties(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const properties = await PropertyService.getOwnerProperties(req.user.userId);
      ApiResponseUtil.success(res, 'Owner properties retrieved', properties);
    } catch (err) {
      next(err);
    }
  }

  static async saveProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const saved = await PropertyService.saveProperty(req.user.userId, req.params.id as string);
      ApiResponseUtil.success(res, 'Property saved to favorites', saved, 201);
    } catch (err) {
      next(err);
    }
  }

  static async unsaveProperty(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      await PropertyService.unsaveProperty(req.user.userId, req.params.id as string);
      ApiResponseUtil.success(res, 'Property removed from saved list');
    } catch (err) {
      next(err);
    }
  }

  static async getSavedProperties(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const properties = await PropertyService.getTenantSavedProperties(req.user.userId);
      ApiResponseUtil.success(res, 'Saved properties retrieved', properties);
    } catch (err) {
      next(err);
    }
  }

  static async addImages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.addPropertyImages(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body.images
      );
      ApiResponseUtil.success(res, 'Images uploaded successfully', property);
    } catch (err) {
      next(err);
    }
  }

  static async setMainImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.setMainImage(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        Number(req.params.imageIndex)
      );
      ApiResponseUtil.success(res, 'Main image updated successfully', property);
    } catch (err) {
      next(err);
    }
  }

  static async deleteImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.deletePropertyImage(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        Number(req.params.imageIndex)
      );
      ApiResponseUtil.success(res, 'Image deleted successfully', property);
    } catch (err) {
      next(err);
    }
  }

  static async reorderImages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const property = await PropertyService.reorderPropertyImages(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body.images
      );
      ApiResponseUtil.success(res, 'Images reordered successfully', property);
    } catch (err) {
      next(err);
    }
  }
}
