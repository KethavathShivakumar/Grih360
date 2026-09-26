import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RentalAgreement {
  _id?: string;
  id?: string;
  rentalId: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  agreementVersion: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
  confirmedAt?: string;
  termsSummary?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgreementService {
  constructor(private apiService: ApiService) {}

  public getAgreementByRentalId(rentalId: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.get<{ success: boolean; data: RentalAgreement }>(`/agreements/rental/${rentalId}`);
  }

  public confirmAgreement(rentalId: string): Observable<{ success: boolean; data: RentalAgreement }> {
    return this.apiService.patch<{ success: boolean; data: RentalAgreement }>(`/agreements/rental/${rentalId}/confirm`, {});
  }
}
