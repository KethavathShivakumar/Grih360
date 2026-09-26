import { ApplicationModel, PropertyModel } from '../models';
import { RentalService } from './rental.service';
import { AgreementService } from './agreement.service';
import { NotificationService } from './notification.service';
import { memoryProperties } from './property.service';
import mongoose from 'mongoose';

export interface SubmitApplicationInput {
  propertyId: string;
  proposedRent: number;
  moveInDate: Date | string;
  message?: string;
}

import { PersistentStore } from '../config/persistent-store';

export const memoryApplications = new Map<string, any>();

// Initialize memory cache from persistent disk store
const loadedApps = PersistentStore.loadCollection('applications');
for (const a of loadedApps) {
  memoryApplications.set(a._id || a.id, a);
}

// Valid Application State Machine Transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  PENDING: ['UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  VERIFICATION_REQUIRED: ['VERIFICATION_PENDING', 'WITHDRAWN'],
  VERIFICATION_PENDING: ['UNDER_REVIEW', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
  APPROVED: [], // Terminal state
  REJECTED: [], // Terminal state
  WITHDRAWN: [], // Terminal state
};

export class ApplicationService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  static async submitApplication(tenantId: string, input: SubmitApplicationInput) {
    if (ApplicationService.isMongoConnected()) {
      const property = await PropertyModel.findById(input.propertyId);
      if (!property) {
        throw { statusCode: 404, code: 'PROPERTY_NOT_FOUND', message: 'Target property listing not found' };
      }

      // 1. Property Availability Check
      if (property.availabilityStatus && property.availabilityStatus !== 'VACANT') {
        throw { statusCode: 400, code: 'PROPERTY_UNAVAILABLE', message: 'This property is no longer available for rent' };
      }

      // 2. Duplicate Active Application Check
      const existingApp = await ApplicationModel.findOne({
        tenantId,
        propertyId: input.propertyId,
        status: { $nin: ['REJECTED', 'WITHDRAWN'] },
      });

      if (existingApp) {
        throw { statusCode: 409, code: 'APPLICATION_EXISTS', message: 'You already have an active application for this property' };
      }

      const application = await ApplicationModel.create({
        propertyId: input.propertyId,
        tenantId,
        status: 'SUBMITTED',
        moveInDate: new Date(input.moveInDate),
        proposedRent: Number(input.proposedRent),
        message: input.message ? input.message.trim() : undefined,
        verificationStatusAtSubmission: 'NOT_STARTED',
      });

      // Notify Property Owner
      await NotificationService.createNotification({
        recipientId: property.ownerId.toString(),
        title: 'New Rental Application',
        message: `A new application has been submitted for property: ${property.title}`,
        type: 'APPLICATION',
        link: `/owner/properties/${property._id}/applicants/${application._id}`,
      });

      return application;
    } else {
      const property = memoryProperties.get(input.propertyId);
      if (property && property.availabilityStatus && property.availabilityStatus !== 'VACANT') {
        throw { statusCode: 400, code: 'PROPERTY_UNAVAILABLE', message: 'This property is no longer available for rent' };
      }

      const activeExisting = Array.from(memoryApplications.values()).find(
        (a) => a.tenantId === tenantId && a.propertyId === input.propertyId && !['REJECTED', 'WITHDRAWN'].includes(a.status)
      );

      if (activeExisting) {
        throw { statusCode: 409, code: 'APPLICATION_EXISTS', message: 'You already have an active application for this property' };
      }

      const id = 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const appDoc = {
        _id: id,
        id,
        propertyId: input.propertyId,
        tenantId,
        status: 'SUBMITTED',
        moveInDate: new Date(input.moveInDate),
        proposedRent: Number(input.proposedRent),
        message: input.message ? input.message.trim() : undefined,
        verificationStatusAtSubmission: 'NOT_STARTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      PersistentStore.insert('applications', appDoc);
      memoryApplications.set(id, appDoc);

      if (property) {
        await NotificationService.createNotification({
          recipientId: property.ownerId || 'mem_owner',
          title: 'New Rental Application',
          message: `A new application has been submitted for property: ${property.title || 'Listing'}`,
          type: 'APPLICATION',
        });
      }

      return appDoc;
    }
  }

  static async getApplicationsForUser(userId: string, role: string) {
    if (ApplicationService.isMongoConnected()) {
      if (role === 'TENANT') {
        return ApplicationModel.find({ tenantId: userId })
          .populate('propertyId')
          .sort({ createdAt: -1 })
          .lean();
      }

      const ownerProperties = await PropertyModel.find({ ownerId: userId }).select('_id');
      const propertyIds = ownerProperties.map((p) => p._id);

      return ApplicationModel.find({ propertyId: { $in: propertyIds } })
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .populate('propertyId')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      const allApps = PersistentStore.loadCollection('applications');
      if (role === 'TENANT') {
        const tenantApps = allApps.filter((a: any) => a.tenantId === userId);
        return tenantApps.map((a: any) => ({
          ...a,
          propertyId: PersistentStore.findById('properties', a.propertyId) || memoryProperties.get(a.propertyId) || { _id: a.propertyId, id: a.propertyId },
        }));
      }

      if (role === 'OWNER') {
        const ownerProps = PersistentStore.find('properties', (p: any) => p.ownerId === userId);
        const ownerPropIds = ownerProps.map((p: any) => p._id || p.id);
        const ownerApps = allApps.filter((a: any) => ownerPropIds.includes(a.propertyId));
        return ownerApps.map((a: any) => ({
          ...a,
          tenantId: PersistentStore.findById('users', a.tenantId) || { name: 'Verified Applicant', email: '', phone: '' },
          propertyId: PersistentStore.findById('properties', a.propertyId) || { _id: a.propertyId, id: a.propertyId },
        }));
      }

      // ADMIN
      return allApps.map((a: any) => ({
        ...a,
        tenantId: PersistentStore.findById('users', a.tenantId) || { name: 'Applicant', email: '', phone: '' },
        propertyId: PersistentStore.findById('properties', a.propertyId) || { _id: a.propertyId, id: a.propertyId },
      }));
    }
  }

