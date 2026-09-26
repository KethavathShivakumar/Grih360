import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-applicant-details',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Back Navigation -->
      <button
        (click)="goBack()"
        type="button"
        class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Applicants List
      </button>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading applicant profile..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Applicant details unavailable"
        [message]="errorMessage"
        (retry)="loadApplication()"
      ></app-error-state>

      <!-- Applicant Details Content -->
      <div *ngIf="!isLoading && !isError && application" class="space-y-6">
        <!-- Applicant Header Card -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full bg-[#0F2937] text-white flex items-center justify-center font-extrabold text-2xl shrink-0">
              {{ applicantInitial }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <app-status-badge [status]="application.status"></app-status-badge>
                <span class="text-xs text-slate-400 font-semibold">APP-{{ application.id }}</span>
              </div>
              <h1 class="text-xl font-extrabold text-[#0F2937] mt-1">{{ applicantName }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Applied on {{ getAppDate() | date: 'longDate' }}</p>
            </div>
          </div>

          <!-- Owner Decision Actions (Server Validated) -->
          <div *ngIf="application.status === 'PENDING' || application.status === 'SHORTLISTED'" class="flex items-center space-x-3 w-full sm:w-auto">
            <button
              (click)="updateStatus('REJECTED')"
              [disabled]="isUpdating"
              type="button"
              class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto"
            >
              Decline Application
            </button>
            <button
              (click)="updateStatus('APPROVED')"
              [disabled]="isUpdating"
              type="button"
              class="px-5 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-md transition-all hover:scale-105 w-full sm:w-auto"
            >
              {{ isUpdating ? 'Processing...' : 'Approve & Activate Rental' }}
            </button>
          </div>
        </div>

        <!-- Property & Proposed Terms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Property Summary -->
          <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Target Property</h2>
            <h3 class="text-base font-bold text-slate-900">{{ propertyTitle }}</h3>
            <p class="text-xs text-slate-500">📍 {{ propertyLocation }}</p>
            <div class="pt-2 border-t border-slate-200 text-xs font-semibold text-slate-700">
              <span>Listing Rent: {{ formatRent(listingRent) }}</span>
            </div>
          </div>

          <!-- Applicant Proposed Terms -->
          <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Proposed Terms</h2>
            <div class="space-y-2">
              <div>
                <span class="text-xs text-slate-400 font-bold block">Offered Monthly Rent</span>
                <span class="text-lg font-extrabold text-[#0F2937]">{{ formatRent(application.proposedRent) }}</span>
              </div>
              <div>
                <span class="text-xs text-slate-400 font-bold block">Intended Move-In Date</span>
                <span class="text-sm font-extrabold text-slate-800">{{ application.moveInDate | date: 'longDate' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover Note & Contact Summary -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Applicant Profile Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-slate-400 font-bold block">Contact Email</span>
              <span class="text-slate-800 text-sm font-bold">{{ applicantEmail }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-slate-400 font-bold block">Mobile Phone</span>
              <span class="text-slate-800 text-sm font-bold">{{ applicantPhone }}</span>
            </div>
          </div>

          <div *ngIf="application.message" class="pt-3 border-t border-slate-200 space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase block">Cover Note</span>
            <p class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              "{{ application.message }}"
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApplicantDetailsComponent implements OnInit {
  propertyId: string = '';
  applicationId: string = '';
  application: RentalApplication | null = null;

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  isUpdating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.applicationId = this.route.snapshot.paramMap.get('applicationId') || '';
    if (this.applicationId) {
      this.loadApplication();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid Application ID.';
      this.isLoading = false;
    }
  }

  loadApplication(): void {
    this.isLoading = true;
    this.isError = false;

    this.applicationService.getApplicationById(this.applicationId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.application = res.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Access denied or application not found.';
      },
    });
  }

  get applicantName(): string {
    const tenant = (this.application as any)?.tenantId;
    return tenant?.name || tenant?.fullName || 'Applicant User';
  }

  get applicantInitial(): string {
    return this.applicantName.charAt(0).toUpperCase();
  }

  get applicantEmail(): string {
    return (this.application as any)?.tenantId?.email || 'tenant@nivas360.com';
  }

  get applicantPhone(): string {
    return (this.application as any)?.tenantId?.phone || 'Contact provided via workspace';
  }

  get propertyTitle(): string {
    return (this.application as any)?.propertyId?.title || 'Rental Property';
  }

  get propertyLocation(): string {
    const loc = (this.application as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address}, ${loc.city}` : 'Nivas360 Location';
  }

  get listingRent(): number {
    return (this.application as any)?.propertyId?.rentAmount || 0;
  }

  getAppDate(): string {
    return this.application?.createdAt || new Date().toISOString();
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  updateStatus(newStatus: string): void {
    if (!this.applicationId) return;
    this.isUpdating = true;

    this.applicationService.updateApplicationStatus(this.applicationId, newStatus).subscribe({
      next: (res: any) => {
        this.isUpdating = false;
        if (newStatus === 'APPROVED') {
          const pId = (this.application as any)?.propertyId?._id || (this.application as any)?.propertyId?.id || this.propertyId;
          this.router.navigate(['/owner/properties', pId, 'tenant']);
        } else {
          this.loadApplication();
        }
      },
      error: (err: any) => {
        this.isUpdating = false;
        alert(err?.error?.message || 'Failed to update application status.');
      },
    });
  }

  goBack(): void {
    if (this.propertyId && this.propertyId !== 'all') {
      this.router.navigate(['/owner/properties', this.propertyId, 'applicants']);
    } else {
      this.router.navigate(['/owner/properties']);
    }
  }
}
