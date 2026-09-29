import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '../utils/api-response.util';
import { UserRole } from '../types/auth.types';

export class AuthValidator {
  static validateRegister(req: Request, res: Response, next: NextFunction): void {
    const { name, email, phone, password, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      ApiResponseUtil.error(res, 'Name is required', 400, 'VALIDATION_ERROR');
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      ApiResponseUtil.error(res, 'Valid email address is required', 400, 'VALIDATION_ERROR');
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      ApiResponseUtil.error(res, 'Valid phone number is required', 400, 'VALIDATION_ERROR');
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      ApiResponseUtil.error(res, 'Password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
      return;
    }

    const allowedRegisterRoles: UserRole[] = ['TENANT', 'OWNER', 'PROFESSIONAL'];
    if (!role || !allowedRegisterRoles.includes(role)) {
      ApiResponseUtil.error(
        res,
        `Role must be one of: [${allowedRegisterRoles.join(', ')}]. Public registration as ADMIN is strictly prohibited.`,
        400,
        'INVALID_ROLE'
      );
      return;
    }

    next();
  }

  static validateLogin(req: Request, res: Response, next: NextFunction): void {
    const { identifier, email, password } = req.body;
    const effective = email || identifier;

    if (!effective || typeof effective !== 'string' || effective.trim().length === 0) {
      ApiResponseUtil.error(res, 'Registered email address or phone number is required', 400, 'VALIDATION_ERROR');
      return;
    }

    if (!password || typeof password !== 'string') {
      ApiResponseUtil.error(res, 'Password is required', 400, 'VALIDATION_ERROR');
      return;
    }

    next();
  }
}
