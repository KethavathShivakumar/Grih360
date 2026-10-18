import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col justify-between p-4 font-sans text-n-900">
      <!-- Slim Top Bar Header -->
      <header class="w-full flex items-center justify-between py-3 border-b border-n-200 mobile-top-bar">
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-navy text-n-0 flex items-center justify-center font-semibold text-sm">
            G
          </div>
          <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a routerLink="/auth/login" class="text-xs font-semibold text-n-700 hover:text-n-900 px-2.5 py-1.5 rounded-lg hover:bg-n-100 transition-colors min-h-[44px] flex items-center">
            Sign In
          </a>
          <a routerLink="/auth/register" class="text-xs font-semibold text-n-0 bg-brand hover:bg-brand-hover px-3 py-1.5 rounded-lg transition-colors min-h-[44px] flex items-center">
            Get Started
          </a>
        </div>
      </header>

      <!-- Main Body -->
      <main class="my-auto py-6 space-y-4">
        <div class="space-y-1.5 text-center">
          <div class="inline-flex items-center gap-1.5 bg-brand-subtle border border-brand/20 px-3 py-0.5 rounded-full text-xs font-semibold text-brand">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span>Verified Rentals</span>
          </div>
          <h1 class="text-xl font-semibold text-n-900 tracking-tight">
            Welcome to Grih360
          </h1>
          <p class="text-xs text-n-500 max-w-xs mx-auto leading-relaxed">
            Select your workspace to proceed.
          </p>
        </div>

        <div class="space-y-2.5 pt-1">
          <!-- Property Owner Card -->
          <div
            (click)="selectOwner()"
            class="p-4 bg-n-0 border border-n-200 active:border-brand rounded-xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[64px]"
          >
            <div class="w-10 h-10 rounded-lg bg-navy text-n-0 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-n-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-n-900">Property Owner</h2>
                <span class="text-xs font-semibold text-brand">→</span>
              </div>
              <p class="text-xs text-n-500 mt-0.5 truncate">
                List homes, review applicants, track rent.
              </p>
            </div>
          </div>

          <!-- Home Seeker / Tenant Card -->
          <div
            (click)="selectTenant()"
            class="p-4 bg-n-0 border border-n-200 active:border-brand rounded-xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[64px]"
          >
            <div class="w-10 h-10 rounded-lg bg-brand text-n-0 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-n-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-n-900">Tenant / Resident</h2>
                <span class="text-xs font-semibold text-brand">→</span>
              </div>
              <p class="text-xs text-n-500 mt-0.5 truncate">
                Search verified homes, leases, maintenance.
              </p>
            </div>
          </div>

          <!-- Professional Card -->
          <div
            (click)="selectPro()"
            class="p-4 bg-n-0 border border-n-200 active:border-brand rounded-xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[64px]"
          >
            <div class="w-10 h-10 rounded-lg bg-n-100 border border-n-200 text-n-700 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-n-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-n-900">Service Professional</h2>
                <span class="text-xs font-semibold text-brand">→</span>
              </div>
              <p class="text-xs text-n-500 mt-0.5 truncate">
                Service requests, OTP completion, earnings.
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-2 text-center text-xs text-n-400 border-t border-n-200">
        © 2026 Grih360 Technologies
      </footer>
    </div>
  `,
})
export class MobileRoleSelectionComponent {
  constructor(private router: Router) {}

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
