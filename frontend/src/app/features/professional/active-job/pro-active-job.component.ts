import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfessionalService } from '../../../core/services/professional.service';
import { ServiceRequestService, ServiceRequestItem } from '../../../core/services/service-request.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pro-active-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B] mb-1">
            <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
            <span>/</span>
            <span class="text-[#0F2937]">Active Job</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Active Service Execution</h1>
          <p class="text-xs text-slate-500">Monitor active on-site work, track job instructions, and submit verified completion.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/requests"
            class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl shadow-xs transition"
          >
            📋 All Assigned Jobs
          </a>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <!-- Success & Error Banners -->
      <div *ngIf="actionSuccess" class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>✓ {{ actionSuccess }}</span>
        <button (click)="actionSuccess = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>

      <div *ngIf="actionError" class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>⚠️ {{ actionError }}</span>
        <button (click)="actionError = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <app-loading-state *ngIf="isLoading" message="Fetching your active service jobs..."></app-loading-state>
      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadActiveJobs()"></app-error-state>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !errorMessage && activeJobs.length === 0">
        <app-empty-state
          title="No Active Job In Progress"
          message="You currently do not have any job marked as 'In Progress' or 'Accepted'. Check your assigned requests to accept or start new work."
          actionText="View Assigned Requests →"
          actionRoute="/professional/requests"
        ></app-empty-state>
      </div>

      <!-- Active Job Cards -->
      <div *ngIf="!isLoading && !errorMessage && activeJobs.length > 0" class="space-y-6">
        <div
          *ngFor="let job of activeJobs; let idx = index"
          class="bg-white rounded-3xl border border-[#E8E6DF] shadow-xs overflow-hidden"
        >
          <!-- Active Job Banner -->
          <div class="px-6 py-4 bg-[#0F2937] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                {{ job.status === 'IN_PROGRESS' ? 'Job In Progress' : 'Job Accepted — Ready to Start' }}
              </span>
              <span class="text-xs text-slate-300">| Job #{{ job._id || job.id }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider">
                {{ job.categoryCode }}
              </span>
              <app-status-badge [status]="job.status"></app-status-badge>
            </div>
          </div>

          <div class="p-6 sm:p-8 space-y-6">
            <!-- Job Summary & Customer Details -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2 space-y-4">
                <div>
                  <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Issue Description</span>
                  <h2 class="text-lg font-black text-[#0F2937] mt-0.5">{{ job.description }}</h2>
                </div>

                <!-- Location & Contact -->
                <div class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl space-y-3">
                  <div class="flex items-start gap-3">
                    <span class="text-lg">📍</span>
                    <div>
                      <strong class="text-xs font-bold text-[#0F2937] block">Service Location:</strong>
                      <p class="text-xs text-slate-600 mt-0.5">
                        {{ job.serviceLocation?.address }}, {{ job.serviceLocation?.city }}, {{ job.serviceLocation?.state }} - {{ job.serviceLocation?.pincode }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                    <span class="text-lg">👤</span>
                    <div>
                      <strong class="text-xs font-bold text-[#0F2937] block">Client Contact:</strong>
                      <p class="text-xs text-slate-600">
                        {{ job.requesterId?.name || 'Tenant Resident' }}
                        <span *ngIf="job.requesterId?.phone">({{ job.requesterId.phone }})</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                    <span class="text-lg">⏰</span>
                    <div>
                      <strong class="text-xs font-bold text-[#0F2937] block">Scheduled Window:</strong>
                      <p class="text-xs text-slate-600">
                        {{ job.scheduledDate | date: 'fullDate' }} &bull; {{ job.preferredTimeWindow || 'Flexible' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Panel -->
              <div class="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E6DF] flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                  <h3 class="text-xs font-black uppercase tracking-wider text-[#0F2937]">Current Phase</h3>
                  <div class="p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                    <span *ngIf="job.status === 'ACCEPTED'">
                      ⏳ Job has been accepted. Once on-site, click <strong>"Start Job"</strong> to mark work in progress.
                    </span>
                    <span *ngIf="job.status === 'IN_PROGRESS'">
                      🔧 You are actively servicing this request. Fill out the completion details below when done.
                    </span>
                  </div>
                </div>

                <!-- Stage 1: If ACCEPTED, allow START JOB -->
                <div *ngIf="job.status === 'ACCEPTED'">
                  <button
                    (click)="startJob(job._id || job.id || '')"
                    [disabled]="isSubmitting"
                    type="button"
                    class="w-full py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {{ isSubmitting ? 'Starting Job...' : '▶ Start Job (Mark In Progress)' }}
                  </button>
                </div>

                <!-- Stage 2: If IN_PROGRESS, allow trigger COMPLETE FORM -->
                <div *ngIf="job.status === 'IN_PROGRESS'">
                  <button
                    (click)="selectedJobForCompletion = (job._id || job.id || null)"
                    type="button"
                    class="w-full py-3 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    ✓ Complete Job Form →
                  </button>
                </div>
              </div>
            </div>

            <!-- Complete Job Modal / Inline Form -->
            <div
              *ngIf="selectedJobForCompletion === (job._id || job.id)"
              class="p-6 bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">📝</span>
                  <h3 class="text-sm font-black text-emerald-950">Record Service Completion & Notes</h3>
                </div>
                <button
                  (click)="selectedJobForCompletion = null"
                  type="button"
                  class="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="sm:col-span-2 space-y-1">
                  <label class="block text-xs font-bold text-emerald-950">Completion Notes *</label>
                  <textarea
                    [(ngModel)]="completionNotes"
                    rows="3"
                    placeholder="Describe what was repaired, parts replaced, and warranty info (e.g. Replaced leaking PPR elbow joint, checked flow, and resealed bathroom trap)..."
                    class="w-full p-3 bg-white border border-emerald-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-700"
                  ></textarea>
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-bold text-emerald-950">Completed Cost / Amount (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="actualCost"
                    placeholder="e.g. 450"
                    class="w-full p-3 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-700"
                  />
                  <span class="text-[10px] text-slate-500 block">Actual cost charged for labor & materials</span>
                </div>
              </div>

              <div class="flex items-center justify-end space-x-3 pt-2">
                <button
                  (click)="selectedJobForCompletion = null"
                  type="button"
                  class="px-4 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  (click)="submitCompletion(job._id || job.id || '')"
                  [disabled]="isSubmitting"
                  type="button"
                  class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Recording Completion...' : '✔ Finalize & Mark Completed' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProActiveJobComponent implements OnInit {
  public activeJobs: ServiceRequestItem[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public actionSuccess: string = '';
  public actionError: string = '';
  public isSubmitting: boolean = false;

  public selectedJobForCompletion: string | null = null;
  public completionNotes: string = '';
  public actualCost: number | null = null;

  constructor(
    private proService: ProfessionalService,
    private serviceReqService: ServiceRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveJobs();
  }

  public loadActiveJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Fetch both IN_PROGRESS and ACCEPTED jobs
    this.proService.getAssignedRequests().subscribe({
      next: (res) => {
        const all = res.data || [];
        this.activeJobs = all.filter(
          (j: any) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED'
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch active jobs';
        this.isLoading = false;
      },
    });
  }

  public startJob(jobId: string): void {
    this.actionError = '';
    this.isSubmitting = true;

    this.serviceReqService.updateRequestStatus(jobId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.isSubmitting = false;
        this.actionSuccess = 'Job started! Status updated to IN_PROGRESS.';
        this.loadActiveJobs();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.actionError = err.error?.message || 'Failed to start job';
      },
    });
  }

  public submitCompletion(jobId: string): void {
    if (!this.completionNotes || this.completionNotes.trim() === '') {
      this.actionError = 'Please enter completion notes before marking as completed.';
      return;
    }

    this.actionError = '';
    this.isSubmitting = true;

    this.serviceReqService
      .updateRequestStatus(
        jobId,
        'COMPLETED',
        this.completionNotes,
        this.actualCost ? Number(this.actualCost) : undefined
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.actionSuccess = 'Job successfully marked as COMPLETED! Verified and recorded.';
          this.selectedJobForCompletion = null;
          this.completionNotes = '';
          this.actualCost = null;
          this.loadActiveJobs();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.actionError = err.error?.message || 'Failed to complete job';
        },
      });
  }
}
