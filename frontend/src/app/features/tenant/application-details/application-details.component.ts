import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    CustomerCareComponent,
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
        Back to Applications List
      </button>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching application records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Application details unavailable"
        [message]="errorMessage"
        (retry)="loadApplication()"
      ></app-error-state>

      <!-- Application Detail Content -->
      <div *ngIf="!isLoading && !isError && application" class="space-y-6">
        <!-- Status Header Card -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">Application Reference</span>
              <h1 class="text-xl font-extrabold text-[#0F2937]">APP-{{ application.id }}</h1>
            </div>
            <div class="flex items-center space-x-3">
              <app-status-badge [status]="application.status"></app-status-badge>
            </div>
          </div>

          <!-- Timeline Stepper -->
          <div class="pt-2">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Application Lifecycle</h2>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <!-- Step 1 -->
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 1</span>
                <span class="text-xs font-bold text-slate-900 block">Submitted</span>
                <span class="text-[11px] text-emerald-700">Completed</span>
              </div>
              <!-- Step 2 -->
              <div [class]="getStepClass(2)" class="p-3 border rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold uppercase block">Step 2</span>
                <span class="text-xs font-bold block">Owner Review</span>
                <span class="text-[11px] block">{{ getStepLabel(2) }}</span>
              </div>
              <!-- Step 3 -->
              <div [class]="getStepClass(3)" class="p-3 border rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold uppercase block">Step 3</span>
                <span class="text-xs font-bold block">Tenant Verification</span>
                <span class="text-[11px] block">{{ getStepLabel(3) }}</span>
              </div>
              <!-- Step 4 -->
              <div [class]="getStepClass(4)" class="p-3 border rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold uppercase block">Step 4</span>
                <span class="text-xs font-bold block">Final Decision</span>
                <span class="text-[11px] block">{{ getStepLabel(4) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Property Summary Card -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Applied Property</h2>
          <div class="flex items-center space-x-4">
            <img
              [src]="propertyImage"
              [alt]="propertyTitle"
              class="w-20 h-20 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ propertyTitle }}</h3>
              <p class="text-xs text-slate-500 mt-1">{{ propertyLocation }}</p>
              <button
                (click)="openPropertyListing()"
                type="button"
                class="text-xs font-bold text-[#2D7A5E] hover:underline mt-2 inline-block"
              >
                View Full Listing →
              </button>
            </div>
          </div>
        </div>

        <!-- Application Details Card -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Application Parameters</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-xs text-slate-400 font-bold block">Proposed Rent</span>
              <span class="text-base font-extrabold text-[#0F2937]">{{ formatRent(application.proposedRent) }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-xs text-slate-400 font-bold block">Requested Move-in Date</span>
              <span class="text-base font-extrabold text-slate-800">{{ application.moveInDate | date: 'longDate' }}</span>
            </div>
          </div>

          <div *ngIf="application.message" class="pt-3 border-t border-slate-200 space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase block">Applicant Cover Note</span>
            <p class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              "{{ application.message }}"
            </p>
          </div>

          <!-- What Do I Need To Do Next Guidance Box -->
          <div class="pt-4 border-t border-slate-200">
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span class="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block">Where Is My Application?</span>
                <p class="text-xs text-indigo-900 font-semibold mt-0.5">
                  Current Status: <span class="font-extrabold underline">{{ application.status }}</span>
                </p>
                <p class="text-xs text-indigo-800 mt-1">
                  {{ getNextActionText() }}
                </p>
              </div>
              <button
                *ngIf="application.status === 'VERIFICATION_REQUIRED' || application.status === 'VERIFICATION_PENDING' || application.status === 'SUBMITTED'"
                (click)="goToVerification()"
                type="button"
                class="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
              >
                Complete Verification →
              </button>
            </div>
          </div>
        </div>

        <!-- Support Banner -->
        <app-customer-care></app-customer-care>
      </div>
    </div>
  `,
})
export class ApplicationDetailsComponent implements OnInit {
  applicationId: string = '';
  application: RentalApplication | null = null;
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
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
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.application = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Access denied or application not found.';
      },
    });
  }

  get propertyTitle(): string {
    return (this.application as any)?.propertyId?.title || 'Rental Property';
  }

  get propertyLocation(): string {
    const loc = (this.application as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.address}, ${loc.locality || loc.city}` : 'Nivas360 Location';
  }

  get propertyImage(): string {
    const images = (this.application as any)?.propertyId?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  getStepClass(step: number): string {
    const st = this.application?.status;
    if (step === 2) {
      if (st === 'SHORTLISTED' || st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      if (st === 'PENDING') return 'bg-amber-50 border-amber-200 text-amber-900';
      if (st === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-900';
    }
    if (step === 3) {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      if (st === 'SHORTLISTED') return 'bg-amber-50 border-amber-200 text-amber-900';
    }
    if (step === 4) {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      if (st === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-900';
    }
    return 'bg-slate-50 border-slate-200 text-slate-500';
  }

  getStepLabel(step: number): string {
    const st = this.application?.status;
    if (step === 2) {
      if (st === 'PENDING') return 'In Progress';
      if (st === 'SHORTLISTED' || st === 'APPROVED') return 'Shortlisted';
      if (st === 'REJECTED') return 'Declined';
    }
    if (step === 3) {
      if (st === 'SHORTLISTED') return 'Verification Pending';
      if (st === 'APPROVED') return 'Verified';
    }
    if (step === 4) {
      if (st === 'APPROVED') return 'Approved';
      if (st === 'REJECTED') return 'Rejected';
    }
    return 'Pending';
  }

  getNextActionText(): string {
    const st = this.application?.status;
    if (st === 'SUBMITTED' || st === 'PENDING') return 'Your application has been received. The property owner is reviewing your request.';
    if (st === 'UNDER_REVIEW') return 'Your application is actively under owner review. Identity verification may be required next.';
    if (st === 'VERIFICATION_REQUIRED') return 'Action Required: Please submit your identity verification details to proceed.';
    if (st === 'VERIFICATION_PENDING') return 'Identity verification details submitted. Administrative review in progress.';
    if (st === 'SHORTLISTED') return 'Good news! Your application has been shortlisted by the property owner.';
    if (st === 'APPROVED') return 'Congratulations! Your application has been approved. Proceed to your rental workspace to view active lease details.';
    if (st === 'REJECTED') return 'This application was declined. You can search for other properties in Find Homes.';
    if (st === 'WITHDRAWN') return 'This application was withdrawn by you.';
    return 'Track your rental progress here.';
  }

  goToVerification(): void {
    this.router.navigate(['/tenant/applications', this.applicationId, 'verification']);
  }

  openPropertyListing(): void {
    const propId = (this.application as any)?.propertyId?._id || (this.application as any)?.propertyId?.id;
    if (propId) {
      this.router.navigate(['/tenant/homes', propId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/tenant/applications']);
  }
}
