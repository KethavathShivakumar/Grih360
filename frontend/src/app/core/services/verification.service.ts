import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RentalVerification {
  _id?: string;
  id?: string;
  tenantId: string;
  status: 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  submittedAt?: string;
  reviewedAt?: string;
  documentType?: string;
  maskedNumber?: string;
  rejectionReason?: string;
  notes?: string;
  isVerified?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  constructor(private apiService: ApiService) {}

  public getTenantVerification(tenantId?: string): Observable<{ success: boolean; data: RentalVerification }> {
    const url = tenantId ? `/verifications/tenant/${tenantId}` : '/verifications/me';
    return this.apiService.get<{ success: boolean; data: RentalVerification }>(url);
  }

  public submitVerification(documentType: string, documentNumber?: string, notes?: string): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.post<{ success: boolean; data: RentalVerification }>('/verifications', {
      documentType,
      documentNumber,
      notes,
    });
  }

  public getAdminQueue(): Observable<{ success: boolean; data: RentalVerification[] }> {
    return this.apiService.get<{ success: boolean; data: RentalVerification[] }>('/verifications/admin/queue');
  }

  public reviewVerification(
    tenantId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Observable<{ success: boolean; data: RentalVerification }> {
    return this.apiService.patch<{ success: boolean; data: RentalVerification }>(`/verifications/admin/${tenantId}/review`, {
      status,
      rejectionReason,
    });
  }
}
