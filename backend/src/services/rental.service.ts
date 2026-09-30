import { RentalModel, PropertyModel, ApplicationModel, RentRecordModel } from '../models';
import { memoryProperties } from './property.service';
import mongoose from 'mongoose';
import { PersistentStore } from '../config/persistent-store';

export const memoryRentals = new Map<string, any>();
export const memoryRentRecords = new Map<string, any>();

// Initialize memory cache from persistent disk store
const loadedRentals = PersistentStore.loadCollection('rentals');
for (const r of loadedRentals) {
  memoryRentals.set(r._id || r.id, r);
}

export class RentalService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get all rentals for user (Tenant or Owner)
   */
  static async getUserRentals(userId: string, role?: string) {
    if (RentalService.isMongoConnected()) {
      const query = role === 'TENANT' ? { tenantId: userId } : { ownerId: userId };
      return RentalModel.find(query)
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      return Array.from(memoryRentals.values()).filter((r) => {
        const tId = (r.tenantId?._id || r.tenantId?.id || r.tenantId)?.toString();
        const oId = (r.ownerId?._id || r.ownerId?.id || r.ownerId)?.toString();
        return role === 'TENANT' ? tId === userId.toString() : oId === userId.toString();
      });
    }
  }

  /**
   * Get all rentals for owner
   */
  static async getOwnerRentals(ownerId: string) {
    return RentalService.getUserRentals(ownerId, 'OWNER');
  }

  /**
   * Get rental for specific property with owner authorization
   */
  static async getRentalByPropertyId(propertyId: string, ownerId: string, role: string) {
    if (RentalService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
      }
      if (role !== 'ADMIN' && property.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      return RentalModel.findOne({ propertyId })
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      const property = memoryProperties.get(propertyId);
      if (property && role !== 'ADMIN' && property.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      const rental = Array.from(memoryRentals.values()).find((r) => r.propertyId === propertyId);
      if (rental && role !== 'ADMIN' && rental.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this property' };
      }
      return rental || null;
    }
  }

  /**
   * Get rental record by rental ID with user access validation
   */
  static async getRentalById(rentalId: string, userId: string, role: string) {
    if (RentalService.isMongoConnected()) {
      let rental = null;
      if (mongoose.Types.ObjectId.isValid(rentalId)) {
        rental = await RentalModel.findById(rentalId)
          .populate('propertyId')
          .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
          .lean();
      }
      if (!rental) {
        rental = await RentalModel.findOne({ propertyId: rentalId })
          .populate('propertyId')
          .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
          .lean();
      }
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      const tId = ((rental.tenantId as any)?._id || (rental.tenantId as any)?.id || rental.tenantId)?.toString();
      const oId = ((rental.ownerId as any)?._id || (rental.ownerId as any)?.id || rental.ownerId)?.toString();
      if (role !== 'ADMIN' && oId !== userId.toString() && tId !== userId.toString()) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }
      return rental;
    } else {
      let rental = memoryRentals.get(rentalId) || Array.from(memoryRentals.values()).find((r) => r.id === rentalId || r._id === rentalId || r.propertyId === rentalId);
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      const tId = ((rental.tenantId as any)?._id || (rental.tenantId as any)?.id || rental.tenantId)?.toString();
      const oId = ((rental.ownerId as any)?._id || (rental.ownerId as any)?.id || rental.ownerId)?.toString();
      if (role !== 'ADMIN' && oId !== userId.toString() && tId !== userId.toString()) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }
      return rental;
    }
  }

  /**
   * Get tenant details for specific property (Owner authorization enforced)
   * Privacy Rule: Only returns appropriate contact & status fields. NO sensitive identity docs!
   */
  static async getTenantDetailsForProperty(propertyId: string, ownerId: string, role: string) {
    if (RentalService.isMongoConnected()) {
      const rental = await RentalModel.findOne({ propertyId })
        .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
        .populate('propertyId', 'title propertyLocation rentAmount depositAmount')
        .lean();

      if (!rental) {
        return null;
      }

      const tenantIdStr = (rental.tenantId as any)?._id?.toString() || (rental.tenantId as any)?.toString();
      if (role !== 'ADMIN' && rental.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }

      return {
        rentalId: (rental._id as any).toString(),
        status: rental.status,
        startDate: rental.startDate,
        endDate: rental.endDate,
        monthlyRent: rental.monthlyRent,
        depositPaid: rental.depositPaid,
        agreementVersion: rental.agreementVersion,
        tenant: rental.tenantId,
        property: rental.propertyId,
      };
    } else {
      const rental = Array.from(memoryRentals.values()).find((r) => r.propertyId === propertyId);
      if (!rental) {
        return null;
      }
      if (role !== 'ADMIN' && rental.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }
      const property = memoryProperties.get(propertyId);
      const { memoryUsers } = require('./auth.service');
      const tenantUser = memoryUsers.get(rental.tenantId) || Array.from(memoryUsers.values()).find((u: any) => u.role === 'TENANT') || {
        _id: rental.tenantId,
        id: rental.tenantId,
        name: 'Test Tenant User',
        email: 'test-tenant@nivas360.com',
      };

      return {
        rentalId: rental.id || rental._id,
        status: rental.status,
        startDate: rental.startDate,
        endDate: rental.endDate,
        monthlyRent: rental.monthlyRent,
        depositPaid: rental.depositPaid,
        agreementVersion: rental.agreementVersion,
        tenant: tenantUser,
        property: property || { _id: propertyId, id: propertyId, title: 'Sample Property' },
      };
    }
  }

  /**
   * Get rent tracking records for a property
   */
  static async getRentRecordsByPropertyId(propertyId: string, ownerId: string, role: string) {
    if (RentalService.isMongoConnected()) {
      const rental = await RentalModel.findOne({ propertyId }).lean();
      if (!rental) {
        return [];
      }
      if (role !== 'ADMIN' && rental.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }
      return RentRecordModel.find({ rentalId: rental._id }).sort({ dueDate: -1 }).lean();
    } else {
      const rental = Array.from(memoryRentals.values()).find((r) => r.propertyId === propertyId);
      if (!rental) {
        return [];
      }
      if (role !== 'ADMIN' && rental.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }
      return Array.from(memoryRentRecords.values()).filter((r) => r.propertyId === propertyId || r.rentalId === rental.id || r.rentalId === rental._id);
    }
  }

  /**
   * Automatically create or prepare rental record when application is approved
   */
  static async createOrUpdateRentalFromApplication(application: any) {
    const propertyId = application.propertyId?._id || application.propertyId;
    const tenantId = application.tenantId?._id || application.tenantId;

    if (RentalService.isMongoConnected()) {
      const property = await PropertyModel.findById(propertyId);
      if (!property) return;

      const startDate = new Date(application.moveInDate || Date.now());
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const existingRental = await RentalModel.findOne({ propertyId });
      let rentalDoc;

      if (existingRental) {
        existingRental.status = 'PENDING_CONFIRMATION';
        existingRental.tenantId = tenantId;
        existingRental.monthlyRent = application.proposedRent || property.rentAmount;
        existingRental.depositPaid = property.depositAmount;
        existingRental.startDate = startDate;
        existingRental.endDate = endDate;
        await existingRental.save();
        rentalDoc = existingRental;
      } else {
        rentalDoc = await RentalModel.create({
          propertyId,
          tenantId,
          ownerId: property.ownerId,
          applicationId: application._id || application.id,
          status: 'PENDING_CONFIRMATION',
          startDate,
          endDate,
          monthlyRent: application.proposedRent || property.rentAmount,
          depositPaid: property.depositAmount,
          rentStatus: 'UPCOMING',
          agreementVersion: 'v1.0',
        });
      }

      return rentalDoc;
    } else {
      const property = memoryProperties.get(propertyId);
      const ownerId = property?.ownerId || application.ownerId || 'mem_owner';

      const rentalId = 'mem_rental_' + Date.now();
      const startDate = new Date(application.moveInDate || Date.now());
      const endDate = new Date(startDate.getTime() + 365 * 86400000);
      const rentalDoc = {
        _id: rentalId,
        id: rentalId,
        propertyId,
        tenantId,
        ownerId,
        applicationId: application.id || application._id,
        status: 'PENDING_CONFIRMATION',
        startDate,
        endDate,
        monthlyRent: application.proposedRent || property?.rentAmount || 25000,
        depositPaid: property?.depositAmount || 50000,
        rentStatus: 'UPCOMING',
        agreementVersion: 'v1.0',
      };
      memoryRentals.set(rentalId, rentalDoc);
      PersistentStore.insert('rentals', rentalDoc);

      return rentalDoc;
    }
  }

  /**
   * Activate Rental upon Owner Confirmation & Prerequisite Validation
   */
  static async activateRental(rentalId: string, ownerId: string, role: string) {
    const { AgreementService } = require('./agreement.service');
    const { NotificationService } = require('./notification.service');

    if (RentalService.isMongoConnected()) {
      const rental = await RentalModel.findById(rentalId);
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      if (role !== 'ADMIN' && rental.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this rental listing' };
      }

      const agreement = await AgreementService.getAgreementByRentalId(rentalId, ownerId, role);
      if (!agreement || agreement.status !== 'CONFIRMED') {
        throw { statusCode: 400, code: 'AGREEMENT_NOT_CONFIRMED', message: 'Rental agreement must be confirmed by owner prior to activation' };
      }

      rental.status = 'ACTIVE';
      await rental.save();

      const property = await PropertyModel.findById(rental.propertyId);
      if (property) {
        property.availabilityStatus = 'RENTED';
        await property.save();
      }

      await NotificationService.createNotification({
        recipientId: rental.tenantId.toString(),
        title: 'Rental Activated!',
        message: `Your rental for ${property?.title || 'the property'} is now officially ACTIVE.`,
        type: 'RENTAL',
      });

      return rental;
    } else {
      const rental = memoryRentals.get(rentalId);
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      if (role !== 'ADMIN' && rental.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this rental listing' };
      }

      const agreement = await AgreementService.getAgreementByRentalId(rentalId, ownerId, role);
      if (!agreement || agreement.status !== 'CONFIRMED') {
        throw { statusCode: 400, code: 'AGREEMENT_NOT_CONFIRMED', message: 'Rental agreement must be confirmed by owner prior to activation' };
      }

      rental.status = 'ACTIVE';
      memoryRentals.set(rentalId, rental);
      PersistentStore.update('rentals', rentalId, { status: 'ACTIVE' });

      const property = memoryProperties.get(rental.propertyId);
      if (property) {
        property.availabilityStatus = 'RENTED';
        memoryProperties.set(rental.propertyId, property);
      }

      await NotificationService.createNotification({
        recipientId: rental.tenantId,
        title: 'Rental Activated!',
        message: 'Your rental is now officially ACTIVE.',
        type: 'RENTAL',
      });

      return rental;
    }
  }

  /**
   * Terminate Rental Lifecycle
   */
  static async terminateRental(rentalId: string, ownerId: string, role: string, reason?: string) {
    const { NotificationService } = require('./notification.service');

    if (RentalService.isMongoConnected()) {
      const rental = await RentalModel.findById(rentalId);
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      if (role !== 'ADMIN' && rental.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this rental listing' };
      }

      if (rental.status !== 'ACTIVE') {
        throw { statusCode: 400, code: 'INVALID_TRANSITION', message: 'Only active rentals can be terminated' };
      }

      rental.status = 'TERMINATED';
      await rental.save();

      const property = await PropertyModel.findById(rental.propertyId);
      if (property) {
        property.availabilityStatus = 'VACANT';
        await property.save();
      }

      await NotificationService.createNotification({
        recipientId: rental.tenantId.toString(),
        title: 'Rental Agreement Terminated',
        message: `The rental for ${property?.title || 'the property'} has been terminated. Reason: ${reason || 'Rental period ended'}`,
        type: 'RENTAL',
      });

      return rental;
    } else {
      const rental = memoryRentals.get(rentalId);
      if (!rental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
      }
      if (role !== 'ADMIN' && rental.ownerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not own this rental listing' };
      }

      if (rental.status !== 'ACTIVE') {
        throw { statusCode: 400, code: 'INVALID_TRANSITION', message: 'Only active rentals can be terminated' };
      }

      rental.status = 'TERMINATED';
      memoryRentals.set(rentalId, rental);
      PersistentStore.update('rentals', rentalId, { status: 'TERMINATED' });

      const property = memoryProperties.get(rental.propertyId);
      if (property) {
        property.availabilityStatus = 'VACANT';
        memoryProperties.set(rental.propertyId, property);
      }

      await NotificationService.createNotification({
        recipientId: rental.tenantId,
        title: 'Rental Agreement Terminated',
        message: 'The rental has been terminated.',
        type: 'RENTAL',
      });

      return rental;
    }
  }
}
