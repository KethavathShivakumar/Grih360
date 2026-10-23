import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-professional-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col">

      <!-- Top app bar -->
      <header class="bg-n-0 border-b border-n-200 sticky top-0 z-50 mobile-top-bar">
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          <div class="flex items-center gap-6">
            <a routerLink="/professional/dashboard" class="flex items-center gap-2 shrink-0">
              <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
              <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
            </a>
            <span class="hidden sm:inline-flex px-2 py-0.5 bg-brand-subtle border border-brand-border text-brand text-xs font-semibold rounded">
              Service Pro
            </span>

            <!-- Desktop nav -->
            <nav class="hidden md:flex items-center gap-0.5 text-sm text-n-500">
              <a routerLink="/professional/dashboard" routerLinkActive="text-n-900 bg-n-100" [routerLinkActiveOptions]="{exact:true}"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Dashboard</a>
              <a routerLink="/professional/requests" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Requests</a>
              <a routerLink="/professional/active-job" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Active Job</a>
              <a routerLink="/professional/history" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">History</a>
              <a routerLink="/professional/services" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Services</a>
              <a routerLink="/professional/availability" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Availability</a>
              <a routerLink="/professional/reviews" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Reviews</a>
            </nav>
          </div>

          <!-- Right actions -->
          <div class="flex items-center gap-2">
            <a routerLink="/professional/notifications" routerLinkActive="text-brand bg-brand-subtle"
              class="relative p-2 text-n-500 hover:text-n-900 hover:bg-n-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span *ngIf="unreadCount > 0"
                class="absolute top-1.5 right-1.5 w-4 h-4 bg-err-text text-n-0 rounded-full flex items-center justify-center font-semibold leading-none"
                style="font-size: 10px;">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </a>

            <a routerLink="/professional/profile" class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-n-100 border border-n-200 transition-colors min-h-[44px] cursor-pointer">
              <div class="w-7 h-7 rounded-full bg-navy text-n-0 flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover"/>
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
              <div class="hidden lg:flex flex-col">
                <span class="text-xs font-semibold text-n-900 leading-tight">{{ userName }}</span>
                <span class="text-n-400 leading-none" style="font-size: 10px;">Service Partner</span>
              </div>
            </a>

            <button (click)="onLogout()" type="button"
              class="hidden sm:inline-flex items-center px-3 py-1.5 border border-n-200 text-xs font-semibold text-n-500 hover:text-err-text hover:border-err-border hover:bg-err-bg rounded-lg transition-colors cursor-pointer min-h-[44px]">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main class="flex-grow px-4 sm:px-6 py-6 pb-24 md:pb-8 max-w-screen-xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile bottom tab bar -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-n-0 border-t border-n-200 grid grid-cols-5 z-40 pb-safe">
        <a routerLink="/professional/dashboard" routerLinkActive="text-brand" [routerLinkActiveOptions]="{exact:true}"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Home</span>
        </a>
        <a routerLink="/professional/requests" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Requests</span>
        </a>
        <a routerLink="/professional/active-job" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Jobs</span>
        </a>
        <a routerLink="/professional/history" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">History</span>
        </a>
        <a routerLink="/professional/profile" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Profile</span>
        </a>
      </nav>
    </div>
  `,
})
export class ProfessionalLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  unreadCount: number = 0;
  private subs: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(this.authService.currentUser$.subscribe((u) => { this.user = u; }));
    this.subs.add(this.notificationService.unreadCount$.subscribe((count) => { this.unreadCount = count; }));
    this.notificationService.fetchNotifications();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  get userName(): string { return this.user?.fullName || this.user?.name || 'Professional'; }
  get userInitial(): string { return this.userName.charAt(0).toUpperCase() || 'P'; }

  onLogout(): void {
    if (confirm('Sign out of Grih360?')) {
      this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
