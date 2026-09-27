import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface OwnerDashboardMetrics {
  totalProperties: number;
  availableProperties: number;
  occupiedProperties: number;
  totalApplications: number;
  newApplications?: number;
  pendingApplications: number;
  activeRentals: number;
  upcomingRent: number;
  overdueRent: number;
}

@Injectable({
  providedIn: 'root',
})
export class OwnerService {
  constructor(private apiService: ApiService) {}

  public getDashboardMetrics(): Observable<{ success: boolean; data: OwnerDashboardMetrics }> {
    return this.apiService.get<{ success: boolean; data: OwnerDashboardMetrics }>('/owner/dashboard');
  }
}
