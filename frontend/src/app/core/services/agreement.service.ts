import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface IAgreementConfirmation {
  confirmed: boolean;
  confirmedAt?: string;
  method?: string;
  ipAddress?: string;
  notes?: string;
}

export interface IAgreementMetadata {
  eSignNotice: string;
  eSignProvider?: string;
  isDigitallySigned: boolean;
  legalNotice: string;
  generatedAt?: string;
  version?: string;
  tenantConfirmation?: IAgreementConfirmation;
  ownerConfirmation?: IAgreementConfirmation;
}

export interface RentalAgreement {
  _id?: string;
  id?: string;
  rentalId: string;
  propertyId: any;
  tenantId: any;
  ownerId: any;
  rent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  agreementVersion: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  termsSummary?: string;
  tenantConfirmed?: boolean;
  ownerConfirmed?: boolean;
  agreementMetadata?: IAgreementMetadata;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgreementService {
  constructor(private apiService: ApiService) {}

  public getAgreements(): Observable<{ success: boolean; data: RentalAgreement[] }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement[] }>('/agreements');
  }

  public getAgreementById(id: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement }>(`/agreements/${id}`);
  }

  public getAgreementByRentalId(rentalId: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement }>(`/agreements/rental/${rentalId}`);
  }

  public tenantConfirmAgreement(idOrRentalId: string, details?: any): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.patch<{ success: boolean; data: RentalAgreement }>(`/agreements/${idOrRentalId}/tenant-confirm`, details || {});
  }

  public confirmAgreement(idOrRentalId: string, details?: any): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.patch<{ success: boolean; data: RentalAgreement }>(`/agreements/${idOrRentalId}/confirm`, details || {});
  }

  public cancelAgreement(idOrRentalId: string, reason?: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.patch<{ success: boolean; data: RentalAgreement }>(`/agreements/${idOrRentalId}/cancel`, { reason });
  }
}

