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

// Account lockout tracker for password failures (15 min lockout after 5 failed attempts)
interface FailedLoginTracker {
  attempts: number;
  lockedUntil?: Date;
}
const failedPasswordAttempts = new Map<string, FailedLoginTracker>();
const MAX_PASSWORD_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

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
   * Helper to create tokens and store rotating 30-day refresh token in DB
   */
  static async createSessionTokens(user: any) {
    const userId = (user._id || user.id).toString();
    const tokens = JwtUtil.generateTokens({
      userId,
      role: user.role,
      email: user.email,
    });

    const tokenHash = JwtUtil.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (AuthService.isMongoConnected() && user._id) {
      await RefreshTokenModel.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });
    }
    return tokens;
  }

  /**
   * Seed Default Platform Accounts (Disabled - No demo data)
   */
  static async seedDemoUsers(): Promise<void> {
    return;
  }

  /**
   * Check whether an email account exists, its authentication methods, and roles
   * POST /api/v1/auth/check-email
   */
  static async checkEmail(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' };
    }

    const user = await AuthService.findUserByIdentifier(normalized);
    if (!user) {
      return {
        exists: false,
      };
    }

    const isGoogle = (user.authProviders && user.authProviders.includes('GOOGLE')) || user.authProvider === 'GOOGLE' || !!user.googleId;
    const hasPassword = !!(user.passwordHash || (user as any).password);
    const roles: string[] = [user.role || 'TENANT'];

    return {
      exists: true,
      hasPassword,
      authProviders: user.authProviders || (isGoogle ? ['GOOGLE'] : ['LOCAL']),
      role: user.role || 'TENANT',
      roles,
      emailMasked: OtpService.maskEmail(normalized),
    };
  }

  /**
   * Request Registration OTP (Step 1 of Email Registration)
   * Validates uniqueness and dispatches 6-digit verification code.
   */
  static async requestRegistrationOtp(input: {
    email: string;
    name?: string;
    phone?: string;
    role?: string;
  }) {
    if (!input.email || typeof input.email !== 'string') {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email address is required.' };
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' };
    }

    const existingUser = await AuthService.findUserByIdentifier(normalizedEmail);
    if (existingUser) {
      const isGoogle =
        (existingUser.authProviders && existingUser.authProviders.includes('GOOGLE')) ||
        existingUser.authProvider === 'GOOGLE' ||
        !!existingUser.googleId;
      throw {
        statusCode: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'This email is already registered. Please sign in or continue with Google.',
        authProviders: existingUser.authProviders || (isGoogle ? ['GOOGLE'] : ['LOCAL']),
      };
    }

    if (input.phone) {
      const cleanPhone = input.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        if (AuthService.isMongoConnected()) {
          const existingPhone = await UserModel.findOne({ phone: cleanPhone });
          if (existingPhone) {
            throw {
              statusCode: 409,
              code: 'PHONE_EXISTS',
              message: 'An account with this mobile number already exists.',
            };
          }
        }
      }
    }

    const res = await OtpService.createAndSendOtp({
      email: normalizedEmail,
      purpose: 'REGISTRATION',
      userName: input.name,
    });

    return {
      success: true,
      message: 'Verification code sent to your email.',
      emailMasked: res.emailMasked,
      expiresInSeconds: res.expiresInSeconds,
      ...(res.rawOtp ? { rawOtp: res.rawOtp } : {}),
    };
  }

  /**
   * Verify Registration OTP Code only (returns registrationToken for step-by-step signup)
   */
  static async verifyRegistrationOtpCode(email: string, otp: string) {
    const normalized = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!normalized || !cleanOtp) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email and 6-digit verification code are required.' };
    }

    const verification = await OtpService.verifyOtp({
      email: normalized,
      otp: cleanOtp,
      purpose: 'REGISTRATION',
    });

    if (!verification.valid) {
      throw {
        statusCode: verification.statusCode || 400,
        code: 'INVALID_OTP',
        message: verification.message || 'Invalid or expired verification code.',
        remainingAttempts: verification.remainingAttempts,
      };
    }

    const registrationToken = JwtUtil.generateRegistrationToken({ email: normalized });
    return {
      success: true,
      message: 'Email verification successful.',
      registrationToken,
      email: normalized,
    };
  }

  /**
   * Verify Registration OTP and Create User (Step 2/Final of Email Registration)
   * Accepts either (email + otp) or (registrationToken)
   */
  static async verifyRegistrationOtpAndCreate(input: {
    email?: string;
    otp?: string;
    registrationToken?: string;
    password: string;
    confirmPassword?: string;
    name?: string;
    phone?: string;
    role?: string;
  }) {
    let normalized = '';
    if (input.registrationToken) {
      const decoded = JwtUtil.verifyRegistrationToken(input.registrationToken);
      normalized = (decoded.email || '').trim().toLowerCase();
    } else {
      normalized = (input.email || '').trim().toLowerCase();
      const cleanOtp = (input.otp || '').trim();
      if (!normalized || !cleanOtp) {
        throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email and verification code are required.' };
      }
      const verification = await OtpService.verifyOtp({
        email: normalized,
        otp: cleanOtp,
        purpose: 'REGISTRATION',
      });
      if (!verification.valid) {
        throw {
          statusCode: verification.statusCode || 400,
          code: 'INVALID_OTP',
          message: verification.message || 'Invalid or expired verification code.',
          remainingAttempts: verification.remainingAttempts,
        };
      }
    }

    if (!normalized || !input.password) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email and password are required.' };
    }

    const cleanName = (input.name || '').trim() || normalized.split('@')[0];
    const requestedRole = (input.role || 'TENANT').toUpperCase();

    if (input.password.length < 8) {
      throw { statusCode: 400, code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' };
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
      throw { statusCode: 400, code: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' };
    }

    // Optional phone validation if provided
    let cleanPhone: string | undefined = undefined;
    const phoneNormalized = (input.phone || '').trim();
    if (phoneNormalized) {
      const digits = phoneNormalized.replace(/\D/g, '');
      if (digits.length === 10) {
        cleanPhone = digits;
      }
    }

    const validRoles: UserRole[] = ['TENANT', 'OWNER', 'PROFESSIONAL'];
    const roleToUse: UserRole = validRoles.includes(requestedRole as UserRole)
      ? (requestedRole as UserRole)
      : 'TENANT';

    // Double check email uniqueness in database
    const existingUser = await AuthService.findUserByIdentifier(normalized);
    if (existingUser) {
      throw {
        statusCode: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'This email is already registered. Please sign in or continue with Google.',
        authProviders: existingUser.authProviders || ['LOCAL'],
      };
    }

    // Double check phone uniqueness only if phone was provided
    if (cleanPhone && AuthService.isMongoConnected()) {
      const existingPhone = await UserModel.findOne({ phone: cleanPhone });
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

    if (AuthService.isMongoConnected()) {
      const newUser = await UserModel.create({
        name: cleanName,
        email: normalized,
        phone: cleanPhone || undefined,
        role: roleToUse,
        passwordHash,
        authProviders: ['LOCAL'],
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        identityVerificationStatus: 'NOT_STARTED',
      });

      if (roleToUse === 'TENANT') {
        await TenantProfileModel.create({ userId: newUser._id });
      } else if (roleToUse === 'OWNER') {
        await OwnerProfileModel.create({ userId: newUser._id });
      } else if (roleToUse === 'PROFESSIONAL') {
        await ProfessionalProfileModel.create({
          userId: newUser._id,
          businessName: cleanName,
        });
      }

      const tokens = await AuthService.createSessionTokens(newUser);

      return {
        user: newUser.toJSON(),
        tokens,
        hasPassword: true,
        authProviders: ['LOCAL'],
        message: 'Account registered successfully. Welcome to Grih360!',
      };
    } else {
      const id = 'mem_usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userDoc = {
        _id: id,
        id,
        name: cleanName,
        email: normalized,
        phone: cleanPhone || undefined,
        passwordHash,
        role: roleToUse,
        authProviders: ['LOCAL'],
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        identityVerificationStatus: 'NOT_STARTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      PersistentStore.insert('users', userDoc);
      memoryUsers.set(id, userDoc);

      const tokens = await AuthService.createSessionTokens(userDoc);
      const { passwordHash: _, ...safeUser } = userDoc;

      return {
        user: safeUser,
        tokens,
        hasPassword: true,
        authProviders: ['LOCAL'],
        message: 'Account registered successfully. Welcome to Grih360!',
      };
    }
  }

  /**
   * Real User Registration (Legacy / Direct path)
   */
  static async registerUser(input: RegisterInput) {
    return await AuthService.verifyRegistrationOtpAndCreate({
      email: input.email,
      otp: '000000',
      password: input.password,
      name: input.name,
      phone: input.phone,
      role: input.role,
    }).catch(async (err) => {
      // If OTP failed in legacy call, check uniqueness and throw
      const normalized = input.email.trim().toLowerCase();
      const existingUser = await AuthService.findUserByIdentifier(normalized);
      if (existingUser) {
        throw { statusCode: 409, code: 'EMAIL_ALREADY_REGISTERED', message: 'This email is already registered.' };
      }
      throw err;
    });
  }

  /**
   * Real User Password Login (Method 1)
   * Logs in directly after a correct password without extra OTP step.
   * Lockout after repeated failed attempts.
   */
  static async loginUser(input: LoginInput) {
    let identifierNormalized = input.identifier.trim().toLowerCase();
    if (identifierNormalized === 'admin') {
      identifierNormalized = 'admin@grih360.com';
    }

    // Check account lockout for password attempts
    const lockRecord = failedPasswordAttempts.get(identifierNormalized);
    if (lockRecord?.lockedUntil && lockRecord.lockedUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((lockRecord.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      console.warn(`[Auth Security] Login rejected: Account locked for identifier [${identifierNormalized}]`);
      throw {
        statusCode: 429,
        code: 'ACCOUNT_LOCKED',
        message: `Account temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
      };
    }

    if (AuthService.isMongoConnected()) {
      const user = await UserModel.findOne({
        $or: [{ email: identifierNormalized }, { phone: identifierNormalized }],
      }).select('+passwordHash');

      if (!user) {
        AuthService.recordFailedPasswordAttempt(identifierNormalized);
        console.warn(`[Auth Security] Login rejected: Unknown account for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.passwordHash) {
        console.warn(`[Auth Security] Login rejected: Account uses Google sign-in (no password configured) [${identifierNormalized}]`);
        throw {
          statusCode: 400,
          code: 'GOOGLE_AUTH_REQUIRED',
          message: 'No password set for this account. Use an email code or Continue with Google, or set one with Forgot Password.',
        };
      }

      if (!user.isActive) {
        console.warn(`[Auth Security] Login rejected: Account is inactive or suspended for identifier [${identifierNormalized}]`);
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        AuthService.recordFailedPasswordAttempt(identifierNormalized);
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

      // Reset failed attempts on success
      failedPasswordAttempts.delete(identifierNormalized);

      // Issue access token (15m) and rotating refresh token (30d) directly
      const tokens = await AuthService.createSessionTokens(user);

      return {
        user: user.toJSON(),
        tokens,
        hasPassword: true,
        authProviders: user.authProviders || ['LOCAL'],
        message: 'Login successful',
      };
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'MongoDB Atlas connection is required in production.' };
      }

      let user: any = null;
      for (const u of memoryUsers.values()) {
        if (u.email === identifierNormalized || u.phone === identifierNormalized) {
          user = u;
          break;
        }
      }

      if (!user) {
        AuthService.recordFailedPasswordAttempt(identifierNormalized);
        console.warn(`[Auth Security] In-memory login rejected: Unknown account for identifier [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (!user.passwordHash) {
        console.warn(`[Auth Security] In-memory login rejected: Account uses Google sign-in [${identifierNormalized}]`);
        throw {
          statusCode: 400,
          code: 'GOOGLE_AUTH_REQUIRED',
          message: 'No password set for this account. Use an email code or Continue with Google, or set one with Forgot Password.',
        };
      }

      if (!user.isActive) {
        console.warn(`[Auth Security] In-memory login rejected: Account suspended for [${identifierNormalized}]`);
        throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended' };
      }

      const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        AuthService.recordFailedPasswordAttempt(identifierNormalized);
        console.warn(`[Auth Security] In-memory login rejected: Password mismatch for [${identifierNormalized}]`);
        throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
      }

      if (input.role) {
        const requestedRole = input.role.trim().toUpperCase();
        const userRole = (user.role || '').toUpperCase();
        if (requestedRole && requestedRole !== userRole) {
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

      failedPasswordAttempts.delete(identifierNormalized);
      const tokens = await AuthService.createSessionTokens(user);
      const { passwordHash: _, ...safeUser } = user;

      return {
        user: safeUser,
        tokens,
        hasPassword: true,
        authProviders: user.authProviders || ['LOCAL'],
        message: 'Login successful',
      };
    }
  }

  private static recordFailedPasswordAttempt(identifierNormalized: string) {
    const record = failedPasswordAttempts.get(identifierNormalized) || { attempts: 0 };
    record.attempts += 1;
    if (record.attempts >= MAX_PASSWORD_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      console.warn(`[Auth Security] Identifier [${identifierNormalized}] locked out for 15 minutes after ${record.attempts} failed attempts`);
    }
    failedPasswordAttempts.set(identifierNormalized, record);
  }

  /**
   * Step B: Code Validation Challenge (POST /api/v1/auth/verify-login-otp) - Backward compatible
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
    const tokens = await AuthService.createSessionTokens(user);
    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete safeUser.passwordHash;

    return {
      user: safeUser,
      tokens,
      hasPassword: !!(user.passwordHash || user.password),
      authProviders: user.authProviders || (user.passwordHash ? ['LOCAL'] : ['GOOGLE']),
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
      }).select('+passwordHash');
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
   * Request Login OTP (Method 2 for existing users)
   * Rate limited. Returns neutral message if user does not exist.
   */
  static async requestLoginOtp(identifier: string) {
    if (!identifier || typeof identifier !== 'string') {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email address is required' };
    }

    const normalized = identifier.trim().toLowerCase();
    const user = await AuthService.findUserByIdentifier(normalized);

    // Neutral enumeration protection
    if (!user || !user.isActive) {
      console.log(`[OTP Login] Code requested for unknown or inactive account [${normalized}]. Returning neutral response.`);
      return {
        success: true,
        message: 'If this email is registered, a code was sent.',
        emailMasked: OtpService.maskEmail(normalized),
        expiresInSeconds: (config.emailOtpExpiryMinutes || 10) * 60,
      };
    }

    const res = await OtpService.createAndSendOtp({
      email: user.email,
      purpose: 'LOGIN',
      userName: user.name,
    });

    return {
      success: true,
      message: 'If this email is registered, a code was sent.',
      emailMasked: res.emailMasked,
      expiresInSeconds: res.expiresInSeconds,
      ...(res.rawOtp ? { rawOtp: res.rawOtp } : {}),
    };
  }

  /**
   * Verify Login OTP (Method 2 for existing users)
   * Validates OTP and issues access + refresh tokens.
   */
  static async loginWithOtp(identifier: string, otp: string, role?: string) {
    if (!identifier || !otp) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email address and 6-digit code are required.' };
    }

    const normalized = identifier.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = await AuthService.findUserByIdentifier(normalized);
    if (!user) {
      throw { statusCode: 401, code: 'INVALID_OTP', message: 'Invalid or expired verification code.' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Your account has been deactivated or suspended.' };
    }

    if (role) {
      const requestedRole = role.trim().toUpperCase();
      const userRole = (user.role || '').toUpperCase();
      if (requestedRole && requestedRole !== userRole) {
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

    const verification = await OtpService.verifyOtp({
      email: user.email,
      otp: cleanOtp,
      purpose: 'LOGIN',
    });

    if (!verification.valid) {
      throw {
        statusCode: verification.statusCode || 401,
        code: 'INVALID_OTP',
        message: verification.message || 'Invalid or expired verification code.',
        remainingAttempts: verification.remainingAttempts,
      };
    }

    const tokens = await AuthService.createSessionTokens(user);
    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete safeUser.passwordHash;

    return {
      user: safeUser,
      tokens,
      hasPassword: !!(user.passwordHash || user.password),
      authProviders: user.authProviders || (user.passwordHash ? ['LOCAL'] : ['GOOGLE']),
      message: 'Authentication successful',
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

