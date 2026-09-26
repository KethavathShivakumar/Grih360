import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { UserModel } from '../models';
import { memoryUsers } from '../services/auth.service';
import { PasswordUtil } from '../utils/password.util';
import mongoose from 'mongoose';

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

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        ApiResponseUtil.error(res, 'Current password and new password are required', 400, 'VALIDATION_ERROR');
        return;
      }
      if (newPassword.length < 6) {
        ApiResponseUtil.error(res, 'New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
        return;
      }

      const userId = req.user.userId;
      if (mongoose.connection.readyState === 1) {
        const user = await UserModel.findById(userId).select('+passwordHash');
        if (!user || !user.passwordHash) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        const isValid = await PasswordUtil.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          ApiResponseUtil.error(res, 'Incorrect current password', 400, 'INVALID_PASSWORD');
          return;
        }
        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        await user.save();
        ApiResponseUtil.success(res, 'Password changed successfully');
      } else {
        let user = memoryUsers.get(userId) || PersistentStore.findById('users', userId);
        if (!user || !user.passwordHash) {
          ApiResponseUtil.error(res, 'User not found', 404, 'NOT_FOUND');
          return;
        }
        const isValid = await PasswordUtil.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          ApiResponseUtil.error(res, 'Incorrect current password', 400, 'INVALID_PASSWORD');
          return;
        }
        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        memoryUsers.set(userId, user);
        PersistentStore.update('users', userId, { passwordHash: user.passwordHash });
        ApiResponseUtil.success(res, 'Password changed successfully');
      }
    } catch (err) {
      next(err);
    }
  }
}
