import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type ServiceCategoryCode =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'PAINTING'
  | 'CLEANING'
  | 'AC_APPLIANCE'
  | 'WATER_FILTER'
  | 'GENERAL_MAINTENANCE';

export type ServiceRequestStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceCategory {
  _id?: string;
  id?: string;
  code: ServiceCategoryCode;
  name: string;
  description: string;
  icon?: string;
  isActive?: boolean;
}

export interface ServiceLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceRequestItem {
  _id?: string;
  id?: string;
  requesterId: any;
  propertyId?: any;
  rentalId?: string;
  categoryId: string;
  categoryCode: ServiceCategoryCode;
  professionalId?: any;
  status: ServiceRequestStatus;
  description: string;
  scheduledDate: string;
  preferredTimeWindow?: string;
  serviceLocation: ServiceLocation;
  images?: string[];
  estimatedCost?: number;
  customerCareContact: string; // Hotline: 6300063704
  cancellation?: {
    cancelledBy: string;
    cancelledAt: string;
    reason: string;
  };
  completion?: {
    completedAt: string;
    notes?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceRequestService {
  constructor(private apiService: ApiService) {}

  public getCategories(): Observable<{ success: boolean; data: ServiceCategory[] }> {
    return this.apiService.get<{ success: boolean; data: ServiceCategory[] }>('/services/categories');
  }

  public createRequest(requestData: {
    categoryCode: ServiceCategoryCode;
    description: string;
    scheduledDate: string;
    preferredTimeWindow?: string;
    propertyId?: string;
    rentalId?: string;
    serviceLocation?: Partial<ServiceLocation>;
    images?: string[];
  }): Observable<{ success: boolean; data: ServiceRequestItem }> {
    return this.apiService.post<{ success: boolean; data: ServiceRequestItem }>('/services/requests', requestData);
  }

  public getUserRequests(status?: string): Observable<{ success: boolean; data: ServiceRequestItem[] }> {
    const url = status ? `/services/requests?status=${status}` : '/services/requests';
    return this.apiService.get<{ success: boolean; data: ServiceRequestItem[] }>(url);
  }

  public getRequestById(id: string): Observable<{ success: boolean; data: { request: ServiceRequestItem; professionalProfile?: any } }> {
    return this.apiService.get<{ success: boolean; data: { request: ServiceRequestItem; professionalProfile?: any } }>(`/services/requests/${id}`);
  }

  public updateRequestStatus(
    id: string,
    status: ServiceRequestStatus,
    notes?: string
  ): Observable<{ success: boolean; data: ServiceRequestItem }> {
    return this.apiService.patch<{ success: boolean; data: ServiceRequestItem }>(`/services/requests/${id}/status`, {
      status,
      notes,
    });
  }

  public cancelRequest(id: string, reason: string): Observable<{ success: boolean; data: ServiceRequestItem }> {
    return this.apiService.post<{ success: boolean; data: ServiceRequestItem }>(`/services/requests/${id}/cancel`, {
      reason,
    });
  }

  public uploadImages(id: string, images: string[]): Observable<{ success: boolean; data: ServiceRequestItem }> {
    return this.apiService.post<{ success: boolean; data: ServiceRequestItem }>(`/services/requests/${id}/images`, {
      images,
    });
  }

  public submitReview(id: string, rating: number, comment: string): Observable<{ success: boolean; data: any }> {
    return this.apiService.post<{ success: boolean; data: any }>(`/services/requests/${id}/review`, {
      rating,
      comment,
    });
  }
}
