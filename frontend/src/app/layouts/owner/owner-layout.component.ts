import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-xs mobile-top-bar">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Left: Brand Logo & Desktop Nav -->
          <div class="flex items-center space-x-6">
            <a routerLink="/owner/dashboard" class="flex items-center space-x-2 group">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                N
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
            </a>
            <span class="hidden sm:inline-flex px-2.5 py-0.5 bg-[#0F2937] text-[#FACC15] text-[10px] font-black rounded-md uppercase tracking-wide">
              Owner Console
            </span>

            <!-- Desktop Nav Links -->
            <nav class="hidden xl:flex items-center space-x-1 text-xs font-bold text-slate-600">
              <a
                routerLink="/owner/dashboard"
                routerLinkActive="bg-[#0F2937] text-white shadow-2xs"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Dashboard
              </a>
              <a
                routerLink="/owner/properties"
                routerLinkActive="bg-[#0F2937] text-white shadow-2xs"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Properties
              </a>
              <a
                routerLink="/owner/properties/new"
                routerLinkActive="bg-[#2D7A5E] text-white font-bold"
                class="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#2D7A5E] hover:bg-[#2D7A5E] hover:text-white transition-all flex items-center gap-1"
              >
                <span>➕ Add Property</span>
              </a>
              <a
                routerLink="/owner/applicants"
                routerLinkActive="bg-[#0F2937] text-white shadow-2xs"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Applicants
              </a>
              <a
                routerLink="/owner/rentals"
                routerLinkActive="bg-[#0F2937] text-white shadow-2xs"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Rentals
              </a>
              <a
                routerLink="/owner/rent-tracking"
                routerLinkActive="bg-[#0F2937] text-white shadow-2xs"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Rent Tracking
              </a>
            </nav>

            <!-- Medium Screens Nav (compact) -->
            <nav class="hidden md:flex xl:hidden items-center space-x-1 text-xs font-bold text-slate-600">
              <a
                routerLink="/owner/dashboard"
                routerLinkActive="bg-[#0F2937] text-white"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Dashboard
              </a>
              <a
                routerLink="/owner/properties"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Properties
              </a>
              <a
                routerLink="/owner/applicants"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Applicants
              </a>
              <a
                routerLink="/owner/rentals"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937]"
              >
                Rentals
              </a>
            </nav>
          </div>

          <!-- Right: Owner Notifications, Settings, Profile & Actions -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Notifications Bell -->
            <a
              routerLink="/owner/notifications"
              routerLinkActive="text-[#2D7A5E] bg-emerald-50"
              class="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span
                *ngIf="unreadCount > 0"
                class="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </a>

            <!-- Settings Button -->
            <a
              routerLink="/owner/settings"
              routerLinkActive="text-[#0F2937] bg-slate-100"
              class="hidden sm:inline-flex p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Workspace Settings"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </a>

            <!-- Owner Profile Link -->
            <a
              routerLink="/owner/profile"
              routerLinkActive="ring-2 ring-[#2D7A5E]"
              class="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer group"
              title="View Owner Profile"
            >
              <div class="w-8 h-8 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
              <div class="hidden lg:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 group-hover:text-[#2D7A5E] leading-tight">{{ userName }}</span>
                <span class="text-[10px] text-slate-400 font-semibold">Property Owner</span>
              </div>
            </a>

            <!-- Logout Button -->
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
              class="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
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
        <div *ngIf="mobileMenuOpen" class="md:hidden pt-3 pb-2 border-t border-slate-100 mt-2 space-y-1">
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/dashboard"
            routerLinkActive="bg-[#0F2937] text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📊 Dashboard
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/properties"
            routerLinkActive="bg-[#0F2937] text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🏢 My Properties
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/properties/new"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ➕ Add New Property
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/applicants"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📋 Tenant Applicants
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/rentals"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📜 Rental Leases
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/rent-tracking"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            💰 Rent Tracking
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/notifications"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
          >
            <span>🔔 Notifications</span>
            <span *ngIf="unreadCount > 0" class="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
              {{ unreadCount }}
            </span>
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/profile"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            👤 Owner Profile
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/owner/settings"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ⚙️ Settings
          </a>
          <div class="pt-2 border-t border-slate-100">
            <button
              (click)="onLogout()"
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content (with padding for mobile bottom bar) -->
      <main class="flex-grow p-4 sm:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Owner Role - Minimal Monochrome Lucide SVG) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-1 z-40 grid grid-cols-5 items-center justify-items-center shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <!-- Home -->
        <a
          routerLink="/owner/dashboard"
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

        <!-- Properties -->
        <a
          routerLink="/owner/properties"
          routerLinkActive="text-[#2D7A5E] font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
            <path d="M9 22v-4h6v4"/>
            <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
            <path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Properties</span>
        </a>

        <!-- Applicants -->
        <a
          routerLink="/owner/applicants"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Applicants</span>
        </a>

        <!-- Rentals -->
        <a
          routerLink="/owner/rentals"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Rentals</span>
        </a>

        <!-- Profile -->
        <a
          routerLink="/owner/profile"
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
export class OwnerLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  unreadCount: number = 0;
  mobileMenuOpen: boolean = false;
  private subs: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe((u) => {
        this.user = u;
      })
    );

    this.subs.add(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
      })
    );

    this.notificationService.fetchNotifications();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Property Owner';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'O';
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