  static async getApplicationById(applicationId: string, userId: string, role: string) {
    if (ApplicationService.isMongoConnected()) {
      const application = await ApplicationModel.findById(applicationId)
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .populate({
          path: 'propertyId',
          populate: { path: 'ownerId', select: 'name email phone' }
        })
        .lean();

      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      const tenantIdStr = (application.tenantId as any)?._id?.toString() || (application.tenantId as any)?.toString();
      const propertyOwnerIdStr = (application.propertyId as any)?.ownerId?._id?.toString() || (application.propertyId as any)?.ownerId?.toString();

      if (role !== 'ADMIN' && tenantIdStr !== userId && propertyOwnerIdStr !== userId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to view this application' };
      }

      return application;
    } else {
      const application = memoryApplications.get(applicationId);
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }
      const property = memoryProperties.get(application.propertyId);
      const ownerId = property?.ownerId || 'mem_owner';

      if (role !== 'ADMIN' && application.tenantId !== userId && ownerId !== userId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to view this application' };
      }

      return {
        ...application,
        propertyId: property || { _id: application.propertyId, id: application.propertyId, ownerId },
      };
    }
  }

  static async updateStatus(applicationId: string, userId: string, role: string, newStatus: string) {
    if (ApplicationService.isMongoConnected()) {
      const application = await ApplicationModel.findById(applicationId).populate('propertyId');
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      const property = application.propertyId as any;
      const tenantIdStr = application.tenantId.toString();
      const ownerIdStr = property.ownerId.toString();

      // Authorization check: Tenant can withdraw own app; Owner/Admin can transition other statuses
      if (newStatus === 'WITHDRAWN') {
        if (role !== 'ADMIN' && tenantIdStr !== userId) {
          throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the applicant tenant can withdraw this application' };
        }
      } else {
        if (role !== 'ADMIN' && ownerIdStr !== userId) {
          throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to update this application' };
        }
      }

      // Controlled State Machine validation
      const currentStatus = application.status;
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw {
          statusCode: 400,
          code: 'INVALID_TRANSITION',
          message: `Cannot transition application from status '${currentStatus}' to '${newStatus}'`,
        };
      }

      application.status = newStatus as any;
      await application.save();

      if (newStatus === 'APPROVED') {
        const rentalDoc = await RentalService.createOrUpdateRentalFromApplication(application);
        if (rentalDoc) {
          await AgreementService.createAgreement({
            rentalId: (rentalDoc._id || rentalDoc.id).toString(),
            propertyId: property._id.toString(),
            tenantId: tenantIdStr,
            ownerId: ownerIdStr,
          });
        }
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Approved!',
          message: `Your application for ${property.title} has been approved. Please review the rental agreement.`,
          type: 'APPLICATION',
        });
      } else if (newStatus === 'REJECTED') {
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Update',
          message: `Your application for ${property.title} was not approved.`,
          type: 'APPLICATION',
        });
      }

      return application;
    } else {
      const application = memoryApplications.get(applicationId);
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }
      const property = memoryProperties.get(application.propertyId);
      const ownerIdStr = property?.ownerId || 'mem_owner';
      const tenantIdStr = application.tenantId;

      if (newStatus === 'WITHDRAWN') {
        if (role !== 'ADMIN' && tenantIdStr !== userId) {
          throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the applicant tenant can withdraw this application' };
        }
      } else {
        if (role !== 'ADMIN' && ownerIdStr !== userId) {
          throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to update this application' };
        }
      }

      const currentStatus = application.status;
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw {
          statusCode: 400,
          code: 'INVALID_TRANSITION',
          message: `Cannot transition application from status '${currentStatus}' to '${newStatus}'`,
        };
      }

      application.status = newStatus;
      memoryApplications.set(applicationId, application);
      PersistentStore.update('applications', applicationId, { status: newStatus });

      if (newStatus === 'APPROVED') {
        const rentalDoc = await RentalService.createOrUpdateRentalFromApplication(application);
        if (rentalDoc) {
          await AgreementService.createAgreement({
            rentalId: (rentalDoc._id || rentalDoc.id).toString(),
            propertyId: application.propertyId,
            tenantId: tenantIdStr,
            ownerId: ownerIdStr,
          });
        }
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Approved!',
          message: 'Your application has been approved. Please review the rental agreement.',
          type: 'APPLICATION',
        });
      }

      return application;
    }
  }
}
