import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestItem } from '../../../core/services/service-request.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pro-request-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] p-6 space-y-6">
      <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B]">
        <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
        <span>/</span>
        <a routerLink="/professional/requests" class="hover:text-[#0F2937]">Assigned Jobs</a>
        <span>/</span>
        <span class="text-[#0F2937]">Job Execution</span>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading job details..."></app-loading-state>

      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadDetails()"></app-error-state>

      <div *ngIf="!isLoading && !errorMessage && request" class="space-y-6 max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-md uppercase">
                {{ request.categoryCode }}
              </span>
              <app-status-badge [status]="request.status"></app-status-badge>
            </div>
            <h1 class="text-xl font-black text-[#0F2937] mt-2">{{ request.description }}</h1>
            <p class="text-xs text-[#64748B]">Scheduled Date: <strong>{{ request.scheduledDate | date: 'fullDate' }}</strong> ({{ request.preferredTimeWindow || 'Flexible' }})</p>
          </div>
          <app-customer-care></app-customer-care>
        </div>

        

        <!-- Main Job Execution Container -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2 bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-5">
            <h2 class="text-base font-bold text-[#0F2937]">Job Information & Address</h2>

            <div class="space-y-3 text-xs text-[#0F2937]">
              <div>
                <strong class="text-[#64748B] block">Category:</strong>
                <span>{{ request.categoryCode }}</span>
              </div>
              <div>
                <strong class="text-[#64748B] block">Issue Description:</strong>
                <p class="mt-1 p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] text-xs leading-relaxed">{{ request.description }}</p>
              </div>
              <div>
                <strong class="text-[#64748B] block">Service Location:</strong>
                <p class="mt-1 p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] text-xs font-semibold">
                  📍 {{ request.serviceLocation?.address }}, {{ request.serviceLocation?.city }}, {{ request.serviceLocation?.state }} - {{ request.serviceLocation?.pincode }}
                </p>
              </div>
              <div>
                <strong class="text-[#64748B] block">Scheduled Window:</strong>
                <span>{{ request.scheduledDate | date: 'fullDate' }} ({{ request.preferredTimeWindow }})</span>
              </div>

              <div *ngIf="request.completion" class="p-4 bg-[#EBF5F0] border border-[#D1EADF] rounded-xl text-[#2D7A5E] space-y-1">
                <strong>✓ Job Completed</strong>
                <p>Notes: {{ request.completion.notes || 'Completed successfully' }}</p>
                <span class="text-[11px] opacity-80 block">Completed at {{ request.completion.completedAt | date: 'short' }}</span>
              </div>
            </div>

            <!-- Controlled State Machine Job Controls -->
            <div class="pt-4 border-t border-[#E8E6DF] space-y-3">
              <h3 class="text-xs font-bold text-[#0F2937] uppercase tracking-wider">Job Actions</h3>

              <div *ngIf="statusError" class="p-3 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs font-bold rounded-xl">
                {{ statusError }}
              </div>

              <!-- ASSIGNED state: ACCEPT or REJECT -->
              <div *ngIf="request.status === 'ASSIGNED'" class="flex items-center space-x-3">
                <button
                  (click)="updateStatus('ACCEPTED')"
                  [disabled]="isSubmitting"
                  class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  ✓ Accept Job Assignment
                </button>
                <button
                  (click)="updateStatus('REJECTED')"
                  [disabled]="isSubmitting"
                  class="px-6 py-2.5 bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2] text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  ✕ Reject Job
                </button>
              </div>

              <!-- ACCEPTED state: START JOB -->
              <div *ngIf="request.status === 'ACCEPTED'">
                <button
                  (click)="updateStatus('IN_PROGRESS')"
                  [disabled]="isSubmitting"
                  class="px-6 py-2.5 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  ▶ Start Job (Mark In Progress)
                </button>
              </div>

              <!-- IN_PROGRESS state: COMPLETE JOB -->
              <div *ngIf="request.status === 'IN_PROGRESS'" class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl space-y-3">
                <h4 class="text-xs font-bold text-[#0F2937]">Mark Job Completed</h4>
                <textarea
                  [(ngModel)]="completionNotes"
                  rows="3"
                  placeholder="Enter completion details (e.g. Replaced leaking valve gasket, tested water flow, sealed pipe joint)..."
                  class="w-full p-3 border border-[#E8E6DF] rounded-xl text-xs text-[#0F2937] focus:outline-none focus:border-[#0F2937]"
                ></textarea>
                <button
                  (click)="completeJob()"
                  [disabled]="isSubmitting"
                  class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  ✔ Complete Job
                </button>
              </div>

              <div *ngIf="request.status === 'COMPLETED'" class="text-xs text-[#2D7A5E] font-bold">
                ✓ This job has been marked as COMPLETED. No further status changes allowed.
              </div>

              <div *ngIf="request.status === 'CANCELLED'" class="text-xs text-[#B91C1C] font-bold">
                ✕ This service request was cancelled.
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-4">
            <div class="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-3">
              <h2 class="text-base font-bold text-[#0F2937]">Customer Support Hotline</h2>
              <p class="text-xs text-[#64748B]">For location issues, scheduling changes, or technical assistance contact customer support.</p>
              <app-customer-care></app-customer-care>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProRequestDetailsComponent implements OnInit {
  public requestId: string = '';
  public request?: ServiceRequestItem;
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public statusError: string = '';
  public completionNotes: string = '';
  public isSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceReqService: ServiceRequestService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.requestId = params['id'];
      if (this.requestId) {
        this.loadDetails();
      }
    });
  }

  public loadDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.serviceReqService.getRequestById(this.requestId).subscribe({
      next: (res) => {
        this.request = res.data?.request;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load job details';
        this.isLoading = false;
      },
    });
  }

  public updateStatus(targetStatus: any): void {
    this.statusError = '';
    this.isSubmitting = true;

    this.serviceReqService.updateRequestStatus(this.requestId, targetStatus).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loadDetails();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.statusError = err.error?.message || 'Failed to update job status';
      },
    });
  }

  public completeJob(): void {
    this.statusError = '';
    this.isSubmitting = true;

    this.serviceReqService.updateRequestStatus(this.requestId, 'COMPLETED', this.completionNotes).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loadDetails();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.statusError = err.error?.message || 'Failed to complete job';
      },
    });
  }
}
