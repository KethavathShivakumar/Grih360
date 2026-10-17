import { UserModel, TenantProfileModel, OwnerProfileModel, ProfessionalProfileModel, RefreshTokenModel } from '../models';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { UserRole } from '../types/auth.types';
import { OtpService } from './otp.service';
import { config } from '../config/env';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface GoogleAuthInput {
  idToken: string;
  role?: UserRole;
  phone?: string;
}

export interface LoginInput {
  identifier: string; // Email or Phone
  password: string;
  directToken?: boolean;
}

import { PersistentStore } from '../config/persistent-store';

// Persistent store fallback when MongoDB daemon is offline
export const memoryUsers = new Map<string, any>();

// Load any existing persisted users into memory cache
const loadedUsers = PersistentStore.loadCollection('users');
for (const u of loadedUsers) {
  memoryUsers.set(u._id || u.id, u);
}

export class AuthService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Seed Default Platform Accounts (Disabled - No demo data)
   */
  static async seedDemoUsers(): Promise<void> {
    // Permanent no-op: demo seeding removed
    return;
  }

  /**
   * Real User Registration with Password Hashing & Profile Creation
   */
  static async registerUser(input: RegisterInput) {
    const emailNormalized = input.email.toLowerCase().trim();
    const phoneNormalized = input.phone.trim();
    const passwordHash = await PasswordUtil.hashPassword(input.password);

    if (AuthService.isMongoConnected()) {
      const existingUser = await UserModel.findOne({
        $or: [{ email: emailNormalized }, { phone: phoneNormalized }],
      });

      if (existingUser) {
        if (existingUser.email === emailNormalized) {
          throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'An account with this email address already exists' };
        }
        throw { statusCode: 409, code: 'PHONE_EXISTS', message: 'An account with this phone number already exists' };
      }

      const newUser = await UserModel.create({
        name: input.name.trim(),
        email: emailNormalized,
        phone: phoneNormalized,
        passwordHash,
        role: input.role,
        isActive: true,
        identityVerificationStatus: 'NOT_STARTED',
      });

      if (input.role === 'TENANT') {
        await TenantProfileModel.create({ userId: newUser._id });
      } else if (input.role === 'OWNER') {
        await OwnerProfileModel.create({ userId: newUser._id });
      } else if (input.role === 'PROFESSIONAL') {
        await ProfessionalProfileModel.create({
          userId: newUser._id,
          businessName: input.name,
        });
      }

      const tokens = JwtUtil.generateTokens({
        userId: (newUser._id as any).toString(),
        role: newUser.role,
        email: newUser.email,
      });

      // Initiate Email OTP Challenge for newly registered account
      const challenge = await OtpService.createLoginChallenge({
        _id: newUser._id,
        id: (newUser._id as any).toString(),
        email: newUser.email,
        name: newUser.name,
      });

      return {
        user: newUser.toJSON(),
        tokens,
        requiresEmailOtp: true,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        message: 'Account registered successfully. Verification code sent to your email.',
      };
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'MongoDB Atlas connection is required in production. In-memory accounts are forbidden.' };
      }
      // Resilient In-Memory Mode
      for (const u of memoryUsers.values()) {
        if (u.email === emailNormalized) {
          throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'An account with this email address already exists' };
        }
        if (u.phone === phoneNormalized) {
          throw { statusCode: 409, code: 'PHONE_EXISTS', message: 'An account with this phone number already exists' };
        }
      }

      const id = 'mem_usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userDoc = {
        _id: id,
        id,
        name: input.name.trim(),
        email: emailNormalized,
        phone: phoneNormalized,
        passwordHash,
        role: input.role,
        isActive: true,
        identityVerificationStatus: 'NOT_STARTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      PersistentStore.insert('users', userDoc);
      memoryUsers.set(id, userDoc);

      const tokens = JwtUtil.generateTokens({
        userId: id,
        role: input.role,
        email: emailNormalized,
      });

      // Initiate Email OTP Challenge for in-memory registration
      const challenge = await OtpService.createLoginChallenge({
        _id: id,
        id,
        email: emailNormalized,
        name: input.name.trim(),
      });

      const { passwordHash: _, ...safeUser } = userDoc;
      return {
        user: safeUser,
        tokens,
        requiresEmailOtp: true,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        message: 'Account registered successfully. Verification code sent to your email.',
      };
    }
  }

  /**
   * Real User Login with Two-Step Authentication Challenge (Step A)
   */
  static async loginUser(input: LoginInput) {
    let identifierNormalized = input.identifier.trim().toLowerCase();
    if (identifierNormalized === 'admin') {
      identifierNormalized = 'admin@grih360.com';
    }

    if (AuthService.isMongoConnected()) {
      const user = await UserModel.findOne({
        $or: [{ email: identifierNormalized }, { phone: identifierNormalized }],
      }).select('+passwordHash');

      if (!user || !user.passwordHash) {
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.isActive) {
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      // If directToken is requested by internal scripts, headless automation, or admin portal
      if (input.directToken) {
        if (process.env.NODE_ENV === 'production' && user.role !== 'ADMIN') {
          throw { statusCode: 403, code: 'DIRECT_TOKEN_FORBIDDEN', message: 'Direct token bypass is disabled in production for non-administrators.' };
        }
        const tokens = JwtUtil.generateTokens({
          userId: (user._id as any).toString(),
          role: user.role,
          email: user.email,
        });
        return {
          user: user.toJSON(),
          tokens,
        };
      }

      // Step A: Initiate Stateful Two-Step Authentication Flow
      const challenge = await OtpService.createLoginChallenge({
        _id: user._id,
        id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
      });

      return {
        requiresEmailOtp: true,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        message: 'Verification code sent to your registered email.',
      };
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'MongoDB Atlas connection is required in production. In-memory fallback is disabled.' };
      }
      // In-Memory Mode
      let user: any = null;
      for (const u of memoryUsers.values()) {
        if (u.email === identifierNormalized || u.phone === identifierNormalized) {
          user = u;
          break;
        }
      }

      if (!user) {
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.isActive) {
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      // If directToken is requested by internal scripts
      if (input.directToken) {
        const tokens = JwtUtil.generateTokens({
          userId: user.id || user._id,
          role: user.role,
          email: user.email,
        });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, tokens };
      }

      // Step A: Initiate Stateful Two-Step Authentication Flow
      const challenge = await OtpService.createLoginChallenge({
        _id: user._id || user.id,
        id: user.id || user._id,
        email: user.email,
        name: user.name,
      });

      return {
        requiresEmailOtp: true,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        message: 'Verification code sent to your registered email.',
      };
    }
  }

  /**
   * Step B: Code Validation Challenge (POST /api/v1/auth/verify-login-otp)
   */
  static async verifyLoginChallenge(challengeId: string, otp: string) {
    const result = await OtpService.verifyLoginChallengeOtp(challengeId, otp);
    if (!result.valid || !result.user) {
      throw {
        statusCode: result.statusCode || 401,
        code: 'VERIFICATION_FAILED',
        message: result.message,
        remainingAttempts: result.remainingAttempts,
      };
    }

    const user = result.user;
    const userId = (user._id || user.id).toString();
    const tokens = JwtUtil.generateTokens({
      userId,
      role: user.role,
      email: user.email,
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      user: safeUser,
      tokens,
    };
  }

  /**
   * Step C: Code Refresh Lifecycle (POST /api/v1/auth/resend-login-otp)
   */
  static async resendLoginChallenge(challengeId: string) {
    return await OtpService.resendLoginChallengeOtp(challengeId);
  }

  /**
   * Finds a user by email or phone across MongoDB and memory store
   */
  static async findUserByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (AuthService.isMongoConnected()) {
      return await UserModel.findOne({
        $or: [{ email: normalized }, { phone: normalized }],
      });
    } else {
      for (const u of memoryUsers.values()) {
        if (u.email === normalized || u.phone === normalized) {
          return u;
        }
      }
      return null;
    }
  }

  /**
   * Initiates sending a secure 6-digit login OTP via Gmail API OAuth2
   */
  static async requestLoginOtp(identifier: string) {
    if (!identifier || typeof identifier !== 'string') {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email or phone identifier is required' };
    }

    const user = await AuthService.findUserByIdentifier(identifier);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'No registered account found with this email or phone' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
    }

    return await OtpService.createAndSendOtp({
      email: user.email,
      purpose: 'LOGIN',
      userName: user.name,
    });
  }

  /**
   * Verifies login OTP and returns authenticated JWT tokens
   */
  static async loginWithOtp(identifier: string, otp: string) {
    if (!identifier || !otp) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Identifier and OTP code are required' };
    }

    const user = await AuthService.findUserByIdentifier(identifier);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'No registered account found with this email or phone' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
    }

    const verification = await OtpService.verifyOtp({
      email: user.email,
      otp,
      purpose: 'LOGIN',
    });

    if (!verification.valid) {
      throw { statusCode: 401, code: 'INVALID_OTP', message: verification.message };
    }

    const userId = user._id ? (user._id as any).toString() : user.id;
    const tokens = JwtUtil.generateTokens({
      userId,
      role: user.role,
      email: user.email,
    });

    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : (() => {
      const { passwordHash: _, ...rest } = user;
      return rest;
    })();

    return {
      user: safeUser,
      tokens,
    };
  }

  /**
   * Fetch authenticated user details
   */
  static async getAuthenticatedUser(userId: string) {
    if (AuthService.isMongoConnected()) {
      const user = await UserModel.findById(userId);
      if (!user || !user.isActive) {
        throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User session invalid or user not found' };
      }
      return user.toJSON();
    } else {
      const user = memoryUsers.get(userId);
      if (!user) {
        throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User session invalid or user not found' };
      }
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
  }

  /**
   * Google Identity Services & Android Native Sign-In Verification
   * POST /api/v1/auth/google
   */
  static async loginWithGoogle(input: GoogleAuthInput) {
    if (!config.googleWebClientId) {
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

    // Verify token with google-auth-library
    const client = new OAuth2Client(config.googleWebClientId);
    let payload: any;

    try {
      const ticket = await client.verifyIdToken({
        idToken: input.idToken,
        audience: config.googleWebClientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
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
      throw {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Token audience mismatch.',
      };
    }

    // Verify issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
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

    if (AuthService.isMongoConnected()) {
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
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB Atlas connection is required in production.',
        };
      }

      // Resilient In-Memory Mode
      let user: any = null;
      for (const u of memoryUsers.values()) {
        if (u.googleId === googleId) {
          user = u;
          break;
        }
      }
      if (!user) {
        for (const u of memoryUsers.values()) {
          if (u.email === emailNormalized) {
            user = u;
            break;
          }
        }
      }

      if (user) {
        if (user.role === 'ADMIN') {
          throw {
            statusCode: 403,
            code: 'ADMIN_GOOGLE_LOGIN_FORBIDDEN',
            message: 'Administrative accounts cannot authenticate via Google.',
          };
        }
        if (!user.isActive) {
          throw {
            statusCode: 403,
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been deactivated or suspended.',
          };
        }
        if (!user.isEmailVerified) {
          delete user.passwordHash;
          user.isEmailVerified = true;
        }
        if (!user.googleId) user.googleId = googleId;
        if (!user.authProviders) user.authProviders = ['LOCAL'];
        if (!user.authProviders.includes('GOOGLE')) user.authProviders.push('GOOGLE');

        const tokens = JwtUtil.generateTokens({
          userId: user._id || user.id,
          role: user.role,
          email: user.email,
        });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, tokens };
      }

      const requestedRole = (input.role || '').toUpperCase();
      const validRoles: UserRole[] = ['TENANT', 'OWNER', 'PROFESSIONAL'];
      const roleToUse: UserRole = validRoles.includes(requestedRole as UserRole)
        ? (requestedRole as UserRole)
        : 'TENANT';

      const phoneNormalized = (input.phone || '').trim();
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

      const cleanPhone = phoneNormalized.replace(/\D/g, '');
      const id = 'mem_usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userDoc = {
        _id: id,
        id,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      PersistentStore.insert('users', userDoc);
      memoryUsers.set(id, userDoc);

      const tokens = JwtUtil.generateTokens({
        userId: id,
        role: roleToUse,
        email: emailNormalized,
      });
      return { user: userDoc, tokens };
    }
  }
}

