import { UserModel, TenantProfileModel, OwnerProfileModel, ProfessionalProfileModel, RefreshTokenModel } from '../models';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { UserRole } from '../types/auth.types';
import { OtpService } from './otp.service';
import { config } from '../config/env';
import { GoogleAuthService, GoogleAuthInput } from './google-auth.service';
import mongoose from 'mongoose';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export { GoogleAuthInput };

export interface LoginInput {
  identifier: string; // Email or Phone
  password: string;
  role?: string;
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
          if (existingUser.authProviders && existingUser.authProviders.includes('GOOGLE') && !existingUser.passwordHash) {
            throw {
              statusCode: 409,
              code: 'ACCOUNT_EXISTS_GOOGLE',
              message: 'An account with this email already exists using Google sign-in. Continue with Google, or set a password with Forgot Password.',
            };
          }
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

      if (!user) {
        console.warn(`[Auth Security] Login rejected: Unknown account for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.passwordHash) {
        console.warn(`[Auth Security] Login rejected: Account uses Google sign-in (no password configured) [${identifierNormalized}]`);
        throw {
          statusCode: 400,
          code: 'GOOGLE_AUTH_REQUIRED',
          message: 'This account uses Google sign-in. Continue with Google, or set a password with Forgot Password.',
        };
      }

      if (!user.isActive) {
        console.warn(`[Auth Security] Login rejected: Account is inactive or suspended for identifier [${identifierNormalized}]`);
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        console.warn(`[Auth Security] Login rejected: Password verification mismatch for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      // Check role mismatch if role was provided from login portal
      if (input.role) {
        const requestedRole = input.role.trim().toUpperCase();
        const userRole = (user.role || '').toUpperCase();
        if (requestedRole && requestedRole !== userRole) {
          console.warn(`[Auth Security] Login rejected: Role mismatch for identifier [${identifierNormalized}]. Account role: [${userRole}], portal: [${requestedRole}]`);
          const portalNameMap: Record<string, string> = {
            TENANT: 'Tenant portal',
            OWNER: 'Owner portal',
            PROFESSIONAL: 'Professional portal',
            ADMIN: 'Admin console',
          };
          const targetPortal = portalNameMap[userRole] || `${userRole} portal`;
          throw {
            statusCode: 403,
            code: 'ROLE_MISMATCH',
            message: `This account is registered for the ${targetPortal}. Please switch to the ${targetPortal} to log in.`,
          };
        }
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
        console.warn(`[Auth Security] In-memory login rejected: Unknown account for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.passwordHash) {
        console.warn(`[Auth Security] In-memory login rejected: Account uses Google sign-in (no password configured) [${identifierNormalized}]`);
        throw {
          statusCode: 400,
          code: 'GOOGLE_AUTH_REQUIRED',
          message: 'This account uses Google sign-in. Continue with Google, or set a password with Forgot Password.',
        };
      }

      if (!user.isActive) {
        console.warn(`[Auth Security] In-memory login rejected: Account is inactive or suspended for identifier [${identifierNormalized}]`);
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        console.warn(`[Auth Security] In-memory login rejected: Password verification mismatch for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (input.role) {
        const requestedRole = input.role.trim().toUpperCase();
        const userRole = (user.role || '').toUpperCase();
        if (requestedRole && requestedRole !== userRole) {
          console.warn(`[Auth Security] In-memory login rejected: Role mismatch for identifier [${identifierNormalized}]. Account role: [${userRole}], portal: [${requestedRole}]`);
          const portalNameMap: Record<string, string> = {
            TENANT: 'Tenant portal',
            OWNER: 'Owner portal',
            PROFESSIONAL: 'Professional portal',
            ADMIN: 'Admin console',
          };
          const targetPortal = portalNameMap[userRole] || `${userRole} portal`;
          throw {
            statusCode: 403,
            code: 'ROLE_MISMATCH',
            message: `This account is registered for the ${targetPortal}. Please switch to the ${targetPortal} to log in.`,
          };
        }
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
   * Delegated to isolated GoogleAuthService to ensure complete fault tolerance for email login.
   */
  static async loginWithGoogle(input: GoogleAuthInput) {
    return await GoogleAuthService.loginWithGoogle(input);
  }

  /**
   * Send Password Reset OTP
   */
  static async sendForgotPasswordOtp(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'A valid email address is required.' };
    }

    const user = await AuthService.findUserByIdentifier(normalizedEmail);
    // If account doesn't exist, return neutral success message to prevent user enumeration
    if (!user) {
      console.log(`[Forgot Password] Requested for non-existent email [${normalizedEmail}]. Returning neutral response.`);
      return {
        success: true,
        message: 'If an account exists with this email address, a verification code has been sent.',
      };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
    }

    await OtpService.createAndSendOtp({
      email: user.email,
      purpose: 'PASSWORD_RESET',
      userName: user.name,
    });

    return {
      success: true,
      message: 'Verification code sent to your registered email address.',
    };
  }

  /**
   * Reset or Set Password with Email OTP Verification
   */
  static async resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!normalizedEmail || !cleanOtp || !newPassword) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Email address, 6-digit verification code, and new password are required.',
      };
    }

    if (newPassword.length < 6) {
      throw {
        statusCode: 400,
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      };
    }

    const verification = await OtpService.verifyOtp({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'PASSWORD_RESET',
    });

    if (!verification.valid) {
      throw {
        statusCode: 400,
        code: 'INVALID_OTP',
        message: verification.message || 'Invalid or expired verification code.',
      };
    }

    const passwordHash = await PasswordUtil.hashPassword(newPassword);

    if (AuthService.isMongoConnected()) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (!user) {
        throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User account not found.' };
      }

      user.passwordHash = passwordHash;
      if (!Array.isArray(user.authProviders)) {
        user.authProviders = ['LOCAL'];
      }
      if (!user.authProviders.includes('LOCAL')) {
        user.authProviders.push('LOCAL');
      }
      user.isEmailVerified = true;
      await user.save();

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your email and password.',
      };
    } else {
      let user: any = null;
      for (const u of memoryUsers.values()) {
        if (u.email === normalizedEmail) {
          user = u;
          break;
        }
      }
      if (!user) {
        throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User account not found.' };
      }

      user.passwordHash = passwordHash;
      if (!Array.isArray(user.authProviders)) {
        user.authProviders = ['LOCAL'];
      }
      if (!user.authProviders.includes('LOCAL')) {
        user.authProviders.push('LOCAL');
      }
      user.isEmailVerified = true;
      user.updatedAt = new Date();
      memoryUsers.set(user._id || user.id, user);
      PersistentStore.update('users', user._id || user.id, user);

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your email and password.',
      };
    }
  }
}

