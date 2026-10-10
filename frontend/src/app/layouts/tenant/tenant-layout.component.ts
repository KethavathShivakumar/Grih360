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
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      <!-- Slim Top Bar Header -->
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-50 shadow-xs mobile-top-bar">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Left: Logo & Desktop Navigation -->
          <div class="flex items-center space-x-6 lg:space-x-8">
            <a routerLink="/tenant/dashboard" class="flex items-center space-x-2 group">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                G
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Grih<span class="text-[#2D7A5E]">360</span></span>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="hidden xl:flex items-center space-x-1 lg:space-x-1.5 text-xs font-bold text-slate-600">
              <a
                routerLink="/tenant/dashboard"
                routerLinkActive="bg-[#0F2937] text-white"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Dashboard
              </a>
              <a
                routerLink="/tenant/homes"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Find Homes
              </a>
              <a
                routerLink="/tenant/saved"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Saved
              </a>
              <a
                routerLink="/tenant/applications"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Applications
              </a>
              <a
                routerLink="/tenant/verification"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Verification
              </a>
              <a
                routerLink="/tenant/rental"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all flex items-center gap-1"
              >
                <span>My Rental</span>
              </a>
              <a
                routerLink="/tenant/rent"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Rent Tracking
              </a>
              <a
                routerLink="/tenant/documents"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Documents
              </a>
              <a
                routerLink="/tenant/services"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Services
              </a>
            </nav>

            <!-- Medium Screens Compact Nav -->
            <nav class="hidden md:flex xl:hidden items-center space-x-1 text-xs font-bold text-slate-600">
              <a
                routerLink="/tenant/dashboard"
                routerLinkActive="bg-[#0F2937] text-white"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Dashboard
              </a>
              <a
                routerLink="/tenant/homes"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Find
              </a>
              <a
                routerLink="/tenant/applications"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Apps
              </a>
              <a
                routerLink="/tenant/rental"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Rental
              </a>
              <a
                routerLink="/tenant/rent"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Rent
              </a>
            </nav>
          </div>

          <!-- Right: Notifications, Settings, Profile & Actions -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Notifications Bell with Unread Badge -->
            <a
              routerLink="/tenant/notifications"
              routerLinkActive="text-[#2D7A5E] bg-emerald-50"
              class="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Notifications"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <!-- Real Data Unread Badge -->
              <span
                *ngIf="unreadCount > 0"
                class="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </a>

            <!-- User Profile Avatar Link -->
            <a
              routerLink="/tenant/profile"
              class="flex items-center space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer group min-h-[44px]"
              title="View Tenant Profile"
            >
              <div class="w-8 h-8 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
              <div class="hidden lg:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 group-hover:text-[#2D7A5E] leading-tight">{{ userName }}</span>
                <span class="text-[10px] text-slate-400 font-semibold">Tenant</span>
              </div>
            </a>

            <!-- Logout Button (Desktop) -->
            <button
              (click)="onLogout()"
              type="button"
              class="hidden sm:inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[44px]"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-grow p-4 sm:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Tenant Role: Home, Find, Saved, Rental, Profile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-1 z-40 grid grid-cols-5 items-center justify-items-center shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <!-- Home -->
        <a
          routerLink="/tenant/dashboard"
          routerLinkActive="text-[#2D7A5E] font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group min-h-[44px]"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Home</span>
        </a>

        <!-- Find -->
        <a
          routerLink="/tenant/homes"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group min-h-[44px]"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Find</span>
        </a>

        <!-- Saved -->
        <a
          routerLink="/tenant/saved"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group min-h-[44px]"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Saved</span>
        </a>

        <!-- Rental -->
        <a
          routerLink="/tenant/rental"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group min-h-[44px]"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="7.5" cy="15.5" r="5.5"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 2-9.6 9.6"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.5 7.5 3 3"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Rental</span>
        </a>

        <!-- Profile -->
        <a
          routerLink="/tenant/profile"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group min-h-[44px]"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Profile</span>
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
    return this.user?.fullName || this.user?.name || 'Tenant User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'T';
  }

  onLogout(): void {
    if (confirm('Are you sure you want to sign out of Grih360?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
