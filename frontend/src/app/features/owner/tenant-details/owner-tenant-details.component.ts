import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../../core/services/rental.service';
import { MoneyService } from '../../../core/services/money.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-tenant-details',
  standalone: true,
  imports: [
    CommonModule,
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
        Back to Property Details
      </button>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Retrieving tenant details..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Unable to load tenant details"
        [message]="errorMessage"
        (retry)="loadTenantDetails()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && !tenantData"
        title="No active tenant for this property"
        message="This property is currently vacant or under application. Review applicants to select and approve a tenant."
        actionText="Review Applicants"
        (action)="goToApplicants()"
      ></app-empty-state>

      <!-- Tenant Details Content -->
      <div *ngIf="!isLoading && !isError && tenantData" class="space-y-6">
        <!-- Tenant Card Header -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full bg-[#0F2937] text-white flex items-center justify-center font-extrabold text-2xl shrink-0">
              {{ tenantInitial }}
            </div>
            <div>
              <span class="inline-flex items-center text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ACTIVE TENANT
              </span>
              <h1 class="text-xl font-extrabold text-[#0F2937] mt-1">{{ tenantName }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Lease Status: {{ tenantData.status }}</p>
            </div>
          </div>

          <button
            (click)="goToRentTracking()"
            type="button"
            class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
          >
            💰 View Rent Tracking
          </button>
        </div>

        <!-- Contact & Lease Terms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tenant Contact -->
          <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tenant Contact Summary</h2>
            <div class="space-y-3 text-xs font-semibold text-slate-700">
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-slate-400 font-bold block">Email Address</span>
                <span class="text-sm font-bold text-slate-900">{{ tenantEmail }}</span>
              </div>
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-slate-400 font-bold block">Phone Number</span>
                <span class="text-sm font-bold text-slate-900">{{ tenantPhone }}</span>
              </div>
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-slate-400 font-bold block">Identity Verification Status</span>
                <span class="text-sm font-extrabold text-emerald-700 uppercase">VERIFIED</span>
              </div>
            </div>
          </div>

          <!-- Lease Terms -->
          <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
            <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Lease & Agreement Parameters</h2>
            <div class="space-y-3 text-xs font-semibold text-slate-700">
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-slate-400 font-bold block">Monthly Rent Amount</span>
                <span class="text-lg font-extrabold text-[#0F2937]">{{ formatRent(tenantData.monthlyRent) }}</span>
              </div>
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span class="text-slate-400 font-bold block">Security Deposit Paid</span>
                <span class="text-sm font-bold text-slate-800">{{ formatDeposit(tenantData.depositPaid) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <span class="text-slate-400 font-bold block">Lease Start</span>
                  <span class="text-xs font-bold text-slate-800">{{ tenantData.startDate | date: 'mediumDate' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 font-bold block">Agreement Version</span>
                  <span class="text-xs font-bold text-slate-800">{{ tenantData.agreementVersion || 'v1.0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerTenantDetailsComponent implements OnInit {
  propertyId: string = '';
  tenantData: any = null;

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
      this.loadTenantDetails();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid property ID.';
      this.isLoading = false;
    }
  }

  loadTenantDetails(): void {
    this.isLoading = true;
    this.isError = false;

    this.rentalService.getTenantByPropertyId(this.propertyId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.isLoading = false;
          this.tenantData = res.data;
        } else {
          this.loadTenantViaRental();
        }
      },
      error: () => {
        this.loadTenantViaRental();
      },
    });
  }

  private loadTenantViaRental(): void {
    this.rentalService.getRentalById(this.propertyId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const r = res.data;
          this.tenantData = {
            rentalId: r.id || r._id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            monthlyRent: r.monthlyRent,
            depositPaid: r.depositPaid,
            agreementVersion: r.agreementVersion,
            tenant: r.tenantId,
            property: r.propertyId,
          };
        } else {
          this.tenantData = null;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Tenant details could not be retrieved.';
      }
    });
  }

  get tenantName(): string {
    const t = this.tenantData?.tenant;
    return t?.name || t?.fullName || 'Active Tenant';
  }

  get tenantInitial(): string {
    return this.tenantName.charAt(0).toUpperCase();
  }

  get tenantEmail(): string {
    return this.tenantData?.tenant?.email || 'tenant@nivas360.com';
  }

  get tenantPhone(): string {
    return this.tenantData?.tenant?.phone || 'Contact provided in agreement';
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  formatDeposit(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  goToApplicants(): void {
    const pId = this.tenantData?.property?._id || this.tenantData?.property?.id || this.propertyId;
    if (pId) {
      this.router.navigate(['/owner/properties', pId, 'applicants']);
    } else {
      this.router.navigate(['/owner/applicants']);
    }
  }

  goToRentTracking(): void {
    const pId = this.tenantData?.property?._id || this.tenantData?.property?.id || this.propertyId;
    if (pId) {
      this.router.navigate(['/owner/properties', pId, 'rent']);
    } else {
      this.router.navigate(['/owner/rent-tracking']);
    }
  }

  goBack(): void {
    const pId = this.tenantData?.property?._id || this.tenantData?.property?.id || this.propertyId;
    if (pId) {
      this.router.navigate(['/owner/properties', pId]);
    } else {
      this.router.navigate(['/owner/properties']);
    }
  }
}
