import { RentalVerificationModel, UserModel, ApplicationModel, PropertyModel } from '../models';
import { VerificationDocumentStorageService } from './verification-document.service';
import { NotificationService } from './notification.service';
import { memoryApplications } from './application.service';
import mongoose, { Types } from 'mongoose';

export const memoryVerifications = new Map<string, any>();

function getDefaultSteps() {
  return [
    {
      stepId: 'ID_VERIFICATION',
      name: 'Government Identity (Aadhaar / Voter ID / Passport)',
      category: 'IDENTITY',
      status: 'NOT_STARTED',
      isExternalProvider: true,
      providerNotice: 'Verification provider integration required',
      data: null,
    },
    {
      stepId: 'INCOME_VERIFICATION',
      name: 'Employment & Income Verification',
      category: 'INCOME',
      status: 'NOT_STARTED',
      isExternalProvider: false,
      providerNotice: 'Manual document assessment by verification team',
      data: null,
    },
    {
      stepId: 'RENTAL_HISTORY',
      name: 'Rental History & Reference Check',
      category: 'RENTAL_HISTORY',
      status: 'NOT_STARTED',
      isExternalProvider: false,
      providerNotice: 'Owner and previous tenancy cross-check',
      data: null,
    },
  ];
}

export class VerificationService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Helper to sanitize verification document for Property Owners.
   * STRICT PRIVACY: Owner must NOT automatically see unrestricted sensitive identity documents.
   */
  public static sanitizeForOwner(verification: any) {
    const raw = typeof verification.toObject === 'function' ? verification.toObject() : { ...verification };

    // Strip sensitive raw document fields
    const sanitizedDocuments = (raw.documents || []).map((doc: any) => ({
      documentType: doc.documentType,
      documentName: doc.documentName || doc.documentType,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
      // Masked number only shows high-level placeholder (e.g. DOCUMENT-PROVIDED)
      maskedIdentifier: doc.maskedIdentifier ? 'XXXX-XXXX-****' : 'DOCUMENT-PROVIDED',
      // Zero raw file storage keys or URLs
    }));

    // High level submitted info without private emergency contacts
    const sanitizedInfo = raw.submittedInfo ? {
      fullName: raw.submittedInfo.fullName,
      employerName: raw.submittedInfo.employerName,
      designation: raw.submittedInfo.designation,
      monthlyIncome: raw.submittedInfo.monthlyIncome,
    } : null;

    return {
      _id: raw._id || raw.id,
      applicationId: raw.applicationId,
      propertyId: raw.propertyId,
      ownerId: raw.ownerId,
      tenantId: raw.tenantId,
      status: raw.status,
      steps: (raw.steps || []).map((s: any) => ({
        stepId: s.stepId,
        name: s.name,
        category: s.category,
        status: s.status,
        providerNotice: s.providerNotice,
      })),
      documents: sanitizedDocuments,
      submittedInfo: sanitizedInfo,
      submittedAt: raw.submittedAt,
      reviewedAt: raw.reviewedAt,
      nextAction: raw.nextAction,
      isRestrictedView: true,
      privacyNotice: 'Sensitive identity documents are encrypted and protected under privacy regulations. Restricted to administrative inspection.',
    };
  }

  /**
   * Get verification for a specific application.
   * Auto-initializes verification workflow if none exists.
   */
  static async getVerificationByApplicationId(applicationId: string, requesterId: string, requesterRole: string) {
    if (!applicationId) {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'applicationId is required' };
    }

    if (VerificationService.isMongoConnected()) {
      const application = await ApplicationModel.findById(applicationId)
        .populate('propertyId')
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .populate('ownerId', 'name email phone');

      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      const tenantIdStr = (application.tenantId as any)?._id?.toString() || (application.tenantId as any)?.toString();
      const ownerIdStr = (application.ownerId as any)?._id?.toString() || 
        (application.propertyId as any)?.ownerId?.toString() || 
        (application.ownerId as any)?.toString();

      // Authorization check (IDOR protection)
      if (requesterRole !== 'ADMIN' && tenantIdStr !== requesterId && ownerIdStr !== requesterId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to this verification record' };
      }

      let verification = await RentalVerificationModel.findOne({ applicationId })
        .populate('tenantId', 'name email phone identityVerificationStatus')
        .populate('propertyId', 'title propertyLocation rentAmount images')
        .populate('ownerId', 'name email phone');

      if (!verification) {
        // Create initial verification workflow state linked to this application
        const initStatus = application.status === 'VERIFICATION_REQUIRED' ? 'PENDING' : 'NOT_STARTED';
        verification = await RentalVerificationModel.create({
          applicationId: application._id,
          propertyId: (application.propertyId as any)?._id || application.propertyId,
          ownerId: (application.ownerId as any)?._id || application.ownerId,
          tenantId: (application.tenantId as any)?._id || application.tenantId,
          status: initStatus,
          steps: getDefaultSteps(),
          documents: [],
          nextAction: initStatus === 'PENDING' 
            ? 'Complete available verification steps' 
            : 'Owner verification request pending',
        });

        // Re-populate newly created
        verification = await RentalVerificationModel.findById(verification._id)
          .populate('tenantId', 'name email phone identityVerificationStatus')
          .populate('propertyId', 'title propertyLocation rentAmount images')
          .populate('ownerId', 'name email phone');
      }

      // PRIVACY SHIELD FOR PROPERTY OWNERS
      if (requesterRole === 'OWNER' && requesterId !== tenantIdStr) {
        return {
          verification: VerificationService.sanitizeForOwner(verification),
          application,
          property: application.propertyId,
        };
      }

      return {
        verification,
        application,
        property: application.propertyId,
      };
    } else {
      // In-Memory Fallback
      let verification = Array.from(memoryVerifications.values()).find(
        (v) => (v.applicationId === applicationId || v.id === applicationId)
      );

      const app = memoryApplications.get(applicationId);
      if (!app) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      if (!verification) {
        verification = {
          _id: 'verif_' + applicationId,
          id: 'verif_' + applicationId,
          applicationId,
          tenantId: app.tenantId,
          propertyId: app.propertyId,
          ownerId: app.ownerId || 'owner_1',
          status: app.status === 'VERIFICATION_REQUIRED' ? 'PENDING' : 'NOT_STARTED',
          steps: getDefaultSteps(),
          documents: [],
          nextAction: 'Complete available verification steps',
        };
        memoryVerifications.set(verification.id, verification);
      }

      if (requesterRole === 'OWNER' && requesterId !== app.tenantId) {
        return {
          verification: VerificationService.sanitizeForOwner(verification),
          application: app,
          property: { _id: app.propertyId, title: 'Rental Property' },
        };
      }

      return {
        verification,
        application: app,
        property: { _id: app.propertyId, title: 'Rental Property' },
      };
    }
  }

  /**
   * Tenant submits available verification steps & documents for their application.
   * State transitions to PENDING.
   */
  static async submitVerificationForApplication(
    applicationId: string,
    tenantId: string,
    payload: {
      documents?: Array<{ documentType: string; documentNumber?: string; notes?: string }>;
      submittedInfo?: any;
      notes?: string;
    }
  ) {
    if (VerificationService.isMongoConnected()) {
      const application = await ApplicationModel.findById(applicationId).populate('propertyId');
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      if (application.tenantId.toString() !== tenantId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the applicant tenant can submit verification details' };
      }

      let verification = await RentalVerificationModel.findOne({ applicationId });
      if (!verification) {
        verification = new RentalVerificationModel({
          applicationId: application._id,
          propertyId: (application.propertyId as any)?._id || application.propertyId,
          ownerId: application.ownerId,
          tenantId,
          steps: getDefaultSteps(),
          documents: [],
        });
      }

      // Process uploaded/input documents securely
      const processedDocs: any[] = [];
      if (payload.documents && Array.isArray(payload.documents)) {
        for (const doc of payload.documents) {
          if (!doc.documentType) continue;
          const storedRecord = VerificationDocumentStorageService.storeDocument(
            tenantId,
            doc.documentType,
            doc.documentNumber
          );
          processedDocs.push({
            documentType: doc.documentType,
            documentName: doc.documentType.replace('_', ' '),
            maskedIdentifier: storedRecord.maskedNumber,
            storageKey: storedRecord.storageKey,
            uploadedAt: new Date(),
            status: 'PENDING',
            notes: doc.notes,
          });
        }
      }

      // Update steps status
      const updatedSteps = (verification.steps && verification.steps.length > 0 ? verification.steps : getDefaultSteps()).map((step: any) => {
        if (step.stepId === 'ID_VERIFICATION' && processedDocs.some(d => ['AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'].includes(d.documentType))) {
          return {
            ...step.toObject ? step.toObject() : step,
            status: 'PENDING',
            completedAt: new Date(),
            providerNotice: 'Verification provider integration required. Document submitted for manual administrative review.',
          };
        }
        if (step.stepId === 'INCOME_VERIFICATION' && (payload.submittedInfo?.monthlyIncome || processedDocs.some(d => ['SALARY_SLIP', 'BANK_STATEMENT'].includes(d.documentType)))) {
          return {
            ...step.toObject ? step.toObject() : step,
            status: 'PENDING',
            completedAt: new Date(),
          };
        }
        if (step.stepId === 'RENTAL_HISTORY' && (payload.submittedInfo?.previousLandlordContact || payload.submittedInfo?.currentAddress)) {
          return {
            ...step.toObject ? step.toObject() : step,
            status: 'PENDING',
            completedAt: new Date(),
          };
        }
        return step;
      });

      verification.steps = updatedSteps as any;
      if (processedDocs.length > 0) {
        verification.documents = [...(verification.documents || []), ...processedDocs] as any;
      }
      if (payload.submittedInfo) {
        verification.submittedInfo = {
          ...verification.submittedInfo,
          ...payload.submittedInfo,
          declarationAccepted: true,
        };
      }
      verification.status = 'PENDING';
      verification.submittedAt = new Date();
      verification.notes = payload.notes || verification.notes;
      verification.nextAction = 'Awaiting administrative verification review';
      await verification.save();

      // Update user & application state
      await UserModel.findByIdAndUpdate(tenantId, { identityVerificationStatus: 'PENDING' });
      
      if (application.status === 'VERIFICATION_REQUIRED' || application.status === 'SUBMITTED') {
        application.status = 'VERIFICATION_PENDING' as any;
        await application.save();
      }

      // Notifications
      const propTitle = (application.propertyId as any)?.title || 'Property';
      await NotificationService.createNotification({
        recipientId: tenantId,
        title: 'Verification Details Submitted',
        message: `Your verification details for ${propTitle} have been submitted. Status: PENDING review.`,
        type: 'APPLICATION',
        link: `/tenant/verification/${applicationId}`,
      });

      const ownerIdStr = (application.ownerId || (application.propertyId as any)?.ownerId)?.toString();
      if (ownerIdStr) {
        await NotificationService.createNotification({
          recipientId: ownerIdStr,
          title: 'Tenant Verification Submitted',
          message: `Applicant has submitted verification details for ${propTitle}. Status is now Pending Review.`,
          type: 'APPLICATION',
          link: `/owner/applications/${applicationId}`,
        });
      }

      return verification;
    } else {
      // In-Memory
      let verification = memoryVerifications.get(applicationId) || {
        _id: 'verif_' + applicationId,
        id: 'verif_' + applicationId,
        applicationId,
        tenantId,
        steps: getDefaultSteps(),
        documents: [],
      };

      verification.status = 'PENDING';
      verification.submittedAt = new Date();
      verification.submittedInfo = payload.submittedInfo;
      verification.nextAction = 'Awaiting administrative verification review';

      memoryVerifications.set(applicationId, verification);
      return verification;
    }
  }

  /**
   * Owner requests verification for an application
   */
  static async requestVerification(applicationId: string, ownerId: string, role: string) {
    if (VerificationService.isMongoConnected()) {
      const application = await ApplicationModel.findById(applicationId).populate('propertyId');
      if (!application) {
        throw { statusCode: 404, code: 'APPLICATION_NOT_FOUND', message: 'Application record not found' };
      }

      const propOwnerId = (application.ownerId || (application.propertyId as any)?.ownerId)?.toString();
      if (role !== 'ADMIN' && propOwnerId !== ownerId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only the property owner can request verification' };
      }

      application.status = 'VERIFICATION_REQUIRED' as any;
      await application.save();

      let verification = await RentalVerificationModel.findOne({ applicationId });
      if (!verification) {
        verification = await RentalVerificationModel.create({
          applicationId: application._id,
          propertyId: (application.propertyId as any)?._id || application.propertyId,
          ownerId: application.ownerId,
          tenantId: application.tenantId,
          status: 'NOT_STARTED',
          steps: getDefaultSteps(),
          nextAction: 'Tenant required to submit identity verification',
        });
      }

      const propTitle = (application.propertyId as any)?.title || 'Property';
      await NotificationService.createNotification({
        recipientId: application.tenantId.toString(),
        title: 'Verification Requested',
        message: `The owner has requested identity and background verification for ${propTitle}. Please complete the required steps.`,
        type: 'APPLICATION',
        link: `/tenant/verification/${applicationId}`,
      });

      return { success: true, message: 'Verification requested successfully', verification };
    } else {
      const app = memoryApplications.get(applicationId);
      if (app) {
        app.status = 'VERIFICATION_REQUIRED';
        memoryApplications.set(applicationId, app);
      }
      return { success: true, message: 'Verification requested successfully' };
    }
  }

  /**
   * Admin verification queue listing with filtering
   */
  static async getAdminVerificationQueue(
    adminId: string,
    role: string,
    filters?: { status?: string; search?: string }
  ) {
    if (role !== 'ADMIN') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Admin access required' };
    }

    if (VerificationService.isMongoConnected()) {
      const query: any = {};
      if (filters?.status && filters.status !== 'ALL') {
        query.status = filters.status;
      }

      return RentalVerificationModel.find(query)
        .populate('tenantId', 'name email phone identityVerificationStatus avatar')
        .populate('propertyId', 'title propertyLocation rentAmount images')
        .populate('applicationId', 'status moveInDate proposedRent createdAt')
        .populate('ownerId', 'name email phone')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .lean();
    } else {
      const all = Array.from(memoryVerifications.values());
      if (filters?.status && filters.status !== 'ALL') {
        return all.filter((v) => v.status === filters.status);
      }
      return all;
    }
  }

  /**
   * Get single verification record by verification ID
   */
  static async getVerificationById(verificationId: string, requesterId: string, requesterRole: string) {
    if (VerificationService.isMongoConnected()) {
      const verification = await RentalVerificationModel.findById(verificationId)
        .populate('tenantId', 'name email phone identityVerificationStatus avatar')
        .populate('propertyId', 'title propertyLocation rentAmount images')
        .populate('applicationId', 'status moveInDate proposedRent createdAt')
        .populate('ownerId', 'name email phone')
        .populate('reviewedBy', 'name email');

      if (!verification) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Verification record not found' };
      }

      const tenantIdStr = (verification.tenantId as any)?._id?.toString() || verification.tenantId?.toString();
      const ownerIdStr = (verification.ownerId as any)?._id?.toString() || verification.ownerId?.toString();

      if (requesterRole !== 'ADMIN' && tenantIdStr !== requesterId && ownerIdStr !== requesterId) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied to this verification record' };
      }

      if (requesterRole === 'OWNER' && requesterId !== tenantIdStr) {
        return VerificationService.sanitizeForOwner(verification);
      }

      return verification;
    } else {
      const verification = memoryVerifications.get(verificationId);
      if (!verification) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Verification record not found' };
      }
      return verification;
    }
  }

  /**
   * Admin reviews verification (VERIFIED or REJECTED)
   */
  static async reviewVerification(
    verificationId: string,
    adminId: string,
    role: string,
    newStatus: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW',
    rejectionReason?: string,
    adminNotes?: string
  ) {
    if (role !== 'ADMIN') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only administrators can perform verification reviews' };
    }

    if (!['VERIFIED', 'REJECTED', 'UNDER_REVIEW'].includes(newStatus)) {
      throw { statusCode: 400, code: 'INVALID_STATUS', message: 'Invalid verification review status' };
    }

    if (VerificationService.isMongoConnected()) {
      // Find by verificationId or by tenantId (for backwards compatibility)
      let verification = await RentalVerificationModel.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(verificationId) ? [{ _id: verificationId }] : []),
          ...(mongoose.Types.ObjectId.isValid(verificationId) ? [{ tenantId: verificationId }] : []),
        ],
      }).populate('applicationId');

      if (!verification) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Verification record not found' };
      }

      verification.status = newStatus;
      verification.reviewedAt = new Date();
      verification.reviewedBy = new Types.ObjectId(adminId);
      if (rejectionReason) verification.rejectionReason = rejectionReason;
      if (adminNotes) verification.adminNotes = adminNotes;

      // Update verification steps status
      verification.steps = (verification.steps || []).map((step: any) => ({
        ...step.toObject ? step.toObject() : step,
        status: newStatus === 'VERIFIED' ? 'VERIFIED' : (newStatus === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW'),
        completedAt: newStatus === 'VERIFIED' ? new Date() : step.completedAt,
      })) as any;

      verification.nextAction = newStatus === 'VERIFIED'
        ? 'Verification approved. Ready for tenancy lease agreement processing.'
        : (newStatus === 'REJECTED' ? 'Verification rejected. Tenant must address concerns and resubmit.' : 'Under active administrative review');

      await verification.save();

      // Update User verification status
      const tenantIdStr = verification.tenantId.toString();
      await UserModel.findByIdAndUpdate(tenantIdStr, { identityVerificationStatus: newStatus });

      // Update Application if linked
      if (verification.applicationId) {
        const app = await ApplicationModel.findById(verification.applicationId);
        if (app && app.status === 'VERIFICATION_PENDING') {
          app.status = newStatus === 'VERIFIED' ? 'UNDER_REVIEW' : 'VERIFICATION_REQUIRED';
          await app.save();
        }
      }

      // Notifications
      await NotificationService.createNotification({
        recipientId: tenantIdStr,
        title: newStatus === 'VERIFIED' ? 'Identity Verification Approved' : 'Identity Verification Update',
        message: newStatus === 'VERIFIED'
          ? 'Your identity verification has been reviewed and verified by the Nivas360 compliance team.'
          : `Identity verification decision: ${newStatus}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
        type: 'SYSTEM',
        link: verification.applicationId ? `/tenant/verification/${verification.applicationId}` : '/tenant/verification',
      });

      if (verification.ownerId) {
        await NotificationService.createNotification({
          recipientId: verification.ownerId.toString(),
          title: `Applicant Verification ${newStatus === 'VERIFIED' ? 'Verified' : 'Update'}`,
          message: `Administrative verification status for applicant: ${newStatus}.`,
          type: 'APPLICATION',
          link: verification.applicationId ? `/owner/applications/${verification.applicationId}` : '/owner/applications',
        });
      }

      return verification;
    } else {
      let verification = memoryVerifications.get(verificationId);
      if (!verification) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Verification record not found' };
      }
      verification.status = newStatus;
      verification.reviewedAt = new Date();
      if (rejectionReason) verification.rejectionReason = rejectionReason;
      if (adminNotes) verification.adminNotes = adminNotes;
      memoryVerifications.set(verificationId, verification);
      return verification;
    }
  }

  /**
   * Backwards compatible legacy tenant verification fetch
   */
  static async getTenantVerification(tenantId: string, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN' && requesterRole !== 'OWNER' && requesterId !== tenantId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    if (VerificationService.isMongoConnected()) {
      let verification = await RentalVerificationModel.findOne({ tenantId })
        .sort({ createdAt: -1 })
        .lean();

      if (!verification) {
        verification = {
          tenantId,
          status: 'NOT_STARTED',
          steps: getDefaultSteps(),
          documents: [],
        } as any;
      }

      if (requesterRole === 'OWNER') {
        return VerificationService.sanitizeForOwner(verification);
      }

      return verification;
    } else {
      let verification = memoryVerifications.get(tenantId) || Array.from(memoryVerifications.values()).find((v) => v.tenantId === tenantId);
      if (!verification) {
        verification = { tenantId, status: 'NOT_STARTED', steps: getDefaultSteps(), documents: [] };
      }
      if (requesterRole === 'OWNER') {
        return VerificationService.sanitizeForOwner(verification);
      }
      return verification;
    }
  }

  /**
   * Backwards compatible legacy simple submission
   */
  static async submitVerification(tenantId: string, documentType: string, documentNumber?: string, notes?: string) {
    const docRecord = VerificationDocumentStorageService.storeDocument(tenantId, documentType, documentNumber);

    if (VerificationService.isMongoConnected()) {
      let verification = await RentalVerificationModel.findOne({ tenantId });
      if (verification) {
        verification.status = 'PENDING';
        verification.submittedAt = new Date();
        verification.documents.push({
          documentType,
          documentName: documentType,
          maskedIdentifier: docRecord.maskedNumber,
          storageKey: docRecord.storageKey,
          uploadedAt: new Date(),
          status: 'PENDING',
          notes,
        });
        await verification.save();
      } else {
        verification = await RentalVerificationModel.create({
          tenantId,
          status: 'PENDING',
          submittedAt: new Date(),
          steps: getDefaultSteps(),
          documents: [
            {
              documentType,
              documentName: documentType,
              maskedIdentifier: docRecord.maskedNumber,
              storageKey: docRecord.storageKey,
              uploadedAt: new Date(),
              status: 'PENDING',
              notes,
            },
          ],
        });
      }

      await UserModel.findByIdAndUpdate(tenantId, { identityVerificationStatus: 'PENDING' });
      return verification;
    } else {
      const verificationDoc = {
        _id: 'mem_verif_' + Date.now(),
        tenantId,
        status: 'PENDING',
        submittedAt: new Date(),
        documentType,
        maskedNumber: docRecord.maskedNumber,
        notes,
      };
      memoryVerifications.set(tenantId, verificationDoc);
      return verificationDoc;
    }
  }
}
