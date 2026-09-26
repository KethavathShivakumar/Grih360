import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RentalAgreement {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  status: 'DRAFT' | 'REVIEW' | 'CONFIRMED' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositPaid: number;
  rentStatus: 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE';
  agreementVersion: string;
}

@Injectable({
  providedIn: 'root',
})
export class RentalService {
  constructor(private apiService: ApiService) {}

  public getRentals(): Observable<{ success: boolean; data: RentalAgreement[] }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement[] }>('/rentals');
  }

  public getRentalById(id: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement }>(`/rentals/${id}`);
  }

  public getRentalByPropertyId(propertyId: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement }>(`/rentals/property/${propertyId}`);
  }

  public getTenantByPropertyId(propertyId: string): Observable<{ success: boolean; data: any }> {
    return this.apiService.get<{ success: boolean; data: any }>(`/rentals/property/${propertyId}/tenant`);
  }

  public getRentRecordsByPropertyId(propertyId: string): Observable<{ success: boolean; data: any[] }> {
    return this.apiService.get<{ success: boolean; data: any[] }>(`/rentals/property/${propertyId}/rent`);
  }

  public activateRental(rentalId: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.post<{ success: boolean; data: RentalAgreement }>(`/rentals/${rentalId}/activate`, {});
  }

  public getCurrentRental(): Observable<{ success: boolean; data: any }> {
    return this.apiService.get<{ success: boolean; data: any }>('/rentals');
  }

  public terminateRental(rentalId: string, reason?: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.post<{ success: boolean; data: RentalAgreement }>(`/rentals/${rentalId}/terminate`, { reason });
  }
}

