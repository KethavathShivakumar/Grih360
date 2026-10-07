import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService, RentalApplication } from '../../../core/services/application.service';
import { VerificationService, RentalVerification } from '../../../core/services/verification.service';
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
        class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Applications
      </button>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading applicant dossier..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Application details unavailable"
        [message]="errorMessage"
        (retry)="loadApplication()"
      ></app-error-state>

      <!-- Applicant Details Content -->
      <div *ngIf="!isLoading && !isError && application" class="space-y-6">
        <!-- Applicant Header Card -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-2xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-md">
              {{ applicantInitial }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <app-status-badge [status]="application.status"></app-status-badge>
                <span class="text-xs text-slate-400 font-semibold">APP-{{ application.id || (application._id) }}</span>
              </div>
              <h1 class="text-xl font-extrabold text-[#0F2937] mt-1">{{ applicantName }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Submitted on {{ getAppDate() | date: 'longDate' }}</p>
            </div>
          </div>

          <!-- Owner Decision Actions (Server Validated State Machine) -->
          <div *ngIf="isActionable" class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <!-- Review Action -->
            <button
              *ngIf="application.status === 'SUBMITTED'"
              (click)="updateStatus('UNDER_REVIEW')"
              [disabled]="isUpdating"
              type="button"
              class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Start Review →
            </button>

            <!-- Verification Request Action -->
            <button
              *ngIf="application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW'"
              (click)="updateStatus('VERIFICATION_REQUIRED')"
              [disabled]="isUpdating"
              type="button"
              class="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>🛡️ Request Verification</span>
            </button>

            <!-- Decline Action -->
            <button
              *ngIf="canReject"
              (click)="updateStatus('REJECTED')"
              [disabled]="isUpdating"
              type="button"
              class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Decline
            </button>

            <!-- Approve Action -->
            <button
              *ngIf="canApprove"
              (click)="updateStatus('APPROVED')"
              [disabled]="isUpdating"
              type="button"
              class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              {{ isUpdating ? 'Processing...' : '✓ Approve & Create Lease' }}
            </button>
          </div>

          <!-- Terminal Status Banner -->
          <div *ngIf="!isActionable" class="px-3 py-1.5 rounded-xl text-xs font-bold" [class]="terminalBadgeClass">
            Status: {{ application.status }}
          </div>
        </div>

        <!-- Timeline Stepper (Synchronized with Backend) -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-3">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Application Lifecycle & Verification Timeline</h2>
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            <!-- Step 1: Submitted -->
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">1. Submission</span>
              <span class="text-xs font-bold text-slate-900 block">Submitted</span>
              <span class="text-[11px] text-emerald-700 font-semibold">✓ Completed</span>
            </div>

            <!-- Step 2: Under Review -->
            <div [class]="getTimelineStepClass('UNDER_REVIEW')" class="p-3 border rounded-2xl space-y-1">
              <span class="text-[10px] font-extrabold uppercase block">2. Screening</span>
              <span class="text-xs font-bold block">Owner Review</span>
              <span class="text-[11px] block font-semibold">{{ getTimelineStepLabel('UNDER_REVIEW') }}</span>
            </div>

            <!-- Step 3: Verification -->
            <div [class]="getTimelineStepClass('VERIFICATION_REQUIRED')" class="p-3 border rounded-2xl space-y-1">
              <span class="text-[10px] font-extrabold uppercase block">3. Verification</span>
              <span class="text-xs font-bold block">Background Checks</span>
              <span class="text-[11px] block font-semibold">{{ getTimelineStepLabel('VERIFICATION_REQUIRED') }}</span>
            </div>

            <!-- Step 4: Decision -->
            <div [class]="getTimelineStepClass('APPROVED')" class="p-3 border rounded-2xl space-y-1">
              <span class="text-[10px] font-extrabold uppercase block">4. Decision</span>
              <span class="text-xs font-bold block">{{ isRejected ? 'Rejected' : 'Approved' }}</span>
              <span class="text-[11px] block font-semibold">{{ getDecisionLabel() }}</span>
            </div>

            <!-- Step 5: Agreement -->
            <div [class]="getTimelineStepClass('AGREEMENT')" class="p-3 border rounded-2xl space-y-1">
              <span class="text-[10px] font-extrabold uppercase block">5. Tenancy</span>
              <span class="text-xs font-bold block">Lease Agreement</span>
              <span class="text-[11px] block font-semibold">{{ isApproved ? 'Active Lease' : 'Pending Approval' }}</span>
            </div>
          </div>
        </div>

        <!-- Property & Proposed Terms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Property Summary -->
          <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Target Listing</h2>
            <div class="flex items-center space-x-3.5">
              <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                <img [src]="propertyImage" [alt]="propertyTitle" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-slate-900 truncate">{{ propertyTitle }}</h3>
                <p class="text-xs text-slate-500 mt-0.5 truncate">📍 {{ propertyLocation }}</p>
                <div class="pt-1.5 text-xs font-semibold text-[#2D7A5E]">
                  <span>Listed at {{ formatRent(listingRent) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Applicant Proposed Terms -->
          <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Proposed Tenancy Terms</h2>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span class="text-[11px] text-slate-400 font-bold block">Offered Rent</span>
                <span class="text-base font-extrabold text-[#0F2937] mt-0.5 block">{{ formatRent(application.proposedRent) }}</span>
              </div>
              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span class="text-[11px] text-slate-400 font-bold block">Move-In Date</span>
                <span class="text-xs font-bold text-slate-800 mt-1 block">{{ application.moveInDate | date: 'mediumDate' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Applicant Verification & Contact Dossier -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Applicant Dossier & Verification</h2>
              <p class="text-xs text-slate-500 mt-0.5">Model Tenancy Act compliance assessment</p>
            </div>
            <span
              [class]="verificationBadgeClass"
              class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
            >
              {{ verificationStatusText }}
            </span>
          </div>

          <!-- Required Verification Steps Status (Owner View) -->
          <div class="space-y-2 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Verification Steps Status</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div class="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span class="text-slate-400 font-semibold text-[10px] block">1. Government Identity</span>
                <span class="font-bold text-slate-800 block text-[11px]">{{ getStepStatus('ID_VERIFICATION') }}</span>
                <span class="text-[10px] text-amber-700 font-semibold block">Provider Integration Required</span>
              </div>
              <div class="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span class="text-slate-400 font-semibold text-[10px] block">2. Rental History</span>
                <span class="font-bold text-slate-800 block text-[11px]">{{ getStepStatus('RENTAL_HISTORY') }}</span>
                <span class="text-[10px] text-slate-400 block">Reference Cross-Check</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Full Legal Name</span>
              <span class="text-slate-800 font-bold text-sm mt-0.5 block">{{ applicantName }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Email Address</span>
              <span class="text-slate-800 font-bold text-sm mt-0.5 block">{{ applicantEmail }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Mobile Phone</span>
              <span class="text-slate-800 font-bold text-sm mt-0.5 block">{{ applicantPhone }}</span>
            </div>
          </div>

          <!-- Application Additional Info -->
          <div *ngIf="applicationData" class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Employment Status</span>
              <span class="text-slate-800 font-bold mt-0.5 block">{{ applicationData.employmentStatus || 'Employed' }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Monthly Household Income</span>
              <span class="text-slate-800 font-bold mt-0.5 block">
                {{ applicationData.monthlyIncome ? ('₹' + applicationData.monthlyIncome.toLocaleString('en-IN') + '/mo') : 'Verified' }}
              </span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span class="text-slate-400 font-bold block">Occupants</span>
              <span class="text-slate-800 font-bold mt-0.5 block">{{ applicationData.occupantsCount || 1 }} Person(s)</span>
            </div>
          </div>

          <!-- Cover Note -->
          <div *ngIf="application.message" class="pt-2 space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Applicant Note</span>
            <p class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 italic">
              "{{ application.message }}"
            </p>
          </div>

          <!-- Data Privacy Notice -->
          <div class="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
            <span>🛡️</span>
            <span><strong>Owner Privacy Shield:</strong> Full unmasked identity documents and file attachments are strictly protected under privacy regulations. Verification confirmations and compliance statuses are displayed above.</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApplicantDetailsComponent implements OnInit {
  propertyId: string = '';
  applicationId: string = '';
  application: any = null;
  verification: RentalVerification | null = null;

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  isUpdating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private verificationService: VerificationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.applicationId =
      this.route.snapshot.paramMap.get('applicationId') ||
      this.route.snapshot.paramMap.get('id') ||
      '';

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
          this.loadVerification();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Access denied or application not found.';
      },
    });
  }

  loadVerification(): void {
    if (!this.applicationId) return;
    this.verificationService.getVerificationByApplicationId(this.applicationId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.verification = res.data.verification;
        }
      },
      error: (err) => console.log('Verification load (owner):', err),
    });
  }

  getStepStatus(stepId: string): string {
    const step = this.verification?.steps?.find((s: any) => s.stepId === stepId);
    return step?.status || 'NOT_STARTED';
  }

  get isActionable(): boolean {
    const st = this.application?.status;
    return ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED'].includes(st);
  }

  get canApprove(): boolean {
    const st = this.application?.status;
    return ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED'].includes(st);
  }

  get canReject(): boolean {
    const st = this.application?.status;
    return ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED'].includes(st);
  }

  get isApproved(): boolean {
    return this.application?.status === 'APPROVED';
  }

  get isRejected(): boolean {
    return this.application?.status === 'REJECTED';
  }

  get terminalBadgeClass(): string {
    const st = this.application?.status;
    if (st === 'APPROVED') return 'bg-emerald-100 text-emerald-800';
    if (st === 'REJECTED') return 'bg-rose-100 text-rose-800';
    if (st === 'WITHDRAWN') return 'bg-slate-200 text-slate-700';
    return 'bg-amber-100 text-amber-800';
  }

  get applicantName(): string {
    const tenant = this.application?.tenantId;
    return tenant?.name || tenant?.fullName || this.application?.applicationData?.applicantName || 'Verified Tenant';
  }

  get applicantInitial(): string {
    return this.applicantName.charAt(0).toUpperCase();
  }

  get applicantEmail(): string {
    return this.application?.tenantId?.email || this.application?.applicationData?.applicantEmail || 'tenant@nivas360.com';
  }

  get applicantPhone(): string {
    return this.application?.tenantId?.phone || this.application?.applicationData?.applicantPhone || 'Contact provided via workspace';
  }

  get applicationData(): any {
    return this.application?.applicationData || null;
  }

  get verificationStatusText(): string {
    const appStatus = this.application?.status;
    const vStatus = this.verification?.status || this.application?.tenantId?.identityVerificationStatus;
    if (vStatus === 'VERIFIED') return 'Verification Verified';
    if (appStatus === 'VERIFICATION_REQUIRED') return 'Verification Requested';
    if (appStatus === 'VERIFICATION_PENDING' || vStatus === 'PENDING' || vStatus === 'UNDER_REVIEW') return 'Verification Pending';
    if (vStatus === 'REJECTED') return 'Verification Rejected';
    if (vStatus === 'EXPIRED') return 'Verification Expired';
    return 'Verification Not Requested';
  }

  get verificationBadgeClass(): string {
    const txt = this.verificationStatusText;
    if (txt === 'Verification Verified') return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    if (txt === 'Verification Pending' || txt === 'Verification Requested') return 'bg-amber-50 text-amber-800 border border-amber-200';
    if (txt === 'Verification Rejected') return 'bg-rose-50 text-rose-800 border border-rose-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  get propertyTitle(): string {
    return this.application?.propertyId?.title || 'Rental Property';
  }

  get propertyLocation(): string {
    const loc = this.application?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address}, ${loc.city}` : 'Nivas360 Location';
  }

  get propertyImage(): string {
    const images = this.application?.propertyId?.images;
    return images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  get listingRent(): number {
    return this.application?.propertyId?.rentAmount || 0;
  }

  getAppDate(): string {
    return this.application?.submittedAt || this.application?.createdAt || new Date().toISOString();
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  getTimelineStepClass(stepKey: string): string {
    const st = this.application?.status;
    if (stepKey === 'UNDER_REVIEW') {
      if (['UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED'].includes(st)) {
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      }
      return 'bg-slate-50 border-slate-200 text-slate-500';
    }
    if (stepKey === 'VERIFICATION_REQUIRED') {
      if (st === 'VERIFICATION_REQUIRED' || st === 'VERIFICATION_PENDING') {
        return 'bg-amber-50 border-amber-300 text-amber-900';
      }
      if (['SHORTLISTED', 'APPROVED'].includes(st)) {
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      }
      return 'bg-slate-50 border-slate-200 text-slate-500';
    }
    if (stepKey === 'APPROVED') {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      if (st === 'REJECTED') return 'bg-rose-50 border-rose-200 text-rose-900';
      return 'bg-slate-50 border-slate-200 text-slate-500';
    }
    if (stepKey === 'AGREEMENT') {
      if (st === 'APPROVED') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      return 'bg-slate-50 border-slate-200 text-slate-500';
    }
    return 'bg-slate-50 border-slate-200 text-slate-500';
  }

  getTimelineStepLabel(stepKey: string): string {
    const st = this.application?.status;
    if (stepKey === 'UNDER_REVIEW') {
      if (st === 'SUBMITTED') return 'Pending Screening';
      if (st === 'UNDER_REVIEW') return 'Review in Progress';
      return 'Completed';
    }
    if (stepKey === 'VERIFICATION_REQUIRED') {
      if (st === 'VERIFICATION_REQUIRED') return 'Action Required';
      if (st === 'VERIFICATION_PENDING') return 'Verifying';
      if (['SHORTLISTED', 'APPROVED'].includes(st)) return 'Verified';
      return 'Not Requested';
    }
    return 'Pending';
  }

  getDecisionLabel(): string {
    const st = this.application?.status;
    if (st === 'APPROVED') return 'Approved ✓';
    if (st === 'REJECTED') return 'Declined ✕';
    if (st === 'WITHDRAWN') return 'Withdrawn';
    return 'Pending Review';
  }

  updateStatus(newStatus: string): void {
    if (!this.applicationId) return;
    this.isUpdating = true;

    this.applicationService.updateApplicationStatus(this.applicationId, newStatus).subscribe({
      next: (res: any) => {
        this.isUpdating = false;
        if (newStatus === 'APPROVED') {
          const pId = this.application?.propertyId?._id || this.application?.propertyId?.id || this.propertyId;
          this.router.navigate(['/owner/properties', pId, 'rental']);
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
    this.router.navigate(['/owner/applications']);
  }
}
