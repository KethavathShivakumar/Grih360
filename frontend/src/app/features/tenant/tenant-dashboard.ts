import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CustomerCareComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Welcome Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-60 h-60 bg-[#FACC15]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="space-y-2 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>🏡 Tenant Residence Portal</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {{ tenantName }} 👋</h1>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
            Discover verified zero-brokerage listings, track active rental applications, and request instant home maintenance services.
          </p>
        </div>

        <button
          (click)="navigateTo('/tenant/homes')"
          type="button"
          class="px-6 py-3 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-extrabold rounded-2xl text-xs shadow-md transition-all hover:scale-105 shrink-0 relative z-10 cursor-pointer flex items-center gap-2"
        >
          <span>🔍 Explore Homes</span>
          <span class="text-base">→</span>
        </button>
      </div>

      <!-- Accent Highlight Bento Card (Inspired by Reference Image 1 & 2) -->
      <div class="accent-bento-card relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center space-x-2 bg-amber-200/70 text-amber-900 px-3 py-1 rounded-full text-xs font-black">
            <span>🛡️ Nivas360 Verification Guarantee</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F2937]">Zero Brokerage & Model Tenancy Act Compliant</h2>
          <p class="text-xs text-amber-900/80 font-medium leading-relaxed">
            All listed homes in Telangana & Andhra Pradesh are direct from property owners with verified title deeds, standardized biometric agreements, and online rent receipts.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5">
            <span class="text-2xl font-black text-[#0F2937]">4,9★</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Tenant Rating</span>
          </div>
          <div class="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-300 text-center space-y-0.5">
            <span class="text-2xl font-black text-[#0F2937]">100%</span>
            <span class="block text-[10px] font-bold text-amber-900 uppercase">Direct Owners</span>
          </div>
        </div>
      </div>

      <!-- Metric Cards Grid (Bento Style) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <!-- Metric 1: Saved Homes -->
        <div (click)="navigateTo('/tenant/saved')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bookmarked Homes</span>
            <span class="p-2.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </span>
          </div>
          <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ savedCount }}</span>
          <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Bookmarked Properties →
          </span>
        </div>

        <!-- Metric 2: Applications -->
        <div (click)="navigateTo('/tenant/applications')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Applications</span>
            <span class="p-2.5 bg-emerald-50 text-[#2D7A5E] rounded-2xl group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
          </div>
          <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ applicationCount }}</span>
          <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Track Application Statuses →
          </span>
        </div>

        <!-- Metric 3: Notifications -->
        <div (click)="navigateTo('/tenant/notifications')" class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Unread Alerts</span>
            <span class="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </span>
          </div>
          <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ unreadNotificationCount }}</span>
          <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Notifications →
          </span>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h2 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Tenant Quick Workspace Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            (click)="navigateTo('/tenant/homes')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🔍</span>
            Find Homes
          </button>
          <button
            (click)="navigateTo('/tenant/saved')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">❤️</span>
            Saved Homes
          </button>
          <button
            (click)="navigateTo('/tenant/verification')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🛡️</span>
            Identity Verification
          </button>
          <button
            (click)="navigateTo('/tenant/services')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">🛠️</span>
            Home Services
          </button>
          <button
            (click)="navigateTo('/tenant/profile')"
            type="button"
            class="p-4 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer"
          >
            <span class="block text-xl mb-1 group-hover:scale-110 transition-transform">👤</span>
            Tenant Profile
          </button>
        </div>
      </div>

      <!-- Customer Care Support Banner -->
      <app-customer-care></app-customer-care>
    </div>
  `,
})
export class TenantDashboardComponent implements OnInit {
  savedCount: number = 0;
  applicationCount: number = 0;
  unreadNotificationCount: number = 0;

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  get tenantName(): string {
    const u = this.authService.currentUserSignal();
    return u?.fullName || u?.name || 'Tenant';
  }

  loadMetrics(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedCount = res.data.length;
        }
      },
    });

    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.applicationCount = res.data.filter((a: any) =>
            !['REJECTED', 'WITHDRAWN'].includes(a.status)
          ).length;
        }
      },
    });

    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.unreadNotificationCount = res.data.filter((n: any) => !n.isRead).length;
        }
      },
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
