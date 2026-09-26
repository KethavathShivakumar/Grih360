import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OwnerService, OwnerDashboardMetrics } from '../../../core/services/owner.service';
import { AuthService } from '../../../core/services/auth.service';
import { MoneyService } from '../../../core/services/money.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CustomerCareComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Welcome Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-60 h-60 bg-[#FACC15]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="space-y-2 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>🏛️ Property Owner Command Center</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {{ ownerName }} 👋</h1>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
            Manage your property portfolio, screen Aadhaar-verified tenant applications, and monitor automated rent collections.
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

      <!-- Accent Highlight Bento Card (Inspired by Reference Image 1 & 2) -->
      <div class="accent-bento-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center space-x-2 bg-amber-200/70 text-amber-900 px-3 py-1 rounded-full text-xs font-black">
            <span>📈 Portfolio Overview & Income Summary</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F2937]">Maximized Rental Yields & Verified Tenancies</h2>
          <p class="text-xs text-amber-900/80 font-medium leading-relaxed">
            All applications pass Model Tenancy Act identity checks and background verification. Manage your active leases and view live collection metrics.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5">
            <span class="text-2xl font-black text-[#0F2937]">0%</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Broker Commission</span>
          </div>
          <div class="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5">
            <span class="text-2xl font-black text-[#0F2937]">100%</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Digital Leases</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Calculating dashboard metrics..."></app-loading-state>

      <!-- Metrics Grid (Bento Style) -->
      <div *ngIf="!isLoading && metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Card 1: Total Properties -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Properties</span>
            <span class="p-2.5 bg-slate-100 text-[#0F2937] rounded-2xl group-hover:scale-110 transition-transform">🏠</span>
          </div>
          <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ metrics.totalProperties }}</span>
          <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View All Listings →
          </span>
        </div>

        <!-- Card 2: Vacant / Available -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Vacant / Available</span>
            <span class="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl group-hover:scale-110 transition-transform">🔑</span>
          </div>
          <span class="text-3xl font-black text-emerald-800 mt-3 block">{{ metrics.availableProperties }}</span>
          <span class="text-xs text-slate-400 font-semibold mt-2 block">Ready for immediate lease</span>
        </div>

        <!-- Card 3: Pending Applications -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pending Applicants</span>
            <span class="p-2.5 bg-amber-50 text-amber-700 rounded-2xl group-hover:scale-110 transition-transform">📋</span>
          </div>
          <span class="text-3xl font-black text-amber-700 mt-3 block">{{ metrics.pendingApplications }}</span>
          <span class="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Review Applications →
          </span>
        </div>

        <!-- Card 4: Upcoming Rent Sum -->
        <div (click)="navigateTo('/owner/properties')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rent Tracking</span>
            <span class="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl group-hover:scale-110 transition-transform">💰</span>
          </div>
          <span class="text-2xl font-black text-[#0F2937] mt-3 block">{{ formatCurrency(metrics.upcomingRent) }}</span>
          <span class="text-xs text-slate-400 font-semibold mt-2 block">Monthly expected rent</span>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h2 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Owner Quick Workspace Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            (click)="navigateTo('/owner/profile')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">👤</span>
            Owner Profile
          </button>
          <button
            (click)="navigateTo('/owner/notifications')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🔔</span>
            Notifications
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
    this.ownerService.getDashboardMetrics().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.metrics = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
        this.metrics = {
          totalProperties: 0,
          availableProperties: 0,
          occupiedProperties: 0,
          totalApplications: 0,
          pendingApplications: 0,
          activeRentals: 0,
          upcomingRent: 0,
          overdueRent: 0,
        };
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
