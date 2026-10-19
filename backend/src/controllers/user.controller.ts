import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { UserModel } from '../models';
import { memoryUsers } from '../services/auth.service';
import { PasswordUtil } from '../utils/password.util';
import mongoose from 'mongoose';
import { OtpService } from '../services/otp.service';

import { PersistentStore } from '../config/persistent-store';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const userId = req.user.userId;
      if (mongoose.connection.readyState === 1) {
        const user = await UserModel.findById(userId);
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        ApiResponseUtil.success(res, 'User profile retrieved', user.toJSON());
      } else {
        let user = memoryUsers.get(userId);
        if (!user) {
          user = PersistentStore.findById('users', userId);
          if (user) memoryUsers.set(userId, user);
        }
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        ApiResponseUtil.success(res, 'User profile retrieved', safeUser);
      }
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const userId = req.user.userId;
      const { name, fullName, phone, profileImage, city, location, occupation, bio, services, serviceArea, availability } = req.body;
      const updateData: any = {};
      if (name || fullName) updateData.name = name || fullName;
      if (phone) updateData.phone = phone;
      if (profileImage !== undefined) updateData.profileImage = profileImage;
      if (city) updateData.city = city;
      if (location) updateData.location = location;
      if (occupation) updateData.occupation = occupation;
      if (bio) updateData.bio = bio;
      if (services) updateData.services = services;
      if (serviceArea) updateData.serviceArea = serviceArea;
      if (availability !== undefined) updateData.availability = availability;
      updateData.updatedAt = new Date();

      if (mongoose.connection.readyState === 1) {
        const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        ApiResponseUtil.success(res, 'User profile updated', user.toJSON());
      } else {
        let user = memoryUsers.get(userId) || PersistentStore.findById('users', userId);
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        const updated = { ...user, ...updateData };
        memoryUsers.set(userId, updated);
        PersistentStore.update('users', userId, updateData);
        const safeUser = { ...updated };
        delete safeUser.passwordHash;
        ApiResponseUtil.success(res, 'User profile updated', safeUser);
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request OTP to Set Password for Google-only account
   * POST /api/v1/users/set-password/send-otp
   */
  static async sendSetPasswordOtp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const userId = req.user.userId;
      let user: any = null;
      if (mongoose.connection.readyState === 1) {
        user = await UserModel.findById(userId);
      } else {
        user = memoryUsers.get(userId) || PersistentStore.findById('users', userId);
      }

      if (!user) {
        ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
        return;
      }

      await OtpService.createAndSendOtp({
        email: user.email,
        purpose: 'PASSWORD_RESET',
        userName: user.name,
      });

      ApiResponseUtil.success(res, 'Verification code sent to your registered email address.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Set Password with Email OTP Verification (for Google-only accounts)
   * POST /api/v1/users/set-password
   */
  static async setPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const { otp, newPassword } = req.body;
      if (!otp || !newPassword) {
        ApiResponseUtil.error(res, 'Verification code and new password are required', 400, 'VALIDATION_ERROR');
        return;
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        ApiResponseUtil.error(res, 'New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
        return;
      }

      const userId = req.user.userId;
      let user: any = null;
      if (mongoose.connection.readyState === 1) {
        user = await UserModel.findById(userId).select('+passwordHash');
      } else {
        user = memoryUsers.get(userId) || PersistentStore.findById('users', userId);
      }

      if (!user) {
        ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
        return;
      }

      const verification = await OtpService.verifyOtp({
        email: user.email,
        otp: (otp || '').trim(),
        purpose: 'PASSWORD_RESET',
      });

      if (!verification.valid) {
        ApiResponseUtil.error(res, verification.message || 'Invalid or expired verification code', 400, 'INVALID_OTP');
        return;
      }

      const passwordHash = await PasswordUtil.hashPassword(newPassword);
      if (mongoose.connection.readyState === 1) {
        user.passwordHash = passwordHash;
        if (!Array.isArray(user.authProviders)) user.authProviders = ['GOOGLE'];
        if (!user.authProviders.includes('LOCAL')) user.authProviders.push('LOCAL');
        user.isEmailVerified = true;
        await user.save();
      } else {
        user.passwordHash = passwordHash;
        if (!Array.isArray(user.authProviders)) user.authProviders = ['GOOGLE'];
        if (!user.authProviders.includes('LOCAL')) user.authProviders.push('LOCAL');
        user.isEmailVerified = true;
        memoryUsers.set(userId, user);
        PersistentStore.update('users', userId, { passwordHash, authProviders: user.authProviders, isEmailVerified: true });
      }

      ApiResponseUtil.success(res, 'Password created successfully. You can now log in using either Google or your email and password.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Change Password (for accounts that already have a password)
   * POST /api/v1/users/change-password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || typeof newPassword !== 'string') {
        ApiResponseUtil.error(res, 'New password is required', 400, 'VALIDATION_ERROR');
        return;
      }
      if (newPassword.length < 6) {
        ApiResponseUtil.error(res, 'New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
        return;
      }

      const userId = req.user.userId;
      if (mongoose.connection.readyState === 1) {
        const user = await UserModel.findById(userId).select('+passwordHash');
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }

        // If user has no password yet, guide them to set-password
        if (!user.passwordHash) {
          ApiResponseUtil.error(res, 'No existing password found. Please use Set Password to configure a password.', 400, 'NO_PASSWORD_SET');
          return;
        }

        // Existing password requires verification
        if (!currentPassword) {
          ApiResponseUtil.error(res, 'Current password is required to change password', 400, 'VALIDATION_ERROR');
          return;
        }
        const isValid = await PasswordUtil.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          ApiResponseUtil.error(res, 'Incorrect current password', 400, 'INVALID_PASSWORD');
          return;
        }
        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        if (!Array.isArray(user.authProviders)) user.authProviders = ['LOCAL'];
        if (!user.authProviders.includes('LOCAL')) user.authProviders.push('LOCAL');
        await user.save();
        ApiResponseUtil.success(res, 'Password changed successfully');
      } else {
        let user = memoryUsers.get(userId) || PersistentStore.findById('users', userId);
        if (!user) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        if (!user.passwordHash) {
          ApiResponseUtil.error(res, 'No existing password found. Please use Set Password to configure a password.', 400, 'NO_PASSWORD_SET');
          return;
        }

        if (!currentPassword) {
          ApiResponseUtil.error(res, 'Current password is required to change password', 400, 'VALIDATION_ERROR');
          return;
        }
        const isValid = await PasswordUtil.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          ApiResponseUtil.error(res, 'Incorrect current password', 400, 'INVALID_PASSWORD');
          return;
        }
        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        if (!Array.isArray(user.authProviders)) user.authProviders = ['LOCAL'];
        if (!user.authProviders.includes('LOCAL')) user.authProviders.push('LOCAL');
        memoryUsers.set(userId, user);
        PersistentStore.update('users', userId, { passwordHash: user.passwordHash, authProviders: user.authProviders });
        ApiResponseUtil.success(res, 'Password changed successfully');
      }
    } catch (err) {
      next(err);
    }
  }
}
