import { RentalVerificationModel, UserModel, ApplicationModel } from '../models';
import { VerificationDocumentStorageService } from './verification-document.service';
import { NotificationService } from './notification.service';
import { memoryApplications } from './application.service';
import mongoose from 'mongoose';

export const memoryVerifications = new Map<string, any>();

export class VerificationService {
  private static isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get verification status with privacy rules:
   * OWNER gets ONLY summary status. TENANT gets masked info. ADMIN gets full info.
   */
  static async getTenantVerification(tenantId: string, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN' && requesterRole !== 'OWNER' && requesterId !== tenantId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    let verificationRecord: any;

    if (VerificationService.isMongoConnected()) {
      verificationRecord = await RentalVerificationModel.findOne({ tenantId }).lean();
    } else {
      verificationRecord = memoryVerifications.get(tenantId) || Array.from(memoryVerifications.values()).find(v => v.tenantId === tenantId);
    }

    if (!verificationRecord) {
      verificationRecord = {
        tenantId,
        status: 'NOT_STARTED',
      };
    }

    // PRIVACY ENFORCEMENT FOR OWNERS: Return ONLY high-level status badge summary
    if (requesterRole === 'OWNER') {
      return {
        tenantId,
        status: verificationRecord.status,
        isVerified: verificationRecord.status === 'VERIFIED',
        message: verificationRecord.status === 'VERIFIED' ? 'Identity Verified' : 'Identity Verification Pending/Review',
      };
    }

    return verificationRecord;
  }

  /**
   * Tenant submits identity verification info & document
   * NO FAKE VERIFICATION: Status transitions to UNDER_REVIEW pending admin verification
   */
  static async submitVerification(
    tenantId: string,
    documentType: string,
    documentNumber?: string,
    notes?: string
  ) {
    const docRecord = VerificationDocumentStorageService.storeDocument(tenantId, documentType, documentNumber);

    if (VerificationService.isMongoConnected()) {
      let verification = await RentalVerificationModel.findOne({ tenantId });
      if (verification) {
        verification.status = 'UNDER_REVIEW';
        verification.submittedAt = new Date();
        verification.notes = notes || `Document submitted: ${docRecord.maskedNumber}`;
        await verification.save();
      } else {
        verification = await RentalVerificationModel.create({
          tenantId,
          status: 'UNDER_REVIEW',
          submittedAt: new Date(),
          notes: notes || `Document submitted: ${docRecord.maskedNumber}`,
        });
      }

      // Update user verification status
      await UserModel.findByIdAndUpdate(tenantId, { identityVerificationStatus: 'UNDER_REVIEW' });

      // Update active applications
      await ApplicationModel.updateMany(
        { tenantId, status: { $in: ['VERIFICATION_REQUIRED', 'SUBMITTED', 'PENDING'] } },
        { status: 'VERIFICATION_PENDING' }
      );

      // Trigger notification
      await NotificationService.createNotification({
        recipientId: tenantId,
        title: 'Identity Verification Submitted',
        message: 'Your verification details have been submitted and are under administrative review.',
        type: 'SYSTEM',
      });

      return verification;
    } else {
      const verificationDoc = {
        _id: 'mem_verif_' + Date.now(),
        id: 'mem_verif_' + Date.now(),
        tenantId,
        status: 'UNDER_REVIEW',
        submittedAt: new Date(),
        documentType,
        maskedNumber: docRecord.maskedNumber,
        storageKey: docRecord.storageKey,
        notes: notes || `Document submitted: ${docRecord.maskedNumber}`,
      };

      memoryVerifications.set(tenantId, verificationDoc);

      // Update in-memory active applications
      for (const [appId, app] of memoryApplications.entries()) {
        if (app.tenantId === tenantId && ['VERIFICATION_REQUIRED', 'SUBMITTED', 'PENDING'].includes(app.status)) {
          app.status = 'VERIFICATION_PENDING';
          memoryApplications.set(appId, app);
        }
      }

      await NotificationService.createNotification({
        recipientId: tenantId,
        title: 'Identity Verification Submitted',
        message: 'Your verification details have been submitted and are under administrative review.',
        type: 'SYSTEM',
      });

      return verificationDoc;
    }
  }

  /**
   * Admin verification review (Approve / Reject)
   */
  static async reviewVerification(
    tenantId: string,
    adminId: string,
    role: string,
    newStatus: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ) {
    if (role !== 'ADMIN') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only administrators can perform verification reviews' };
    }

    if (!['VERIFIED', 'REJECTED'].includes(newStatus)) {
      throw { statusCode: 400, code: 'INVALID_STATUS', message: 'Invalid verification review status' };
    }

    if (VerificationService.isMongoConnected()) {
      let verification = await RentalVerificationModel.findOne({ tenantId });
      if (!verification) {
        throw { statusCode: 404, code: 'VERIFICATION_NOT_FOUND', message: 'Verification record not found for tenant' };
      }

      verification.status = newStatus;
      verification.reviewedAt = new Date();
      if (rejectionReason) verification.rejectionReason = rejectionReason;
      await verification.save();

      // Update User status
      await UserModel.findByIdAndUpdate(tenantId, { identityVerificationStatus: newStatus });

      // Notify Tenant
      await NotificationService.createNotification({
        recipientId: tenantId,
        title: newStatus === 'VERIFIED' ? 'Identity Verification Approved' : 'Identity Verification Rejected',
        message: newStatus === 'VERIFIED' 
          ? 'Your identity verification has been successfully verified.' 
          : `Identity verification failed: ${rejectionReason || 'Please resubmit valid documentation.'}`,
        type: 'SYSTEM',
      });

      return verification;
    } else {
      let verification = memoryVerifications.get(tenantId);
      if (!verification) {
        throw { statusCode: 404, code: 'VERIFICATION_NOT_FOUND', message: 'Verification record not found for tenant' };
      }

      verification.status = newStatus;
      verification.reviewedAt = new Date();
      if (rejectionReason) verification.rejectionReason = rejectionReason;
      memoryVerifications.set(tenantId, verification);

      await NotificationService.createNotification({
        recipientId: tenantId,
        title: newStatus === 'VERIFIED' ? 'Identity Verification Approved' : 'Identity Verification Rejected',
        message: newStatus === 'VERIFIED' 
          ? 'Your identity verification has been successfully verified.' 
          : `Identity verification failed: ${rejectionReason || 'Please resubmit valid documentation.'}`,
        type: 'SYSTEM',
      });

      return verification;
    }
  }

  /**
   * Admin verification queue listing
   */
  static async getAdminVerificationQueue(adminId: string, role: string) {
    if (role !== 'ADMIN') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Admin access required' };
    }

    if (VerificationService.isMongoConnected()) {
      return RentalVerificationModel.find({ status: { $in: ['UNDER_REVIEW', 'PENDING'] } })
        .populate('tenantId', 'name email phone')
        .sort({ submittedAt: -1 })
        .lean();
    } else {
      return Array.from(memoryVerifications.values()).filter(v => ['UNDER_REVIEW', 'PENDING'].includes(v.status));
    }
  }
}
