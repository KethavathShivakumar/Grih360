import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/admin/dashboard" class="hover:text-[#0F2937]">Admin Console</a>
        <span>/</span>
        <span class="text-[#0F2937]">Home Services Monitoring</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Admin Home Services Control</h1>
          <p class="text-xs text-[#64748B]">Platform-wide audit of service requests, matching states, and professional assignments.</p>
        </div>
        <span class="px-3 py-1 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs font-bold rounded-full">
          ADMIN ACCESS ONLY
        </span>
      </div>

      

      <app-loading-state *ngIf="isLoading" message="Loading platform service requests..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadRequests()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage" class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-4">
        <h2 class="text-base font-bold text-[#0F2937]">Platform Service Requests ({{ requests.length }})</h2>

        <div *ngIf="requests.length === 0" class="text-xs text-[#64748B] text-center py-6">
          No service requests submitted on platform yet.
        </div>

        <div *ngIf="requests.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-[#0F2937]">
            <thead class="bg-[#FAF9F5] border-b border-[#E8E6DF] text-[#64748B] font-bold uppercase text-[10px]">
              <tr>
                <th class="p-3">Category</th>
                <th class="p-3">Requester</th>
                <th class="p-3">Location</th>
                <th class="p-3">Assigned Pro</th>
                <th class="p-3">Status</th>
                <th class="p-3">Scheduled Date</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E8E6DF]">
              <tr *ngFor="let req of requests" class="hover:bg-[#FAF9F5] transition">
                <td class="p-3 font-bold uppercase">{{ req.categoryCode }}</td>
                <td class="p-3">{{ req.requesterId?.name || 'Tenant' }} ({{ req.requesterId?.phone || 'N/A' }})</td>
                <td class="p-3">📍 {{ req.serviceLocation?.city || 'Hyderabad' }}</td>
                <td class="p-3 font-semibold">{{ req.professionalId?.name || 'Unassigned / Matching' }}</td>
                <td class="p-3"><app-status-badge [status]="req.status"></app-status-badge></td>
                <td class="p-3">{{ req.scheduledDate | date: 'shortDate' }}</td>
                <td class="p-3 text-right">
                  <a
                    [routerLink]="['/admin/services/requests', req._id || req.id]"
                    class="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-[10px] font-bold transition"
                  >
                    Inspect →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminServicesComponent implements OnInit {
  public requests: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  public loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.apiService.get<{ success: boolean; data: any[] }>('/admin/services/requests').subscribe({
      next: (res) => {
        this.requests = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch admin service requests';
        this.isLoading = false;
      },
    });
  }
}
