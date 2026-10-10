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
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      <!-- Admin Top Navbar -->
      <header class="bg-white border-b border-[#E8E6DF] sticky top-0 z-50 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <a routerLink="/admin/dashboard" class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-rose-400 flex items-center justify-center font-black text-base shadow-sm">
                G
              </div>
              <span class="text-xl font-black text-[#0F2937] tracking-tight">
                Grih<span class="text-[#2D7A5E]">360</span>
              </span>
            </a>
            <span class="px-2.5 py-0.5 bg-rose-700 text-white text-[10px] font-black rounded-full uppercase tracking-wide">
              Admin Ops
            </span>
          </div>

          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-full bg-rose-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                A
              </div>
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 leading-tight">{{ userName }}</span>
                <span class="text-[10px] text-slate-400 font-semibold">Super Admin</span>
              </div>
            </div>
            <button
              (click)="onLogout()"
              type="button"
              class="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        <!-- Secondary Subnav -->
        <nav class="bg-[#F4F3EE] border-t border-[#E8E6DF] px-4 sm:px-6 overflow-x-auto flex space-x-1 py-1.5 scrollbar-none text-xs font-semibold text-slate-600">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> Dashboard
          </a>
          <a
            routerLink="/admin/users"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> Users
          </a>
          <a
            routerLink="/admin/properties"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> Properties
          </a>
          <a
            routerLink="/admin/applications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Applications
          </a>
          <a
            routerLink="/admin/rentals"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> Rentals
          </a>
          <a
            routerLink="/admin/verifications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Verifications
          </a>
          <a
            routerLink="/admin/services"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Services
          </a>
          <a
            routerLink="/admin/professionals"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
             Professionals
          </a>
          <a
            routerLink="/admin/notifications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg> Broadcasts
          </a>
          <a
            routerLink="/admin/audit"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
             Audit Logs
          </a>
          <a
            routerLink="/admin/system"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> System Health
          </a>
          <a
            routerLink="/admin/settings"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Settings
          </a>
        </nav>
      </header>

      <main class="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe((u) => {
      this.user = u;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Platform Administrator';
  }

  onLogout(): void {
    if (confirm('Are you sure you want to sign out of Admin Ops?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
