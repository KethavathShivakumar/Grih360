import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { MobileRoleSelectionComponent } from './mobile-role-selection.component';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeComponent,
    MobileRoleSelectionComponent,
  ],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-role-selection></app-mobile-role-selection>
    } @else {
      <div class="min-h-screen bg-n-50 flex flex-col justify-between font-sans text-n-900">
        <!-- Desktop Header -->
        <header class="w-full bg-n-0 border-b border-n-200 sticky top-0 z-50">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-navy text-n-0 flex items-center justify-center font-semibold text-sm">
                G
              </div>
              <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
            </div>
            <div class="flex items-center gap-3">
              <a routerLink="/auth/login" class="text-xs font-semibold text-n-700 hover:text-n-900 px-3 py-1.5 rounded-lg hover:bg-n-100 transition-colors">
                Sign In
              </a>
              <a routerLink="/auth/register" class="text-xs font-semibold text-n-0 bg-brand hover:bg-brand-hover px-3.5 py-1.5 rounded-lg transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </header>

        <main class="max-w-4xl mx-auto w-full my-auto py-12 px-4 space-y-8 text-center">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-1.5 bg-brand-subtle border border-brand/20 px-3.5 py-1 rounded-full text-xs font-semibold text-brand">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Direct-Owner Residential Rentals</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-semibold text-n-900 tracking-tight">
              Welcome to Grih360
            </h1>
            <p class="text-n-600 text-sm max-w-lg mx-auto">
              Select your workspace to browse verified homes, manage listings, or deliver maintenance services.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <!-- Property Owner Card -->
            <div
              (click)="selectOwner()"
              class="card cursor-pointer text-left p-6 hover:border-brand transition-colors space-y-4">
              <div class="w-10 h-10 rounded-lg bg-navy text-n-0 flex items-center justify-center">
                <svg class="w-5 h-5 text-n-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-n-900">Property Owner</h2>
                <p class="text-xs text-n-500 leading-relaxed">
                  List rental homes, review applicant IDs, manage lease terms, and track rent collection.
                </p>
              </div>
              <div class="pt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
                <span>Enter Owner Portal</span>
                <span>→</span>
              </div>
            </div>

            <!-- Home Seeker / Tenant Card -->
            <div
              (click)="selectTenant()"
              class="card cursor-pointer text-left p-6 hover:border-brand transition-colors space-y-4">
              <div class="w-10 h-10 rounded-lg bg-brand text-n-0 flex items-center justify-center">
                <svg class="w-5 h-5 text-n-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-n-900">Tenant / Resident</h2>
                <p class="text-xs text-n-500 leading-relaxed">
                  Find direct homes on map and list, submit applications, manage leases, and request repair services.
                </p>
              </div>
              <div class="pt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
                <span>Enter Tenant Portal</span>
                <span>→</span>
              </div>
            </div>

            <!-- Service Professional Card -->
            <div
              (click)="selectPro()"
              class="card cursor-pointer text-left p-6 hover:border-brand transition-colors space-y-4">
              <div class="w-10 h-10 rounded-lg bg-n-100 border border-n-200 text-n-700 flex items-center justify-center">
                <svg class="w-5 h-5 text-n-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-n-900">Service Professional</h2>
                <p class="text-xs text-n-500 leading-relaxed">
                  Receive verified repair requests, complete jobs with OTP confirmation, and manage earnings.
                </p>
              </div>
              <div class="pt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
                <span>Enter Pro Workspace</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </main>

        <!-- Footer -->
        <footer class="w-full border-t border-n-200 bg-n-0 py-4 text-center text-xs text-n-400">
          Grih360 &copy; 2026. Direct rentals across Telangana & Andhra Pradesh.
        </footer>
      </div>
    }
  `,
})
export class RoleSelectionComponent {
  constructor(
    private router: Router,
    public isMobile: IsMobileService
  ) {}

  selectOwner(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'OWNER' } });
  }

  selectTenant(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'TENANT' } });
  }

  selectPro(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'PROFESSIONAL' } });
  }
}
