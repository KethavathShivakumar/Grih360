import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col">

      <!-- Admin top bar — same palette, no rose/red theme -->
      <header class="bg-n-0 border-b border-n-200 sticky top-0 z-50">
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          <div class="flex items-center gap-4">
            <a routerLink="/admin/dashboard" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
              <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
            </a>
            <span class="px-2 py-0.5 bg-n-100 border border-n-200 text-n-700 text-xs font-semibold rounded uppercase tracking-wide">
              Admin
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-navy text-n-0 flex items-center justify-center font-semibold text-xs">A</div>
              <div class="hidden sm:flex flex-col">
                <span class="text-xs font-semibold text-n-900 leading-tight">{{ userName }}</span>
                <span class="text-n-400 leading-none" style="font-size: 10px;">Administrator</span>
              </div>
            </div>
            <button (click)="onLogout()" type="button"
              class="px-3 py-1.5 bg-n-100 hover:bg-err-bg hover:text-err-text text-n-700 text-xs font-semibold rounded-lg border border-n-200 hover:border-err-border transition-colors cursor-pointer">
              Sign out
            </button>
          </div>
        </div>

        <!-- Secondary nav -->
        <nav class="border-t border-n-200 px-4 sm:px-6 overflow-x-auto flex gap-0.5 py-1.5 text-xs font-semibold text-n-500 bg-n-50">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-n-0 text-n-900 border border-n-200" [routerLinkActiveOptions]="{exact:true}"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Users
          </a>
          <a routerLink="/admin/properties" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Properties
          </a>
          <a routerLink="/admin/applications" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Applications
          </a>
          <a routerLink="/admin/rentals" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            Rentals
          </a>
          <a routerLink="/admin/verifications" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Verifications
          </a>
          <a routerLink="/admin/services" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            Services
          </a>
          <a routerLink="/admin/professionals" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            Professionals
          </a>
          <a routerLink="/admin/notifications" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            Broadcasts
          </a>
          <a routerLink="/admin/audit" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            Audit Logs
          </a>
          <a routerLink="/admin/system" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            System Health
          </a>
          <a routerLink="/admin/settings" routerLinkActive="bg-n-0 text-n-900 border border-n-200"
            class="px-3 py-1.5 rounded-md hover:bg-n-0 hover:text-n-900 transition-colors whitespace-nowrap">
            Settings
          </a>
        </nav>
      </header>

      <main class="flex-grow px-4 sm:px-6 py-6 max-w-screen-xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  private sub?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe((u) => { this.user = u; });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Administrator';
  }

  onLogout(): void {
    if (confirm('Sign out of Admin?')) {
      this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
