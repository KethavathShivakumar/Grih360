import { RentalAgreementModel, PropertyModel, RentalModel, RentRecordModel } from '../models';
import { NotificationService } from './notification.service';
import mongoose from 'mongoose';
import { PersistentStore } from '../config/persistent-store';

export const memoryAgreements = new Map<string, any>();

// Initialize memory cache from persistent disk store
const loadedAgreements = PersistentStore.loadCollection('agreements');
for (const a of loadedAgreements) {
  memoryAgreements.set(a._id || a.id, a);
}

export class AgreementService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get all rental agreements for a user (Tenant or Owner)
   */
  static async getUserAgreements(userId: string, role?: string) {
    if (AgreementService.isMongoConnected()) {
      const query = role === 'TENANT' ? { tenantId: userId } : { ownerId: userId };
      return RentalAgreementModel.find(query)
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
        .populate('ownerId', 'name email phone profileImage')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      const { memoryUsers } = require('./auth.service');
      const { memoryProperties } = require('./property.service');

      return Array.from(memoryAgreements.values())
        .filter((a) => {
          const tId = (a.tenantId?._id || a.tenantId?.id || a.tenantId)?.toString();
          const oId = (a.ownerId?._id || a.ownerId?.id || a.ownerId)?.toString();
          return role === 'TENANT' ? tId === userId.toString() : oId === userId.toString();
        })
        .map((a) => {
          const tId = (a.tenantId?._id || a.tenantId?.id || a.tenantId)?.toString();
          const oId = (a.ownerId?._id || a.ownerId?.id || a.ownerId)?.toString();
          const pId = (a.propertyId?._id || a.propertyId?.id || a.propertyId)?.toString();
          return {
            ...a,
            tenantId: memoryUsers.get(tId) || a.tenantId,
            ownerId: memoryUsers.get(oId) || a.ownerId,
            propertyId: memoryProperties.get(pId) || a.propertyId,
          };
        });
    }
  }

  /**
   * Create or update rental agreement draft
   */
  static async createAgreement(data: {
    rentalId: string;
    propertyId: string;
    tenantId: string;
    ownerId: string;
    rent?: number;
    deposit?: number;
    startDate?: Date | string;
    endDate?: Date | string;
    termMonths?: number;
    termsSummary?: string;
    agreementVersion?: string;
    agreementMetadata?: any;
  }) {
    const rent = data.rent || 0;
    const deposit = data.deposit || 0;
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + 365 * 86400000);
    const termMonths = data.termMonths || 11;
    const termsSummary = data.termsSummary || 'Standard Grih360 Residential Rental Agreement v1.0';

    if (AgreementService.isMongoConnected()) {
      const existing = await RentalAgreementModel.findOne({ rentalId: data.rentalId });
      if (existing) {
        existing.status = 'PENDING_CONFIRMATION';
        existing.rent = rent;
        existing.deposit = deposit;
        existing.startDate = startDate;
        existing.endDate = endDate;
        existing.termMonths = termMonths;
        if (data.termsSummary) existing.termsSummary = data.termsSummary;
        await existing.save();
        return existing;
      }

      return RentalAgreementModel.create({
        rentalId: data.rentalId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        rent,
        deposit,
        startDate,
        endDate,
        termMonths,
        agreementVersion: data.agreementVersion || 'v1.0',
        status: 'PENDING_CONFIRMATION',
        termsSummary,
        tenantConfirmed: false,
        ownerConfirmed: false,
        agreementMetadata: {
          eSignNotice: 'Digital signature integration required',
          eSignProvider: 'UNAVAILABLE',
          isDigitallySigned: false,
          legalNotice: 'Standard platform lease draft. Digital signature integration required for legal execution.',
          generatedAt: new Date(),
          version: data.agreementVersion || 'v1.0',
          tenantConfirmation: { confirmed: false },
          ownerConfirmation: { confirmed: false },
          ...data.agreementMetadata,
        },
      });
    } else {
      const existing = Array.from(memoryAgreements.values()).find((a) => a.rentalId === data.rentalId);
      if (existing) {
        existing.status = 'PENDING_CONFIRMATION';
        existing.rent = rent;
        existing.deposit = deposit;
        existing.startDate = startDate;
        existing.endDate = endDate;
        existing.termMonths = termMonths;
        if (data.termsSummary) existing.termsSummary = data.termsSummary;
        const aId = existing._id || existing.id;
        memoryAgreements.set(aId, existing);
        PersistentStore.update('agreements', aId, existing);
        return existing;
      }

      const agreementId = 'mem_agree_' + Date.now();
      const agreement = {
        _id: agreementId,
        id: agreementId,
        rentalId: data.rentalId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        rent,
        deposit,
        startDate,
        endDate,
        termMonths,
        agreementVersion: data.agreementVersion || 'v1.0',
        status: 'PENDING_CONFIRMATION',
        termsSummary,
        tenantConfirmed: false,
        ownerConfirmed: false,
        agreementMetadata: {
          eSignNotice: 'Digital signature integration required',
          eSignProvider: 'UNAVAILABLE',
          isDigitallySigned: false,
          legalNotice: 'Standard platform lease draft. Digital signature integration required for legal execution.',
          generatedAt: new Date(),
          version: data.agreementVersion || 'v1.0',
          tenantConfirmation: { confirmed: false },
          ownerConfirmation: { confirmed: false },
          ...data.agreementMetadata,
        },
        createdAt: new Date(),
      };
      memoryAgreements.set(agreementId, agreement);
      PersistentStore.insert('agreements', agreement);
      return agreement;
    }
  }

  /**
   * Get rental agreement by Agreement ID
   */
  static async getAgreementById(agreementId: string, userId: string, role: string) {
    if (AgreementService.isMongoConnected()) {
      let agreement = await RentalAgreementModel.findById(agreementId)
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
        .populate('ownerId', 'name email phone profileImage')
        .lean();

      if (!agreement) {
        // Fallback: check if agreementId was passed as rentalId
        agreement = await RentalAgreementModel.findOne({ rentalId: agreementId })
          .populate('propertyId')
          .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
          .populate('ownerId', 'name email phone profileImage')
          .lean();
      }

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement not found' };
      }

      const tenantIdStr = (agreement.tenantId as any)?._id?.toString() || agreement.tenantId?.toString();
      const ownerIdStr = (agreement.ownerId as any)?._id?.toString() || agreement.ownerId?.toString();

      if (role !== 'ADMIN' && userId !== tenantIdStr && userId !== ownerIdStr) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      return agreement;
    } else {
      let agreement = memoryAgreements.get(agreementId) ||
        Array.from(memoryAgreements.values()).find((a) => (a.id || a._id) === agreementId || a.rentalId === agreementId);

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement not found' };
      }

      const tId = (agreement.tenantId?._id || agreement.tenantId?.id || agreement.tenantId)?.toString();
      const oId = (agreement.ownerId?._id || agreement.ownerId?.id || agreement.ownerId)?.toString();

      if (role !== 'ADMIN' && userId !== tId && userId !== oId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      const { memoryUsers } = require('./auth.service');
      const { memoryProperties } = require('./property.service');
      const pId = (agreement.propertyId?._id || agreement.propertyId?.id || agreement.propertyId)?.toString();

      return {
        ...agreement,
        tenantId: memoryUsers.get(tId) || agreement.tenantId,
        ownerId: memoryUsers.get(oId) || agreement.ownerId,
        propertyId: memoryProperties.get(pId) || agreement.propertyId,
      };
    }
  }

  /**
   * Get rental agreement by rental ID
   */
  static async getAgreementByRentalId(rentalId: string, userId: string, role: string) {
    if (AgreementService.isMongoConnected()) {
      const agreement = await RentalAgreementModel.findOne({ rentalId })
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus profileImage')
        .populate('ownerId', 'name email phone profileImage')
        .lean();

      if (!agreement) return null;

      const tenantIdStr = (agreement.tenantId as any)?._id?.toString() || agreement.tenantId.toString();
      const ownerIdStr = (agreement.ownerId as any)?._id?.toString() || agreement.ownerId.toString();

      if (role !== 'ADMIN' && userId !== tenantIdStr && userId !== ownerIdStr) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      return agreement;
    } else {
      const agreement = Array.from(memoryAgreements.values()).find((a) => a.rentalId === rentalId);
      if (!agreement) return null;

      const tId = (agreement.tenantId?._id || agreement.tenantId?.id || agreement.tenantId)?.toString();
      const oId = (agreement.ownerId?._id || agreement.ownerId?.id || agreement.ownerId)?.toString();

      if (role !== 'ADMIN' && userId !== tId && userId !== oId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      const { memoryUsers } = require('./auth.service');
      const { memoryProperties } = require('./property.service');
      const pId = (agreement.propertyId?._id || agreement.propertyId?.id || agreement.propertyId)?.toString();

      return {
        ...agreement,
        tenantId: memoryUsers.get(tId) || agreement.tenantId,
        ownerId: memoryUsers.get(oId) || agreement.ownerId,
        propertyId: memoryProperties.get(pId) || agreement.propertyId,
      };
    }
  }

  /**
   * Tenant confirms rental agreement (Platform assent / consent representation)
   */
  static async tenantConfirmAgreement(idOrRentalId: string, tenantId: string, role: string, details?: any) {
    if (AgreementService.isMongoConnected()) {
      let agreement = await RentalAgreementModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(idOrRentalId) ? idOrRentalId : undefined }, { rentalId: idOrRentalId }].filter(Boolean),
      });

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement record not found' };
      }

      if (role !== 'ADMIN' && agreement.tenantId.toString() !== tenantId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement as tenant' };
      }

      agreement.tenantConfirmed = true;
      if (!agreement.agreementMetadata) {
        agreement.agreementMetadata = {
          eSignNotice: 'Digital signature integration required',
          eSignProvider: 'UNAVAILABLE',
          isDigitallySigned: false,
          legalNotice: 'Standard platform lease draft. Digital signature integration required for legal execution.',
          generatedAt: new Date(),
          version: agreement.agreementVersion || 'v1.0',
        };
      }
      agreement.agreementMetadata.tenantConfirmation = {
        confirmed: true,
        confirmedAt: new Date(),
        method: details?.method || 'PLATFORM_CONSENT',
        ipAddress: details?.ipAddress || '127.0.0.1',
        notes: details?.notes || 'Tenant reviewed and accepted platform agreement terms',
      };
      await agreement.save();

      // Notify owner
      await NotificationService.createNotification({
        recipientId: agreement.ownerId.toString(),
        title: 'Tenant Confirmed Agreement',
        message: 'The tenant has reviewed and confirmed the rental agreement. Please confirm to activate the rental.',
        type: 'RENTAL',
        link: `/owner/properties/${agreement.propertyId}/rental`,
      });

      return agreement;
    } else {
      let agreement = Array.from(memoryAgreements.values()).find(
        (a) => (a._id || a.id) === idOrRentalId || a.rentalId === idOrRentalId
      );

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement record not found' };
      }

      const tId = (agreement.tenantId?._id || agreement.tenantId?.id || agreement.tenantId)?.toString();
      if (role !== 'ADMIN' && tId !== tenantId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement as tenant' };
      }

      agreement.tenantConfirmed = true;
      agreement.agreementMetadata = agreement.agreementMetadata || {};
      agreement.agreementMetadata.tenantConfirmation = {
        confirmed: true,
        confirmedAt: new Date(),
        method: details?.method || 'PLATFORM_CONSENT',
        ipAddress: details?.ipAddress || '127.0.0.1',
        notes: details?.notes || 'Tenant reviewed and accepted platform agreement terms',
      };

      const aId = agreement._id || agreement.id;
      memoryAgreements.set(aId, agreement);
      PersistentStore.update('agreements', aId, agreement);

      await NotificationService.createNotification({
        recipientId: agreement.ownerId,
        title: 'Tenant Confirmed Agreement',
        message: 'The tenant has reviewed and confirmed the rental agreement.',
        type: 'RENTAL',
      });

      return agreement;
    }
  }

  /**
   * Owner confirms rental agreement
   * LIFECYCLE EFFECT:
   * Agreement status -> CONFIRMED
   * Rental status -> ACTIVE
   * Property availability -> RENTED
   * Rent record -> UPCOMING
   */
  static async confirmAgreement(idOrRentalId: string, ownerId: string, role: string, details?: any) {
    if (AgreementService.isMongoConnected()) {
      let agreement = await RentalAgreementModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(idOrRentalId) ? idOrRentalId : undefined }, { rentalId: idOrRentalId }].filter(Boolean),
      });

      const rental = await RentalModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(idOrRentalId) ? idOrRentalId : undefined }, { _id: agreement?.rentalId }].filter(Boolean),
      });

      if (!agreement && !rental) {
        throw { statusCode: 404, code: 'RECORD_NOT_FOUND', message: 'Rental or agreement record not found' };
      }

      const targetRentalId = (rental?._id || agreement?.rentalId)?.toString();
      const targetRental = rental || await RentalModel.findById(targetRentalId);

      if (!targetRental) {
        throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Linked rental record not found' };
      }

      if (role !== 'ADMIN' && targetRental.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement' };
      }

      const property = await PropertyModel.findById(targetRental.propertyId);

      if (!agreement) {
        agreement = await RentalAgreementModel.create({
          rentalId: targetRental._id,
          propertyId: targetRental.propertyId,
          tenantId: targetRental.tenantId,
          ownerId: targetRental.ownerId,
          rent: targetRental.monthlyRent,
          deposit: targetRental.depositPaid,
          startDate: targetRental.startDate,
          endDate: targetRental.endDate,
          termMonths: 11,
          agreementVersion: targetRental.agreementVersion || 'v1.0',
          status: 'PENDING_CONFIRMATION',
          termsSummary: 'Standard Grih360 Residential Rental Agreement v1.0',
        });
      }

      // Update Agreement to CONFIRMED
      agreement.status = 'CONFIRMED';
      agreement.ownerConfirmed = true;
      agreement.confirmedAt = new Date();
      if (!agreement.agreementMetadata) {
        agreement.agreementMetadata = {
          eSignNotice: 'Digital signature integration required',
          eSignProvider: 'UNAVAILABLE',
          isDigitallySigned: false,
          legalNotice: 'Standard platform lease draft. Digital signature integration required for legal execution.',
          generatedAt: new Date(),
          version: agreement.agreementVersion || 'v1.0',
        };
      }
      agreement.agreementMetadata.ownerConfirmation = {
        confirmed: true,
        confirmedAt: new Date(),
        method: details?.method || 'PLATFORM_CONSENT',
        ipAddress: details?.ipAddress || '127.0.0.1',
        notes: details?.notes || 'Owner confirmed lease and authorized rental activation',
      };
      await agreement.save();

      // Activate Rental
      targetRental.status = 'ACTIVE';
      await targetRental.save();

      // Mark Property as RENTED
      if (property) {
        property.availabilityStatus = 'RENTED';
        await property.save();
      }

      // Ensure Initial Rent Record is created
      const existingRecord = await RentRecordModel.findOne({ rentalId: targetRental._id });
      if (!existingRecord) {
        await RentRecordModel.create({
          rentalId: targetRental._id,
          tenantId: targetRental.tenantId,
          ownerId: targetRental.ownerId,
          amount: targetRental.monthlyRent,
          dueDate: targetRental.startDate,
          status: 'UPCOMING',
          notes: 'Initial monthly rent cycle generated upon agreement confirmation',
        });
      }

      // Notify Tenant
      await NotificationService.createNotification({
        recipientId: targetRental.tenantId.toString(),
        title: 'Rental Agreement Confirmed & Activated!',
        message: `The owner has confirmed your rental agreement for ${property?.title || 'the property'}. Your rental is now ACTIVE!`,
        type: 'RENTAL',
        link: '/tenant/rental',
      });

      return agreement;
    } else {
      const { memoryProperties } = require('./property.service');
      const { memoryRentals, memoryRentRecords } = require('./rental.service');

      let agreement = Array.from(memoryAgreements.values()).find(
        (a) => (a._id || a.id) === idOrRentalId || a.rentalId === idOrRentalId
      );

      let rental = memoryRentals.get(idOrRentalId) ||
        (agreement ? memoryRentals.get(agreement.rentalId) : null) ||
        Array.from(memoryRentals.values()).find((r: any) => r.propertyId === idOrRentalId);

      if (!agreement && !rental) {
        throw { statusCode: 404, code: 'RECORD_NOT_FOUND', message: 'Rental or agreement record not found' };
      }

      const oId = (rental?.ownerId || agreement?.ownerId)?.toString();
      if (role !== 'ADMIN' && oId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement' };
      }

      const rentalId = rental?.id || rental?._id || agreement?.rentalId;

      if (!agreement) {
        const agreementId = 'mem_agree_' + Date.now();
        agreement = {
          _id: agreementId,
          id: agreementId,
          rentalId,
          propertyId: rental.propertyId,
          tenantId: rental.tenantId,
          ownerId,
          rent: rental.monthlyRent || 25000,
          deposit: rental.depositPaid || 50000,
          startDate: rental.startDate || new Date(),
          endDate: rental.endDate || new Date(Date.now() + 365 * 86400000),
          termMonths: 11,
          agreementVersion: 'v1.0',
          status: 'CONFIRMED',
          ownerConfirmed: true,
          tenantConfirmed: false,
          confirmedAt: new Date(),
          termsSummary: 'Standard Grih360 Residential Rental Agreement v1.0',
          agreementMetadata: {
            eSignNotice: 'Digital signature integration required',
            eSignProvider: 'UNAVAILABLE',
            isDigitallySigned: false,
            legalNotice: 'Standard platform lease draft. Digital signature integration required for legal execution.',
            generatedAt: new Date(),
            version: 'v1.0',
            ownerConfirmation: { confirmed: true, confirmedAt: new Date() },
          },
        };
        memoryAgreements.set(agreementId, agreement);
        PersistentStore.insert('agreements', agreement);
      } else {
        agreement.status = 'CONFIRMED';
        agreement.ownerConfirmed = true;
        agreement.confirmedAt = new Date();
        agreement.agreementMetadata = agreement.agreementMetadata || {};
        agreement.agreementMetadata.ownerConfirmation = {
          confirmed: true,
          confirmedAt: new Date(),
          method: details?.method || 'PLATFORM_CONSENT',
          notes: 'Owner confirmed lease and authorized rental activation',
        };
        const aId = agreement._id || agreement.id;
        memoryAgreements.set(aId, agreement);
        PersistentStore.update('agreements', aId, agreement);
      }

      // Activate Rental in memory
      if (rental) {
        rental.status = 'ACTIVE';
        const rId = rental.id || rental._id;
        memoryRentals.set(rId, rental);
        PersistentStore.update('rentals', rId, { status: 'ACTIVE' });

        const property = memoryProperties.get(rental.propertyId);
        if (property) {
          property.availabilityStatus = 'RENTED';
          memoryProperties.set(rental.propertyId, property);
        }
        PersistentStore.update('properties', rental.propertyId, { availabilityStatus: 'RENTED' });

        const recId = 'mem_rentrec_' + Date.now();
        const rentRec = {
          _id: recId,
          id: recId,
          rentalId: rId,
          propertyId: rental.propertyId,
          tenantId: rental.tenantId,
          ownerId,
          amount: rental.monthlyRent,
          dueDate: rental.startDate,
          status: 'UPCOMING',
          notes: 'Initial monthly rent cycle generated upon agreement confirmation',
        };
        memoryRentRecords.set(recId, rentRec);
        PersistentStore.insert('rent_records', rentRec);
      }

      await NotificationService.createNotification({
        recipientId: agreement.tenantId,
        title: 'Rental Agreement Confirmed & Activated!',
        message: 'The owner has confirmed your rental agreement. Your rental is now ACTIVE!',
        type: 'RENTAL',
      });

      return agreement;
    }
  }

  /**
   * Cancel Rental Agreement
   */
  static async cancelAgreement(idOrRentalId: string, userId: string, role: string, reason?: string) {
    if (AgreementService.isMongoConnected()) {
      const agreement = await RentalAgreementModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(idOrRentalId) ? idOrRentalId : undefined }, { rentalId: idOrRentalId }].filter(Boolean),
      });

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement not found' };
      }

      const tenantIdStr = agreement.tenantId.toString();
      const ownerIdStr = agreement.ownerId.toString();

      if (role !== 'ADMIN' && userId !== tenantIdStr && userId !== ownerIdStr) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }

      agreement.status = 'CANCELLED';
      agreement.cancelledAt = new Date();
      agreement.cancellationReason = reason || 'Agreement cancelled by participant';
      await agreement.save();

      // If rental was pending, terminate it
      const rental = await RentalModel.findById(agreement.rentalId);
      if (rental && rental.status !== 'ACTIVE') {
        rental.status = 'TERMINATED';
        await rental.save();
      }

      const recipientId = userId === tenantIdStr ? ownerIdStr : tenantIdStr;
      await NotificationService.createNotification({
        recipientId,
        title: 'Rental Agreement Cancelled',
        message: `The rental agreement has been cancelled. Reason: ${agreement.cancellationReason}`,
        type: 'RENTAL',
      });

      return agreement;
    } else {
      const agreement = Array.from(memoryAgreements.values()).find(
        (a) => (a._id || a.id) === idOrRentalId || a.rentalId === idOrRentalId
      );

      if (!agreement) {
        throw { statusCode: 404, code: 'AGREEMENT_NOT_FOUND', message: 'Rental agreement not found' };
      }

      const tId = (agreement.tenantId?._id || agreement.tenantId?.id || agreement.tenantId)?.toString();
      const oId = (agreement.ownerId?._id || agreement.ownerId?.id || agreement.ownerId)?.toString();

      if (role !== 'ADMIN' && userId !== tId && userId !== oId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
      }

      agreement.status = 'CANCELLED';
      agreement.cancelledAt = new Date();
      agreement.cancellationReason = reason || 'Agreement cancelled by participant';
      const aId = agreement._id || agreement.id;
      memoryAgreements.set(aId, agreement);
      PersistentStore.update('agreements', aId, agreement);

      const recipientId = userId === tId ? oId : tId;
      await NotificationService.createNotification({
        recipientId,
        title: 'Rental Agreement Cancelled',
        message: `The rental agreement has been cancelled. Reason: ${agreement.cancellationReason}`,
        type: 'RENTAL',
      });

      return agreement;
    }
  }
}

