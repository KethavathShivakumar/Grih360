import { config } from '../config/env';
import { UserModel } from '../models/user.model';
import { TenantProfileModel } from '../models/tenant-profile.model';
import { OwnerProfileModel } from '../models/owner-profile.model';
import { ProfessionalProfileModel } from '../models/professional-profile.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { JwtUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/password.util';
import { OtpService } from './otp.service';
import { UserRole } from '../types/auth.types';
import mongoose from 'mongoose';

export interface GoogleAuthInput {
  idToken: string;
  role?: string;
  phone?: string;
}

export class GoogleAuthService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Lazily loads OAuth2Client to isolate google-auth-library from the rest of the backend
   */
  private static getOAuth2Client(): any {
    try {
      const { OAuth2Client } = require('google-auth-library');
      return new OAuth2Client(config.googleWebClientId);
    } catch (err: any) {
      console.error('[GoogleAuthService] Failed to load google-auth-library:', err?.message || err);
      throw {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Google authentication service is currently unavailable.',
      };
    }
  }

  /**
   * Google Identity Services & Android Native Sign-In Verification
   * Isolated completely so Google Cloud/token errors never disrupt email OTP authentication.
   */
  static async loginWithGoogle(input: GoogleAuthInput) {
    if (!config.googleWebClientId) {
      console.warn('[GoogleAuthService] Login rejected: GOOGLE_WEB_CLIENT_ID is not configured in environment variables');
      throw {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Google authentication service is currently unavailable.',
      };
    }

    if (!input.idToken || typeof input.idToken !== 'string') {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Google ID token is required.',
      };
    }

    const client = this.getOAuth2Client();
    let payload: any;

    try {
      const ticket = await client.verifyIdToken({
        idToken: input.idToken,
        audience: config.googleWebClientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      console.warn('[GoogleAuthService] Token verification failed:', err?.message || err);
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid or expired Google authentication credentials.',
      };
    }

    if (!payload) {
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid Google authentication token payload.',
      };
    }

    // Verify audience
    if (payload.aud !== config.googleWebClientId) {
      console.warn('[GoogleAuthService] Audience mismatch. Expected:', config.googleWebClientId, 'Got:', payload.aud);
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Token audience mismatch.',
      };
    }

    // Verify issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      console.warn('[GoogleAuthService] Issuer mismatch:', payload.iss);
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid token issuer.',
      };
    }

    // Verify expiry
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Google authentication token has expired.',
      };
    }

    // Require email_verified: true
    if (payload.email_verified !== true) {
      throw {
        statusCode: 401,
        code: 'UNVERIFIED_EMAIL',
        message: 'Google account email address is not verified.',
      };
    }

    const googleId = payload.sub;
    const emailNormalized = (payload.email || '').toLowerCase().trim();
    const name = (payload.name || '').trim();
    const picture = payload.picture || null;

    if (!emailNormalized) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Email address could not be retrieved from Google account.',
      };
    }

    if (!this.isMongoConnected()) {
      if (process.env.NODE_ENV === 'production') {
        throw {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB Atlas connection is required in production.',
        };
      }
      throw {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database service is currently unavailable.',
      };
    }

    // 1. Match by googleId first
    let user: any = await UserModel.findOne({ googleId }).select('+passwordHash');

    // 2. If not found by googleId, match by verified email
    if (!user) {
      user = await UserModel.findOne({ email: emailNormalized }).select('+passwordHash');
    }

    if (user) {
      // Never allow Google login for an ADMIN account
      if (user.role === 'ADMIN') {
        throw {
          statusCode: 403,
          code: 'ADMIN_GOOGLE_LOGIN_FORBIDDEN',
          message: 'Administrative accounts cannot authenticate via Google.',
        };
      }

      // Reject inactive users
      if (!user.isActive) {
        throw {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been deactivated or suspended.',
        };
      }

      let updated = false;

      // Mark email verified since Google has verified it
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        updated = true;
      }

      // Link googleId if not yet set
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }

      // Maintain authProviders list ensuring both methods are reflected
      if (!Array.isArray(user.authProviders)) {
        user.authProviders = user.passwordHash ? ['LOCAL', 'GOOGLE'] : ['GOOGLE'];
        updated = true;
      } else {
        if (!user.authProviders.includes('GOOGLE')) {
          user.authProviders.push('GOOGLE');
          updated = true;
        }
        if (user.passwordHash && !user.authProviders.includes('LOCAL')) {
          user.authProviders.push('LOCAL');
          updated = true;
        }
      }

      // Save profile image if absent
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      // Issue access token (15m) and rotating refresh token (30d)
      const tokens = JwtUtil.generateTokens({
        userId: (user._id as any).toString(),
        role: user.role,
        email: user.email,
      });

      const tokenHash = JwtUtil.hashToken(tokens.refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await RefreshTokenModel.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });

      return {
        user: user.toJSON(),
        tokens,
        isNewUser: false,
        hasPassword: !!user.passwordHash,
        authProviders: user.authProviders || (user.passwordHash ? ['LOCAL', 'GOOGLE'] : ['GOOGLE']),
      };
    }

    // 3. New User Flow - Do NOT create user in database yet!
    const requestedRole = (input.role || '').toUpperCase();
    const validRoles: UserRole[] = ['TENANT', 'OWNER', 'PROFESSIONAL'];
    const roleToUse: UserRole = validRoles.includes(requestedRole as UserRole)
      ? (requestedRole as UserRole)
      : 'TENANT';

    // If role was not supplied, prompt user for role choice first
    if (!input.role) {
      return {
        isNewUser: true,
        needsRoleChoice: true,
        email: emailNormalized,
        name,
        profileImage: picture,
        idToken: input.idToken,
        message: 'Please choose your account type.',
      };
    }

    // Optional phone normalization if supplied
    const phoneNormalized = (input.phone || '').trim();
    let cleanPhone: string | undefined = undefined;
    if (phoneNormalized) {
      const digits = phoneNormalized.replace(/\D/g, '');
      if (digits.length === 10) {
        const existingPhone = await UserModel.findOne({ phone: digits });
        if (existingPhone) {
          throw {
            statusCode: 409,
            code: 'PHONE_EXISTS',
            message: 'An account with this mobile number already exists.',
          };
        }
        cleanPhone = digits;
      }
    }

    // Generate secure onboarding token containing verified Google details
    const onboardingPayload = {
      email: emailNormalized,
      name: name || 'Google User',
      phone: cleanPhone,
      role: roleToUse,
      googleId,
      picture,
    };
    const onboardingToken = JwtUtil.generateOnboardingToken(onboardingPayload);

    // Automatically send 6-digit OTP to the verified Google email
    await OtpService.createAndSendOtp({
      email: emailNormalized,
      purpose: 'GOOGLE_ONBOARDING',
      userName: name || 'Google User',
    });

    return {
      isNewUser: true,
      needsPassword: true,
      onboardingToken,
      email: emailNormalized,
      name: name || 'Google User',
      role: roleToUse,
      phone: cleanPhone,
      maskedEmail: OtpService.maskEmail(emailNormalized),
      message: 'A verification code has been sent to your Google email. Please enter the code and set your password to finish creating your account.',
    };
  }

  /**
   * Complete Google First Registration: Verifies Email OTP, Hashes Password, Creates User
   */
  static async setInitialPassword(input: {
    onboardingToken: string;
    otp: string;
    password: string;
    confirmPassword?: string;
  }) {
    if (!input.onboardingToken) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Onboarding session token is required.',
      };
    }

    const cleanOtp = (input.otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'A 6-digit verification code is required.',
      };
    }

    if (!input.password) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Password is required.',
      };
    }

    if (input.password.length < 8) {
      throw {
        statusCode: 400,
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long.',
      };
    }

    if (
      !/[A-Z]/.test(input.password) ||
      !/[a-z]/.test(input.password) ||
      !/[0-9]/.test(input.password)
    ) {
      throw {
        statusCode: 400,
        code: 'WEAK_PASSWORD',
        message: 'Password must contain uppercase, lowercase, and a number.',
      };
    }

    if (input.confirmPassword && input.password !== input.confirmPassword) {
      throw {
        statusCode: 400,
        code: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match.',
      };
    }

    // Verify onboarding token
    const decoded = JwtUtil.verifyOnboardingToken(input.onboardingToken);

    // Verify OTP
    const verification = await OtpService.verifyOtp({
      email: decoded.email,
      otp: cleanOtp,
      purpose: 'GOOGLE_ONBOARDING',
    });

    if (!verification.valid) {
      throw {
        statusCode: verification.statusCode || 400,
        code: 'INVALID_OTP',
        message: verification.message || 'Invalid or expired verification code.',
        remainingAttempts: verification.remainingAttempts,
      };
    }

    // Double check email uniqueness in DB before creating
    const existingUser = await UserModel.findOne({ email: decoded.email });
    if (existingUser) {
      throw {
        statusCode: 409,
        code: 'USER_EXISTS',
        message: 'An account with this email already exists.',
      };
    }

    if (decoded.phone) {
      const existingPhone = await UserModel.findOne({ phone: decoded.phone });
      if (existingPhone) {
        throw {
          statusCode: 409,
          code: 'PHONE_EXISTS',
          message: 'An account with this mobile number already exists.',
        };
      }
    }

    // Hash password
    const passwordHash = await PasswordUtil.hashPassword(input.password);

    // Create user only now!
    const newUser = await UserModel.create({
      name: decoded.name || 'Google User',
      email: decoded.email,
      phone: decoded.phone || undefined,
      role: decoded.role,
      googleId: decoded.googleId,
      passwordHash,
      authProviders: ['GOOGLE', 'LOCAL'],
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      profileImage: decoded.picture || null,
      identityVerificationStatus: 'NOT_STARTED',
    });

    if (decoded.role === 'TENANT') {
      await TenantProfileModel.create({ userId: newUser._id });
    } else if (decoded.role === 'OWNER') {
      await OwnerProfileModel.create({ userId: newUser._id });
    } else if (decoded.role === 'PROFESSIONAL') {
      await ProfessionalProfileModel.create({
        userId: newUser._id,
        businessName: decoded.name || 'Professional Services',
      });
    }

    const tokens = JwtUtil.generateTokens({
      userId: (newUser._id as any).toString(),
      role: newUser.role,
      email: newUser.email,
    });

    const tokenHash = JwtUtil.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshTokenModel.create({
      userId: newUser._id,
      tokenHash,
      expiresAt,
    });

    return {
      user: newUser.toJSON(),
      tokens,
      hasPassword: true,
      authProviders: ['GOOGLE', 'LOCAL'],
      message: 'Account created successfully. Welcome to Grih360!',
    };
  }

  /**
   * Resends verification OTP for new Google user onboarding
   */
  static async resendOnboardingOtp(onboardingToken: string) {
    if (!onboardingToken) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Onboarding session token is required.',
      };
    }

    const decoded = JwtUtil.verifyOnboardingToken(onboardingToken);
    return await OtpService.createAndSendOtp({
      email: decoded.email,
      purpose: 'GOOGLE_ONBOARDING',
      userName: decoded.name,
    });
  }
}
