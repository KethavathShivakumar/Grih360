import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { OtpModel, EmailOtpModel, OtpPurpose } from '../models/otp.model';
import { LoginChallengeModel } from '../models/login-challenge.model';
import { EmailService } from './email.service';
import { config } from '../config/env';

export interface SendOtpResult {
  success: boolean;
  message: string;
  emailMasked: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResult {
  valid: boolean;
  message: string;
  statusCode?: number;
  remainingAttempts?: number;
  user?: any;
}

export interface LoginChallengeResult {
  challengeId: string;
  rawOtp: string;
  expiresAt: Date;
  maskedEmail: string;
}

export class OtpService {
  public static readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // Strict 5-minute lifespan
  public static readonly CHALLENGE_EXPIRY_MS = 10 * 60 * 1000; // 10-minute maximum context window
  public static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60-second restriction window
  public static readonly MAX_ATTEMPTS = 5;

  /**
   * Helper to mask email address for safe display in responses (e.g., te***t@do***in.com)
   */
  public static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const [name, fullDomain] = email.trim().toLowerCase().split('@');
    if (!fullDomain) return email;

    let maskedName = name;
    if (name.length <= 2) {
      maskedName = `${name[0]}*`;
    } else {
      const start = name.slice(0, 2);
      const end = name.slice(-1);
      maskedName = `${start}${'*'.repeat(Math.min(name.length - 3, 5))}${end}`;
    }

    return `${maskedName}@${fullDomain}`;
  }

  /**
   * Generates a cryptographically secure 6-digit numeric OTP code
   */
  public static generateCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes the generated token using server-side HMAC-SHA256 secret (Keyed Hashing)
   */
  public static hashOtp(rawOtp: string): string {
    const secret = process.env.OTP_HMAC_SECRET || config.jwtAccessSecret || 'nivas360_secure_otp_hmac_secret_2026';
    return crypto.createHmac('sha256', secret).update(rawOtp.trim()).digest('hex');
  }

  /**
   * Constant-time verification of entered OTP against stored hash.
   * Also supports bcrypt hash verification for backward compatibility.
   */
  public static verifyOtpHash(enteredOtp: string, storedHash: string): boolean {
    if (!enteredOtp || !storedHash) return false;
    const cleanOtp = enteredOtp.trim();

    // Backward compatibility for bcrypt hashes
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      return bcrypt.compareSync(cleanOtp, storedHash);
    }

    // Constant-time HMAC-SHA256 comparison
    const secret = process.env.OTP_HMAC_SECRET || config.jwtAccessSecret || 'nivas360_secure_otp_hmac_secret_2026';
    const computedHash = crypto.createHmac('sha256', secret).update(cleanOtp).digest('hex');

    if (computedHash.length !== storedHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
  }

  /**
   * Step A: Creates a stateful Login Challenge and dispatches the identity token.
   * Invalidation: All previous active OTPs and open challenges for the user are invalidated.
   */
  public static async createLoginChallenge(user: {
    _id?: any;
    id?: any;
    email: string;
    name?: string;
  }): Promise<LoginChallengeResult> {
    const userId = user._id ? (user._id as any).toString() : user.id;
    const normalizedEmail = user.email.trim().toLowerCase();
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);
    const challengeExpiresAt = new Date(now.getTime() + this.CHALLENGE_EXPIRY_MS);

    // 1. Invalidate historical active OTPs and open challenges
    if (mongoose.connection.readyState === 1) {
      await OtpModel.updateMany(
        {
          $or: [{ email: normalizedEmail }, { identifier: normalizedEmail }, { userId }],
          isUsed: false,
        },
        { isUsed: true }
      );

      await LoginChallengeModel.updateMany(
        {
          $or: [{ email: normalizedEmail }, { userId }],
          isCompleted: false,
        },
        { isCompleted: true }
      );
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otps = PersistentStore.loadCollection('otps');
      for (const o of otps) {
        if ((o.email === normalizedEmail || o.identifier === normalizedEmail || o.userId === userId) && !o.isUsed) {
          PersistentStore.update('otps', o.id || o._id, { isUsed: true });
        }
      }
      const challenges = PersistentStore.loadCollection('login_challenges');
      for (const c of challenges) {
        if ((c.email === normalizedEmail || c.userId === userId) && !c.isCompleted) {
          PersistentStore.update('login_challenges', c.id || c._id, { isCompleted: true });
        }
      }
    }

