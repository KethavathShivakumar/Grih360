import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { EmailService } from '../services/email.service';
import { ApiResponseUtil } from '../utils/api-response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * Real User Registration (Legacy / Direct)
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, password, role } = req.body;
      const result = await AuthService.registerUser({ name, email, phone, password, role });
      res.status(201).json({
        success: true,
        message: result.message || 'User account registered successfully',
        data: result,
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'REGISTRATION_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Check whether an email account exists, its auth methods, and roles
   * POST /api/v1/auth/check-email
   */
  static async checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.checkEmail(email);
      ApiResponseUtil.success(res, 'Email account check completed', result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'VALIDATION_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Request Registration OTP (Step 1 of Email Registration)
   * POST /api/v1/auth/register/send-otp
   */
  static async registerSendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, phone, role } = req.body;
      const result = await AuthService.requestRegistrationOtp({ email, name, phone, role });
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'REGISTRATION_ERROR',
          message: err.message,
          authProviders: err.authProviders,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Verify Registration OTP Code (Step 2 of step-by-step Email Registration)
   * POST /api/v1/auth/register/verify-code
   */
  static async registerVerifyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, role } = req.body;
      const result = await AuthService.verifyRegistrationOtpCode(email, otp, role);
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'INVALID_OTP',
          message: err.message,
          remainingAttempts: err.remainingAttempts,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Verify Registration OTP and Create Account (Step 2 of Email Registration)
   * POST /api/v1/auth/register/verify-and-create
   */
  static async registerVerifyAndCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, registrationToken, password, confirmPassword, name, phone, role } = req.body;
      const result = await AuthService.verifyRegistrationOtpAndCreate({
        email,
        otp,
        registrationToken,
        password,
        confirmPassword,
        name,
        phone,
        role,
      });
      ApiResponseUtil.success(res, result.message, result, 201);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'REGISTRATION_ERROR',
          message: err.message,
          remainingAttempts: err.remainingAttempts,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Google Identity Services & Mobile Native OAuth Handler
   * POST /api/v1/auth/google
   */
  static async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken, role, phone } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        ApiResponseUtil.error(res, 'Google ID token is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await GoogleAuthService.loginWithGoogle({
        idToken: idToken.trim(),
        role,
        phone,
      });

      if ((result as any).needsRoleChoice) {
        res.status(200).json({
          success: true,
          isNewUser: true,
          needsRoleChoice: true,
          message: (result as any).message,
          data: result,
        });
        return;
      }

      if ((result as any).needsProfile) {
        res.status(200).json({
          success: true,
          isNewUser: true,
          needsProfile: true,
          message: (result as any).message,
          data: result,
        });
        return;
      }

      if ((result as any).needsPassword) {
        res.status(200).json({
          success: true,
          isNewUser: true,
          needsPassword: true,
          message: (result as any).message,
          data: result,
        });
        return;
      }

      ApiResponseUtil.success(res, 'Google authentication successful', result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'GOOGLE_AUTH_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Google First Registration Password Setup
   * POST /api/v1/auth/google/set-initial-password
   */
  static async googleSetInitialPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { onboardingToken, otp, password, confirmPassword } = req.body;
      const result = await GoogleAuthService.setInitialPassword({
        onboardingToken,
        otp,
        password,
        confirmPassword,
      });
      ApiResponseUtil.success(res, result.message, result, 201);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'GOOGLE_SET_PASSWORD_ERROR',
          message: err.message,
          remainingAttempts: err.remainingAttempts,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Resend Verification OTP for Google First Registration
   * POST /api/v1/auth/google/resend-otp
   */
  static async googleResendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { onboardingToken } = req.body;
      const result = await GoogleAuthService.resendOnboardingOtp(onboardingToken);
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'GOOGLE_RESEND_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Password Login (Method 1: Direct token issue after correct password)
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, email, password, role } = req.body;
      const effectiveIdentifier = (email || identifier || '').trim();

      if (!effectiveIdentifier || !password) {
        ApiResponseUtil.error(res, 'Email address and password are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.loginUser({
        identifier: effectiveIdentifier,
        password,
        role: typeof role === 'string' && role.trim() ? role.trim() : undefined,
      });

      ApiResponseUtil.success(res, result.message || 'Login successful', result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'AUTH_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Verify Login OTP (Method 2: Email Code OR Legacy Challenge)
   * POST /api/v1/auth/verify-login-otp
   */
  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challengeId, identifier, email, otp, role } = req.body;
      const effectiveIdentifier = (email || identifier || '').trim();
      const cleanOtp = (otp || '').trim();

      if (challengeId && typeof challengeId === 'string') {
        const result = await AuthService.verifyLoginChallenge(challengeId.trim(), cleanOtp);
        ApiResponseUtil.success(res, 'Authentication successful via OTP verification', result, 200);
        return;
      }

      if (!effectiveIdentifier || !cleanOtp) {
        ApiResponseUtil.error(res, 'Both email address and 6-digit verification code are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.loginWithOtp(effectiveIdentifier, cleanOtp, role);
      ApiResponseUtil.success(res, result.message || 'Authentication successful via OTP verification', result, 200);
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
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        const { JwtUtil } = require('../utils/jwt.util');
        const { RefreshTokenModel } = require('../models/refresh-token.model');
        const tokenHash = JwtUtil.hashToken(refreshToken);
        await RefreshTokenModel.deleteOne({ tokenHash });
      }
    } catch (e) {}
    ApiResponseUtil.success(res, 'Logged out successfully');
  }

  /**
   * Token Refresh with 30-day lifetime & Rotation
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
      const { RefreshTokenModel } = require('../models/refresh-token.model');

      const payload = JwtUtil.verifyRefreshToken(refreshToken);
      const tokenHash = JwtUtil.hashToken(refreshToken);

      // Verify and invalidate old refresh token (Rotation security)
      const existingToken = await RefreshTokenModel.findOneAndDelete({ tokenHash });
      if (!existingToken) {
        ApiResponseUtil.error(res, 'Invalid or revoked refresh token', 401, 'INVALID_REFRESH_TOKEN');
        return;
      }

      const user = await AuthService.getAuthenticatedUser(payload.userId);
      const tokens = JwtUtil.generateTokens({
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
      });

      // Save new rotated 30-day refresh token in MongoDB
      const newTokenHash = JwtUtil.hashToken(tokens.refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await RefreshTokenModel.create({
        userId: payload.userId,
        tokenHash: newTokenHash,
        expiresAt,
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

  /**
   * Request Forgot Password OTP
   * POST /api/v1/auth/forgot-password/send-otp
   */
  static async forgotPasswordSendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        ApiResponseUtil.error(res, 'A valid email address is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.sendForgotPasswordOtp(email);
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'FORGOT_PASSWORD_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * Reset / Set Password with OTP
   * POST /api/v1/auth/forgot-password/reset
   */
  static async forgotPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        ApiResponseUtil.error(res, 'Email, 6-digit verification code, and new password are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AuthService.resetPasswordWithOtp(email, otp, newPassword);
      ApiResponseUtil.success(res, result.message, result, 200);
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          code: err.code || 'PASSWORD_RESET_ERROR',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
}

