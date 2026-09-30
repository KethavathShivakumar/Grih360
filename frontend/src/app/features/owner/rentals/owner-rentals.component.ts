import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RentalService, RentalAgreement } from '../../../core/services/rental.service';
import { MoneyService } from '../../../core/services/money.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-owner-rentals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold border border-emerald-200 mb-1.5">
            <span>📜 Telangana Model Tenancy Act Compliant</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Rental Tenancy Management</h1>
          <p class="text-xs text-slate-500">Monitor digital leases, verified tenant occupancies, and automated monthly rent collections.</p>
        </div>

        <button
          (click)="navigateTo('/owner/properties')"
          type="button"
          class="px-4 py-2 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>🏢</span>
          <span>View Property Listings</span>
        </button>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <!-- Summary Metrics Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tenancies</span>
          <span class="text-2xl font-black text-[#0F2937] mt-1 block">{{ rentals.length }}</span>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
          <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Active Leases</span>
          <span class="text-2xl font-black text-emerald-800 mt-1 block">{{ activeRentalsCount }}</span>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-b from-amber-50/40 to-white">
          <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending Signing</span>
          <span class="text-2xl font-black text-amber-800 mt-1 block">{{ pendingRentalsCount }}</span>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Monthly Yield</span>
          <span class="text-lg sm:text-xl font-black text-[#0F2937] mt-1 block truncate">{{ formatCurrency(totalMonthlyRent) }}</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          *ngFor="let tab of filterTabs"
          (click)="selectedTab = tab.key"
          type="button"
          [class]="selectedTab === tab.key ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
          class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{{ tab.label }}</span>
          <span
            [class]="selectedTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
          >
            {{ getTabCount(tab.key) }}
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching rental agreements from database..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load rental tenancies"
        [message]="errorMessage"
        (retry)="loadRentals()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && filteredRentals.length === 0"
        title="No tenancies found for this filter"
        message="Active rental agreements and leases created upon approving tenant applications will be displayed here."
        actionText="Review Applicants"
        (action)="navigateTo('/owner/applicants')"
      ></app-empty-state>

      <!-- Rentals List -->
      <div *ngIf="!isLoading && !isError && filteredRentals.length > 0" class="space-y-4">
        <div
          *ngFor="let item of filteredRentals"
          class="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E6DF] hover:border-[#2D7A5E] hover:shadow-md transition-all shadow-xs space-y-4"
        >
          <!-- Top Row: Property Title, Location, and Status Badges -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <app-status-badge [status]="item.status"></app-status-badge>
                <span class="text-xs font-semibold text-slate-400">Lease Ref: RENTAL-{{ item.id || item._id }}</span>
              </div>
              <h2 class="text-lg font-bold text-slate-900 mt-1">
                {{ getPropertyTitle(item) }}
              </h2>
              <p class="text-xs text-slate-500">
                📍 {{ getPropertyAddress(item) }}
              </p>
            </div>

            <!-- Financials Summary -->
            <div class="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Monthly Rent</span>
                <span class="text-sm font-black text-[#0F2937]">{{ formatCurrency(item.monthlyRent) }}/mo</span>
              </div>
              <div class="border-l border-slate-200 pl-4">
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Deposit</span>
                <span class="text-sm font-extrabold text-slate-700">{{ formatCurrency(item.depositPaid || item.monthlyRent * 2) }}</span>
              </div>
            </div>
          </div>

          <!-- Middle Row: Tenant & Tenancy Dates -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Primary Tenant</span>
              <span class="text-sm font-bold text-slate-900 block mt-0.5">{{ getTenantName(item) }}</span>
              <span class="text-[11px] text-slate-500">{{ getTenantContact(item) }}</span>
            </div>

            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Lease Duration</span>
              <span class="text-xs font-bold text-slate-800 block mt-0.5">
                {{ item.startDate ? (item.startDate | date: 'mediumDate') : 'Immediate' }} →
                {{ item.endDate ? (item.endDate | date: 'mediumDate') : '11 Months' }}
              </span>
              <span class="text-[10px] text-emerald-700 font-bold block mt-0.5">
                ✓ 11-Month Standard Registration
              </span>
            </div>

            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase block">Rent Collection Status</span>
              <div class="flex items-center gap-2 mt-1">
                <span
                  [ngClass]="item.rentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'"
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                >
                  {{ item.rentStatus || 'UPCOMING' }}
                </span>
                <span class="text-[11px] text-slate-500">Auto-Invoiced</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-bold">
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="viewAgreement(item)"
                type="button"
                class="px-3.5 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>📜</span>
                <span>View Digital Lease Agreement</span>
              </button>

              <button
                (click)="viewRentTracking(item)"
                type="button"
                class="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>💰</span>
                <span>Rent Collection Ledger</span>
              </button>

              <button
                (click)="viewTenantDetails(item)"
                type="button"
                class="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>👤</span>
                <span>Tenant Profile</span>
              </button>
            </div>

            <div *ngIf="item.status === 'ACTIVE' || item.status === 'CONFIRMED'">
              <button
                (click)="confirmTermination(item)"
                type="button"
                class="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                End Tenancy...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerRentalsComponent implements OnInit {
  rentals: any[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedTab: string = 'ALL';

  readonly filterTabs = [
    { key: 'ALL', label: 'All Tenancies' },
    { key: 'ACTIVE', label: 'Active Leases' },
    { key: 'PENDING', label: 'Pending Signing' },
    { key: 'TERMINATED', label: 'Ended / Terminated' },
  ];

  constructor(
    private rentalService: RentalService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRentals();
  }

  loadRentals(): void {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';

    this.rentalService.getRentals().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.rentals = res.data;
        } else {
          this.rentals = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to retrieve rental records.';
      },
    });
  }

  get filteredRentals(): any[] {
    if (this.selectedTab === 'ACTIVE') {
      return this.rentals.filter((r) => r.status === 'ACTIVE');
    }
    if (this.selectedTab === 'PENDING') {
      return this.rentals.filter((r) => r.status === 'CONFIRMED' || r.status === 'REVIEW' || r.status === 'DRAFT');
    }
    if (this.selectedTab === 'TERMINATED') {
      return this.rentals.filter((r) => r.status === 'TERMINATED' || r.status === 'EXPIRED');
    }
    return this.rentals;
  }

  get activeRentalsCount(): number {
    return this.rentals.filter((r) => r.status === 'ACTIVE').length;
  }

  get pendingRentalsCount(): number {
    return this.rentals.filter((r) => r.status === 'CONFIRMED' || r.status === 'REVIEW' || r.status === 'DRAFT').length;
  }

  get totalMonthlyRent(): number {
    return this.rentals
      .filter((r) => r.status === 'ACTIVE')
      .reduce((sum, r) => sum + (Number(r.monthlyRent) || 0), 0);
  }

  getTabCount(key: string): number {
    if (key === 'ACTIVE') return this.activeRentalsCount;
    if (key === 'PENDING') return this.pendingRentalsCount;
    if (key === 'TERMINATED') return this.rentals.filter((r) => r.status === 'TERMINATED' || r.status === 'EXPIRED').length;
    return this.rentals.length;
  }

  getPropertyTitle(item: any): string {
    return item.propertyId?.title || item.propertyTitle || 'Residential Property';
  }

  getPropertyAddress(item: any): string {
    const loc = item.propertyId?.propertyLocation;
    if (!loc) return 'Warangal, Telangana';
    return `${loc.locality || loc.address || ''}, ${loc.city || 'Telangana'}`;
  }

  getTenantName(item: any): string {
    const t = item.tenantId;
    return t?.name || t?.fullName || item.tenantName || 'Tenant Resident';
  }

  getTenantContact(item: any): string {
    const t = item.tenantId;
    const phone = t?.phone ? `+91 ${t.phone}` : '';
    const email = t?.email || '';
    return [phone, email].filter(Boolean).join(' • ') || 'Contact available upon lease activation';
  }

  formatCurrency(amount: number): string {
    return this.moneyService.formatINR(amount || 0);
  }

  viewAgreement(item: any): void {
    const propId = item.propertyId?._id || item.propertyId?.id || item.propertyId;
    if (propId) {
      this.router.navigate(['/owner/properties', propId, 'rental']);
    } else {
      this.router.navigate(['/owner/rentals', item.id || item._id]);
    }
  }

  viewRentTracking(item: any): void {
    const propId = item.propertyId?._id || item.propertyId?.id || item.propertyId;
    if (propId) {
      this.router.navigate(['/owner/properties', propId, 'rent']);
    } else {
      this.router.navigate(['/owner/rent-tracking']);
    }
  }

  viewTenantDetails(item: any): void {
    const propId = item.propertyId?._id || item.propertyId?.id || item.propertyId;
    if (propId) {
      this.router.navigate(['/owner/properties', propId, 'tenant']);
    }
  }

  confirmTermination(item: any): void {
    const reason = prompt('Please enter the reason for lease termination (e.g., Mutual Agreement, End of Term, Default):');
    if (reason === null) return;

    const rentalId = item.id || item._id;
    this.rentalService.terminateRental(rentalId, reason).subscribe({
      next: () => {
        this.successMessage = 'Tenancy terminated successfully.';
        this.loadRentals();
        setTimeout(() => (this.successMessage = ''), 3500);
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Failed to terminate tenancy.';
      },
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
