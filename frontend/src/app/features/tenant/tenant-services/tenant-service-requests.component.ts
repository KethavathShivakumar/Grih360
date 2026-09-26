import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceRequestService, ServiceRequestItem } from '../../../core/services/service-request.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-service-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/tenant/services" class="hover:text-[#0F2937]">Home Services</a>
        <span>/</span>
        <span class="text-[#0F2937]">My Requests</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">My Service Requests</h1>
          <p class="text-xs text-[#64748B]">Track real-time progress, assigned professionals, and completion history.</p>
        </div>
        <a routerLink="/tenant/services/request" class="px-4 py-2 bg-[#E26D46] hover:bg-[#d05c35] text-white text-xs font-bold rounded-xl transition">
          + New Request
        </a>
      </div>

      

      <!-- Status Filters -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          *ngFor="let tab of statusTabs"
          (click)="setFilter(tab.value)"
          [class]="activeFilter === tab.value ? 'px-4 py-2 bg-[#0F2937] text-white text-xs font-bold rounded-full shadow-sm' : 'px-4 py-2 bg-white border border-[#E8E6DF] text-[#0F2937] text-xs font-medium rounded-full hover:bg-[#FAF9F5]'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Content Area -->
      <app-loading-state *ngIf="isLoading" message="Loading your service requests..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadRequests()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage">
        <app-empty-state
          *ngIf="requests.length === 0"
          title="You don't have any service requests yet."
          description="Request a professional plumber, electrician, carpenter, or cleaning specialist for your home."
          actionText="+ Request Home Service"
          actionRoute="/tenant/services/request"
        ></app-empty-state>

        <div *ngIf="requests.length > 0" class="space-y-3">
          <div
            *ngFor="let req of requests"
            [routerLink]="['/tenant/services/requests', req._id || req.id]"
            class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] hover:shadow-md transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
          >
            <div class="space-y-2 max-w-xl">
              <div class="flex items-center space-x-3">
                <span class="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-md uppercase">
                  {{ req.categoryCode }}
                </span>
                <span class="text-xs text-[#64748B]">Scheduled: <strong>{{ req.scheduledDate | date: 'mediumDate' }}</strong></span>
              </div>
              <h3 class="text-sm font-bold text-[#0F2937] group-hover:text-[#2D7A5E] transition line-clamp-2">
                {{ req.description }}
              </h3>
              <div class="text-xs text-[#64748B] flex items-center space-x-2">
                <span>📍 {{ req.serviceLocation?.city || 'Hyderabad' }}</span>
                <span *ngIf="req.professionalId?.name">| 👤 Assigned: <strong>{{ req.professionalId.name }}</strong></span>
              </div>
            </div>

            <div class="flex items-center space-x-4 self-end md:self-center">
              <app-status-badge [status]="req.status"></app-status-badge>
              <span class="text-xs font-bold text-[#E26D46] group-hover:translate-x-1 transition">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantServiceRequestsComponent implements OnInit {
  public requests: ServiceRequestItem[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public activeFilter: string = 'ALL';

  public statusTabs = [
    { label: 'All Requests', value: 'ALL' },
    { label: 'Matching / Requested', value: 'REQUESTED' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  constructor(private serviceReqService: ServiceRequestService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  public loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const statusParam = this.activeFilter === 'ALL' ? undefined : this.activeFilter;

    this.serviceReqService.getUserRequests(statusParam).subscribe({
      next: (res) => {
        this.requests = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch service requests';
        this.isLoading = false;
      },
    });
  }

  public setFilter(filter: string): void {
    this.activeFilter = filter;
    this.loadRequests();
  }
}
