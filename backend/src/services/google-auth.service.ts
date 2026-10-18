import { config } from '../config/env';
import { UserModel } from '../models/user.model';
import { TenantProfileModel } from '../models/tenant-profile.model';
import { OwnerProfileModel } from '../models/owner-profile.model';
import { ProfessionalProfileModel } from '../models/professional-profile.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { JwtUtil } from '../utils/jwt.util';
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

      // If that account's own email was not verified, clear its password hash to prevent account takeover
      if (!user.isEmailVerified) {
        user.passwordHash = undefined;
        user.isEmailVerified = true;
        updated = true;
      }

      // Link googleId if not yet set
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }

      // Update authProviders
      if (!user.authProviders) user.authProviders = ['LOCAL'];
      if (!user.authProviders.includes('GOOGLE')) {
        user.authProviders.push('GOOGLE');
        updated = true;
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
      };
    }

    // 3. New User Flow
    const requestedRole = (input.role || '').toUpperCase();
    const validRoles: UserRole[] = ['TENANT', 'OWNER', 'PROFESSIONAL'];
    const roleToUse: UserRole = validRoles.includes(requestedRole as UserRole)
      ? (requestedRole as UserRole)
      : 'TENANT';

    const phoneNormalized = (input.phone || '').trim();

    // If phone is mandatory in the model, return needsProfile: true
    if (!phoneNormalized) {
      return {
        needsProfile: true,
        email: emailNormalized,
        name,
        profileImage: picture,
        suggestedRole: roleToUse,
        message: 'Profile completion required. Please choose your role and provide your mobile number.',
      };
    }

    // Validate phone number format (10 digits)
    const cleanPhone = phoneNormalized.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw {
        statusCode: 400,
        code: 'INVALID_PHONE',
        message: 'Please provide a valid 10-digit mobile number.',
      };
    }

    // Check if phone number is already registered
    const existingPhone = await UserModel.findOne({ phone: cleanPhone });
    if (existingPhone) {
      throw {
        statusCode: 409,
        code: 'PHONE_EXISTS',
        message: 'An account with this mobile number already exists.',
      };
    }

    // Create new user (Google sign-in must not mark identityVerificationStatus as verified)
    const newUser = await UserModel.create({
      name: name || 'Google User',
      email: emailNormalized,
      phone: cleanPhone,
      role: roleToUse,
      googleId,
      authProviders: ['GOOGLE'],
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      profileImage: picture,
      identityVerificationStatus: 'NOT_STARTED',
    });

    if (roleToUse === 'TENANT') {
      await TenantProfileModel.create({ userId: newUser._id });
    } else if (roleToUse === 'OWNER') {
      await OwnerProfileModel.create({ userId: newUser._id });
    } else if (roleToUse === 'PROFESSIONAL') {
      await ProfessionalProfileModel.create({
        userId: newUser._id,
        businessName: name || 'Professional Services',
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
    };
  }
}
