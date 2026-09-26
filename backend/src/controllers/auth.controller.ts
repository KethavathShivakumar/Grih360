import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * Real User Registration
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, password, role } = req.body;
      const result = await AuthService.registerUser({ name, email, phone, password, role });
      ApiResponseUtil.success(res, 'User account registered successfully', result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Real User Login
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.loginUser({ identifier, password });
      ApiResponseUtil.success(res, 'Login successful', result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Current Authenticated User Session
   * GET /api/v1/auth/me
   */
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Not authenticated', 401, 'UNAUTHORIZED');
        return;
      }
      const user = await AuthService.getAuthenticatedUser(req.user.userId);
      ApiResponseUtil.success(res, 'Active user session retrieved', { user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Real User Logout
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    ApiResponseUtil.success(res, 'Logged out successfully');
  }

  /**
   * Token Refresh
   * POST /api/v1/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        ApiResponseUtil.error(res, 'Refresh token required', 400, 'MISSING_TOKEN');
        return;
      }
      const { JwtUtil } = require('../utils/jwt.util');
      const payload = JwtUtil.verifyRefreshToken(refreshToken);
      const user = await AuthService.getAuthenticatedUser(payload.userId);
      const tokens = JwtUtil.generateTokens({
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
      });
      ApiResponseUtil.success(res, 'Token refreshed successfully', { user, tokens });
    } catch (err) {
      ApiResponseUtil.error(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }
}
