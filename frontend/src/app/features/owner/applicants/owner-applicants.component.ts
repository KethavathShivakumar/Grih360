import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-applicants',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Tenant Applications</h1>
          <p class="text-xs text-slate-500">Screen prospective tenants, verify KYC credentials, and issue Model Tenancy Act leases.</p>
        </div>
        <button
          *ngIf="propertyId"
          (click)="goBackToProperties()"
          type="button"
          class="text-xs font-bold text-[#0F2937] hover:text-[#2D7A5E] cursor-pointer"
        >
          ← Back to Properties
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          *ngFor="let tab of filterTabs"
          (click)="selectedTab = tab.key"
          type="button"
          [class]="selectedTab === tab.key ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
          class="px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{{ tab.label }}</span>
          <span
            *ngIf="getTabCount(tab.key) > 0"
            [class]="selectedTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
          >
            {{ getTabCount(tab.key) }}
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading tenant applications from database..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load applications"
        [message]="errorMessage"
        (retry)="loadApplications()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && filteredApplications.length === 0"
        title="No applications match this filter"
        message="Applications submitted by prospective tenants for your listed properties will appear here."
      ></app-empty-state>

      <!-- Applications List -->
      <div *ngIf="!isLoading && !isError && filteredApplications.length > 0" class="space-y-4">
        <div
          *ngFor="let app of filteredApplications"
          (click)="viewApplicantDetails(app)"
          class="bg-white p-5 rounded-3xl border border-[#E8E6DF] hover:border-[#2D7A5E] hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
        >
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 rounded-2xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              {{ getApplicantInitial(app) }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <app-status-badge [status]="app.status"></app-status-badge>
                <span class="text-[11px] text-slate-400 font-semibold">Submitted {{ getAppDate(app) | date: 'mediumDate' }}</span>
              </div>
              <h3 class="text-base font-bold text-slate-900 mt-1 group-hover:text-[#2D7A5E] transition-colors">
                {{ getApplicantName(app) }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Property: <strong class="text-slate-700">{{ getPropertyTitle(app) }}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div>
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Proposed Rent</span>
              <span class="text-sm font-extrabold text-[#0F2937]">{{ formatRent(app.proposedRent) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 font-bold uppercase">Move-In Date</span>
              <span class="text-xs font-bold text-slate-700">{{ app.moveInDate | date: 'mediumDate' }}</span>
            </div>
            <button
              (click)="viewApplicantDetails(app); $event.stopPropagation()"
              type="button"
              class="px-3.5 py-2 bg-[#0F2937] group-hover:bg-[#2D7A5E] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Review Dossier →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerApplicantsComponent implements OnInit {
  propertyId: string = '';
  applications: RentalApplication[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  selectedTab: string = 'ALL';

  filterTabs = [
    { key: 'ALL', label: 'All Applications' },
    { key: 'SUBMITTED', label: 'New (Submitted)' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'VERIFICATION', label: 'Verification' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Declined' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.isError = false;

    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          if (this.propertyId) {
            this.applications = res.data.filter((a: any) => {
              const pId = a.propertyId?._id || a.propertyId?.id || a.propertyId;
              return pId === this.propertyId;
            });
          } else {
            this.applications = res.data;
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load applications.';
      },
    });
  }

  get filteredApplications(): RentalApplication[] {
    if (this.selectedTab === 'ALL') return this.applications;
    if (this.selectedTab === 'VERIFICATION') {
      return this.applications.filter((a) => a.status === 'VERIFICATION_REQUIRED' || a.status === 'VERIFICATION_PENDING');
    }
    return this.applications.filter((a) => a.status === this.selectedTab);
  }

  getTabCount(key: string): number {
    if (key === 'ALL') return this.applications.length;
    if (key === 'VERIFICATION') {
      return this.applications.filter((a) => a.status === 'VERIFICATION_REQUIRED' || a.status === 'VERIFICATION_PENDING').length;
    }
    return this.applications.filter((a) => a.status === key).length;
  }

  getApplicantName(app: RentalApplication): string {
    const tenant = (app as any)?.tenantId;
    return tenant?.name || tenant?.fullName || (app as any)?.applicationData?.applicantName || 'Applicant User';
  }

  getApplicantInitial(app: RentalApplication): string {
    return this.getApplicantName(app).charAt(0).toUpperCase();
  }

  getPropertyTitle(app: RentalApplication): string {
    return (app as any)?.propertyId?.title || 'Rental Listing';
  }

  getAppDate(app: RentalApplication): string {
    return (app as any)?.submittedAt || app.createdAt || new Date().toISOString();
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  viewApplicantDetails(app: RentalApplication): void {
    const appId = app.id || (app as any)._id;
    this.router.navigate(['/owner/applications', appId]);
  }

  goBackToProperties(): void {
    this.router.navigate(['/owner/properties']);
  }
}
