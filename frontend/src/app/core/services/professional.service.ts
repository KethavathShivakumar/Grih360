import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ServiceCategoryCode } from './service-request.service';

export type VerificationStatus = 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED';

export interface ProfessionalProfile {
  _id?: string;
  id?: string;
  userId: any;
  businessName: string;
  categories: ServiceCategoryCode[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isActive?: boolean;
  verificationStatus: VerificationStatus;
  serviceAreas: string[];
  serviceRadiusKm?: number;
  profileImage?: string;
  bio?: string;
  phone?: string;
}

export interface ProDashboardData {
  profile: ProfessionalProfile;
  stats: {
    pendingAssignments: number;
    acceptedJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalJobs: number;
    rating: number;
    reviewCount: number;
    isAvailable: boolean;
    verificationStatus: VerificationStatus;
  };
  recentRequests: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ProfessionalService {
  constructor(private apiService: ApiService) {}

  public getMyProfile(): Observable<{ success: boolean; data: ProfessionalProfile }> {
    return this.apiService.get<{ success: boolean; data: ProfessionalProfile }>('/professionals/me');
  }

  public updateMyProfile(data: {
    businessName?: string;
    categories?: ServiceCategoryCode[];
    experienceYears?: number;
    serviceAreas?: string[];
    serviceRadiusKm?: number;
    bio?: string;
    profileImage?: string;
    phone?: string;
  }): Observable<{ success: boolean; data: ProfessionalProfile }> {
    return this.apiService.patch<{ success: boolean; data: ProfessionalProfile }>('/professionals/me', data);
  }

  public toggleAvailability(isAvailable: boolean): Observable<{ success: boolean; data: ProfessionalProfile }> {
    return this.apiService.patch<{ success: boolean; data: ProfessionalProfile }>('/professionals/me/availability', {
      isAvailable,
    });
  }

  public getDashboard(): Observable<{ success: boolean; data: ProDashboardData }> {
    return this.apiService.get<{ success: boolean; data: ProDashboardData }>('/professionals/me/dashboard');
  }

  public getAssignedRequests(status?: string): Observable<{ success: boolean; data: any[] }> {
    const url = status ? `/professionals/me/requests?status=${status}` : '/professionals/me/requests';
    return this.apiService.get<{ success: boolean; data: any[] }>(url);
  }

  public getMyReviews(): Observable<{ success: boolean; data: any[] }> {
    return this.apiService.get<{ success: boolean; data: any[] }>('/professionals/me/reviews');
  }

  public getReviews(proUserId: string): Observable<{ success: boolean; data: any[] }> {
    return this.apiService.get<{ success: boolean; data: any[] }>(`/professionals/${proUserId}/reviews`);
  }

  public adminGetAllProfessionals(): Observable<{ success: boolean; data: ProfessionalProfile[] }> {
    return this.apiService.get<{ success: boolean; data: ProfessionalProfile[] }>('/admin/professionals');
  }

  public adminVerifyProfessional(
    profileId: string,
    verificationStatus: VerificationStatus
  ): Observable<{ success: boolean; data: ProfessionalProfile }> {
    return this.apiService.patch<{ success: boolean; data: ProfessionalProfile }>(
      `/admin/professionals/${profileId}/verify`,
      { verificationStatus }
    );
  }

  public adminToggleStatus(
    profileId: string,
    isActive: boolean
  ): Observable<{ success: boolean; data: ProfessionalProfile }> {
    return this.apiService.patch<{ success: boolean; data: ProfessionalProfile }>(
      `/admin/professionals/${profileId}/status`,
      { isActive }
    );
  }
}
