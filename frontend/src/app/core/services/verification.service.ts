import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface VerificationStep {
  stepId: string;
  name: string;
  category: 'IDENTITY' | 'INCOME' | 'RENTAL_HISTORY' | 'POLICE_VERIFICATION';
  status: 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'UNAVAILABLE';
  isExternalProvider?: boolean;
  providerNotice?: string;
  data?: any;
  completedAt?: string;
}

export interface VerificationDocumentItem {
  documentType: string;
  documentName?: string;
  maskedIdentifier?: string;
  storageKey?: string;
  uploadedAt: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  notes?: string;
}

export interface VerificationSubmittedInfo {
  fullName?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  employerName?: string;
  designation?: string;
  monthlyIncome?: number;
  previousLandlordContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  declarationAccepted?: boolean;
  notes?: string;
}

export interface RentalVerification {
  _id?: string;
  id?: string;
  applicationId?: any;
  propertyId?: any;
  ownerId?: any;
  tenantId: any;
  status: VerificationStatus;
  steps?: VerificationStep[];
  documents?: VerificationDocumentItem[];
  submittedInfo?: VerificationSubmittedInfo;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: any;
  rejectionReason?: string;
  notes?: string;
  adminNotes?: string;
  nextAction?: string;
  isRestrictedView?: boolean;
  privacyNotice?: string;

  // Legacy compatibility fields
  documentType?: string;
  maskedNumber?: string;
  isVerified?: boolean;
  message?: string;
}

export interface ApplicationVerificationResponse {
  verification: RentalVerification;
  application: any;
  property: any;
}

@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  constructor(private apiService: ApiService) {}

  /**
   * Fetch verification workflow data linked to an application
   */
  public getVerificationByApplicationId(
    applicationId: string
  ): Observable<{ success: boolean; data: ApplicationVerificationResponse }> {
    return this.apiService.get<{ success: boolean; data: ApplicationVerificationResponse }>(
      `/verifications/application/${applicationId}`
    );
  }

  /**
   * Tenant submits verification details and documents for an application
   */
  public submitVerificationForApplication(
    applicationId: string,
    payload: {
      documents?: Array<{ documentType: string; documentNumber?: string; notes?: string }>;
      submittedInfo?: VerificationSubmittedInfo;
      notes?: string;
    }
  ): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.post<{ success: boolean; data: RentalVerification }>(
      `/verifications/application/${applicationId}/submit`,
      payload
    );
  }

  /**
   * Owner requests verification for an application
   */
  public requestVerificationForApplication(
    applicationId: string
  ): Observable<{ success: boolean; data: any; message: string }> {
    return this.apiService.post<{ success: boolean; data: any; message: string }>(
      `/verifications/application/${applicationId}/request`,
      {}
    );
  }

  /**
   * Get single verification record by verification ID
   */
  public getVerificationById(
    verificationId: string
  ): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.get<{ success: boolean; data: RentalVerification }>(
      `/verifications/${verificationId}`
    );
  }

  /**
   * Admin verification queue listing with optional status filtering
   */
  public getAdminQueue(
    status?: string
  ): Observable<{ success: boolean; data: RentalVerification[] }> {
    const url = status && status !== 'ALL' ? `/verifications/admin/queue?status=${status}` : '/verifications/admin/queue';
    return this.apiService.get<{ success: boolean; data: RentalVerification[] }>(url);
  }

  /**
   * Admin reviews verification (VERIFIED or REJECTED)
   */
  public reviewVerification(
    idOrTenantId: string,
    status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW',
    rejectionReason?: string,
    adminNotes?: string
  ): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.patch<{ success: boolean; data: RentalVerification }>(
      `/verifications/${idOrTenantId}/review`,
      {
        status,
        rejectionReason,
        adminNotes,
      }
    );
  }

  /**
   * Legacy tenant verification retrieval
   */
  public getTenantVerification(
    tenantId?: string
  ): Observable<{ success: boolean; data: RentalVerification }> {
    const url = tenantId ? `/verifications/tenant/${tenantId}` : '/verifications/me';
    return this.apiService.get<{ success: boolean; data: RentalVerification }>(url);
  }

  /**
   * Legacy simple submission
   */
  public submitVerification(
    documentType: string,
    documentNumber?: string,
    notes?: string
  ): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.post<{ success: boolean; data: RentalVerification }>('/verifications', {
      documentType,
      documentNumber,
      notes,
    });
  }
}
