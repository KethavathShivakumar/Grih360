import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfessionalService } from '../../../core/services/professional.service';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pro-requests',
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
        <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
        <span>/</span>
        <span class="text-[#0F2937]">Service Jobs</span>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-[#0F2937]">Assigned Service Jobs</h1>
          <p class="text-xs text-[#64748B]">Review incoming job assignments, accept or start work, and record completions.</p>
        </div>
      </div>

      

      <!-- Filter Tabs -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          *ngFor="let tab of statusTabs"
          (click)="setFilter(tab.value)"
          [class]="activeFilter === tab.value ? 'px-4 py-2 bg-[#0F2937] text-white text-xs font-bold rounded-full shadow-sm' : 'px-4 py-2 bg-white border border-[#E8E6DF] text-[#0F2937] text-xs font-medium rounded-full hover:bg-[#FAF9F5]'"
        >
          {{ tab.label }}
        </button>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading assigned jobs..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadRequests()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage">
        <app-empty-state
          *ngIf="requests.length === 0"
          title="No assigned service jobs found."
          description="Newly assigned customer service requests matching your categories will appear here."
        ></app-empty-state>

        <div *ngIf="requests.length > 0" class="space-y-3">
          <div
            *ngFor="let req of requests"
            class="bg-white p-5 rounded-2xl border border-[#E8E6DF] hover:border-[#0F2937] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div
              [routerLink]="['/professional/requests', req._id || req.id]"
              class="space-y-2 max-w-xl cursor-pointer group flex-grow"
            >
              <div class="flex items-center space-x-3">
                <span class="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-md uppercase">
                  {{ req.categoryCode }}
                </span>
                <span class="text-xs text-[#64748B]">Scheduled: <strong>{{ req.scheduledDate | date: 'mediumDate' }}</strong></span>
              </div>
              <h3 class="text-sm font-bold text-[#0F2937] group-hover:text-[#2D7A5E] transition">
                {{ req.description }}
              </h3>
              <p class="text-xs text-[#64748B]">📍 Location: {{ req.serviceLocation?.address }}, {{ req.serviceLocation?.city }}</p>
            </div>

            <div class="flex items-center space-x-3 self-end md:self-center">
              <app-status-badge [status]="req.status"></app-status-badge>

              <div *ngIf="req.status === 'ASSIGNED'" class="flex items-center space-x-2">
                <button
                  (click)="acceptJob(req._id || req.id)"
                  [disabled]="isActionLoading"
                  class="px-3 py-1.5 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  (click)="rejectJob(req._id || req.id)"
                  [disabled]="isActionLoading"
                  class="px-3 py-1.5 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2] text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>

              <a
                [routerLink]="['/professional/requests', req._id || req.id]"
                class="px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E6DF] hover:bg-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-lg transition"
              >
                View &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProRequestsComponent implements OnInit {
  public requests: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public activeFilter: string = 'ALL';
  public isActionLoading: boolean = false;

  public statusTabs = [
    { label: 'All Jobs', value: 'ALL' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  constructor(
    private proService: ProfessionalService,
    private serviceReqService: ServiceRequestService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  public loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const statusParam = this.activeFilter === 'ALL' ? undefined : this.activeFilter;

    this.proService.getAssignedRequests(statusParam).subscribe({
      next: (res) => {
        this.requests = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch assigned requests';
        this.isLoading = false;
      },
    });
  }

  public setFilter(filter: string): void {
    this.activeFilter = filter;
    this.loadRequests();
  }

  public acceptJob(requestId: string): void {
    this.isActionLoading = true;
    this.serviceReqService.updateRequestStatus(requestId, 'ACCEPTED').subscribe({
      next: () => {
        this.isActionLoading = false;
        this.loadRequests();
      },
      error: (err) => {
        this.isActionLoading = false;
        alert(err.error?.message || 'Failed to accept job');
      },
    });
  }

  public rejectJob(requestId: string): void {
    this.isActionLoading = true;
    this.serviceReqService.updateRequestStatus(requestId, 'REJECTED').subscribe({
      next: () => {
        this.isActionLoading = false;
        this.loadRequests();
      },
      error: (err) => {
        this.isActionLoading = false;
        alert(err.error?.message || 'Failed to reject job');
      },
    });
  }
}
