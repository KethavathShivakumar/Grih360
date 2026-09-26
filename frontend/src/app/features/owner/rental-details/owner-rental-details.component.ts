import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
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
      <!-- Back Navigation -->
      <button
        (click)="goBack()"
        type="button"
        class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Property Listing
      </button>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rental details..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Rental details unavailable"
        [message]="errorMessage"
        (retry)="loadRental()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !rental"
        title="No active rental agreement for this property"
        message="A rental record is automatically generated when an owner approves a prospective tenant's application."
      ></app-empty-state>

      <!-- Content -->
      <div *ngIf="!isLoading && !isError && rental" class="space-y-6">
        <!-- Status Card -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase">Rental Reference</span>
              <h1 class="text-xl font-extrabold text-[#0F2937]">RENTAL-{{ rental.id }}</h1>
            </div>
            <app-status-badge [status]="rental.status"></app-status-badge>
          </div>

          <!-- Lifecycle Stepper -->
          <div class="pt-2">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Rental Lifecycle</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 1</span>
                <span class="font-bold text-slate-900 block">Application Approval</span>
                <span class="text-[11px] text-emerald-700 font-semibold">Completed</span>
              </div>
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 2</span>
                <span class="font-bold text-slate-900 block">Agreement Setup</span>
                <span class="text-[11px] text-emerald-700 font-semibold">Version {{ rental.agreementVersion || 'v1.0' }}</span>
              </div>
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 3</span>
                <span class="font-bold text-slate-900 block">Owner Confirmation</span>
                <span class="text-[11px] text-emerald-700 font-semibold">Confirmed</span>
              </div>
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span class="text-[10px] font-extrabold text-emerald-800 uppercase block">Step 4</span>
                <span class="font-bold text-slate-900 block">Rental Active</span>
                <span class="text-[11px] text-emerald-700 font-semibold">Active Occupancy</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rental Parameters Grid -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Financial & Term Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-xs text-slate-400 font-bold block">Monthly Rent</span>
              <span class="text-lg font-extrabold text-[#0F2937]">{{ formatRent(rental.monthlyRent) }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span class="text-xs text-slate-400 font-bold block">Security Deposit</span>
              <span class="text-lg font-extrabold text-slate-800">{{ formatDeposit(rental.depositPaid) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-slate-200">
            <div>
              <span class="text-slate-400 font-bold block">Lease Start Date</span>
              <span class="text-slate-800 font-bold">{{ rental.startDate | date: 'longDate' }}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block">Lease End Date</span>
              <span class="text-slate-800 font-bold">{{ rental.endDate | date: 'longDate' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRentalDetailsComponent implements OnInit {
  propertyId: string = '';
  rental: RentalAgreement | null = null;

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rentalService: RentalService,
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
        this.isLoading = false;
        if (res.success && res.data) {
          this.rental = res.data;
        } else {
          this.rental = null;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load rental agreement details.';
      },
    });
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  formatDeposit(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  goBack(): void {
    this.router.navigate(['/owner/properties', this.propertyId]);
  }
}
