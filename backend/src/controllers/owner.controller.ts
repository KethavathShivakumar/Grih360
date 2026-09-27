import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/api-response.util';
import { PropertyModel, ApplicationModel, RentalModel, RentRecordModel } from '../models';
import mongoose from 'mongoose';

export class OwnerController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        ApiResponseUtil.error(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const ownerId = req.user.userId;

      if (mongoose.connection.readyState === 1) {
        const properties = await PropertyModel.find({ ownerId }).lean();
        const propertyIds = properties.map((p: any) => p._id);

        const totalProperties = properties.length;
        const availableProperties = properties.filter((p: any) => p.availabilityStatus === 'VACANT').length;
        const occupiedProperties = properties.filter((p: any) => p.availabilityStatus === 'RENTED').length;

        const applications = await ApplicationModel.find({
          $or: [
            { ownerId },
            { propertyId: { $in: propertyIds } }
          ]
        }).lean();
        const totalApplications = applications.length;
        const newApplications = applications.filter((a: any) => a.status === 'SUBMITTED').length;
        const pendingApplications = applications.filter((a: any) =>
          ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED'].includes(a.status)
        ).length;

        const rentals = await RentalModel.find({ ownerId }).lean();
        const activeRentals = rentals.filter((r: any) => r.status === 'ACTIVE').length;

        const rentRecords = await RentRecordModel.find({ ownerId }).lean();
        const upcomingRent = rentRecords
          .filter((rr: any) => rr.status === 'UPCOMING' || rr.status === 'DUE')
          .reduce((sum: number, rr: any) => sum + (rr.amount || 0), 0);

        const overdueRent = rentRecords
          .filter((rr: any) => rr.status === 'OVERDUE')
          .reduce((sum: number, rr: any) => sum + (rr.amount || 0), 0);

        ApiResponseUtil.success(res, 'Owner dashboard metrics retrieved', {
          totalProperties,
          availableProperties,
          occupiedProperties,
          totalApplications,
          newApplications,
          pendingApplications,
          activeRentals,
          upcomingRent,
          overdueRent,
        });
      } else {
        const { PersistentStore } = require('../config/persistent-store');
        const properties = PersistentStore.find('properties', (p: any) => p.ownerId === ownerId);
        const propertyIds = properties.map((p: any) => p._id || p.id);

        const totalProperties = properties.length;
        const availableProperties = properties.filter((p: any) => p.availabilityStatus === 'VACANT' || !p.availabilityStatus).length;
        const occupiedProperties = properties.filter((p: any) => p.availabilityStatus === 'RENTED').length;

        const applications = PersistentStore.find('applications', (a: any) => a.ownerId === ownerId || propertyIds.includes(a.propertyId));
        const totalApplications = applications.length;
        const newApplications = applications.filter((a: any) => a.status === 'SUBMITTED').length;
        const pendingApplications = applications.filter((a: any) =>
          ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED'].includes(a.status)
        ).length;

        const rentals = PersistentStore.find('rentals', (r: any) => r.ownerId === ownerId);
        const activeRentals = rentals.filter((r: any) => r.status === 'ACTIVE').length;

        const rentRecords = PersistentStore.find('rent_records', (rr: any) => rr.ownerId === ownerId);
        const upcomingRent = rentRecords
          .filter((rr: any) => rr.status === 'UPCOMING' || rr.status === 'DUE')
          .reduce((sum: number, rr: any) => sum + (rr.amount || 0), 0);
        const overdueRent = rentRecords
          .filter((rr: any) => rr.status === 'OVERDUE')
          .reduce((sum: number, rr: any) => sum + (rr.amount || 0), 0);

        ApiResponseUtil.success(res, 'Owner dashboard metrics retrieved', {
          totalProperties,
          availableProperties,
          occupiedProperties,
          totalApplications,
          newApplications,
          pendingApplications,
          activeRentals,
          upcomingRent,
          overdueRent,
        });
      }
    } catch (err) {
      next(err);
    }
  }
}
