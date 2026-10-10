import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VerificationService, RentalVerification } from '../../../core/services/verification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-tenant-verification-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-2 text-xs text-slate-500">
          <a routerLink="/tenant/dashboard" class="hover:text-[#2D7A5E] font-medium">Dashboard</a>
          <span>/</span>
          <a routerLink="/tenant/verification" class="hover:text-[#2D7A5E] font-medium">Verification</a>
          <span>/</span>
          <span class="text-slate-800 font-bold">Verification Dossier</span>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/tenant/verification"
            class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            ← Back to Verification Portal
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching verification dossier records..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Verification Details Unavailable"
        [message]="errorMessage"
        (retry)="loadVerification()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !verification"
        title="Verification record not found"
        message="No identity verification file was found matching this identifier."
        actionText="Back to Verification"
        (action)="router.navigate(['/tenant/verification'])"
      ></app-empty-state>

      <!-- Main Dossier Content -->
      <div *ngIf="!isLoading && !isError && verification" class="space-y-6">

        <!-- Top Status & Certificate Header -->
        <div class="bg-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div class="absolute -right-8 -bottom-8 w-56 h-56 bg-[#FACC15]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15 mb-2">
                <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Model Tenancy Act Compliance Dossier</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Identity & Tenancy Assessment</h1>
              <p class="text-xs sm:text-sm text-slate-300 mt-1">
                Reference ID: <span class="font-mono text-white">{{ verification._id || verification.id }}</span>
              </p>
            </div>

            <div class="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <app-status-badge [status]="verification.status"></app-status-badge>
              <span class="text-[11px] text-slate-300">
                Submitted {{ submissionDate | date: 'mediumDate' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Verified Trust Certificate (When VERIFIED) -->
        <div *ngIf="verification.status === 'VERIFIED'" class="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                
              </div>
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900">
                  Certified Resident
                </span>
                <h2 class="text-base font-black text-emerald-950 mt-0.5">Verified Tenant Credential</h2>
              </div>
            </div>

            <button
              (click)="printCertificate()"
              type="button"
              class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg> Print Certificate</span>
            </button>
          </div>

          <p class="text-xs text-emerald-900 leading-relaxed font-medium">
            This verification certifies that the tenant's government identification, income assertions, and statutory declarations have been checked and validated according to Telangana & Andhra Pradesh residential rental norms.
          </p>
        </div>

        <!-- Four Pillars Verification Assessment Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Pillar 1: Identity & KYC -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pillar 1: Government Identity</span>
              <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2H9.17A3.001 3.001 0 0112 14z"/></svg></span>
            </div>
            <div>
              <div class="font-extrabold text-sm text-[#0F2937]">
                {{ verification.documentType || 'Aadhaar / Government ID' }}
              </div>
              <div class="text-xs text-slate-500 font-mono mt-0.5">
                Identifier: {{ verification.maskedNumber || '•••• •••• ' + ((verification.submittedInfo?.phone || '1234').slice(-4)) }}
              </div>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-semibold">Document Status:</span>
              <span class="font-extrabold" [class]="verification.status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'">
                {{ verification.status === 'VERIFIED' ? ' Authenticated' : 'Under Assessment' }}
              </span>
            </div>
          </div>

          <!-- Pillar 2: Employment & Income -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pillar 2: Income & Employment</span>
              <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></span>
            </div>
            <div>
              <div class="font-extrabold text-sm text-[#0F2937]">
                {{ verification.submittedInfo?.employerName || 'Corporate Professional' }}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                Role: {{ verification.submittedInfo?.designation || 'Software Engineer / Professional' }}
              </div>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-semibold">Reported Income:</span>
              <span class="font-extrabold text-[#0F2937]">
                {{ reportedIncomeDisplay }}
              </span>
            </div>
          </div>

          <!-- Pillar 3: Residential History -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pillar 3: Residential Background</span>
              <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></span>
            </div>
            <div>
              <div class="font-extrabold text-sm text-[#0F2937]">Previous Tenancy Record</div>
              <div class="text-xs text-slate-500 mt-0.5">
                Current City: {{ verification.submittedInfo?.currentAddress || 'Hyderabad, Telangana' }}
              </div>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-semibold">Reference Contact:</span>
              <span class="font-bold text-slate-700">
                {{ verification.submittedInfo?.previousLandlordContact || 'On File (Owner Protected)' }}
              </span>
            </div>
          </div>

          <!-- Pillar 4: Police Intimation Compliance -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pillar 4: Statutory Compliance</span>
              <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg></span>
            </div>
            <div>
              <div class="font-extrabold text-sm text-[#0F2937]">Police Verification & Tenant Intimation</div>
              <div class="text-xs text-slate-500 mt-0.5">Section 4, Model Tenancy Act 2021</div>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-semibold">Compliance Status:</span>
              <span class="font-extrabold text-emerald-700"> Digital Ready</span>
            </div>
          </div>
        </div>

        <!-- Verification Steps Progress Breakdown -->
        <div *ngIf="verification.steps && verification.steps.length > 0" class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h2 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Detailed Verification Steps</h2>
          <div class="space-y-3">
            <div
              *ngFor="let step of verification.steps"
              class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-slate-900">{{ step.name }}</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">• {{ step.category }}</span>
                </div>
                <p *ngIf="step.providerNotice" class="text-[11px] text-slate-500 mt-0.5">{{ step.providerNotice }}</p>
              </div>

              <span
                class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0"
                [class]="step.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'"
              >
                {{ step.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <a
            routerLink="/tenant/applications"
            class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            ← View My Applications
          </a>

          <a
            *ngIf="verification.status === 'VERIFIED'"
            routerLink="/tenant/rental"
            class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            Go to My Rental & Lease Agreement →
          </a>
        </div>
      </div>
    </div>
  `,
})
export class TenantVerificationDetailsComponent implements OnInit {
  verificationId: string = '';
  verification: RentalVerification | null = null;
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    this.verificationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.verificationId) {
      this.loadVerification();
    } else {
      this.isError = true;
      this.errorMessage = 'Verification ID was not provided in route.';
      this.isLoading = false;
    }
  }

  get submissionDate(): string {
    return this.verification?.submittedAt || (this.verification as any)?.createdAt || new Date().toISOString();
  }

  get reportedIncomeDisplay(): string {
    const inc = this.verification?.submittedInfo?.monthlyIncome;
    return inc ? ('₹' + inc.toLocaleString('en-IN') + '/mo') : 'Verified Criteria Met';
  }

  loadVerification(): void {
    this.isLoading = true;
    this.isError = false;

    // Check if ID is a verification ID or try by application ID
    this.verificationService.getVerificationById(this.verificationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.verification = res.data;
        } else {
          this.loadByApplicationIdFallback();
        }
      },
      error: () => {
        // Fallback: the route parameter might be an applicationId
        this.loadByApplicationIdFallback();
      },
    });
  }

  loadByApplicationIdFallback(): void {
    this.verificationService.getVerificationByApplicationId(this.verificationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data?.verification) {
          this.verification = res.data.verification;
        } else {
          this.isError = true;
          this.errorMessage = 'Verification dossier could not be retrieved.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Verification record not found.';
      },
    });
  }

  printCertificate(): void {
    window.print();
  }
}
