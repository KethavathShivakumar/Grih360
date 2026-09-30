import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { RentalService, RentalAgreement } from '../../core/services/rental.service';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { MoneyService } from '../../core/services/money.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeComponent,
    CustomerCareComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">

      <!-- Welcome Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="space-y-2 relative z-10 max-w-2xl">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>🏡 Tenant Residence Portal</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {{ tenantName }} 👋</h1>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Discover verified zero-brokerage listings, track rental applications, monitor active rent schedules, and request instant home maintenance services.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <a
            routerLink="/tenant/homes"
            class="px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-extrabold rounded-2xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <span>🔍 Explore Homes</span>
          </a>
          <a
            routerLink="/tenant/search"
            class="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-extrabold rounded-2xl text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡ Search Listings</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Calculating dashboard analytics and tenancy parameters..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load tenant dashboard"
        [message]="errorMessage"
        (retry)="loadAllData()"
      ></app-error-state>

      <!-- Main Dashboard Content -->
      <div *ngIf="!isLoading && !isError" class="space-y-6">

        <!-- Regulatory & Zero Brokerage Banner -->
        <div class="accent-bento-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-amber-50 via-amber-100/40 to-amber-50 border border-amber-200/80 p-6 rounded-3xl">
          <div class="space-y-2 max-w-xl">
            <div class="inline-flex items-center space-x-2 bg-amber-200/70 text-amber-900 px-3 py-0.5 rounded-full text-xs font-black">
              <span>🛡️ Nivas360 Verification Guarantee</span>
            </div>
            <h2 class="text-lg font-black text-[#0F2937]">Zero Brokerage & Model Tenancy Act Compliance</h2>
            <p class="text-xs text-amber-900/80 font-medium leading-relaxed">
              All properties are listed direct from owners with verified title deeds, standardized biometric agreements, and online rent receipts.
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <div class="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs">
              <span class="text-2xl font-black text-[#0F2937]">₹0</span>
              <span class="block text-[10px] font-bold text-amber-900 uppercase">Brokerage Fee</span>
            </div>
            <div class="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs">
              <span class="text-2xl font-black text-[#0F2937]">100%</span>
              <span class="block text-[10px] font-bold text-amber-900 uppercase">Direct Owners</span>
            </div>
          </div>
        </div>

        <!-- Metric Cards Grid (Real Database Records) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Metric 1: Active Tenancy Status -->
          <div
            (click)="navigateTo(activeRental ? '/tenant/rent' : '/tenant/homes')"
            class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tenancy Status</span>
              <span class="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                🏠
              </span>
            </div>
            <span class="text-xl font-black text-[#0F2937] mt-3 block truncate">
              {{ activeRental ? (formatINR(activeRental.monthlyRent) + '/mo') : 'No Active Lease' }}
            </span>
            <span class="text-xs font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform" [class]="activeRental ? 'text-[#2D7A5E]' : 'text-slate-500'">
              {{ activeRental ? ('Rent ' + (activeRental.rentStatus || 'UPCOMING') + ' →') : 'Find a Home →' }}
            </span>
          </div>

          <!-- Metric 2: Applications -->
          <div
            (click)="navigateTo('/tenant/applications')"
            class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Applications</span>
              <span class="p-2 bg-emerald-50 text-[#2D7A5E] rounded-xl group-hover:scale-110 transition-transform">
                📄
              </span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ applicationCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Track Applications →
            </span>
          </div>

          <!-- Metric 3: Saved Homes -->
          <div
            (click)="navigateTo('/tenant/saved')"
            class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bookmarked Homes</span>
              <span class="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                ❤️
              </span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ savedCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Saved Homes →
            </span>
          </div>

          <!-- Metric 4: Unread Notifications -->
          <div
            (click)="navigateTo('/tenant/notifications')"
            class="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Unread Alerts</span>
              <span class="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                🔔
              </span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ unreadNotificationCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Alerts →
            </span>
          </div>
        </div>

        <!-- Active Rental Overview Card (If Tenant has an Active Tenancy) -->
        <div *ngIf="activeRental" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                  My Active Tenancy
                </span>
                <span class="text-xs text-slate-400 font-semibold">• Agreement {{ activeRental.agreementVersion || 'v1.0' }}</span>
              </div>
              <h3 class="text-xl font-black text-[#0F2937] mt-1">{{ rentalPropertyTitle }}</h3>
              <p class="text-xs text-slate-500">📍 {{ rentalPropertyLocation }}</p>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="px-3 py-1 rounded-full text-xs font-black uppercase"
                [class]="activeRental.rentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              >
                Rent: {{ activeRental.rentStatus || 'UPCOMING' }}
              </span>
            </div>
          </div>

          <!-- Quick Navigation Actions for Active Tenancy -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <a
              routerLink="/tenant/rent"
              class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
            >
              <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">💰</span>
              Rent Tracking
            </a>
            <a
              routerLink="/tenant/rental"
              class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
            >
              <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📜</span>
              Lease Agreement
            </a>
            <a
              routerLink="/tenant/handover"
              class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
            >
              <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📋</span>
              Handover List
            </a>
            <a
              routerLink="/tenant/condition"
              class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
            >
              <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📸</span>
              Condition Log
            </a>
            <a
              routerLink="/tenant/documents"
              class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
            >
              <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">📁</span>
              Vault & Receipts
            </a>
          </div>
        </div>

        <!-- Quick Actions Grid (All 23 Tenant Workspace Tools) -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h2 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Tenant Workspace Hub & Tools</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <button
              (click)="navigateTo('/tenant/homes')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">🔍</span>
              Find Homes
            </button>
            <button
              (click)="navigateTo('/tenant/search')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">⚡</span>
              Search Results
            </button>
            <button
              (click)="navigateTo('/tenant/saved')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">❤️</span>
              Saved Homes
            </button>
            <button
              (click)="navigateTo('/tenant/applications')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">📄</span>
              Applications
            </button>
            <button
              (click)="navigateTo('/tenant/verification')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">🛡️</span>
              Verification
            </button>
            <button
              (click)="navigateTo('/tenant/rental')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">🏠</span>
              My Rental
            </button>
            <button
              (click)="navigateTo('/tenant/rent')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">💰</span>
              Rent Tracking
            </button>
            <button
              (click)="navigateTo('/tenant/documents')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">📁</span>
              Documents
            </button>
            <button
              (click)="navigateTo('/tenant/handover')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">📋</span>
              Handover List
            </button>
            <button
              (click)="navigateTo('/tenant/condition')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">📸</span>
              Condition Log
            </button>
            <button
              (click)="navigateTo('/tenant/services')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">🛠️</span>
              Home Services
            </button>
            <button
              (click)="navigateTo('/tenant/settings')"
              type="button"
              class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
            >
              <span class="block text-2xl mb-1 group-hover:scale-110 transition-transform">⚙️</span>
              Settings
            </button>
          </div>
        </div>

        <!-- Recent Applications Section -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-extrabold text-[#0F2937]">Recent Rental Applications</h3>
              <p class="text-xs text-slate-500">Live review status from property owners</p>
            </div>
            <a routerLink="/tenant/applications" class="text-xs font-bold text-[#2D7A5E] hover:underline cursor-pointer">
              View All Applications →
            </a>
          </div>

          <div *ngIf="recentApplications.length > 0" class="space-y-3">
            <div
              *ngFor="let app of recentApplications"
              (click)="navigateTo('/tenant/applications/' + (app.id || app._id))"
              class="p-4 bg-slate-50/80 hover:bg-slate-100 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition"
            >
              <div>
                <div class="flex items-center gap-2">
                  <app-status-badge [status]="app.status"></app-status-badge>
                  <span class="text-[11px] text-slate-400 font-semibold">{{ app.createdAt | date: 'mediumDate' }}</span>
                </div>
                <h4 class="text-sm font-extrabold text-slate-900 mt-1">
                  {{ app.propertyId?.title || 'Rental Residence' }}
                </h4>
              </div>

              <div class="flex items-center gap-4 text-xs font-bold">
                <span class="text-[#0F2937]">{{ formatINR(app.proposedRent) }}/mo</span>
                <span class="text-[#2D7A5E]">View Details →</span>
              </div>
            </div>
          </div>

          <div *ngIf="recentApplications.length === 0" class="py-6 text-center text-xs text-slate-400 font-semibold">
            No rental applications submitted yet. Browse homes to submit an application.
          </div>
        </div>

        <!-- Customer Care Support Banner -->
        <app-customer-care></app-customer-care>

      </div>
    </div>
  `,
})
export class TenantDashboardComponent implements OnInit {
  savedCount: number = 0;
  applicationCount: number = 0;
  unreadNotificationCount: number = 0;
  activeRental: RentalAgreement | null = null;
  recentApplications: any[] = [];

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private rentalService: RentalService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  get tenantName(): string {
    const u = this.authService.currentUserSignal();
    return u?.fullName || u?.name || 'Tenant';
  }

  get rentalPropertyTitle(): string {
    return (this.activeRental as any)?.propertyId?.title || 'Residential Rental Home';
  }

  get rentalPropertyLocation(): string {
    const loc = (this.activeRental as any)?.propertyId?.propertyLocation;
    return loc ? `${loc.locality || loc.address || ''}, ${loc.city || ''}` : 'Telangana / Andhra Pradesh';
  }

  loadAllData(): void {
    this.isLoading = true;
    this.isError = false;

    // 1. Saved Homes
    this.propertyService.getSavedProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedCount = res.data.length;
        }
      },
    });

    // 2. Active Rental
    this.rentalService.getRentals().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.activeRental = res.data[0];
        } else {
          this.activeRental = null;
        }
      },
    });

    // 3. Applications
    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.recentApplications = res.data.slice(0, 3);
          this.applicationCount = res.data.filter((a: any) =>
            !['REJECTED', 'WITHDRAWN'].includes(a.status)
          ).length;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to retrieve tenant dashboard metrics.';
      },
    });

    // 4. Notifications
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.unreadNotificationCount = res.data.filter((n: any) => !n.isRead).length;
        }
      },
    });
  }

  formatINR(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
