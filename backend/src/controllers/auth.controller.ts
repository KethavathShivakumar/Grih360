import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
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
      res.status(201).json({
        success: true,
        message: result.message || 'User account registered successfully',
        requiresEmailOtp: result.requiresEmailOtp,
        challengeId: result.challengeId,
        maskedEmail: result.maskedEmail,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Step A: Password Verification & Challenge Generation
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, email, password, directToken } = req.body;
      const effectiveIdentifier = (email || identifier || '').trim();

      if (!effectiveIdentifier || !password) {
        ApiResponseUtil.error(res, 'Email address and password are required', 400, 'VALIDATION_ERROR');
        return;
      }

      // Check if caller requests direct token bypass (e.g., internal integration script header)
      const allowDirectToken = directToken === true || req.headers['x-auth-step'] === 'direct';

      const result = await AuthService.loginUser({
        identifier: effectiveIdentifier,
        password,
        directToken: allowDirectToken,
      });

      // If Two-Step Challenge is returned
      if (result.requiresEmailOtp) {
        res.status(200).json({
          success: true,
          requiresEmailOtp: true,
          challengeId: result.challengeId,
          maskedEmail: result.maskedEmail,
          message: result.message || 'Verification code sent to your registered email.',
          data: {
            requiresEmailOtp: true,
            challengeId: result.challengeId,
            maskedEmail: result.maskedEmail,
          },
        });
        return;
      }

      // Direct login path (for backwards-compatibility / administrative scripts)
      ApiResponseUtil.success(res, 'Login successful', result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Step B: Code Validation Challenge
   * POST /api/v1/auth/verify-login-otp
   */
  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challengeId, otp } = req.body;
      if (!challengeId || typeof challengeId !== 'string' || !otp || typeof otp !== 'string') {
        ApiResponseUtil.error(res, 'Both challengeId and 6-digit verification code are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.verifyLoginChallenge(challengeId.trim(), otp.trim());
      ApiResponseUtil.success(res, 'Authentication successful via OTP verification', result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'VERIFICATION_ERROR',
          message: err.message,
          remainingAttempts: err.remainingAttempts,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Step C: Code Refresh Lifecycle
   * POST /api/v1/auth/resend-login-otp
   */
  static async resendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challengeId } = req.body;
      if (!challengeId || typeof challengeId !== 'string') {
        ApiResponseUtil.error(res, 'Challenge ID is required to resend verification code', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.resendLoginChallenge(challengeId.trim());
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'RESEND_ERROR',
          message: err.message,
          remainingSeconds: err.remainingSeconds,
        });
        return;
      }
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

  /**
   * Legacy Direct OTP Request
   * POST /api/v1/auth/otp/send
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.body;
      if (!identifier || typeof identifier !== 'string') {
        ApiResponseUtil.error(res, 'Registered email address or mobile number is required', 400, 'VALIDATION_ERROR');
        return;
      }
      const result = await AuthService.requestLoginOtp(identifier);
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy Direct OTP Verify
   * POST /api/v1/auth/otp/verify
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, otp } = req.body;
      if (!identifier || !otp) {
        ApiResponseUtil.error(res, 'Both identifier and 6-digit OTP code are required', 400, 'VALIDATION_ERROR');
        return;
      }
      const result = await AuthService.loginWithOtp(identifier, otp);
      ApiResponseUtil.success(res, 'Authentication successful via OTP verification', result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verifies Gmail SMTP connection
   * GET /api/v1/auth/smtp/verify
   */
  static async verifySmtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await EmailService.verifyConnection();
      if (result.success) {
        ApiResponseUtil.success(res, result.message, result, 200);
      } else {
        ApiResponseUtil.error(res, result.message, 503, 'SMTP_CONNECTION_ERROR', result);
      }
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'SMTP verification failed', 500);
    }
  }

  /**
   * Sends a test email via Gmail SMTP
   * POST /api/v1/auth/smtp/test-email
   */
  static async sendTestSmtpEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to } = req.body;
      if (!to || typeof to !== 'string' || !to.includes('@')) {
        ApiResponseUtil.error(res, 'Valid recipient email "to" is required in request body', 400);
        return;
      }

      const result = await EmailService.sendTestEmail(to.trim().toLowerCase());
      ApiResponseUtil.success(res, 'Test email delivered successfully via Gmail SMTP', result, 200);
    } catch (err: any) {
      ApiResponseUtil.error(res, err.message || 'Failed to dispatch test email', 500);
    }
  }
}

