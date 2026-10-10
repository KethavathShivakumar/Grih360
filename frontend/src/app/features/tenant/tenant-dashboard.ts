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
      <div class="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">

        <!-- Welcome Hero Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0F2937] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-800 relative overflow-hidden">
          <div class="space-y-2 relative z-10 max-w-2xl">
            <div class="inline-flex items-center space-x-2 bg-[#1E3A8A] px-3 py-1 rounded-full text-xs font-extrabold text-[#FACC15] border border-blue-900">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Tenant Residence Portal</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Welcome back, {{ tenantName }}</h1>
            <p class="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
              Discover verified zero-brokerage listings, track rental applications, monitor active rent schedules, and request instant home maintenance services.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <a
              routerLink="/tenant/homes"
              class="px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-extrabold rounded-2xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.3-4.3"/></svg>
              <span>Explore Homes</span>
            </a>
            <a
              routerLink="/tenant/search"
              class="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-extrabold rounded-2xl text-xs border border-blue-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Search Listings</span>
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
          <div class="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-[#FEF9C3] border border-[#FDE047] p-5 sm:p-6 rounded-3xl shadow-2xs">
            <div class="space-y-2 max-w-xl">
              <div class="inline-flex items-center space-x-2 bg-amber-200/90 text-amber-950 px-3 py-0.5 rounded-full text-xs font-black">
                <svg class="w-3.5 h-3.5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>Nivas360 Verification Guarantee</span>
              </div>
              <h2 class="text-base sm:text-lg font-black text-[#0F2937]">Zero Brokerage & Model Tenancy Act Compliance</h2>
              <p class="text-xs text-amber-950 font-bold leading-relaxed">
                All properties are listed direct from owners with verified title deeds, standardized digital rental agreements, and online rent receipts.
              </p>
            </div>
            <div class="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
              <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs flex-1 sm:flex-initial">
                <span class="text-xl sm:text-2xl font-black text-[#0F2937]">₹0</span>
                <span class="block text-[10px] font-bold text-amber-900 uppercase">Brokerage Fee</span>
              </div>
              <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-300 text-center space-y-0.5 shadow-xs flex-1 sm:flex-initial">
                <span class="text-xl sm:text-2xl font-black text-[#0F2937]">100%</span>
                <span class="block text-[9px] font-bold text-amber-900 uppercase">Direct Owners</span>
              </div>
            </div>
          </div>v>

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
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
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
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
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
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </span>
              </div>
              <span class="text-3xl font-black text-[#0F2937] mt-3 block">{{ unreadNotificationCount }}</span>
              <span class="text-xs text-[#2D7A5E] font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Alerts →
              </span>
            </div>
          </div>

          <!-- Active Rental Overview Card (If Tenant has an Active Tenancy) -->
          <div *ngIf="activeRental" class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                    My Active Tenancy
                  </span>
                  <span class="text-xs text-slate-400 font-semibold">• Agreement {{ activeRental.agreementVersion || 'v1.0' }}</span>
                </div>
                <h3 class="text-lg sm:text-xl font-black text-[#0F2937] mt-1">{{ rentalPropertyTitle }}</h3>
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
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-[#2D7A5E] group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                Rent Tracking
              </a>
              <a
                routerLink="/tenant/rental"
                class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
              >
                <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                Lease Agreement
              </a>
              <a
                routerLink="/tenant/handover"
                class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
              >
                <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 02-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                Handover List
              </a>
              <a
                routerLink="/tenant/condition"
                class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
              >
                <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                Condition Log
              </a>
              <a
                routerLink="/tenant/documents"
                class="p-3 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-center text-xs font-bold transition group cursor-pointer"
              >
                <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
                </div>
                Vault & Receipts
              </a>
            </div>
          </div>

          <!-- Quick Actions Grid (Workspace Hub & Tools) -->
          <div class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Tenant Workspace Hub & Tools</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <button
                (click)="navigateTo('/tenant/homes')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.3-4.3"/></svg>
                </div>
                <span>Find Homes</span>
              </button>

              <button
                (click)="navigateTo('/tenant/search')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <span>Search Results</span>
              </button>

              <button
                (click)="navigateTo('/tenant/saved')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <span>Saved Homes</span>
              </button>

              <button
                (click)="navigateTo('/tenant/applications')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-emerald-50 text-[#2D7A5E] group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span>Applications</span>
              </button>

              <button
                (click)="navigateTo('/tenant/verification')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <span>Verification</span>
              </button>

              <button
                (click)="navigateTo('/tenant/rental')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <span>My Rental</span>
              </button>

              <button
                (click)="navigateTo('/tenant/rent')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <span>Rent Tracking</span>
              </button>

              <button
                (click)="navigateTo('/tenant/documents')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-[#FAF9F5] text-slate-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
                </div>
                <span>Documents</span>
              </button>

              <button
                (click)="navigateTo('/tenant/handover')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 02-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <span>Handover List</span>
              </button>

              <button
                (click)="navigateTo('/tenant/condition')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                <span>Condition Log</span>
              </button>

              <button
                (click)="navigateTo('/tenant/services')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <span>Home Services</span>
              </button>

              <button
                (click)="navigateTo('/tenant/settings')"
                type="button"
                class="p-3.5 bg-slate-50 hover:bg-[#0F2937] hover:text-white border border-slate-200/80 rounded-2xl text-left transition-all font-bold text-xs group cursor-pointer flex flex-col justify-between h-24"
              >
                <div class="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <span>Settings</span>
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
