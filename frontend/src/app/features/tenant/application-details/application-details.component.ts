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
      <!-- Back Navigation & Withdraw Action -->
      <div class="flex items-center justify-between">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Applications List
        </button>

        <button
          *ngIf="canWithdraw"
          (click)="withdrawApplication()"
          [disabled]="isUpdating"
          type="button"
          class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          {{ isUpdating ? 'Processing...' : 'Withdraw Application' }}
        </button>
      </div>

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
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">Application Reference</span>
              <h1 class="text-xl font-extrabold text-[#0F2937]">APP-{{ application.id || application._id }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Submitted on {{ applicationDate | date: 'longDate' }}</p>
            </div>
            <div class="flex items-center space-x-3">
              <app-status-badge [status]="application.status"></app-status-badge>
            </div>
          </div>

          <!-- Timeline Stepper (Only Shows Steps Actually Reached / Current) -->
          <div class="pt-2">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Application Lifecycle Timeline</h2>
            <div class="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
              <!-- Step 1: Submitted -->
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span class="text-[9px] font-black text-emerald-800 uppercase block">1. Submitted</span>
                <span class="text-xs font-bold text-slate-900 block">Submitted</span>
                <span class="text-[10px] text-emerald-700 font-semibold block">✓ Reached</span>
              </div>

              <!-- Step 2: Under Review -->
              <div
                *ngIf="hasReachedStep('UNDER_REVIEW')"
                [class]="getTimelineStepClass('UNDER_REVIEW')"
                class="p-3 border rounded-2xl space-y-1"
              >
                <span class="text-[9px] font-black uppercase block">2. Screening</span>
                <span class="text-xs font-bold block">Under Review</span>
                <span class="text-[10px] font-semibold block">{{ getTimelineStepState('UNDER_REVIEW') }}</span>
              </div>

              <!-- Step 3: Verification -->
              <div
                *ngIf="hasReachedStep('VERIFICATION')"
                [class]="getTimelineStepClass('VERIFICATION')"
                class="p-3 border rounded-2xl space-y-1"
              >
                <span class="text-[9px] font-black uppercase block">3. Verification</span>
                <span class="text-xs font-bold block">KYC Check</span>
                <span class="text-[10px] font-semibold block">{{ getTimelineStepState('VERIFICATION') }}</span>
              </div>

              <!-- Step 4: Approved/Rejected -->
              <div
                *ngIf="hasReachedStep('DECISION')"
                [class]="getTimelineStepClass('DECISION')"
                class="p-3 border rounded-2xl space-y-1"
              >
                <span class="text-[9px] font-black uppercase block">4. Decision</span>
                <span class="text-xs font-bold block">{{ isRejected ? 'Rejected' : (isApproved ? 'Approved' : 'Decision') }}</span>
                <span class="text-[10px] font-semibold block">{{ isRejected ? 'Declined' : 'Approved' }}</span>
              </div>

              <!-- Step 5: Agreement -->
              <div
                *ngIf="hasReachedStep('AGREEMENT')"
                [class]="getTimelineStepClass('AGREEMENT')"
                class="p-3 border rounded-2xl space-y-1"
              >
                <span class="text-[9px] font-black uppercase block">5. Agreement</span>
                <span class="text-xs font-bold block">Digital Lease</span>
                <span class="text-[10px] font-semibold block">Generated</span>
              </div>

              <!-- Step 6: Rental Activated -->
              <div
                *ngIf="hasReachedStep('RENTAL_ACTIVATED')"
                [class]="getTimelineStepClass('RENTAL_ACTIVATED')"
                class="p-3 border rounded-2xl space-y-1"
              >
                <span class="text-[9px] font-black uppercase block">6. Tenancy</span>
                <span class="text-xs font-bold block">Activated</span>
                <span class="text-[10px] font-semibold block">Active Resident</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Property Summary Card -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Applied Property</h2>
          <div class="flex items-center space-x-4">
            <img
              [src]="propertyImage"
              [alt]="propertyTitle"
              class="w-20 h-20 rounded-2xl object-cover border border-slate-200"
            />
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ propertyTitle }}</h3>
              <p class="text-xs text-slate-500 mt-1">📍 {{ propertyLocation }}</p>
              <button
                (click)="openPropertyListing()"
                type="button"
                class="text-xs font-bold text-[#2D7A5E] hover:underline mt-2 inline-block cursor-pointer"
              >
                View Full Listing →
              </button>
            </div>
          </div>
        </div>

        <!-- Application Parameters & Verification Card -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Application Parameters & State</h2>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 font-semibold">Verification:</span>
              <span [class]="verificationStateBadgeClass" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                {{ verificationStateText }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-semibold">
            <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[11px] text-slate-400 font-bold block uppercase">Proposed Rent</span>
              <span class="text-lg font-extrabold text-[#0F2937] block mt-0.5">{{ formatRent(application.proposedRent) }}</span>
            </div>
            <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[11px] text-slate-400 font-bold block uppercase">Target Move-in Date</span>
              <span class="text-sm font-extrabold text-slate-800 block mt-1">{{ application.moveInDate | date: 'longDate' }}</span>
            </div>
            <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-[11px] text-slate-400 font-bold block uppercase">Agreement State</span>
              <span class="text-xs font-extrabold text-[#2D7A5E] block mt-1.5">{{ agreementStateText }}</span>
            </div>
          </div>

          <div *ngIf="application.message" class="pt-2 space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Applicant Cover Note</span>
            <p class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 italic">
              "{{ application.message }}"
            </p>
          </div>

          <!-- What Do I Need To Do Next Guidance Box -->
          <div class="pt-3 border-t border-slate-100">
            <div class="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span class="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block">Next Steps & Guidance</span>
                <p class="text-xs text-indigo-900 font-semibold mt-0.5">
                  Current Status: <span class="font-extrabold underline">{{ application.status }}</span>
                </p>
                <p class="text-xs text-indigo-800 mt-1">
                  {{ getNextActionText() }}
                </p>
              </div>
              <button
                *ngIf="application.status === 'VERIFICATION_REQUIRED' || application.status === 'VERIFICATION_PENDING'"
                (click)="goToVerification()"
                type="button"
                class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Complete Verification →
              </button>
              <button
                *ngIf="application.status === 'APPROVED'"
                (click)="goToRental()"
                type="button"
                class="px-4 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                View Active Lease →
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
  application: any = null;
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

  get applicationDate(): string {
    return this.application?.submittedAt || this.application?.createdAt || new Date().toISOString();
  }

  get propertyTitle(): string {
    return this.application?.propertyId?.title || 'Rental Property';
  }

  get propertyLocation(): string {
    const loc = this.application?.propertyId?.propertyLocation;
    return loc ? `${loc.address}, ${loc.locality || loc.city}` : 'Nivas360 Location';
  }

  get propertyImage(): string {
    const images = this.application?.propertyId?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  get isApproved(): boolean {
    return this.application?.status === 'APPROVED';
  }

  get isRejected(): boolean {
    return this.application?.status === 'REJECTED';
  }

  get canWithdraw(): boolean {
    const st = this.application?.status;
    return ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED'].includes(st);
  }

  get verificationStateText(): string {
    const v = this.application?.tenantId?.identityVerificationStatus || this.application?.verificationStatusAtSubmission || 'NOT_STARTED';
    if (v === 'VERIFIED') return 'Aadhaar Verified';
    if (v === 'PENDING' || v === 'UNDER_REVIEW') return 'Verification In Progress';
    if (v === 'EXPIRED') return 'Expired';
    return 'Pending Submission';
  }

  get verificationStateBadgeClass(): string {
    const v = this.application?.tenantId?.identityVerificationStatus || this.application?.verificationStatusAtSubmission || 'NOT_STARTED';
    if (v === 'VERIFIED') return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    if (v === 'PENDING' || v === 'UNDER_REVIEW') return 'bg-amber-50 text-amber-800 border border-amber-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  get agreementStateText(): string {
    if (this.application?.status === 'APPROVED') {
      return 'Standard Lease Generated';
    }
    return 'Pending Approval';
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  hasReachedStep(stepKey: string): boolean {
    const st = this.application?.status;
    if (stepKey === 'UNDER_REVIEW') {
      return ['UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED'].includes(st);
    }
    if (stepKey === 'VERIFICATION') {
      return ['VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED'].includes(st);
    }
    if (stepKey === 'DECISION') {
      return ['APPROVED', 'REJECTED'].includes(st);
    }
    if (stepKey === 'AGREEMENT') {
      return ['APPROVED'].includes(st);
    }
    if (stepKey === 'RENTAL_ACTIVATED') {
      return ['APPROVED'].includes(st);
    }
    return false;
  }

  getTimelineStepClass(stepKey: string): string {
    const st = this.application?.status;
    if (stepKey === 'UNDER_REVIEW') {
      if (st === 'UNDER_REVIEW') return 'bg-amber-50 border-amber-200 text-amber-900';
      return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    }
    if (stepKey === 'VERIFICATION') {
      if (st === 'VERIFICATION_REQUIRED' || st === 'VERIFICATION_PENDING') return 'bg-amber-50 border-amber-200 text-amber-900';
      return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    }
    if (stepKey === 'DECISION') {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      if (st === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-900';
      return 'bg-slate-50 border-slate-200 text-slate-700';
    }
    if (stepKey === 'AGREEMENT' || stepKey === 'RENTAL_ACTIVATED') {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    }
    return 'bg-slate-50 border-slate-200 text-slate-700';
  }

  getTimelineStepState(stepKey: string): string {
    const st = this.application?.status;
    if (stepKey === 'UNDER_REVIEW') {
      return st === 'UNDER_REVIEW' ? 'In Progress' : '✓ Completed';
    }
    if (stepKey === 'VERIFICATION') {
      if (st === 'VERIFICATION_REQUIRED') return 'Action Needed';
      if (st === 'VERIFICATION_PENDING') return 'In Progress';
      return '✓ Verified';
    }
    return '✓ Completed';
  }

  getNextActionText(): string {
    const st = this.application?.status;
    if (st === 'SUBMITTED' || st === 'PENDING') return 'Your application has been received. The property owner is reviewing your request.';
    if (st === 'UNDER_REVIEW') return 'Your application is actively under owner review. Background verification may be requested shortly.';
    if (st === 'VERIFICATION_REQUIRED') return 'Action Required: Please complete your rental KYC verification to proceed.';
    if (st === 'VERIFICATION_PENDING') return 'Verification submitted. Background check verification is underway.';
    if (st === 'APPROVED') return 'Congratulations! Your application has been approved. Proceed to your rental workspace to view the lease agreement.';
    if (st === 'REJECTED') return 'This application was declined. You can search for other properties in Find Homes.';
    if (st === 'WITHDRAWN') return 'This application was withdrawn.';
    return 'Track your rental progress here.';
  }

  withdrawApplication(): void {
    if (!this.applicationId) return;
    if (!confirm('Are you sure you want to withdraw this rental application?')) return;

    this.isUpdating = true;
    this.applicationService.updateApplicationStatus(this.applicationId, 'WITHDRAWN').subscribe({
      next: () => {
        this.isUpdating = false;
        this.loadApplication();
      },
      error: (err: any) => {
        this.isUpdating = false;
        alert(err?.error?.message || 'Failed to withdraw application.');
      },
    });
  }

  goToVerification(): void {
    this.router.navigate(['/tenant/applications', this.applicationId, 'verification']);
  }

  goToRental(): void {
    this.router.navigate(['/tenant/rental']);
  }

  openPropertyListing(): void {
    const propId = this.application?.propertyId?._id || this.application?.propertyId?.id;
    if (propId) {
      this.router.navigate(['/tenant/homes', propId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/tenant/applications']);
  }
}
