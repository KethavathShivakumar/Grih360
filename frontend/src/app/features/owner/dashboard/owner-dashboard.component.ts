import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OwnerService, OwnerDashboardMetrics } from '../../../core/services/owner.service';
import { AuthService } from '../../../core/services/auth.service';
import { MoneyService } from '../../../core/services/money.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Welcome Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-800 relative overflow-hidden">
        <div class="space-y-2 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-[#1E3A8A] px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-blue-900">
            <span>🏛️ Property Owner Command Center</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Welcome, {{ ownerName }} 👋</h1>
          <p class="text-xs sm:text-sm text-slate-100 max-w-xl font-medium">
            Manage your property portfolio, screen tenant applications, and monitor automated rent collections.
          </p>
        </div>

        <button
          (click)="navigateTo('/owner/properties/new')"
          type="button"
          class="px-6 py-3 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-extrabold rounded-2xl text-xs shadow-md transition-all hover:scale-105 shrink-0 relative z-10 cursor-pointer flex items-center gap-2"
        >
          <span>➕ Add New Property</span>
          <span class="text-base">→</span>
        </button>
      </div>

      <!-- Accent Highlight Bento Card -->
      <div class="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FEF9C3] border border-[#FDE047] p-5 sm:p-6 rounded-3xl shadow-2xs">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center space-x-2 bg-amber-200/90 text-amber-950 px-3 py-1 rounded-full text-xs font-black">
            <span>📈 Portfolio Overview & Income Summary</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F2937]">Maximized Rental Yields & Verified Tenancies</h2>
          <p class="text-xs text-amber-950 font-bold leading-relaxed">
            All applications pass Model Tenancy Act identity checks and background verification. Manage your active leases and view live collection metrics.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-white p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs">
            <span class="text-2xl font-black text-[#0F2937]">0%</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Broker Commission</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs">
            <span class="text-2xl font-black text-[#0F2937]">100%</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Digital Leases</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Calculating dashboard metrics..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Unable to load dashboard metrics"
        [message]="errorMessage"
        (retry)="loadMetrics()"
      ></app-error-state>

      <!-- Empty State: New Owner with 0 Properties -->
      <app-empty-state
        *ngIf="!isLoading && !isError && metrics && metrics.totalProperties === 0"
        title="Welcome to your Owner Command Center"
        message="You haven't listed any properties yet. Add your first real estate listing to begin receiving tenant applications and collecting digital rent."
        actionText="Add First Property Listing"
        (action)="navigateTo('/owner/properties/new')"
      ></app-empty-state>

      <!-- Metrics Grid (Bento Style) -->
      <div *ngIf="!isLoading && !isError && metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <!-- Card 1: Total Properties -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Properties</span>
            <span class="p-2 bg-slate-100 text-[#0F2937] rounded-xl group-hover:scale-110 transition-transform text-sm">🏠</span>
          </div>
          <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ metrics.totalProperties }}</span>
          <span class="text-[11px] text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View All →
          </span>
        </div>

        <!-- Card 2: Vacant / Available -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Vacant Homes</span>
            <span class="p-2 bg-emerald-50 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform text-sm">🔑</span>
          </div>
          <span class="text-3xl font-black text-emerald-800 mt-3 block">{{ metrics.availableProperties }}</span>
          <span class="text-[11px] text-slate-400 font-semibold mt-2 block">Available to lease</span>
        </div>

        <!-- Card 3: Active Rentals / Tenancies -->
        <div (click)="navigateTo('/owner/rentals')" class="bg-white p-5 rounded-3xl border border-emerald-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-gradient-to-b from-emerald-50/30 to-white">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Active Rentals</span>
            <span class="p-2 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-110 transition-transform text-sm">📜</span>
          </div>
          <span class="text-3xl font-black text-emerald-900 mt-3 block">{{ metrics.activeRentals ?? 0 }}</span>
          <span class="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Active Leases →
          </span>
        </div>

        <!-- Card 4: New Applications (Submitted) -->
        <div (click)="navigateTo('/owner/applicants')" class="bg-white p-5 rounded-3xl border border-amber-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-gradient-to-b from-amber-50/40 to-white">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">New Applications</span>
            <span class="p-2 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-110 transition-transform text-sm">✨</span>
          </div>
          <span class="text-3xl font-black text-amber-800 mt-3 block">{{ metrics.newApplications ?? 0 }}</span>
          <span class="text-[11px] text-amber-700 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Review Submitted →
          </span>
        </div>

        <!-- Card 5: Applications Under Review (Applicant Decision Dossiers) -->
        <div (click)="navigateTo('/owner/applicants')" class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Applicant Reviews</span>
            <span class="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-110 transition-transform text-sm">📋</span>
          </div>
          <span class="text-3xl font-black text-slate-800 mt-3 block">{{ metrics.pendingApplications }}</span>
          <span class="text-[11px] text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Track Pipeline →
          </span>
        </div>

        <!-- Card 6: Monthly Rent Records -->
        <div (click)="navigateTo('/owner/rent-tracking')" class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Monthly Rent</span>
            <span class="p-2 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform text-sm">💰</span>
          </div>
          <span class="text-xl font-black text-[#0F2937] mt-3 block">{{ formatCurrency(metrics.upcomingRent) }}</span>
          <span class="text-[11px] text-slate-400 font-semibold mt-2 block">Expected collection</span>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h2 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Owner Workspace Quick Navigation</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            (click)="navigateTo('/owner/properties/new')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">➕</span>
            Add Property
          </button>
          <button
            (click)="navigateTo('/owner/properties')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🏢</span>
            My Properties
          </button>
          <button
            (click)="navigateTo('/owner/applicants')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📋</span>
            Applicants
          </button>
          <button
            (click)="navigateTo('/owner/rentals')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📜</span>
            Rental Leases
          </button>
          <button
            (click)="navigateTo('/owner/rent-tracking')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">💰</span>
            Rent Tracking
          </button>
          <button
            (click)="navigateTo('/owner/notifications')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🔔</span>
            Notifications
          </button>
          <button
            (click)="navigateTo('/owner/profile')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">👤</span>
            Owner Profile
          </button>
          <button
            (click)="navigateTo('/owner/settings')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">⚙️</span>
            Settings
          </button>
        </div>
      </div>

      <!-- Customer Support Banner -->
      <app-customer-care></app-customer-care>
    </div>
  `,
})
export class OwnerDashboardComponent implements OnInit {
  metrics: OwnerDashboardMetrics | null = null;
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private ownerService: OwnerService,
    private authService: AuthService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  get ownerName(): string {
    const u = this.authService.currentUserSignal();
    return u?.fullName || u?.name || 'Property Owner';
  }

  loadMetrics(): void {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';

    this.ownerService.getDashboardMetrics().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.metrics = res.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to calculate owner dashboard metrics.';
      },
    });
  }

  formatCurrency(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
