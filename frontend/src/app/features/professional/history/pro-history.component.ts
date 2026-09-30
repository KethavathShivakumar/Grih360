import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfessionalService } from '../../../core/services/professional.service';
import { ServiceRequestItem } from '../../../core/services/service-request.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pro-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
            <span class="text-[#0F2937]">Job History</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Service Job History</h1>
          <p class="text-xs text-slate-500">Review your past completed jobs, tenant feedback, and historical records.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/active-job"
            class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#206f54] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            ⚡ Active Work
          </a>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="bg-white p-4 rounded-2xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <button
            *ngFor="let tab of filterTabs"
            (click)="setFilter(tab.value)"
            [class]="activeFilter === tab.value ? 'px-4 py-1.5 bg-[#0F2937] text-white text-xs font-bold rounded-full' : 'px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full hover:bg-slate-200'"
            class="cursor-pointer transition"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="w-full sm:w-64">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search description or city..."
            class="w-full px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0F2937]"
          />
        </div>
      </div>

      <app-loading-state *ngIf="isLoading" message="Fetching job history records..."></app-loading-state>
      <app-error-state *ngIf="errorMessage && !isLoading" [message]="errorMessage" (retry)="loadHistory()"></app-error-state>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !errorMessage && filteredJobs.length === 0">
        <app-empty-state
          title="No Past Job History Found"
          message="Once you complete assigned service requests, your completed work records, completion notes, and client reviews will appear here."
          actionText="View Assigned Jobs →"
          actionRoute="/professional/requests"
        ></app-empty-state>
      </div>

      <!-- Job History Cards -->
      <div *ngIf="!isLoading && !errorMessage && filteredJobs.length > 0" class="space-y-4">
        <div
          *ngFor="let job of filteredJobs"
          class="bg-white p-6 rounded-3xl border border-[#E8E6DF] hover:border-[#0F2937] shadow-xs transition space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E6DF] text-[#0F2937] text-xs font-bold rounded-md uppercase">
                {{ job.categoryCode }}
              </span>
              <app-status-badge [status]="job.status"></app-status-badge>
              <span class="text-xs text-slate-400">Scheduled: {{ job.scheduledDate | date: 'mediumDate' }}</span>
            </div>

            <div class="flex items-center space-x-2">
              <span *ngIf="job.estimatedCost" class="text-sm font-black text-[#2D7A5E]">
                ₹{{ job.estimatedCost }}
              </span>
              <a
                [routerLink]="['/professional/requests', job._id || job.id]"
                class="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
              >
                View Details &rarr;
              </a>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-bold text-[#0F2937]">{{ job.description }}</h3>
            <p class="text-xs text-slate-500">
              📍 {{ job.serviceLocation?.address }}, {{ job.serviceLocation?.city }} &bull; Client: {{ job.requesterId?.name || 'Resident' }}
            </p>
          </div>

          <!-- Completion Notes Banner -->
          <div *ngIf="job.completion" class="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-extrabold flex items-center gap-1.5">
                <span>✓</span> Completed on {{ job.completion.completedAt | date: 'mediumDate' }}
              </span>
            </div>
            <p class="text-xs text-emerald-800 mt-1 font-medium">Notes: {{ job.completion.notes || 'Job concluded successfully.' }}</p>
          </div>

          <!-- Cancellation Notice -->
          <div *ngIf="job.cancellation" class="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-2xl space-y-1">
            <span class="font-bold">Cancelled on {{ job.cancellation.cancelledAt | date: 'mediumDate' }}</span>
            <p class="text-xs mt-0.5">Reason: {{ job.cancellation.reason || 'N/A' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProHistoryComponent implements OnInit {
  public allJobs: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public activeFilter: string = 'ALL';
  public searchQuery: string = '';

  public filterTabs = [
    { label: 'All Past', value: 'ALL' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  public loadHistory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.proService.getAssignedRequests().subscribe({
      next: (res) => {
        const list = res.data || [];
        // Only completed or cancelled jobs are part of history
        this.allJobs = list.filter(
          (j: any) => j.status === 'COMPLETED' || j.status === 'CANCELLED'
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch job history';
        this.isLoading = false;
      },
    });
  }

  public setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  public get filteredJobs(): any[] {
    let result = this.allJobs;
    if (this.activeFilter !== 'ALL') {
      result = result.filter((j) => j.status === this.activeFilter);
    }
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.description?.toLowerCase().includes(q) ||
          j.serviceLocation?.city?.toLowerCase().includes(q) ||
          j.categoryCode?.toLowerCase().includes(q)
      );
    }
    return result;
  }
}
