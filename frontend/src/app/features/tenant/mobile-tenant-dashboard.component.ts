import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { RentalAgreement } from '../../core/services/rental.service';

@Component({
  selector: 'app-mobile-tenant-dashboard',
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
    <div class="space-y-4 pb-20 font-sans text-slate-800 p-4">

      <!-- Compact Mobile Hero Header -->
      <div class="bg-[#0F2937] text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-3">
        <div class="space-y-1 relative z-10">
          <div class="inline-flex items-center space-x-1.5 bg-[#1E3A8A] px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#FACC15] border border-blue-900">
            <span>🏡 Tenant Residence Portal</span>
          </div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">Welcome, {{ tenantName }}</h1>
          <p class="text-xs text-slate-100 leading-relaxed font-normal">
            Discover verified zero-brokerage homes, track applications & manage rent.
          </p>
        </div>

        <div class="flex items-center gap-2 pt-1 relative z-10">
          <a
            routerLink="/tenant/homes"
            class="flex-1 py-2 bg-[#FACC15] active:bg-[#EAB308] text-[#0F2937] font-extrabold rounded-xl text-xs text-center shadow-xs cursor-pointer min-h-[40px] flex items-center justify-center gap-1"
          >
            <span>Explore Homes</span>
          </a>
          <a
            routerLink="/tenant/search"
            class="flex-1 py-2 bg-[#1E3A8A] active:bg-[#1E40AF] text-white font-extrabold rounded-xl text-xs text-center border border-blue-800 cursor-pointer min-h-[40px] flex items-center justify-center gap-1"
          >
            <span>Search</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Calculating dashboard parameters..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load tenant dashboard"
        [message]="errorMessage"
        (retry)="retryData.emit()"
      ></app-error-state>

      <!-- Main Dashboard Content -->
      <div *ngIf="!isLoading && !isError" class="space-y-4">

        <!-- Zero Brokerage Callout Banner -->
        <div class="bg-[#FEF9C3] border border-[#FDE047] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <div class="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-950 tracking-wide bg-amber-200/90 px-2 py-0.5 rounded-md">
              <span>🛡️ Verification Guarantee</span>
            </div>
            <div class="text-xs font-black text-[#0F2937] mt-1">
              Zero Brokerage • 100% Direct Owners
            </div>
          </div>
          <div class="px-3 py-1 bg-white border border-amber-300 rounded-xl text-center shrink-0 shadow-xs">
            <span class="text-base font-black text-[#0F2937]">₹0</span>
            <span class="block text-[9px] font-bold text-amber-900 uppercase">Fee</span>
          </div>
        </div>

        <!-- Metric Cards 2x2 Grid (Compact Mobile Height) -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Metric 1: Tenancy Status -->
          <div
            (click)="navigateTo(activeRental ? '/tenant/rent' : '/tenant/homes')"
            class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs active:bg-slate-50 cursor-pointer space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tenancy</span>
              <span class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </span>
            </div>
            <span class="text-base font-black text-[#0F2937] block truncate">
              {{ activeRental ? formatINR(activeRental.monthlyRent) : 'No Lease' }}
            </span>
            <span class="text-[11px] font-bold text-[#2D7A5E] block truncate">
              {{ activeRental ? (activeRental.rentStatus || 'UPCOMING') : 'Find Home →' }}
            </span>
          </div>

          <!-- Metric 2: Applications -->
          <div
            (click)="navigateTo('/tenant/applications')"
            class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs active:bg-slate-50 cursor-pointer space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Apps</span>
              <span class="p-1.5 bg-emerald-50 text-[#2D7A5E] rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </span>
            </div>
            <span class="text-2xl font-black text-[#0F2937] block">{{ applicationCount }}</span>
            <span class="text-[11px] font-bold text-[#2D7A5E] block truncate">
              Applications →
            </span>
          </div>

          <!-- Metric 3: Saved Homes -->
          <div
            (click)="navigateTo('/tenant/saved')"
            class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs active:bg-slate-50 cursor-pointer space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Saved</span>
              <span class="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </span>
            </div>
            <span class="text-2xl font-black text-[#0F2937] block">{{ savedCount }}</span>
            <span class="text-[11px] font-bold text-[#2D7A5E] block truncate">
              Bookmarked →
            </span>
          </div>

          <!-- Metric 4: Unread Notifications -->
          <div
            (click)="navigateTo('/tenant/notifications')"
            class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs active:bg-slate-50 cursor-pointer space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alerts</span>
              <span class="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </span>
            </div>
            <span class="text-2xl font-black text-[#0F2937] block">{{ unreadNotificationCount }}</span>
            <span class="text-[11px] font-bold text-[#2D7A5E] block truncate">
              Unread Alerts →
            </span>
          </div>
        </div>

        <!-- Active Rental Overview Card (If Tenant Has Active Rental) -->
        <div *ngIf="activeRental" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full">
                Active Tenancy
              </span>
              <h3 class="text-sm font-black text-[#0F2937] mt-1 line-clamp-1">{{ rentalPropertyTitle }}</h3>
              <p class="text-[11px] text-slate-500">📍 {{ rentalPropertyLocation }}</p>
            </div>
            <span
              class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
              [class]="activeRental.rentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ activeRental.rentStatus || 'UPCOMING' }}
            </span>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <a routerLink="/tenant/rent" class="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 active:bg-slate-100 min-h-[44px] flex flex-col items-center justify-center">
              <span>Rent</span>
            </a>
            <a routerLink="/tenant/rental" class="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 active:bg-slate-100 min-h-[44px] flex flex-col items-center justify-center">
              <span>Lease</span>
            </a>
            <a routerLink="/tenant/handover" class="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 active:bg-slate-100 min-h-[44px] flex flex-col items-center justify-center">
              <span>Handover</span>
            </a>
            <a routerLink="/tenant/documents" class="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 active:bg-slate-100 min-h-[44px] flex flex-col items-center justify-center">
              <span>Vault</span>
            </a>
          </div>
        </div>

        <!-- Quick Workspace Hub Tools -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <h2 class="text-[11px] font-black text-[#0F2937] uppercase tracking-wider">Quick Tools</h2>
          <div class="grid grid-cols-3 gap-2">
            <button
              (click)="navigateTo('/tenant/homes')"
              type="button"
              class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs active:bg-slate-100 min-h-[44px] flex items-center justify-between"
            >
              <span>Find</span>
              <span class="text-slate-400">🔍</span>
            </button>
            <button
              (click)="navigateTo('/tenant/applications')"
              type="button"
              class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs active:bg-slate-100 min-h-[44px] flex items-center justify-between"
            >
              <span>Apps</span>
              <span class="text-slate-400">📄</span>
            </button>
            <button
              (click)="navigateTo('/tenant/services')"
              type="button"
              class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs active:bg-slate-100 min-h-[44px] flex items-center justify-between"
            >
              <span>Services</span>
              <span class="text-slate-400">🛠️</span>
            </button>
          </div>
        </div>

        <!-- Recent Applications -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Recent Applications</h3>
            <a routerLink="/tenant/applications" class="text-[11px] font-bold text-[#2D7A5E] hover:underline">
              View All →
            </a>
          </div>

          <div *ngIf="recentApplications.length > 0" class="space-y-2">
            <div
              *ngFor="let app of recentApplications"
              (click)="navigateTo('/tenant/applications/' + (app.id || app._id))"
              class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 active:bg-slate-100 cursor-pointer min-h-[48px]"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <app-status-badge [status]="app.status"></app-status-badge>
                </div>
                <h4 class="text-xs font-extrabold text-slate-900 mt-1 truncate">
                  {{ app.propertyId?.title || 'Rental Residence' }}
                </h4>
              </div>
              <span class="text-xs font-bold text-[#2D7A5E] shrink-0">→</span>
            </div>
          </div>

          <div *ngIf="recentApplications.length === 0" class="py-4 text-center text-xs text-slate-400 font-semibold">
            No rental applications submitted yet.
          </div>
        </div>

        <!-- Customer Support -->
        <app-customer-care></app-customer-care>

      </div>
    </div>
  `,
})
export class MobileTenantDashboardComponent {
  @Input() tenantName: string = 'Tenant';
  @Input() savedCount: number = 0;
  @Input() applicationCount: number = 0;
  @Input() unreadNotificationCount: number = 0;
  @Input() activeRental: RentalAgreement | null = null;
  @Input() recentApplications: any[] = [];
  @Input() rentalPropertyTitle: string = '';
  @Input() rentalPropertyLocation: string = '';
  @Input() isLoading: boolean = true;
  @Input() isError: boolean = false;
  @Input() errorMessage: string = '';

  @Output() retryData = new EventEmitter<void>();

  constructor(
    private router: Router
  ) {}

  formatINR(amount: number): string {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
