import { ApplicationModel, PropertyModel, UserModel } from '../models';
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
  occupantsCount?: number;
  employmentStatus?: string;
  monthlyIncome?: number;
  notes?: string;
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
  VERIFICATION_REQUIRED: ['VERIFICATION_PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
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

      // 3. Retrieve Tenant Profile Details for application data snapshot
      const tenantUser = await UserModel.findById(tenantId).lean();
      const applicantName = tenantUser?.name || 'Verified Tenant';
      const applicantEmail = tenantUser?.email || '';
      const applicantPhone = tenantUser?.phone || '';
      const verificationStatus = (tenantUser as any)?.identityVerificationStatus || 'NOT_STARTED';

      const application = await ApplicationModel.create({
        propertyId: input.propertyId,
        tenantId,
        ownerId: property.ownerId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        moveInDate: new Date(input.moveInDate),
        proposedRent: Number(input.proposedRent),
        message: input.message ? input.message.trim() : undefined,
        applicationData: {
          applicantName,
          applicantEmail,
          applicantPhone,
          employmentStatus: input.employmentStatus || 'Employed',
          monthlyIncome: input.monthlyIncome || Number(input.proposedRent) * 3,
          occupantsCount: input.occupantsCount || 1,
          notes: input.notes,
        },
        verificationStatusAtSubmission: verificationStatus,
      });

      // 4. Notify Property Owner
      await NotificationService.createNotification({
        recipientId: property.ownerId.toString(),
        title: 'New Rental Application',
        message: `A new application has been submitted by ${applicantName} for property: ${property.title}`,
        type: 'APPLICATION',
        link: `/owner/applications/${application._id}`,
      });

      // 5. Notify Applicant Tenant (Confirmation)
      await NotificationService.createNotification({
        recipientId: tenantId,
        title: 'Application Submitted',
        message: `Your application for ${property.title} was submitted successfully and is awaiting review.`,
        type: 'APPLICATION',
        link: `/tenant/applications/${application._id}`,
      });

      return application;
    } else {
      const property = memoryProperties.get(input.propertyId) || PersistentStore.findById('properties', input.propertyId);
      if (property && property.availabilityStatus && property.availabilityStatus !== 'VACANT') {
        throw { statusCode: 400, code: 'PROPERTY_UNAVAILABLE', message: 'This property is no longer available for rent' };
      }

      const activeExisting = Array.from(memoryApplications.values()).find(
        (a) => a.tenantId === tenantId && a.propertyId === input.propertyId && !['REJECTED', 'WITHDRAWN'].includes(a.status)
      );

      if (activeExisting) {
        throw { statusCode: 409, code: 'APPLICATION_EXISTS', message: 'You already have an active application for this property' };
      }

      const tenantUser = PersistentStore.findById('users', tenantId);
      const applicantName = tenantUser?.name || 'Verified Tenant';
      const applicantEmail = tenantUser?.email || '';
      const applicantPhone = tenantUser?.phone || '';
      const verificationStatus = tenantUser?.identityVerificationStatus || 'NOT_STARTED';

      const id = 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const appDoc = {
        _id: id,
        id,
        propertyId: input.propertyId,
        tenantId,
        ownerId: property?.ownerId || 'mem_owner',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        moveInDate: new Date(input.moveInDate),
        proposedRent: Number(input.proposedRent),
        message: input.message ? input.message.trim() : undefined,
        applicationData: {
          applicantName,
          applicantEmail,
          applicantPhone,
          employmentStatus: input.employmentStatus || 'Employed',
          monthlyIncome: input.monthlyIncome || Number(input.proposedRent) * 3,
          occupantsCount: input.occupantsCount || 1,
          notes: input.notes,
        },
        verificationStatusAtSubmission: verificationStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      PersistentStore.insert('applications', appDoc);
      memoryApplications.set(id, appDoc);

      if (property) {
        await NotificationService.createNotification({
          recipientId: property.ownerId || 'mem_owner',
          title: 'New Rental Application',
          message: `A new application has been submitted by ${applicantName} for property: ${property.title || 'Listing'}`,
          type: 'APPLICATION',
          link: `/owner/applications/${id}`,
        });
      }

      await NotificationService.createNotification({
        recipientId: tenantId,
        title: 'Application Submitted',
        message: `Your application for ${property?.title || 'Listing'} was submitted successfully and is awaiting review.`,
        type: 'APPLICATION',
        link: `/tenant/applications/${id}`,
      });

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

      return ApplicationModel.find({
        $or: [
          { ownerId: userId },
          { propertyId: { $in: propertyIds } }
        ]
      })
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
        const ownerApps = allApps.filter((a: any) => a.ownerId === userId || ownerPropIds.includes(a.propertyId));
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
      const propertyOwnerIdStr = (application.propertyId as any)?.ownerId?._id?.toString() 
        || (application.propertyId as any)?.ownerId?.toString()
        || (application.ownerId as any)?._id?.toString()
        || (application.ownerId as any)?.toString();

      if (role !== 'ADMIN' && tenantIdStr !== userId && propertyOwnerIdStr !== userId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to view this application' };
      }

      return application;
    } else {
      const application = memoryApplications.get(applicationId);
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }
      const property = memoryProperties.get(application.propertyId) || PersistentStore.findById('properties', application.propertyId);
      const ownerId = application.ownerId || property?.ownerId || 'mem_owner';

      if (role !== 'ADMIN' && application.tenantId !== userId && ownerId !== userId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have authorization to view this application' };
      }

      const tenant = PersistentStore.findById('users', application.tenantId) || { name: 'Verified Applicant', email: '', phone: '' };

      return {
        ...application,
        tenantId: tenant,
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
      const ownerIdStr = (property?.ownerId || application.ownerId)?.toString();

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

      // Real Notifications based on state transitions
      const propTitle = property?.title || 'Listing';
      const appId = application._id.toString();

      if (newStatus === 'UNDER_REVIEW') {
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Under Review',
          message: `Your application for ${propTitle} is now under review by the property owner.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'VERIFICATION_REQUIRED') {
        const { RentalVerificationModel } = await import('../models/rental-verification.model');
        const existingVerif = await RentalVerificationModel.findOne({ applicationId: application._id });
        if (!existingVerif) {
          await RentalVerificationModel.create({
            applicationId: application._id,
            propertyId: (property as any)?._id || application.propertyId,
            ownerId: (application.ownerId || ownerIdStr),
            tenantId: application.tenantId,
            status: 'NOT_STARTED',
            steps: [
              {
                stepId: 'ID_VERIFICATION',
                name: 'Government Identity (Aadhaar / Voter ID / Passport)',
                category: 'IDENTITY',
                status: 'NOT_STARTED',
                isExternalProvider: true,
                providerNotice: 'Verification provider integration required',
              },
              {
                stepId: 'INCOME_VERIFICATION',
                name: 'Employment & Income Verification',
                category: 'INCOME',
                status: 'NOT_STARTED',
                isExternalProvider: false,
                providerNotice: 'Manual document assessment by verification team',
              },
              {
                stepId: 'RENTAL_HISTORY',
                name: 'Rental History & Reference Check',
                category: 'RENTAL_HISTORY',
                status: 'NOT_STARTED',
                isExternalProvider: false,
                providerNotice: 'Owner and previous tenancy cross-check',
              },
            ],
            nextAction: 'Tenant required to submit identity verification',
          });
        }
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Verification Required',
          message: `The owner has requested identity and background verification for ${propTitle}.`,
          type: 'APPLICATION',
          link: `/tenant/verification/${appId}`,
        });
      } else if (newStatus === 'APPROVED') {
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
          message: `Congratulations! Your application for ${propTitle} has been approved. Please review your rental agreement.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'REJECTED') {
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Update',
          message: `Your application for ${propTitle} was not approved.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'WITHDRAWN') {
        if (ownerIdStr) {
          await NotificationService.createNotification({
            recipientId: ownerIdStr,
            title: 'Application Withdrawn',
            message: `The applicant has withdrawn their rental application for ${propTitle}.`,
            type: 'APPLICATION',
            link: `/owner/applications`,
          });
        }
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Withdrawn',
          message: `You have successfully withdrawn your application for ${propTitle}.`,
          type: 'APPLICATION',
          link: `/tenant/applications`,
        });
      }

      return application;
    } else {
      const application = memoryApplications.get(applicationId);
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }
      const property = memoryProperties.get(application.propertyId) || PersistentStore.findById('properties', application.propertyId);
      const ownerIdStr = (application.ownerId || property?.ownerId || 'mem_owner').toString();
      const tenantIdStr = application.tenantId.toString();

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
      application.updatedAt = new Date();
      memoryApplications.set(applicationId, application);
      PersistentStore.update('applications', applicationId, { status: newStatus, updatedAt: application.updatedAt });

      const propTitle = property?.title || 'Listing';
      const appId = application._id || application.id;

      if (newStatus === 'UNDER_REVIEW') {
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Under Review',
          message: `Your application for ${propTitle} is now under review by the property owner.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'VERIFICATION_REQUIRED') {
        const { memoryVerifications } = await import('./verification.service');
        if (!memoryVerifications.has(applicationId)) {
          memoryVerifications.set(applicationId, {
            _id: 'verif_' + applicationId,
            id: 'verif_' + applicationId,
            applicationId,
            tenantId: application.tenantId,
            propertyId: application.propertyId,
            ownerId: application.ownerId || ownerIdStr,
            status: 'NOT_STARTED',
            steps: [
              {
                stepId: 'ID_VERIFICATION',
                name: 'Government Identity (Aadhaar / Voter ID / Passport)',
                category: 'IDENTITY',
                status: 'NOT_STARTED',
                isExternalProvider: true,
                providerNotice: 'Verification provider integration required',
              },
              {
                stepId: 'INCOME_VERIFICATION',
                name: 'Employment & Income Verification',
                category: 'INCOME',
                status: 'NOT_STARTED',
                isExternalProvider: false,
                providerNotice: 'Manual document assessment by verification team',
              },
              {
                stepId: 'RENTAL_HISTORY',
                name: 'Rental History & Reference Check',
                category: 'RENTAL_HISTORY',
                status: 'NOT_STARTED',
                isExternalProvider: false,
                providerNotice: 'Owner and previous tenancy cross-check',
              },
            ],
            documents: [],
            nextAction: 'Tenant required to submit identity verification',
          });
        }
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Verification Required',
          message: `The owner has requested identity and background verification for ${propTitle}.`,
          type: 'APPLICATION',
          link: `/tenant/verification/${appId}`,
        });
      } else if (newStatus === 'APPROVED') {
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
          message: `Congratulations! Your application for ${propTitle} has been approved. Please review your rental agreement.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'REJECTED') {
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Update',
          message: `Your application for ${propTitle} was not approved.`,
          type: 'APPLICATION',
          link: `/tenant/applications/${appId}`,
        });
      } else if (newStatus === 'WITHDRAWN') {
        await NotificationService.createNotification({
          recipientId: ownerIdStr,
          title: 'Application Withdrawn',
          message: `The applicant has withdrawn their rental application for ${propTitle}.`,
          type: 'APPLICATION',
          link: `/owner/applications`,
        });
        await NotificationService.createNotification({
          recipientId: tenantIdStr,
          title: 'Application Withdrawn',
          message: `You have successfully withdrawn your application for ${propTitle}.`,
          type: 'APPLICATION',
          link: `/tenant/applications`,
        });
      }

      return application;
    }
  }
}
