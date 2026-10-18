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
    <div class="space-y-4 pb-20 text-n-900 p-4">

      <!-- Compact Mobile Hero Header -->
      <div class="bg-navy text-n-0 p-5 rounded-xl space-y-3">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-1.5 bg-n-0/10 px-2.5 py-1 rounded-full text-xs font-semibold text-n-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Tenant Portal</span>
          </div>
          <h1 class="text-xl font-semibold tracking-tight text-n-0">Welcome, {{ tenantName }}</h1>
          <p class="text-xs text-n-300 leading-relaxed">
            Verified direct-owner homes, active leases, and rent records.
          </p>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a
            routerLink="/tenant/homes"
            class="flex-1 py-2.5 bg-brand active:bg-brand-hover text-n-0 font-semibold rounded-lg text-xs text-center min-h-[44px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3"/></svg>
            <span>Find Homes</span>
          </a>
          <a
            routerLink="/tenant/search"
            class="flex-1 py-2.5 bg-n-0/10 active:bg-n-0/20 text-n-0 font-semibold rounded-lg text-xs text-center border border-n-0/20 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Search</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading your dashboard..."></app-loading-state>

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
        <div class="card bg-brand-subtle border-brand/20 p-4 flex items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="inline-flex items-center gap-1 text-xs font-semibold text-brand">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Zero Brokerage</span>
            </div>
            <p class="text-xs text-n-700">Direct owner rentals with verified ID review</p>
          </div>
          <div class="px-3 py-1 bg-n-0 border border-n-200 rounded-lg text-center shrink-0">
            <span class="text-sm font-semibold text-brand">₹0</span>
            <span class="block text-[11px] text-n-500">brokerage</span>
          </div>
        </div>

        <!-- Metric Cards 2x2 Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Metric 1: Tenancy Status -->
          <div
            (click)="navigateTo(activeRental ? '/tenant/rent' : '/tenant/homes')"
            class="card p-3.5 cursor-pointer hover:border-brand transition-colors space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Tenancy</span>
              <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
            </div>
            <span class="text-base font-semibold text-n-900 block truncate">
              {{ activeRental ? formatINR(activeRental.monthlyRent) : 'No Lease' }}
            </span>
            <span class="text-xs font-semibold text-brand block truncate">
              {{ activeRental ? (activeRental.rentStatus || 'Active') : 'Find Home →' }}
            </span>
          </div>

          <!-- Metric 2: Applications -->
          <div
            (click)="navigateTo('/tenant/applications')"
            class="card p-3.5 cursor-pointer hover:border-brand transition-colors space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Applications</span>
              <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
            </div>
            <span class="text-xl font-semibold text-n-900 block">{{ applicationCount }}</span>
            <span class="text-xs font-semibold text-brand block truncate">
              Track status →
            </span>
          </div>

          <!-- Metric 3: Saved Homes -->
          <div
            (click)="navigateTo('/tenant/saved')"
            class="card p-3.5 cursor-pointer hover:border-brand transition-colors space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Saved</span>
              <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
            </div>
            <span class="text-xl font-semibold text-n-900 block">{{ savedCount }}</span>
            <span class="text-xs font-semibold text-brand block truncate">
              Shortlisted →
            </span>
          </div>

          <!-- Metric 4: Unread Notifications -->
          <div
            (click)="navigateTo('/tenant/notifications')"
            class="card p-3.5 cursor-pointer hover:border-brand transition-colors space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Alerts</span>
              <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </div>
            </div>
            <span class="text-xl font-semibold text-n-900 block">{{ unreadNotificationCount }}</span>
            <span class="text-xs font-semibold text-brand block truncate">
              View notifications →
            </span>
          </div>
        </div>

        <!-- Active Rental Overview Card -->
        <div *ngIf="activeRental" class="card p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-n-200 pb-2.5">
            <div>
              <span class="badge badge-success text-xs font-semibold">
                Active Tenancy
              </span>
              <h3 class="text-sm font-semibold text-n-900 mt-1 line-clamp-1">{{ rentalPropertyTitle }}</h3>
              <p class="text-xs text-n-500 flex items-center gap-1 mt-0.5">
                <svg class="w-3.5 h-3.5 text-n-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>{{ rentalPropertyLocation }}</span>
              </p>
            </div>
            <span
              class="badge text-xs font-semibold"
              [class]="activeRental.rentStatus === 'PAID' ? 'badge-success' : 'badge-warning'"
            >
              {{ activeRental.rentStatus || 'Upcoming' }}
            </span>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            <a routerLink="/tenant/rent" class="p-2 bg-n-50 rounded-lg border border-n-200 text-n-700 active:bg-n-100 min-h-[44px] flex flex-col items-center justify-center transition-colors">
              <span>Rent</span>
            </a>
            <a routerLink="/tenant/rental" class="p-2 bg-n-50 rounded-lg border border-n-200 text-n-700 active:bg-n-100 min-h-[44px] flex flex-col items-center justify-center transition-colors">
              <span>Lease</span>
            </a>
            <a routerLink="/tenant/handover" class="p-2 bg-n-50 rounded-lg border border-n-200 text-n-700 active:bg-n-100 min-h-[44px] flex flex-col items-center justify-center transition-colors">
              <span>Handover</span>
            </a>
            <a routerLink="/tenant/documents" class="p-2 bg-n-50 rounded-lg border border-n-200 text-n-700 active:bg-n-100 min-h-[44px] flex flex-col items-center justify-center transition-colors">
              <span>Receipts</span>
            </a>
          </div>
        </div>

        <!-- Quick Workspace Hub Tools -->
        <div class="card p-4 space-y-2.5">
          <h2 class="text-xs font-semibold text-n-500 uppercase tracking-wider">Quick Tools</h2>
          <div class="grid grid-cols-3 gap-2">
            <button
              (click)="navigateTo('/tenant/homes')"
              type="button"
              class="p-2.5 bg-n-50 border border-n-200 rounded-lg text-left font-semibold text-xs active:bg-n-100 min-h-[44px] flex items-center justify-between text-n-700 transition-colors"
            >
              <span>Find</span>
              <svg class="w-4 h-4 text-n-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
            <button
              (click)="navigateTo('/tenant/applications')"
              type="button"
              class="p-2.5 bg-n-50 border border-n-200 rounded-lg text-left font-semibold text-xs active:bg-n-100 min-h-[44px] flex items-center justify-between text-n-700 transition-colors"
            >
              <span>Apps</span>
              <svg class="w-4 h-4 text-n-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
            <button
              (click)="navigateTo('/tenant/services')"
              type="button"
              class="p-2.5 bg-n-50 border border-n-200 rounded-lg text-left font-semibold text-xs active:bg-n-100 min-h-[44px] flex items-center justify-between text-n-700 transition-colors"
            >
              <span>Services</span>
              <svg class="w-4 h-4 text-n-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </button>
          </div>
        </div>

        <!-- Recent Applications -->
        <div class="card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-n-500 uppercase tracking-wider">Recent Applications</h3>
            <a routerLink="/tenant/applications" class="text-xs font-semibold text-brand hover:text-brand-hover">
              View All →
            </a>
          </div>

          <div *ngIf="recentApplications.length > 0" class="space-y-2">
            <div
              *ngFor="let app of recentApplications"
              (click)="navigateTo('/tenant/applications/' + (app.id || app._id))"
              class="p-3 bg-n-50 rounded-lg border border-n-200 flex items-center justify-between gap-2 active:bg-n-100 cursor-pointer min-h-[48px] transition-colors"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <app-status-badge [status]="app.status"></app-status-badge>
                </div>
                <h4 class="text-xs font-semibold text-n-900 mt-1 truncate">
                  {{ app.propertyId?.title || 'Rental Home' }}
                </h4>
              </div>
              <svg class="w-4 h-4 text-n-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>

          <div *ngIf="recentApplications.length === 0" class="py-4 text-center text-xs text-n-500">
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
