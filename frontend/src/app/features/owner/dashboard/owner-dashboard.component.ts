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
    <div class="space-y-6 max-w-screen-xl mx-auto pb-12">
      <!-- Welcome Hero Header -->
      <div class="bg-navy text-n-0 p-6 sm:p-8 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <div class="inline-flex items-center gap-1.5 bg-n-0/10 px-3 py-1 rounded-full text-xs font-semibold text-n-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Owner Dashboard</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-n-0">Welcome, {{ ownerName }}</h1>
          <p class="text-sm text-n-300 leading-relaxed">
            Manage your properties, review tenant applications with verified ID status, and monitor rent schedules.
          </p>
        </div>

        <button
          (click)="navigateTo('/owner/properties/new')"
          type="button"
          class="px-5 py-2.5 bg-brand hover:bg-brand-hover text-n-0 font-semibold rounded-lg text-sm transition-colors shrink-0 cursor-pointer flex items-center gap-2 min-h-[44px]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span>List a Property</span>
        </button>
      </div>

      <!-- Information Callout Banner -->
      <div class="card bg-brand-subtle border-brand/20 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1 max-w-xl">
          <div class="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span>Verified Tenant Screening</span>
          </div>
          <p class="text-sm text-n-700 leading-relaxed">
            Tenant identity documents are reviewed manually by our operations team. You only see verified status without storing sensitive Aadhaar or UIDAI data.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-n-0 px-4 py-2.5 rounded-lg border border-n-200 text-center">
            <span class="text-lg font-semibold text-brand">0%</span>
            <span class="block text-xs text-n-500">Brokerage</span>
          </div>
          <div class="bg-n-0 px-4 py-2.5 rounded-lg border border-n-200 text-center">
            <span class="text-lg font-semibold text-brand">100%</span>
            <span class="block text-xs text-n-500">Direct Owners</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading property portfolio analytics..."></app-loading-state>

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
        title="No properties listed yet"
        message="List your residential property to start receiving verified tenant applications and automated rent tracking."
        actionText="List Property"
        (action)="navigateTo('/owner/properties/new')"
      ></app-empty-state>

      <!-- Metrics Grid -->
      <div *ngIf="!isLoading && !isError && metrics" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <!-- Card 1: Total Properties -->
        <div (click)="navigateTo('/owner/properties')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Properties</span>
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
          </div>
          <span class="text-2xl font-semibold text-n-900 block mt-2">{{ metrics.totalProperties }}</span>
          <span class="text-xs font-semibold text-brand">View all →</span>
        </div>

        <!-- Card 2: Vacant / Available -->
        <div (click)="navigateTo('/owner/properties')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Available</span>
            <div class="w-7 h-7 rounded-lg bg-brand-subtle border border-brand/20 flex items-center justify-center text-brand">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
          </div>
          <span class="text-2xl font-semibold text-brand block mt-2">{{ metrics.availableProperties }}</span>
          <span class="text-xs text-n-500">Vacant homes</span>
        </div>

        <!-- Card 3: Active Rentals -->
        <div (click)="navigateTo('/owner/rentals')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Active Leases</span>
            <div class="w-7 h-7 rounded-lg bg-brand-subtle border border-brand/20 flex items-center justify-center text-brand">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <span class="text-2xl font-semibold text-n-900 block mt-2">{{ metrics.activeRentals ?? 0 }}</span>
          <span class="text-xs font-semibold text-brand">Manage leases →</span>
        </div>

        <!-- Card 4: New Applications -->
        <div (click)="navigateTo('/owner/applicants')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">New Apps</span>
            <div class="w-7 h-7 rounded-lg bg-warn-bg border border-warn-border flex items-center justify-center text-warn-text">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
          </div>
          <span class="text-2xl font-semibold text-n-900 block mt-2">{{ metrics.newApplications ?? 0 }}</span>
          <span class="text-xs font-semibold text-warn-text">To review →</span>
        </div>

        <!-- Card 5: Applications Under Review -->
        <div (click)="navigateTo('/owner/applicants')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">In Review</span>
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
          </div>
          <span class="text-2xl font-semibold text-n-900 block mt-2">{{ metrics.pendingApplications }}</span>
          <span class="text-xs font-semibold text-brand">Pipeline →</span>
        </div>

        <!-- Card 6: Monthly Rent Records -->
        <div (click)="navigateTo('/owner/rent-tracking')" class="card p-4 hover:border-brand transition-colors cursor-pointer space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-n-500 uppercase tracking-wider">Monthly Rent</span>
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
          </div>
          <span class="text-lg font-semibold text-n-900 block mt-2 truncate">{{ formatCurrency(metrics.upcomingRent) }}</span>
          <span class="text-xs text-n-500">Expected rent</span>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="card space-y-3">
        <h2 class="text-xs font-semibold text-n-500 uppercase tracking-wider">Owner Workspace Actions</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            (click)="navigateTo('/owner/properties/new')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            </div>
            <span class="text-n-900">Add Property</span>
          </button>
          <button
            (click)="navigateTo('/owner/properties')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <span class="text-n-900">My Properties</span>
          </button>
          <button
            (click)="navigateTo('/owner/applicants')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <span class="text-n-900">Applicants</span>
          </button>
          <button
            (click)="navigateTo('/owner/rentals')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <span class="text-n-900">Active Leases</span>
          </button>
          <button
            (click)="navigateTo('/owner/rent-tracking')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <span class="text-n-900">Rent Tracking</span>
          </button>
          <button
            (click)="navigateTo('/owner/notifications')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <span class="text-n-900">Alerts</span>
          </button>
          <button
            (click)="navigateTo('/owner/profile')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <span class="text-n-900">Profile</span>
          </button>
          <button
            (click)="navigateTo('/owner/settings')"
            type="button"
            class="card p-3.5 hover:border-brand hover:bg-brand-subtle text-left transition-colors font-semibold text-xs cursor-pointer flex flex-col justify-between h-24"
          >
            <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <span class="text-n-900">Settings</span>
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
