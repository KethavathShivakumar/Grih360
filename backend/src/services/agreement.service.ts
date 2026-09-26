import { RentalAgreementModel, PropertyModel, RentalModel } from '../models';
import { NotificationService } from './notification.service';
import mongoose from 'mongoose';

export const memoryAgreements = new Map<string, any>();

export class AgreementService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Create or update rental agreement draft
   */
  static async createAgreement(data: {
    rentalId: string;
    propertyId: string;
    tenantId: string;
    ownerId: string;
    termsSummary?: string;
  }) {
    if (AgreementService.isMongoConnected()) {
      const existing = await RentalAgreementModel.findOne({ rentalId: data.rentalId });
      if (existing) {
        existing.status = 'PENDING_CONFIRMATION';
        if (data.termsSummary) existing.termsSummary = data.termsSummary;
        await existing.save();
        return existing;
      }
      return RentalAgreementModel.create({
        rentalId: data.rentalId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        agreementVersion: 'v1.0',
        status: 'PENDING_CONFIRMATION',
        termsSummary: data.termsSummary || 'Standard Nivas360 Residential Rental Agreement v1.0',
      });
    } else {
      const agreementId = 'mem_agree_' + Date.now();
      const agreement = {
        _id: agreementId,
        id: agreementId,
        rentalId: data.rentalId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        agreementVersion: 'v1.0',
        status: 'PENDING_CONFIRMATION',
        termsSummary: data.termsSummary || 'Standard Nivas360 Residential Rental Agreement v1.0',
        createdAt: new Date(),
      };
      memoryAgreements.set(agreementId, agreement);
      return agreement;
    }
  }

  /**
   * Get rental agreement by rental ID or agreement ID
   */
  static async getAgreementByRentalId(rentalId: string, userId: string, role: string) {
    if (AgreementService.isMongoConnected()) {
      const agreement = await RentalAgreementModel.findOne({ rentalId }).lean();
      if (!agreement) return null;

      const tenantIdStr = agreement.tenantId.toString();
      const ownerIdStr = agreement.ownerId.toString();

      if (role !== 'ADMIN' && userId !== tenantIdStr && userId !== ownerIdStr) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      return agreement;
    } else {
      const agreement = Array.from(memoryAgreements.values()).find(a => a.rentalId === rentalId);
      if (!agreement) return null;

      if (role !== 'ADMIN' && userId !== agreement.tenantId && userId !== agreement.ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to rental agreement' };
      }

      return agreement;
    }
  }

  /**
   * Owner confirms rental agreement
   */
  static async confirmAgreement(rentalId: string, ownerId: string, role: string) {
    if (AgreementService.isMongoConnected()) {
      let agreement = await RentalAgreementModel.findOne({ rentalId });
      if (!agreement) {
        // Auto-create draft agreement if missing
        const rental = await RentalModel.findById(rentalId);
        if (!rental) {
          throw { statusCode: 404, code: 'RENTAL_NOT_FOUND', message: 'Rental record not found' };
        }
        agreement = await RentalAgreementModel.create({
          rentalId,
          propertyId: rental.propertyId,
          tenantId: rental.tenantId,
          ownerId: rental.ownerId,
          agreementVersion: 'v1.0',
          status: 'PENDING_CONFIRMATION',
          termsSummary: 'Standard Nivas360 Residential Rental Agreement v1.0',
        });
      }

      if (role !== 'ADMIN' && agreement.ownerId.toString() !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement' };
      }

      agreement.status = 'CONFIRMED';
      agreement.confirmedAt = new Date();
      await agreement.save();

      // Notify tenant
      await NotificationService.createNotification({
        recipientId: agreement.tenantId.toString(),
        title: 'Rental Agreement Confirmed',
        message: 'The owner has confirmed the rental agreement for your property.',
        type: 'RENTAL',
      });

      return agreement;
    } else {
      let agreement = Array.from(memoryAgreements.values()).find(a => a.rentalId === rentalId);
      if (!agreement) {
        const agreementId = 'mem_agree_' + Date.now();
        agreement = {
          _id: agreementId,
          id: agreementId,
          rentalId,
          propertyId: 'mem_prop',
          tenantId: 'mem_tenant',
          ownerId,
          agreementVersion: 'v1.0',
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          termsSummary: 'Standard Nivas360 Residential Rental Agreement v1.0',
        };
        memoryAgreements.set(agreementId, agreement);
      } else {
        if (role !== 'ADMIN' && agreement.ownerId !== ownerId) {
          throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to confirm this agreement' };
        }
        agreement.status = 'CONFIRMED';
        agreement.confirmedAt = new Date();
        memoryAgreements.set(agreement._id || agreement.id, agreement);
      }

      await NotificationService.createNotification({
        recipientId: agreement.tenantId,
        title: 'Rental Agreement Confirmed',
        message: 'The owner has confirmed the rental agreement for your property.',
        type: 'RENTAL',
      });

      return agreement;
    }
  }
}
