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
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-xs mobile-top-bar">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Left: Logo & Desktop Navigation -->
          <div class="flex items-center space-x-6 lg:space-x-8">
            <a routerLink="/tenant/dashboard" class="flex items-center space-x-2 group">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                N
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
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
            <!-- Notifications Bell -->
            <a
              routerLink="/tenant/notifications"
              routerLinkActive="text-[#2D7A5E] bg-emerald-50"
              class="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <!-- Unread Badge -->
              <span
                *ngIf="unreadCount > 0"
                class="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </a>

            <!-- Settings Button -->
            <a
              routerLink="/tenant/settings"
              routerLinkActive="text-[#0F2937] bg-slate-100"
              class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Settings"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </a>

            <!-- User Profile Button -->
            <a
              routerLink="/tenant/profile"
              class="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer group"
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
              class="hidden sm:inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              Logout
            </button>

            <!-- Mobile Hamburger Toggle -->
            <button
              (click)="toggleMobileMenu()"
              type="button"
              class="xl:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                <path *ngIf="mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Drawer Menu -->
        <div *ngIf="mobileMenuOpen" class="xl:hidden pt-3 pb-2 border-t border-slate-100 mt-2 space-y-1">
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/dashboard"
            routerLinkActive="bg-[#0F2937] text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/homes"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Find Homes
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/search"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Search Results
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/saved"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Saved Homes
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/applications"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Rental Applications
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/verification"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Identity Verification
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/rental"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            My Rental & Lease
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/rent"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Rent Tracking
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/documents"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Tenancy Documents
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/handover"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Handover Checklist
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/condition"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Property Condition
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/services"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Home Services
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/notifications"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Notifications ({{ unreadCount }})
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/settings"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Settings
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/profile"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            My Profile
          </a>
          <div class="pt-2 border-t border-slate-100">
            <button
              (click)="onLogout()"
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-grow p-4 sm:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Minimal Monochrome Lucide SVG Style) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-1 z-40 grid grid-cols-5 items-center justify-items-center shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <!-- Home -->
        <a
          routerLink="/tenant/dashboard"
          routerLinkActive="text-[#2D7A5E] font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
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
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
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
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
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
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
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
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
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
  mobileMenuOpen: boolean = false;
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

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onLogout(): void {
    if (confirm('Are you sure you want to sign out of Nivas360?')) {
      this.closeMobileMenu();
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
