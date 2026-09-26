import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { UserRole } from '../types/auth.types';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ApiResponseUtil.error(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
};
