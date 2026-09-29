import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { OtpModel, OtpPurpose } from '../models/otp.model';
import { EmailService } from './email.service';

export interface SendOtpResult {
  success: boolean;
  message: string;
  emailMasked: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResult {
  valid: boolean;
  message: string;
}

export class OtpService {
  private static readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Helper to mask email address for safe display in responses
   */
  public static maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    const maskedName = `${name.slice(0, 2)}${'*'.repeat(Math.min(name.length - 2, 5))}${name.slice(-1)}`;
    return `${maskedName}@${domain}`;
  }

  /**
   * Generates a cryptographically secure 6-digit numeric OTP code
   */
  public static generateCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Creates, hashes, persists, and delivers an OTP to the user's email via Gmail API OAuth2
   */
  public static async createAndSendOtp(params: {
    email: string;
    purpose: OtpPurpose;
    userName?: string;
  }): Promise<SendOtpResult> {
    const normalizedEmail = params.email.trim().toLowerCase();

    // 1. Check Rate Limit / Cooldown (60 seconds)
    const now = new Date();
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

    // 2. Generate and Hash Code
    const rawOtp = this.generateCode();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);

    // 3. Persist Hashed OTP
    if (mongoose.connection.readyState === 1) {
      // Invalidate any older unused OTPs for this identifier & purpose
      await OtpModel.updateMany(
        { identifier: normalizedEmail, purpose: params.purpose, isUsed: false },
        { isUsed: true }
      );

      await OtpModel.create({
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

    // 4. Real Email Delivery via Gmail API OAuth2
    await EmailService.sendOtpEmail({
      to: normalizedEmail,
      otp: rawOtp,
      purpose: params.purpose,
      userName: params.userName,
    });

    return {
      success: true,
      message: 'Verification code sent to your registered email address.',
      emailMasked: this.maskEmail(normalizedEmail),
      expiresInSeconds: 600,
    };
  }

  /**
   * Verifies an OTP code against the stored hash
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

    // A. MongoDB path
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

      const isMatch = await bcrypt.compare(enteredOtp, record.otpHash);
      if (!isMatch) {
        record.attempts += 1;
        await record.save();
        const remaining = record.maxAttempts - record.attempts;
        return {
          valid: false,
          message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        };
      }

      // Valid OTP: mark as used
      record.isUsed = true;
      await record.save();

      return { valid: true, message: 'Verification code validated successfully.' };
    }

    // B. PersistentStore fallback
    const { PersistentStore } = require('../config/persistent-store');
    const otps = PersistentStore.find('otps', (o: any) =>
      o.identifier === normalizedEmail &&
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

    const isMatch = await bcrypt.compare(enteredOtp, record.otpHash);
    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      PersistentStore.update('otps', record.id || record._id, { attempts: newAttempts });
      const remaining = record.maxAttempts - newAttempts;
      return {
        valid: false,
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    PersistentStore.update('otps', record.id || record._id, { isUsed: true });
    return { valid: true, message: 'Verification code validated successfully.' };
  }
}
