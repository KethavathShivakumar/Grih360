import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HealthCheckStatus } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  constructor(private apiService: ApiService) {}

  checkHealth(): Observable<HealthCheckStatus> {
    return this.apiService.get<HealthCheckStatus>('/health');
  }
}