    // 2. Generate secure random 6-digit numeric code and HMAC keyed hash
    const rawOtp = this.generateCode();
    const otpHash = this.hashOtp(rawOtp);
    const challengeId = crypto.randomBytes(32).toString('hex');

    // 3. Persist OTP and Login Challenge
    if (mongoose.connection.readyState === 1) {
      await OtpModel.create({
        userId,
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: 'LOGIN',
        otpHash,
        expiresAt: otpExpiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
      });

      await LoginChallengeModel.create({
        challengeId,
        userId,
        email: normalizedEmail,
        isCompleted: false,
        totalAttempts: 0,
        expiresAt: challengeExpiresAt,
      });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otpId = 'otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      PersistentStore.insert('otps', {
        id: otpId,
        _id: otpId,
        userId,
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: 'LOGIN',
        otpHash,
        expiresAt: otpExpiresAt.toISOString(),
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
        createdAt: now.toISOString(),
      });

      PersistentStore.insert('login_challenges', {
        id: challengeId,
        _id: challengeId,
        challengeId,
        userId,
        email: normalizedEmail,
        isCompleted: false,
        totalAttempts: 0,
        expiresAt: challengeExpiresAt.toISOString(),
        createdAt: now.toISOString(),
      });
    }

    // 4. Dispatch raw OTP into Identity Token / Notification Infrastructure
    try {
      await EmailService.sendOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        purpose: 'LOGIN',
        userName: user.name,
      });
    } catch (err: any) {
      console.warn('[OtpService] Email notification dispatch notice:', err?.message || err);
    }

    return {
      challengeId,
      rawOtp,
      expiresAt: otpExpiresAt,
      maskedEmail: this.maskEmail(normalizedEmail),
    };
  }

  /**
   * Step B: Code Validation Challenge
   */
  public static async verifyLoginChallengeOtp(
    challengeId: string,
    enteredOtp: string
  ): Promise<VerifyOtpResult> {
    const cleanChallengeId = (challengeId || '').trim();
    const cleanOtp = (enteredOtp || '').trim();

    if (!cleanChallengeId || !cleanOtp || cleanOtp.length !== 6) {
      return {
        valid: false,
        statusCode: 400,
        message: 'A valid challenge ID and 6-digit verification code are required.',
      };
    }

    const now = new Date();

    // 1. Resolve Challenge Context
    let challenge: any = null;
    if (mongoose.connection.readyState === 1) {
      challenge = await LoginChallengeModel.findOne({ challengeId: cleanChallengeId });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      challenge = PersistentStore.findOne('login_challenges', (c: any) => c.challengeId === cleanChallengeId);
    }

    if (!challenge) {
      return {
        valid: false,
        statusCode: 400,
        message: 'Invalid or expired authentication challenge. Please sign in again.',
      };
    }

    if (challenge.isCompleted) {
      return {
        valid: false,
        statusCode: 400,
        message: 'This authentication challenge has already been completed. Please sign in again.',
      };
    }

    if (new Date(challenge.expiresAt).getTime() <= now.getTime()) {
      return {
        valid: false,
        statusCode: 400,
        message: 'Authentication session expired. Please sign in again.',
      };
    }

    // Check excessive total attempts across resends
    if ((challenge.totalAttempts || 0) >= 10) {
      if (mongoose.connection.readyState === 1) {
        challenge.isCompleted = true;
        await challenge.save();
      } else {
        const { PersistentStore } = require('../config/persistent-store');
        PersistentStore.update('login_challenges', challenge.id || challenge._id, { isCompleted: true });
      }
      return {
        valid: false,
        statusCode: 401,
        message: 'Too many failed verification attempts across session. Please sign in again.',
      };
    }

    // 2. Fetch Latest Active Code Record for Context
    const normalizedEmail = challenge.email.trim().toLowerCase();
    let otpRecord: any = null;

    if (mongoose.connection.readyState === 1) {
      otpRecord = await OtpModel.findOne({
        $or: [{ email: normalizedEmail }, { identifier: normalizedEmail }, { userId: challenge.userId }],
        purpose: 'LOGIN',
        isUsed: false,
        expiresAt: { $gt: now },
      })
        .sort({ createdAt: -1 })
        .select('+otpHash');
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otps = PersistentStore.find('otps', (o: any) =>
        (o.email === normalizedEmail || o.identifier === normalizedEmail || o.userId === challenge.userId) &&
        o.purpose === 'LOGIN' &&
        !o.isUsed &&
        new Date(o.expiresAt).getTime() > now.getTime()
      );
      otpRecord = otps.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }

    if (!otpRecord) {
      return {
        valid: false,
        statusCode: 400,
        message: 'Verification code has expired. Please request a new code.',
      };
    }

    // 3. Attempt Management (5 failed attempts limit)
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      if (mongoose.connection.readyState === 1) {
        otpRecord.isUsed = true;
        await otpRecord.save();
        challenge.isCompleted = true;
        await challenge.save();
      } else {
        const { PersistentStore } = require('../config/persistent-store');
        PersistentStore.update('otps', otpRecord.id || otpRecord._id, { isUsed: true });
        PersistentStore.update('login_challenges', challenge.id || challenge._id, { isCompleted: true });
      }
      return {
        valid: false,
        statusCode: 401,
        message: 'Too many incorrect attempts. This code is invalidated. Please request a new one.',
      };
    }

    // 4. Cryptographic Verification
    const isMatch = this.verifyOtpHash(cleanOtp, otpRecord.otpHash);

    if (!isMatch) {
      const newAttempts = otpRecord.attempts + 1;
      const totalAttempts = (challenge.totalAttempts || 0) + 1;
      const remaining = Math.max(0, otpRecord.maxAttempts - newAttempts);
      const isLockout = newAttempts >= otpRecord.maxAttempts;

      if (mongoose.connection.readyState === 1) {
        otpRecord.attempts = newAttempts;
        if (isLockout) otpRecord.isUsed = true;
        await otpRecord.save();

        challenge.totalAttempts = totalAttempts;
        if (isLockout) challenge.isCompleted = true;
        await challenge.save();
      } else {
        const { PersistentStore } = require('../config/persistent-store');
        PersistentStore.update('otps', otpRecord.id || otpRecord._id, {
          attempts: newAttempts,
          isUsed: isLockout ? true : otpRecord.isUsed,
        });
        PersistentStore.update('login_challenges', challenge.id || challenge._id, {
          totalAttempts,
          isCompleted: isLockout ? true : challenge.isCompleted,
        });
      }

      if (isLockout) {
        return {
          valid: false,
          statusCode: 401,
          remainingAttempts: 0,
          message: 'Too many incorrect attempts. Verification code invalidated. Please sign in again.',
        };
      }

      return {
        valid: false,
        statusCode: 401,
        remainingAttempts: remaining,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // 5. Atomic State Change
    const consumedTime = new Date();
    if (mongoose.connection.readyState === 1) {
      otpRecord.isUsed = true;
      otpRecord.consumedAt = consumedTime;
      otpRecord.verifiedAt = consumedTime;
      await otpRecord.save();

      challenge.isCompleted = true;
      await challenge.save();
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      PersistentStore.update('otps', otpRecord.id || otpRecord._id, {
        isUsed: true,
        consumedAt: consumedTime.toISOString(),
        verifiedAt: consumedTime.toISOString(),
      });
      PersistentStore.update('login_challenges', challenge.id || challenge._id, {
        isCompleted: true,
      });
    }

    // 6. Resolve User Account Record
    let user: any = null;
    const { UserModel } = require('../models/user.model');
    const { AuthService } = require('./auth.service');

    if (mongoose.connection.readyState === 1) {
      user = await UserModel.findById(challenge.userId);
      if (!user) {
        user = await UserModel.findOne({ email: normalizedEmail });
      }
    } else {
      user = await AuthService.findUserByIdentifier(normalizedEmail);
    }

    if (!user) {
      return {
        valid: false,
        statusCode: 404,
        message: 'Account matching this authentication challenge was not found.',
      };
    }

    return {
      valid: true,
      user: typeof user.toJSON === 'function' ? user.toJSON() : user,
      message: 'Verification code validated successfully.',
    };
  }

  /**
   * Step C: Code Refresh Lifecycle (Enforces 60s cooldown, invalidates unused codes, preserves rate boundaries)
   */
  public static async resendLoginChallengeOtp(challengeId: string): Promise<{
    success: boolean;
    message: string;
    expiresInSeconds: number;
    cooldownSeconds: number;
  }> {
    const cleanChallengeId = (challengeId || '').trim();
    if (!cleanChallengeId) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Challenge ID is required' };
    }

    const now = new Date();

    // 1. Resolve Challenge Context
    let challenge: any = null;
    if (mongoose.connection.readyState === 1) {
      challenge = await LoginChallengeModel.findOne({ challengeId: cleanChallengeId });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      challenge = PersistentStore.findOne('login_challenges', (c: any) => c.challengeId === cleanChallengeId);
    }

    if (!challenge) {
      throw {
        statusCode: 400,
        code: 'INVALID_CHALLENGE',
        message: 'Invalid or expired authentication challenge. Please sign in again.',
      };
    }

    if (challenge.isCompleted) {
      throw {
        statusCode: 400,
        code: 'CHALLENGE_COMPLETED',
        message: 'This authentication challenge has already concluded. Please sign in again.',
      };
    }

    if (new Date(challenge.expiresAt).getTime() <= now.getTime()) {
      throw {
        statusCode: 400,
        code: 'CHALLENGE_EXPIRED',
        message: 'Authentication session expired. Please sign in again.',
      };
    }

    const normalizedEmail = challenge.email.trim().toLowerCase();

    // 2. Check 60-Second Cooldown Window
    let latestOtp: any = null;
    if (mongoose.connection.readyState === 1) {
      latestOtp = await OtpModel.findOne({
        $or: [{ email: normalizedEmail }, { identifier: normalizedEmail }, { userId: challenge.userId }],
        purpose: 'LOGIN',
      }).sort({ createdAt: -1 });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otps = PersistentStore.find('otps', (o: any) =>
        (o.email === normalizedEmail || o.identifier === normalizedEmail || o.userId === challenge.userId) &&
        o.purpose === 'LOGIN'
      );
      latestOtp = otps.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }

    if (latestOtp) {
      const elapsedMs = now.getTime() - new Date(latestOtp.createdAt).getTime();
      if (elapsedMs < this.RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        throw {
          statusCode: 429,
          code: 'RATE_LIMIT_COOLDOWN',
          message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
          remainingSeconds,
        };
      }
    }

    // 3. Invalidate previous unused codes
    if (mongoose.connection.readyState === 1) {
      await OtpModel.updateMany(
        {
          $or: [{ email: normalizedEmail }, { identifier: normalizedEmail }, { userId: challenge.userId }],
          purpose: 'LOGIN',
          isUsed: false,
        },
        { isUsed: true }
      );
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otps = PersistentStore.loadCollection('otps');
      for (const o of otps) {
        if (
          (o.email === normalizedEmail || o.identifier === normalizedEmail || o.userId === challenge.userId) &&
          o.purpose === 'LOGIN' &&
          !o.isUsed
        ) {
          PersistentStore.update('otps', o.id || o._id, { isUsed: true });
        }
      }
    }

    // 4. Cycle Refresh: generate and store new 6-digit HMAC-hashed OTP
    const rawOtp = this.generateCode();
    const otpHash = this.hashOtp(rawOtp);
    const otpExpiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);

    if (mongoose.connection.readyState === 1) {
      await OtpModel.create({
        userId: challenge.userId,
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: 'LOGIN',
        otpHash,
        expiresAt: otpExpiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
      });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otpId = 'otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      PersistentStore.insert('otps', {
        id: otpId,
        _id: otpId,
        userId: challenge.userId,
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: 'LOGIN',
        otpHash,
        expiresAt: otpExpiresAt.toISOString(),
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
        createdAt: now.toISOString(),
      });
    }

    // 5. Dispatch new raw OTP to identity token notification delivery engine
    try {
      await EmailService.sendOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        purpose: 'LOGIN',
      });
    } catch (err: any) {
      console.warn('[OtpService] Resend email dispatch notice:', err?.message || err);
    }

    return {
      success: true,
      message: 'New verification code sent to your registered email.',
      expiresInSeconds: 300,
      cooldownSeconds: 60,
    };
  }

  /**
   * General OTP Generation (Used for direct OTP login or general verification)
   */
  public static async createAndSendOtp(params: {
    email: string;
    purpose: OtpPurpose;
    userName?: string;
  }): Promise<SendOtpResult> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const now = new Date();

    // 1. Check Rate Limit / Cooldown (60 seconds)
    if (mongoose.connection.readyState === 1) {
      const recentOtp = await OtpModel.findOne({
        identifier: normalizedEmail,
        purpose: params.purpose,
        createdAt: { $gte: new Date(now.getTime() - this.RESEND_COOLDOWN_MS) },
      });
      if (recentOtp) {
        const remainingSeconds = Math.ceil(
          (this.RESEND_COOLDOWN_MS - (now.getTime() - recentOtp.createdAt.getTime())) / 1000
        );
        throw new Error(
          `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
        );
      }
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const recent = PersistentStore.findOne('otps', (o: any) =>
        o.identifier === normalizedEmail &&
        o.purpose === params.purpose &&
        new Date(o.createdAt).getTime() >= (now.getTime() - this.RESEND_COOLDOWN_MS)
      );
      if (recent) {
        throw new Error('Please wait 60 seconds before requesting a new verification code.');
      }
    }

    // 2. Generate Code and Hash
    const rawOtp = this.generateCode();
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);

    // 3. Persist Hashed OTP
    if (mongoose.connection.readyState === 1) {
      await OtpModel.updateMany(
        { identifier: normalizedEmail, purpose: params.purpose, isUsed: false },
        { isUsed: true }
      );

      await OtpModel.create({
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: params.purpose,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
      });
    } else {
      const { PersistentStore } = require('../config/persistent-store');
      const otpId = 'otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      PersistentStore.insert('otps', {
        id: otpId,
        _id: otpId,
        email: normalizedEmail,
        identifier: normalizedEmail,
        purpose: params.purpose,
        otpHash,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isUsed: false,
        createdAt: now.toISOString(),
      });
    }

    // 4. Delivery via Gmail API OAuth2
    try {
      await EmailService.sendOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        purpose: params.purpose,
        userName: params.userName,
      });
    } catch (err: any) {
      console.warn('[OtpService] Email delivery notice:', err?.message || err);
    }

    return {
      success: true,
      message: 'Verification code sent to your registered email address.',
      emailMasked: this.maskEmail(normalizedEmail),
      expiresInSeconds: 300,
    };
  }

  /**
   * General OTP Verification
   */
  public static async verifyOtp(params: {
    email: string;
    otp: string;
    purpose: OtpPurpose;
  }): Promise<VerifyOtpResult> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const enteredOtp = (params.otp || '').trim();

    if (!enteredOtp || enteredOtp.length !== 6) {
      return { valid: false, message: 'Please enter a valid 6-digit verification code.' };
    }

    const now = new Date();

    if (mongoose.connection.readyState === 1) {
      const record = await OtpModel.findOne({
        identifier: normalizedEmail,
        purpose: params.purpose,
        isUsed: false,
        expiresAt: { $gt: now },
      }).select('+otpHash');

      if (!record) {
        return {
          valid: false,
          message: 'Verification code has expired or is invalid. Please request a new one.',
        };
      }

      if (record.attempts >= record.maxAttempts) {
        record.isUsed = true;
        await record.save();
        return {
          valid: false,
          message: 'Too many incorrect attempts. This code is invalidated. Please request a new one.',
        };
      }

      const isMatch = this.verifyOtpHash(enteredOtp, record.otpHash);
      if (!isMatch) {
        record.attempts += 1;
        await record.save();
        const remaining = record.maxAttempts - record.attempts;
        return {
          valid: false,
          message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        };
      }

      record.isUsed = true;
      record.consumedAt = now;
      record.verifiedAt = now;
      await record.save();

      return { valid: true, message: 'Verification code validated successfully.' };
    }

    // PersistentStore fallback
    const { PersistentStore } = require('../config/persistent-store');
    const otps = PersistentStore.find('otps', (o: any) =>
      (o.identifier === normalizedEmail || o.email === normalizedEmail) &&
      o.purpose === params.purpose &&
      !o.isUsed &&
      new Date(o.expiresAt).getTime() > now.getTime()
    );

    const record = otps.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!record) {
      return {
        valid: false,
        message: 'Verification code has expired or is invalid. Please request a new one.',
      };
    }

    if (record.attempts >= record.maxAttempts) {
      PersistentStore.update('otps', record.id || record._id, { isUsed: true });
      return {
        valid: false,
        message: 'Too many incorrect attempts. This code is invalidated. Please request a new one.',
      };
    }

    const isMatch = this.verifyOtpHash(enteredOtp, record.otpHash);
    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      PersistentStore.update('otps', record.id || record._id, { attempts: newAttempts });
      const remaining = record.maxAttempts - newAttempts;
      return {
        valid: false,
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    PersistentStore.update('otps', record.id || record._id, {
      isUsed: true,
      consumedAt: now.toISOString(),
      verifiedAt: now.toISOString(),
    });
    return { valid: true, message: 'Verification code validated successfully.' };
  }
}
