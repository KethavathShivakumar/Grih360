import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { RentalService, RentalAgreement } from '../../core/services/rental.service';
import { MoneyService } from '../../core/services/money.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { IsMobileService } from '../../core/services/is-mobile.service';
import { MobileTenantDashboardComponent } from './mobile-tenant-dashboard.component';

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
    MobileTenantDashboardComponent,
  ],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-tenant-dashboard
        [tenantName]="tenantName"
        [savedCount]="savedCount"
        [applicationCount]="applicationCount"
        [unreadNotificationCount]="unreadNotificationCount"
        [activeRental]="activeRental"
        [recentApplications]="recentApplications"
        [rentalPropertyTitle]="rentalPropertyTitle"
        [rentalPropertyLocation]="rentalPropertyLocation"
        [isLoading]="isLoading"
        [isError]="isError"
        [errorMessage]="errorMessage"
        (retryData)="loadAllData()"
      ></app-mobile-tenant-dashboard>
    } @else {
      <div class="space-y-6 max-w-screen-xl mx-auto pb-12">

        <!-- Welcome header -->
        <div class="bg-navy text-n-0 p-6 sm:p-8 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2 max-w-2xl">
            <p class="text-xs font-semibold text-n-300 uppercase tracking-wide">Tenant Portal</p>
            <h1 class="text-2xl font-semibold text-n-0">Welcome back, {{ tenantName }}</h1>
            <p class="text-sm text-n-300 leading-relaxed">
              Browse verified listings, track applications, sign agreements, and manage rent.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <a routerLink="/tenant/homes" class="btn-primary cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3"/></svg>
              Find homes
            </a>
          </div>
        </div>

        <app-loading-state *ngIf="isLoading"></app-loading-state>

        <app-error-state
          *ngIf="isError && !isLoading"
          title="Could not load dashboard"
          [message]="errorMessage"
          (retry)="loadAllData()"
        ></app-error-state>

        <div *ngIf="!isLoading && !isError" class="space-y-6">

          <!-- Zero brokerage callout -->
          <div class="bg-brand-subtle border border-brand-border p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="badge badge-verified text-xs inline-flex">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Grih360 Verified
              </span>
              <h2 class="text-base font-semibold text-navy">Zero brokerage &middot; Direct from owners</h2>
              <p class="text-sm text-n-500">Standardised digital agreements. Model Tenancy Act compliant.</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div class="card text-center px-5 py-3">
                <span class="text-xl font-semibold text-n-900 block">&#8377;0</span>
                <span class="text-xs text-n-500">Brokerage</span>
              </div>
              <div class="card text-center px-5 py-3">
                <span class="text-xl font-semibold text-n-900 block">100%</span>
                <span class="text-xs text-n-500">Direct owners</span>
              </div>
            </div>
          </div>

          <!-- Metric cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div (click)="navigateTo(activeRental ? '/tenant/rent' : '/tenant/homes')"
              class="card cursor-pointer group">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-n-400 font-semibold uppercase tracking-wide">Tenancy</span>
                <span class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </span>
              </div>
              <span class="text-lg font-semibold text-n-900 block truncate">
                {{ activeRental ? (formatINR(activeRental.monthlyRent) + '/mo') : 'No lease' }}
              </span>
              <span class="text-xs mt-1 text-brand font-semibold flex items-center gap-1">
                {{ activeRental ? 'Rent ' + (activeRental.rentStatus || 'upcoming') : 'Find a home' }}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>

            <div (click)="navigateTo('/tenant/applications')" class="card cursor-pointer group">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-n-400 font-semibold uppercase tracking-wide">Applications</span>
                <span class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </span>
              </div>
              <span class="text-3xl font-semibold text-n-900 block">{{ applicationCount }}</span>
              <span class="text-xs mt-1 text-brand font-semibold flex items-center gap-1">
                Track
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>

            <div (click)="navigateTo('/tenant/saved')" class="card cursor-pointer group">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-n-400 font-semibold uppercase tracking-wide">Saved</span>
                <span class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </span>
              </div>
              <span class="text-3xl font-semibold text-n-900 block">{{ savedCount }}</span>
              <span class="text-xs mt-1 text-brand font-semibold flex items-center gap-1">
                View saved
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>

            <div (click)="navigateTo('/tenant/notifications')" class="card cursor-pointer group">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-n-400 font-semibold uppercase tracking-wide">Alerts</span>
                <span class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </span>
              </div>
              <span class="text-3xl font-semibold text-n-900 block">{{ unreadNotificationCount }}</span>
              <span class="text-xs mt-1 text-brand font-semibold flex items-center gap-1">
                View all
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
              </span>
            </div>
          </div>

          <!-- Active rental card -->
          <div *ngIf="activeRental" class="card space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-n-200 pb-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge badge-verified text-xs">Active Tenancy</span>
                  <span class="text-xs text-n-400">{{ activeRental.agreementVersion || 'v1.0' }}</span>
                </div>
                <h3 class="text-base font-semibold text-n-900">{{ rentalPropertyTitle }}</h3>
                <p class="text-xs text-n-500 flex items-center mt-0.5">
                  <svg class="w-3.5 h-3.5 text-brand mr-1 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ rentalPropertyLocation }}
                </p>
              </div>
              <span class="badge text-xs" [class]="activeRental.rentStatus === 'PAID' ? 'badge-verified' : 'badge-review'">
                Rent: {{ activeRental.rentStatus || 'Upcoming' }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <a routerLink="/tenant/rent" class="card hover:border-brand hover:bg-brand-subtle flex flex-col items-center gap-2 p-3 text-center cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <span class="text-xs font-semibold text-n-700">Rent</span>
              </a>
              <a routerLink="/tenant/rental" class="card hover:border-brand hover:bg-brand-subtle flex flex-col items-center gap-2 p-3 text-center cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="text-xs font-semibold text-n-700">Agreement</span>
              </a>
              <a routerLink="/tenant/handover" class="card hover:border-brand hover:bg-brand-subtle flex flex-col items-center gap-2 p-3 text-center cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <span class="text-xs font-semibold text-n-700">Handover</span>
              </a>
              <a routerLink="/tenant/condition" class="card hover:border-brand hover:bg-brand-subtle flex flex-col items-center gap-2 p-3 text-center cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                <span class="text-xs font-semibold text-n-700">Condition</span>
              </a>
              <a routerLink="/tenant/documents" class="card hover:border-brand hover:bg-brand-subtle flex flex-col items-center gap-2 p-3 text-center cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="text-xs font-semibold text-n-700">Receipts</span>
              </a>
            </div>
          </div>

          <!-- Quick navigation -->
          <div class="card space-y-3">
            <h2 class="text-sm font-semibold text-n-700">All sections</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              <button *ngFor="let nav of navItems" (click)="navigateTo(nav.route)" type="button"
                class="card flex flex-col items-center gap-2 p-3 text-center cursor-pointer hover:border-brand hover:bg-brand-subtle transition-colors h-24 justify-center">
                <div class="w-7 h-7 rounded-lg bg-n-100 border border-n-200 flex items-center justify-center text-n-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="nav.icon"/>
                  </svg>
                </div>
                <span class="text-xs font-semibold text-n-700">{{ nav.label }}</span>
              </button>
            </div>
          </div>

          <!-- Recent applications -->
          <div class="card space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-n-900">Recent Applications</h3>
                <p class="text-xs text-n-500 mt-0.5">Status from property owners</p>
              </div>
              <a routerLink="/tenant/applications" class="text-sm font-semibold text-brand hover:text-brand-hover cursor-pointer">View all</a>
            </div>

            <div *ngIf="recentApplications.length > 0" class="space-y-2">
              <div *ngFor="let app of recentApplications"
                (click)="navigateTo('/tenant/applications/' + (app.id || app._id))"
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-n-50 hover:bg-n-100 border border-n-200 rounded-lg cursor-pointer transition-colors">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <app-status-badge [status]="app.status"></app-status-badge>
                    <span class="text-xs text-n-400">{{ app.createdAt | date: 'mediumDate' }}</span>
                  </div>
                  <p class="text-sm font-semibold text-n-900">{{ app.propertyId?.title || 'Rental Property' }}</p>
                </div>
                <div class="flex items-center gap-4 text-sm font-semibold shrink-0">
                  <span class="text-n-700">{{ formatINR(app.proposedRent) }}/mo</span>
                  <span class="text-brand flex items-center gap-0.5">
                    Details
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="recentApplications.length === 0" class="py-4 text-center text-sm text-n-400">
              No applications yet. <a routerLink="/tenant/homes" class="text-brand font-semibold hover:underline">Browse homes</a> to apply.
            </div>
          </div>

          <app-customer-care></app-customer-care>
        </div>
      </div>
    }
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

  navItems = [
    { label: 'Find Homes',    route: '/tenant/homes',        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'Saved',         route: '/tenant/saved',        icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' },
    { label: 'Applications',  route: '/tenant/applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Verification',  route: '/tenant/verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'My Rental',     route: '/tenant/rental',       icon: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { label: 'Rent',          route: '/tenant/rent',         icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Documents',     route: '/tenant/documents',    icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
    { label: 'Services',      route: '/tenant/services',     icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
    { label: 'Handover',      route: '/tenant/handover',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { label: 'Condition',     route: '/tenant/condition',    icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M12 10a3 3 0 110 6 3 3 0 010-6z' },
    { label: 'Notifications', route: '/tenant/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { label: 'Settings',      route: '/tenant/settings',     icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private rentalService: RentalService,
    private moneyService: MoneyService,
    private router: Router,
    public isMobile: IsMobileService
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
