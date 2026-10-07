import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RentalService, RentalAgreement as RentalRecord } from '../../../core/services/rental.service';
import { AgreementService, RentalAgreement } from '../../../core/services/agreement.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-current-rental',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <!-- Breadcrumb / Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="inline-flex items-center space-x-2 bg-emerald-50 text-[#2D7A5E] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 mb-2">
            <span>🏡 My Tenancy & Lease Lifecycle</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937]">Rental & Lease Agreement</h1>
          <p class="text-xs sm:text-sm text-slate-500">
            Review your standardized residential rental agreement, digital assent records, and active tenancy parameters.
          </p>
        </div>

        <button
          (click)="loadData()"
          type="button"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
        <div class="w-10 h-10 border-4 border-[#2D7A5E] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-bold text-slate-500">Fetching lease agreement and rental status...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !rental && !agreement" class="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center space-y-4">
        <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-2xl border border-slate-200">
          🏠
        </div>
        <h2 class="text-lg font-extrabold text-[#0F2937]">No Active Rental or Pending Agreement Found</h2>
        <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          You do not currently have an active tenancy or pending lease agreement. Browse available zero-brokerage homes and submit an application to start.
        </p>
        <div class="pt-2">
          <a routerLink="/tenant/homes" class="inline-block px-6 py-3 bg-[#0F2937] text-[#FACC15] font-extrabold rounded-2xl text-xs shadow-md hover:scale-105 transition-all">
            🔍 Browse Verified Homes
          </a>
        </div>
      </div>

      <!-- Content when Rental or Agreement exists -->
      <div *ngIf="!loading && (rental || agreement)" class="space-y-6">

        <!-- Mandatory Digital Signature Regulatory Notice Banner -->
        <div class="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-lg shrink-0 font-black">
              ⚠️
            </div>
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                  Compliance Notice
                </span>
                <span class="text-xs font-black text-amber-950">
                  {{ agreement?.agreementMetadata?.eSignNotice || 'Digital signature integration required' }}
                </span>
              </div>
              <p class="text-xs text-amber-900 leading-relaxed font-medium">
                {{ agreement?.agreementMetadata?.legalNotice || 'Standard platform lease draft. Digital signature integration required for legal execution.' }}
                Platform consent by Tenant and Owner represents mutual assent to lease terms on the Nivas360 network.
              </p>
            </div>
          </div>
        </div>

        <!-- Agreement Status & Summary Card -->
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-[#2D7A5E] uppercase tracking-wider">
                  {{ isRentalActive ? 'Active Lease Agreement' : 'Rental Agreement Under Review' }}
                </span>
                <span class="text-xs text-slate-400">• Version {{ agreement?.agreementVersion || rental?.agreementVersion || 'v1.0' }}</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-[#0F2937] mt-1">
                {{ propertyTitle }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">{{ propertyAddress }}</p>
            </div>

            <div class="flex items-center gap-3">
              <app-status-badge [status]="currentStatus"></app-status-badge>
            </div>
          </div>

          <!-- Parties Grid (Owner & Tenant) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Owner Box -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Property Owner (Lessor)</span>
                <span class="text-xs">🏛️</span>
              </div>
              <div class="font-extrabold text-sm text-[#0F2937]">{{ ownerName }}</div>
              <div class="text-xs text-slate-500">{{ ownerEmail }}</div>
              <div class="pt-1 flex items-center gap-1.5 text-[11px] font-bold" [class]="ownerConfirmed ? 'text-emerald-700' : 'text-amber-700'">
                <span>{{ ownerConfirmed ? '✓ Confirmed by Owner' : '⏳ Pending Owner Confirmation' }}</span>
              </div>
            </div>

            <!-- Tenant Box -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tenant (Lessee)</span>
                <span class="text-xs">👤</span>
              </div>
              <div class="font-extrabold text-sm text-[#0F2937]">{{ tenantName }}</div>
              <div class="text-xs text-slate-500">{{ tenantEmail }}</div>
              <div class="pt-1 flex items-center gap-1.5 text-[11px] font-bold" [class]="tenantConfirmed ? 'text-emerald-700' : 'text-amber-700'">
                <span>{{ tenantConfirmed ? '✓ Confirmed by You' : '⚠️ Action Required: Tenant Confirmation Pending' }}</span>
              </div>
            </div>
          </div>

          <!-- Financial & Term Parameters Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gradient-to-r from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200/80">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Agreed Monthly Rent</span>
              <span class="text-lg font-black text-[#0F2937] block mt-0.5">{{ formatINR(agreedRent) }}/mo</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Security Deposit</span>
              <span class="text-lg font-black text-slate-800 block mt-0.5">{{ formatINR(agreedDeposit) }}</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lease Start Date</span>
              <span class="text-xs font-extrabold text-slate-800 block mt-1.5">{{ startDate | date: 'mediumDate' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lease End Date / Term</span>
              <span class="text-xs font-extrabold text-slate-800 block mt-1.5">{{ endDate | date: 'mediumDate' }} ({{ termMonths }} Mo)</span>
            </div>
          </div>

          <!-- Standard Terms Summary -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Agreement Terms Summary</span>
            <p class="text-xs text-slate-600 leading-relaxed font-medium">
              {{ agreement?.termsSummary || 'Standard Nivas360 Residential Rental Agreement v1.0. Compliance with Model Tenancy Act provisions, 11-month standard tenure, 30-day notice for vacating, and digital rent receipts generated on monthly basis.' }}
            </p>
          </div>

          <!-- Digital Confirmation Representation Box -->
          <div class="border-t border-slate-100 pt-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Platform Confirmation Status</h3>
              <span class="text-[10px] font-bold text-slate-400">Model Tenancy Act Compliant Recording</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3.5 rounded-xl border" [class]="tenantConfirmed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'">
                <div class="font-extrabold flex items-center justify-between">
                  <span>Tenant Digital Consent:</span>
                  <span>{{ tenantConfirmed ? 'CONFIRMED' : 'PENDING' }}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  {{ tenantConfirmedAt ? ('Confirmed on ' + (tenantConfirmedAt | date: 'medium')) : 'Awaiting your assent to agreement terms' }}
                </div>
              </div>

              <div class="p-3.5 rounded-xl border" [class]="ownerConfirmed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'">
                <div class="font-extrabold flex items-center justify-between">
                  <span>Owner Digital Consent:</span>
                  <span>{{ ownerConfirmed ? 'CONFIRMED' : 'PENDING' }}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  {{ ownerConfirmedAt ? ('Confirmed on ' + (ownerConfirmedAt | date: 'medium')) : 'Awaiting owner confirmation to activate rental' }}
                </div>
              </div>
            </div>

            <!-- Tenant Action Button -->
            <div *ngIf="!tenantConfirmed && agreement?.status !== 'CANCELLED'" class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <h4 class="font-bold text-sm text-[#FACC15]">Confirm Agreement Terms</h4>
                <p class="text-xs text-slate-300">By confirming, you record platform agreement to the lease terms and rental fees.</p>
                <p *ngIf="confirmError" class="text-xs text-rose-400 font-bold mt-1">⚠️ {{ confirmError }}</p>
              </div>
              <button
                (click)="confirmAsTenant()"
                [disabled]="isConfirming"
                type="button"
                class="px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black rounded-xl text-xs transition-all hover:scale-105 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {{ isConfirming ? 'Confirming...' : '✓ Accept & Confirm Agreement' }}
              </button>
            </div>

            <div *ngIf="tenantConfirmed && !ownerConfirmed" class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>✓</span>
              <span>You have confirmed this agreement! Awaiting owner confirmation to activate your tenancy.</span>
            </div>
          </div>
        </div>

        <!-- Rent Payment Schedule (When Active) -->
        <div *ngIf="isRentalActive" class="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-extrabold text-[#0F2937]">Active Rent Payment Schedule</h3>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">Active Tenancy</span>
          </div>

          <div class="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Current Cycle Status</div>
              <div class="text-lg font-black text-emerald-950 mt-0.5">Status: {{ rental?.rentStatus || 'UPCOMING' }}</div>
              <div class="text-xs text-emerald-700 mt-1">Monthly Due: {{ formatINR(agreedRent) }}</div>
            </div>
            <div class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center shrink-0 shadow-xs">
              Automated Receipts Enabled
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TenantCurrentRentalComponent implements OnInit {
  public rental: RentalRecord | null = null;
  public agreement: RentalAgreement | null = null;
  public loading = true;
  public isConfirming = false;
  public confirmError: string | null = null;

  constructor(
    private rentalService: RentalService,
    private agreementService: AgreementService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load rentals
    this.rentalService.getRentals().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.rental = res.data[0];
        } else {
          this.rental = null;
        }

        // Also load agreements
        this.agreementService.getAgreements().subscribe({
          next: (agreeRes) => {
            this.loading = false;
            if (agreeRes.success && agreeRes.data && agreeRes.data.length > 0) {
              this.agreement = agreeRes.data[0];
            } else if (this.rental) {
              // Try loading by rentalId
              this.loadAgreementByRental(this.rental.id);
            }
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadAgreementByRental(rentalId: string): void {
    this.agreementService.getAgreementByRentalId(rentalId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.agreement = res.data;
        }
      },
    });
  }

  get isRentalActive(): boolean {
    return this.rental?.status === 'ACTIVE' || this.agreement?.status === 'CONFIRMED';
  }

  get currentStatus(): string {
    return this.agreement?.status || this.rental?.status || 'PENDING_CONFIRMATION';
  }

  get propertyTitle(): string {
    return this.agreement?.propertyId?.title || (this.rental as any)?.propertyId?.title || 'Residential Rental Listing';
  }

  get propertyAddress(): string {
    const loc = this.agreement?.propertyId?.propertyLocation || (this.rental as any)?.propertyId?.propertyLocation;
    if (loc) {
      return `${loc.locality || loc.address || ''}, ${loc.city || ''} ${loc.pincode || ''}`;
    }
    return 'Telangana / Andhra Pradesh';
  }

  get ownerName(): string {
    return this.agreement?.ownerId?.name || (this.rental as any)?.ownerId?.name || 'Property Owner';
  }

  get ownerEmail(): string {
    return this.agreement?.ownerId?.email || (this.rental as any)?.ownerId?.email || 'owner@nivas360.com';
  }

  get tenantName(): string {
    return this.agreement?.tenantId?.name || (this.rental as any)?.tenantId?.name || 'Verified Tenant';
  }

  get tenantEmail(): string {
    return this.agreement?.tenantId?.email || (this.rental as any)?.tenantId?.email || 'tenant@nivas360.com';
  }

  get agreedRent(): number {
    return this.agreement?.rent || this.rental?.monthlyRent || 0;
  }

  get agreedDeposit(): number {
    return this.agreement?.deposit || this.rental?.depositPaid || 0;
  }

  get startDate(): string {
    return this.agreement?.startDate || this.rental?.startDate || new Date().toISOString();
  }

  get endDate(): string {
    return this.agreement?.endDate || this.rental?.endDate || new Date().toISOString();
  }

  get termMonths(): number {
    return this.agreement?.termMonths || 11;
  }

  get tenantConfirmed(): boolean {
    return !!(this.agreement?.tenantConfirmed || this.agreement?.agreementMetadata?.tenantConfirmation?.confirmed);
  }

  get tenantConfirmedAt(): string | undefined {
    return this.agreement?.agreementMetadata?.tenantConfirmation?.confirmedAt;
  }

  get ownerConfirmed(): boolean {
    return !!(this.agreement?.ownerConfirmed || this.agreement?.status === 'CONFIRMED' || this.rental?.status === 'ACTIVE');
  }

  get ownerConfirmedAt(): string | undefined {
    return this.agreement?.confirmedAt || this.agreement?.agreementMetadata?.ownerConfirmation?.confirmedAt;
  }

  formatINR(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  confirmAsTenant(): void {
    const targetId = this.agreement?._id || this.agreement?.id || this.rental?.id;
    if (!targetId) return;

    this.isConfirming = true;
    this.confirmError = null;
    this.agreementService.tenantConfirmAgreement(targetId, {
      method: 'PLATFORM_CONSENT',
      notes: 'Tenant accepted residential lease terms via Tenant portal',
    }).subscribe({
      next: (res) => {
        this.isConfirming = false;
        if (res.success && res.data) {
          this.agreement = res.data;
        }
        this.loadData();
      },
      error: (err) => {
        this.isConfirming = false;
        this.confirmError = err?.error?.message || 'Failed to confirm agreement.';
      },
    });
  }
}
