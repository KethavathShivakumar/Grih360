import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VerificationService, RentalVerification } from '../../../core/services/verification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">Identity Verification Queue</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Central compliance portal for tenant identity verification and Model Tenancy Act screening
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <button
            (click)="loadQueue()"
            [disabled]="loading"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5"
          >
            <span *ngIf="loading" class="animate-spin text-sm">⟳</span>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total In Queue</span>
          <span class="text-2xl font-black text-slate-900 block">{{ queue.length }}</span>
        </div>
        <div class="bg-amber-50 p-4 rounded-3xl border border-amber-200 shadow-xs space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Pending Review</span>
          <span class="text-2xl font-black text-amber-900 block">{{ getCountByStatus('PENDING') }}</span>
        </div>
        <div class="bg-indigo-50 p-4 rounded-3xl border border-indigo-200 shadow-xs space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">Under Review</span>
          <span class="text-2xl font-black text-indigo-900 block">{{ getCountByStatus('UNDER_REVIEW') }}</span>
        </div>
        <div class="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Verified</span>
          <span class="text-2xl font-black text-emerald-900 block">{{ getCountByStatus('VERIFIED') }}</span>
        </div>
      </div>

      <!-- Controls & Filter Tabs -->
      <div class="bg-white rounded-3xl p-4 border border-[#E8E6DF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Status Filter Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
          <button
            *ngFor="let tab of statusTabs"
            (click)="setFilter(tab.key)"
            [class]="activeFilter === tab.key ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition"
          >
            {{ tab.label }}
            <span
              *ngIf="tab.count > 0"
              class="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
              [ngClass]="activeFilter === tab.key ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-72">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search applicant name, email, property..."
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          <span *ngIf="searchQuery" (click)="searchQuery = ''" class="absolute right-3 top-2.5 text-xs text-slate-400 cursor-pointer">✕</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
        <div class="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p class="text-sm font-semibold text-slate-600">Loading administrative verification queue...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredQueue.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
        <span class="text-4xl block">📭</span>
        <h3 class="text-base font-bold text-slate-800">No Verifications in this Category</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          {{ searchQuery ? 'No records match your search criteria.' : 'There are currently no verification records matching this filter.' }}
        </p>
      </div>

      <!-- Queue Records Grid / Table -->
      <div *ngIf="!loading && filteredQueue.length > 0" class="space-y-3">
        <div
          *ngFor="let item of filteredQueue"
          class="bg-white rounded-3xl p-5 border border-[#E8E6DF] hover:border-indigo-300 transition shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <!-- Left: Tenant & Application Context -->
          <div class="flex items-start space-x-4 min-w-0">
            <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-base">
              {{ (getTenantName(item) || 'T')[0] }}
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-extrabold text-slate-900 truncate">{{ getTenantName(item) }}</h3>
                <app-status-badge [status]="item.status"></app-status-badge>
              </div>
              <p class="text-xs text-slate-500 truncate">
                {{ getTenantContact(item) }}
              </p>
              <div class="flex items-center space-x-3 text-[11px] text-slate-400">
                <span>Target: <strong class="text-slate-700">{{ getPropertyTitle(item) }}</strong></span>
                <span>•</span>
                <span>Submitted: {{ getItemDate(item) | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <!-- Middle: Step Breakdown & Next Action -->
          <div class="border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 space-y-1.5 text-xs">
            <div class="flex items-center space-x-2">
              <span class="text-slate-400 font-semibold text-[11px]">Next Action:</span>
              <span class="font-bold text-slate-800 text-[11px]">{{ item.nextAction || 'Pending Officer Review' }}</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span
                *ngFor="let step of (item.steps || [])"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                [ngClass]="{
                  'bg-emerald-100 text-emerald-800': step.status === 'VERIFIED',
                  'bg-amber-100 text-amber-800': step.status === 'PENDING' || step.status === 'UNDER_REVIEW',
                  'bg-rose-100 text-rose-800': step.status === 'REJECTED',
                  'bg-slate-100 text-slate-600': step.status === 'NOT_STARTED'
                }"
              >
                {{ step.category }}: {{ step.status }}
              </span>
            </div>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center space-x-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
            <button
              (click)="openDetails(item)"
              class="px-4 py-2.5 bg-[#0F2937] hover:bg-[#1E3E52] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
            >
              <span>Review Dossier</span>
              <span>→</span>
            </button>
            <button
              *ngIf="item.status !== 'VERIFIED'"
              (click)="quickApprove(item)"
              title="Quick Approve"
              class="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition font-bold text-xs"
            >
              ✓
            </button>
            <button
              *ngIf="item.status !== 'REJECTED'"
              (click)="quickReject(item)"
              title="Quick Reject"
              class="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class AdminVerificationsComponent implements OnInit {
  public queue: RentalVerification[] = [];
  public loading: boolean = true;
  public activeFilter: string = 'ALL';
  public searchQuery: string = '';

  constructor(
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.verificationService.getAdminQueue().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.queue = res.data || [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  get statusTabs() {
    return [
      { key: 'ALL', label: 'All Records', count: this.queue.length },
      { key: 'PENDING', label: 'Pending Review', count: this.getCountByStatus('PENDING') },
      { key: 'UNDER_REVIEW', label: 'Under Review', count: this.getCountByStatus('UNDER_REVIEW') },
      { key: 'VERIFIED', label: 'Verified', count: this.getCountByStatus('VERIFIED') },
      { key: 'REJECTED', label: 'Rejected', count: this.getCountByStatus('REJECTED') },
    ];
  }

  getCountByStatus(st: string): number {
    return this.queue.filter((item) => item.status === st).length;
  }

  setFilter(filterKey: string): void {
    this.activeFilter = filterKey;
  }

  get filteredQueue(): RentalVerification[] {
    let result = this.queue;
    if (this.activeFilter !== 'ALL') {
      result = result.filter((item) => item.status === this.activeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((item) => {
        const name = this.getTenantName(item).toLowerCase();
        const contact = this.getTenantContact(item).toLowerCase();
        const title = this.getPropertyTitle(item).toLowerCase();
        return name.includes(q) || contact.includes(q) || title.includes(q);
      });
    }
    return result;
  }

  getItemDate(item: RentalVerification): string | undefined {
    return item.submittedAt || (item as any).createdAt;
  }

  getTenantName(item: RentalVerification): string {
    const t = item.tenantId;
    if (t && typeof t === 'object') {
      return t.name || 'Tenant Applicant';
    }
    return item.submittedInfo?.fullName || 'Tenant Applicant';
  }

  getTenantContact(item: RentalVerification): string {
    const t = item.tenantId;
    if (t && typeof t === 'object') {
      return `${t.email || ''} ${t.phone ? '• ' + t.phone : ''}`;
    }
    return item.submittedInfo?.phone || item.submittedInfo?.email || 'Contact on file';
  }

  getPropertyTitle(item: RentalVerification): string {
    const p = item.propertyId;
    if (p && typeof p === 'object') {
      return p.title || 'Rental Property';
    }
    return 'Rental Property';
  }

  openDetails(item: RentalVerification): void {
    const id = item._id || item.id;
    this.router.navigate(['/admin/verifications', id]);
  }

  quickApprove(item: RentalVerification): void {
    const id = item._id || item.id || (typeof item.tenantId === 'object' ? item.tenantId._id : item.tenantId);
    if (!confirm(`Are you sure you want to approve verification for ${this.getTenantName(item)}?`)) return;

    this.verificationService.reviewVerification(id, 'VERIFIED').subscribe({
      next: (res) => {
        if (res.success) {
          alert('Verification marked as VERIFIED');
          this.loadQueue();
        }
      },
      error: (err) => alert(err.error?.message || 'Approval failed'),
    });
  }

  quickReject(item: RentalVerification): void {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    const id = item._id || item.id || (typeof item.tenantId === 'object' ? item.tenantId._id : item.tenantId);
    this.verificationService.reviewVerification(id, 'REJECTED', reason.trim()).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Verification marked as REJECTED');
          this.loadQueue();
        }
      },
      error: (err) => alert(err.error?.message || 'Rejection failed'),
    });
  }
}
