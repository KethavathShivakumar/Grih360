import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService, RentalAgreement as RentalRecord } from '../../../core/services/rental.service';
import { AgreementService, RentalAgreement } from '../../../core/services/agreement.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-rental-details',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Back Navigation & Quick Actions -->
      <div class="flex items-center justify-between">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Property Listing
        </button>

        <button
          *ngIf="rental"
          (click)="navigateToRent()"
          type="button"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          💰 Rent Collection Records →
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rental & lease agreement details..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Rental details unavailable"
        [message]="errorMessage"
        (retry)="loadRental()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !rental && !agreement"
        title="No active rental agreement for this property"
        message="A rental agreement record is automatically generated when an owner approves a prospective tenant's application."
      ></app-empty-state>

      <!-- Content -->
      <div *ngIf="!isLoading && !isError && (rental || agreement)" class="space-y-6">

        <!-- Regulatory Notice Banner (Phase 6 Compliance) -->
        <div class="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-5 shadow-xs">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-lg shrink-0 font-black">
              🛡️
            </div>
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                  Regulatory Notice
                </span>
                <span class="text-xs font-black text-amber-950">
                  {{ agreement?.agreementMetadata?.eSignNotice || 'Digital signature integration required' }}
                </span>
              </div>
              <p class="text-xs text-amber-900 leading-relaxed font-medium">
                {{ agreement?.agreementMetadata?.legalNotice || 'Standard platform lease draft. Digital signature integration required for legal execution.' }}
                Owner confirmation authorizes platform rental activation and schedules monthly rent collection.
              </p>
            </div>
          </div>
        </div>

        <!-- Status Card & Stepper -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rental Reference</span>
              <h1 class="text-xl sm:text-2xl font-black text-[#0F2937]">
                RENTAL-{{ rental?.id || agreement?.rentalId }}
              </h1>
              <p class="text-xs text-slate-500 mt-0.5">Agreement Version: {{ agreement?.agreementVersion || rental?.agreementVersion || 'v1.0' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <app-status-badge [status]="currentStatus"></app-status-badge>
            </div>
          </div>

          <!-- Lifecycle Stepper -->
          <div class="space-y-3">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Lease & Tenancy Lifecycle</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <!-- Step 1 -->
              <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 1</span>
                <span class="font-bold text-slate-900 block">Application</span>
                <span class="text-[11px] text-emerald-700 font-semibold">✓ Approved</span>
              </div>
              <!-- Step 2 -->
              <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 2</span>
                <span class="font-bold text-slate-900 block">Agreement Draft</span>
                <span class="text-[11px] text-emerald-700 font-semibold">✓ Generated</span>
              </div>
              <!-- Step 3 -->
              <div class="p-3.5 rounded-2xl space-y-1 border" [class]="ownerConfirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-300'">
                <span class="text-[10px] font-extrabold uppercase block" [class]="ownerConfirmed ? 'text-emerald-800' : 'text-amber-800'">Step 3</span>
                <span class="font-bold text-slate-900 block">Owner Confirmation</span>
                <span class="text-[11px] font-semibold" [class]="ownerConfirmed ? 'text-emerald-700' : 'text-amber-700'">
                  {{ ownerConfirmed ? '✓ Confirmed' : 'Action Required' }}
                </span>
              </div>
              <!-- Step 4 -->
              <div class="p-3.5 rounded-2xl space-y-1 border" [class]="isRentalActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'">
                <span class="text-[10px] font-extrabold uppercase block" [class]="isRentalActive ? 'text-emerald-800' : 'text-slate-400'">Step 4</span>
                <span class="font-bold block" [class]="isRentalActive ? 'text-slate-900' : 'text-slate-500'">Rental Activation</span>
                <span class="text-[11px] font-semibold" [class]="isRentalActive ? 'text-emerald-700' : 'text-slate-400'">
                  {{ isRentalActive ? '✓ Active Tenancy' : 'Pending Confirmation' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Parties Details (Owner & Tenant) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Tenant</span>
              <span class="font-black text-sm text-[#0F2937] block">{{ tenantName }}</span>
              <span class="text-xs text-slate-500 block">{{ tenantEmail }}</span>
              <div class="pt-1 text-[11px] font-bold" [class]="tenantConfirmed ? 'text-emerald-700' : 'text-amber-700'">
                {{ tenantConfirmed ? '✓ Tenant Confirmed Agreement' : '⏳ Awaiting Tenant Confirmation' }}
              </div>
            </div>

            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Owner Representation</span>
              <span class="font-black text-sm text-[#0F2937] block">{{ ownerName }}</span>
              <span class="text-xs text-slate-500 block">{{ ownerEmail }}</span>
              <div class="pt-1 text-[11px] font-bold" [class]="ownerConfirmed ? 'text-emerald-700' : 'text-amber-700'">
                {{ ownerConfirmed ? '✓ Owner Confirmed & Activated' : '⚠️ Pending Your Confirmation' }}
              </div>
            </div>
          </div>

          <!-- Financial & Term Parameters Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Monthly Rent</span>
              <span class="text-lg font-black text-[#0F2937] block mt-0.5">{{ formatRent(agreedRent) }}</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Security Deposit</span>
              <span class="text-lg font-black text-slate-800 block mt-0.5">{{ formatDeposit(agreedDeposit) }}</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lease Start Date</span>
              <span class="text-xs font-extrabold text-slate-800 block mt-1.5">{{ startDate | date: 'mediumDate' }}</span>
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lease End Date</span>
              <span class="text-xs font-extrabold text-slate-800 block mt-1.5">{{ endDate | date: 'mediumDate' }}</span>
            </div>
          </div>

          <!-- Terms Summary -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Agreement Terms Summary</span>
            <p class="text-xs text-slate-600 leading-relaxed font-medium">
              {{ agreement?.termsSummary || 'Standard Nivas360 Residential Rental Agreement v1.0. Zero-brokerage direct lease adhering to Model Tenancy Act principles.' }}
            </p>
          </div>

          <!-- Confirmation Actions Bar -->
          <div class="border-t border-slate-100 pt-5 space-y-4">
            <div *ngIf="!ownerConfirmed && currentStatus !== 'CANCELLED'" class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#0F2937] to-[#164E63] text-white p-5 rounded-2xl">
              <div>
                <h3 class="font-black text-sm text-[#FACC15]">Confirm Agreement & Activate Tenancy</h3>
                <p class="text-xs text-slate-300 mt-0.5">
                  Confirming the agreement sets the rental to ACTIVE, reserves the property as RENTED, and schedules rent collections.
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  (click)="cancelAgreement()"
                  [disabled]="isActioning"
                  type="button"
                  class="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  (click)="confirmAsOwner()"
                  [disabled]="isActioning"
                  type="button"
                  class="px-5 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-black rounded-xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                >
                  {{ isActioning ? 'Activating...' : '✓ Confirm Agreement & Activate Rental' }}
                </button>
              </div>
            </div>

            <!-- Active Status Banner -->
            <div *ngIf="isRentalActive" class="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
                  ✓
                </div>
                <div>
                  <h4 class="font-extrabold text-sm text-emerald-950">Rental Management is ACTIVE</h4>
                  <p class="text-xs text-emerald-700">Tenancy confirmed and property marked as RENTED. Track upcoming rent and tenant details.</p>
                </div>
              </div>

              <button
                (click)="navigateToRent()"
                type="button"
                class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all shrink-0 cursor-pointer"
              >
                View Rent Tracking →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class OwnerRentalDetailsComponent implements OnInit {
  propertyId: string = '';
  rental: RentalRecord | null = null;
  agreement: RentalAgreement | null = null;

  isLoading: boolean = true;
  isError: boolean = false;
  isActioning: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rentalService: RentalService,
    private agreementService: AgreementService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadRental();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid property ID.';
      this.isLoading = false;
    }
  }

  loadRental(): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getRentalByPropertyId(this.propertyId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.rental = res.data;
          const rId = this.rental?.id || (this.rental as any)?._id;
          if (rId) {
            this.agreementService.getAgreementByRentalId(rId).subscribe({
              next: (agreeRes) => {
                this.isLoading = false;
                if (agreeRes.success && agreeRes.data) {
                  this.agreement = agreeRes.data;
                }
              },
              error: () => {
                this.isLoading = false;
              },
            });
          } else {
            this.isLoading = false;
          }
        } else {
          this.rental = null;
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load rental agreement details.';
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
    return this.agreement?.propertyId?.title || (this.rental as any)?.propertyId?.title || 'Rental Property';
  }

  get ownerName(): string {
    return this.agreement?.ownerId?.name || (this.rental as any)?.ownerId?.name || 'Property Owner';
  }

  get ownerEmail(): string {
    return this.agreement?.ownerId?.email || (this.rental as any)?.ownerId?.email || 'owner@nivas360.com';
  }

  get tenantName(): string {
    return this.agreement?.tenantId?.name || (this.rental as any)?.tenantId?.name || 'Prospective Tenant';
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

  get tenantConfirmed(): boolean {
    return !!(this.agreement?.tenantConfirmed || this.agreement?.agreementMetadata?.tenantConfirmation?.confirmed);
  }

  get ownerConfirmed(): boolean {
    return !!(this.agreement?.ownerConfirmed || this.agreement?.status === 'CONFIRMED' || this.rental?.status === 'ACTIVE');
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  formatDeposit(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  confirmAsOwner(): void {
    const targetId = this.agreement?._id || this.agreement?.id || this.rental?.id || (this.rental as any)?._id;
    if (!targetId) return;

    this.isActioning = true;
    this.agreementService.confirmAgreement(targetId, {
      method: 'PLATFORM_CONSENT',
      notes: 'Owner approved lease agreement and activated active tenancy',
    }).subscribe({
      next: (res) => {
        this.isActioning = false;
        if (res.success && res.data) {
          this.agreement = res.data;
        }
        this.loadRental();
      },
      error: (err) => {
        this.isActioning = false;
        alert(err?.error?.message || 'Failed to confirm agreement.');
      },
    });
  }

  cancelAgreement(): void {
    const reason = prompt('Please enter cancellation reason:', 'Mutual agreement cancellation');
    if (!reason) return;

    const targetId = this.agreement?._id || this.agreement?.id || this.rental?.id;
    if (!targetId) return;

    this.isActioning = true;
    this.agreementService.cancelAgreement(targetId, reason).subscribe({
      next: () => {
        this.isActioning = false;
        this.loadRental();
      },
      error: (err) => {
        this.isActioning = false;
        alert(err?.error?.message || 'Failed to cancel agreement.');
      },
    });
  }

  navigateToRent(): void {
    this.router.navigate(['/owner/properties', this.propertyId, 'rent']);
  }

  goBack(): void {
    this.router.navigate(['/owner/properties', this.propertyId]);
  }
}
