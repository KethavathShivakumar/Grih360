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
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-xs">
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
      <main class="flex-grow p-4 sm:p-6 pb-20 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Owner) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E6DF] py-2 px-3 z-40 flex items-center justify-around shadow-lg">
        <a
          routerLink="/owner/dashboard"
          routerLinkActive="text-[#0F2937] font-black"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">📊</span>
          <span>Dashboard</span>
        </a>
        <a
          routerLink="/owner/properties"
          routerLinkActive="text-[#0F2937] font-black"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">🏢</span>
          <span>Properties</span>
        </a>
        <a
          routerLink="/owner/properties/new"
          routerLinkActive="text-[#2D7A5E] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">➕</span>
          <span>Add</span>
        </a>
        <a
          routerLink="/owner/rentals"
          routerLinkActive="text-[#0F2937] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">📜</span>
          <span>Rentals</span>
        </a>
        <a
          routerLink="/owner/profile"
          routerLinkActive="text-[#0F2937] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">👤</span>
          <span>Profile</span>
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
