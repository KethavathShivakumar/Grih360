import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RentalApplication {
  id: string;
  _id?: string;
  propertyId: any;
  tenantId: any;
  ownerId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFICATION_REQUIRED' | 'VERIFICATION_PENDING' | 'SHORTLISTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  moveInDate: string;
  proposedRent: number;
  message?: string;
  applicationData?: any;
  submittedAt?: string;
  verificationStatusAtSubmission: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  constructor(private apiService: ApiService) {}

  public submitApplication(appData: {
    propertyId: string;
    proposedRent: number;
    moveInDate: string;
    message?: string;
    employmentStatus?: string;
    monthlyIncome?: number;
    occupantsCount?: number;
    notes?: string;
  }): Observable<{ success: boolean; data: RentalApplication }> {
    return this.apiService.post<{ success: boolean; data: RentalApplication }>('/applications', appData);
  }

  public getApplications(): Observable<{ success: boolean; data: RentalApplication[] }> {
    return this.apiService.get<{ success: boolean; data: RentalApplication[] }>('/applications');
  }

  public getApplicationById(id: string): Observable<{ success: boolean; data: RentalApplication }> {
    return this.apiService.get<{ success: boolean; data: RentalApplication }>(`/applications/${id}`);
  }

  public updateApplicationStatus(id: string, status: string): Observable<{ success: boolean; data: RentalApplication }> {
    return this.apiService.patch<{ success: boolean; data: RentalApplication }>(`/applications/${id}/status`, { status });
  }
}
