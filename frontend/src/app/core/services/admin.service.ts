import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private api: ApiService) {}

  getDashboardStats(): Observable<any> {
    return this.api.get('/admin/dashboard');
  }

  getSystemHealth(): Observable<any> {
    return this.api.get('/admin/system');
  }

  getUsers(params?: any): Observable<any> {
    return this.api.get('/admin/users', params);
  }

  getUserById(id: string): Observable<any> {
    return this.api.get(`/admin/users/${id}`);
  }

  updateUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.api.patch(`/admin/users/${id}/status`, { isActive });
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.api.patch(`/admin/users/${id}/role`, { role });
  }

  getProperties(params?: any): Observable<any> {
    return this.api.get('/admin/properties', params);
  }

  getPropertyById(id: string): Observable<any> {
    return this.api.get(`/admin/properties/${id}`);
  }

  updatePropertyStatus(id: string, status: string): Observable<any> {
    return this.api.patch(`/admin/properties/${id}/status`, { status });
  }

  getApplications(params?: any): Observable<any> {
    return this.api.get('/admin/applications', params);
  }

  getApplicationById(id: string): Observable<any> {
    return this.api.get(`/admin/applications/${id}`);
  }

  getRentals(params?: any): Observable<any> {
    return this.api.get('/admin/rentals', params);
  }

  getRentalById(id: string): Observable<any> {
    return this.api.get(`/admin/rentals/${id}`);
  }

  getVerifications(params?: any): Observable<any> {
    return this.api.get('/admin/verifications', params);
  }

  getVerificationById(id: string): Observable<any> {
    return this.api.get(`/admin/verifications/${id}`);
  }

  updateVerificationStatus(id: string, status: string, rejectionReason?: string): Observable<any> {
    return this.api.patch(`/admin/verifications/${id}/status`, { status, rejectionReason });
  }

  getProfessionals(params?: any): Observable<any> {
    return this.api.get('/admin/professionals', params);
  }

  getProfessionalById(id: string): Observable<any> {
    return this.api.get(`/admin/professionals/${id}`);
  }

  updateProfessionalStatus(id: string, isActive: boolean): Observable<any> {
    return this.api.patch(`/admin/professionals/${id}/status`, { isActive });
  }

  updateProfessionalVerification(id: string, verificationStatus: string): Observable<any> {
    return this.api.patch(`/admin/professionals/${id}/verify`, { verificationStatus });
  }

  getServiceRequests(params?: any): Observable<any> {
    return this.api.get('/admin/services/requests', params);
  }

  getServiceRequestById(id: string): Observable<any> {
    return this.api.get(`/admin/services/requests/${id}`);
  }

  reassignServiceRequest(id: string, professionalId: string): Observable<any> {
    return this.api.patch(`/admin/services/requests/${id}/assignment`, { professionalId });
  }

  getNotifications(): Observable<any> {
    return this.api.get('/admin/notifications');
  }

  broadcastNotification(title: string, message: string, targetRole: string = 'ALL'): Observable<any> {
    return this.api.post('/admin/notifications/broadcast', { title, message, targetRole });
  }

  getAuditLogs(params?: any): Observable<any> {
    return this.api.get('/admin/audit', params);
  }
}
