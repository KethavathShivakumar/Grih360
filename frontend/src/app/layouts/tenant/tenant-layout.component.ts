import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col">

      <!-- Top app bar -->
      <header class="bg-n-0 border-b border-n-200 sticky top-0 z-50 mobile-top-bar">
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          <!-- Logo + desktop nav -->
          <div class="flex items-center gap-6 xl:gap-8">
            <a routerLink="/tenant/dashboard" class="flex items-center gap-2 shrink-0">
              <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
              <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
            </a>

            <!-- Desktop nav (xl+) -->
            <nav class="hidden xl:flex items-center gap-0.5 text-sm text-n-500">
              <a routerLink="/tenant/dashboard" routerLinkActive="text-n-900 bg-n-100"
                [routerLinkActiveOptions]="{exact:true}"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Dashboard</a>
              <a routerLink="/tenant/homes" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Find Homes</a>
              <a routerLink="/tenant/saved" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Saved</a>
              <a routerLink="/tenant/applications" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Applications</a>
              <a routerLink="/tenant/verification" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Verification</a>
              <a routerLink="/tenant/rental" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">My Rental</a>
              <a routerLink="/tenant/rent" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Rent</a>
              <a routerLink="/tenant/documents" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Documents</a>
              <a routerLink="/tenant/services" routerLinkActive="text-n-900 bg-n-100"
                class="px-3 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Services</a>
            </nav>

            <!-- Medium screen compact nav -->
            <nav class="hidden md:flex xl:hidden items-center gap-0.5 text-sm text-n-500">
              <a routerLink="/tenant/dashboard" routerLinkActive="text-n-900 bg-n-100"
                [routerLinkActiveOptions]="{exact:true}"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Home</a>
              <a routerLink="/tenant/homes" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Find</a>
              <a routerLink="/tenant/applications" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Apps</a>
              <a routerLink="/tenant/rental" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Rental</a>
              <a routerLink="/tenant/rent" routerLinkActive="text-n-900 bg-n-100"
                class="px-2.5 py-1.5 rounded-md hover:bg-n-100 hover:text-n-900 transition-colors font-semibold">Rent</a>
            </nav>
          </div>

          <!-- Right actions -->
          <div class="flex items-center gap-2">
            <!-- Notifications -->
            <a routerLink="/tenant/notifications" routerLinkActive="text-brand bg-brand-subtle"
              class="relative p-2 text-n-500 hover:text-n-900 hover:bg-n-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Notifications">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span
                *ngIf="unreadCount > 0"
                class="absolute top-1.5 right-1.5 w-4 h-4 bg-err-text text-n-0 rounded-full text-xs flex items-center justify-center font-semibold leading-none"
                style="font-size: 10px;"
              >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </a>

            <!-- Profile -->
            <a routerLink="/tenant/profile"
              class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-n-100 border border-n-200 transition-colors min-h-[44px] cursor-pointer"
              title="Profile">
              <div class="w-7 h-7 rounded-full bg-navy text-n-0 flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover"/>
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
              <div class="hidden lg:flex flex-col">
                <span class="text-xs font-semibold text-n-900 leading-tight">{{ userName }}</span>
                <span class="text-n-400 leading-none" style="font-size: 10px;">Tenant</span>
              </div>
            </a>

            <!-- Logout (desktop) -->
            <button
              (click)="onLogout()"
              type="button"
              class="hidden sm:inline-flex items-center px-3 py-1.5 border border-n-200 text-xs font-semibold text-n-500 hover:text-err-text hover:border-err-border hover:bg-err-bg rounded-lg transition-colors cursor-pointer min-h-[44px]">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-grow px-4 sm:px-6 py-6 pb-24 md:pb-8 max-w-screen-xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile bottom tab bar -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-n-0 border-t border-n-200 grid grid-cols-5 z-40 pb-safe">
        <a routerLink="/tenant/dashboard" routerLinkActive="text-brand" [routerLinkActiveOptions]="{exact:true}"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Home</span>
        </a>
        <a routerLink="/tenant/homes" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Find</span>
        </a>
        <a routerLink="/tenant/saved" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Saved</span>
        </a>
        <a routerLink="/tenant/rental" routerLinkActive="text-brand"
          class="flex flex-col items-center justify-center py-2 text-n-400 hover:text-n-700 transition-colors min-h-[56px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="text-xs mt-0.5 font-semibold">Rental</span>
        </a>
        <a routerLink="/tenant/profile" routerLinkActive="text-brand"
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
export class TenantLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  unreadCount: number = 0;
  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe((u) => {
      this.user = u;
    });

    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.unreadCount = res.data.filter((n: any) => !n.isRead).length;
        }
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Tenant';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'T';
  }

  onLogout(): void {
    if (confirm('Sign out of Grih360?')) {
      this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
