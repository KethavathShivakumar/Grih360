import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-professional-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-xs">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Left: Logo & Nav -->
          <div class="flex items-center space-x-6">
            <a routerLink="/professional/dashboard" class="flex items-center space-x-2 group">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                N
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
            </a>
            <span class="hidden sm:inline-flex px-2.5 py-0.5 bg-[#E26D46] text-white text-[10px] font-black rounded-md uppercase tracking-wide">
              Service Pro
            </span>

            <!-- Desktop Nav Links -->
            <nav class="hidden md:flex items-center space-x-1 text-xs font-bold text-slate-600">
              <a
                routerLink="/professional/dashboard"
                routerLinkActive="bg-[#0F2937] text-white"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Dashboard
              </a>
              <a
                routerLink="/professional/requests"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Requests
              </a>
              <a
                routerLink="/professional/active-job"
                routerLinkActive="bg-[#2D7A5E] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all flex items-center gap-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Job</span>
              </a>
              <a
                routerLink="/professional/history"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                History
              </a>
              <a
                routerLink="/professional/services"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Services
              </a>
              <a
                routerLink="/professional/availability"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Availability
              </a>
              <a
                routerLink="/professional/service-area"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Coverage
              </a>
              <a
                routerLink="/professional/reviews"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Reviews
              </a>
              <a
                routerLink="/professional/notifications"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Alerts
              </a>
            </nav>
          </div>

          <!-- Right: Profile & Actions -->
          <div class="flex items-center space-x-3">
            <a
              routerLink="/professional/profile"
              class="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer group"
              title="View Pro Profile"
            >
              <div class="w-8 h-8 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
              <div class="hidden lg:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 group-hover:text-[#2D7A5E] leading-tight">{{ userName }}</span>
                <span class="text-[10px] text-slate-400 font-semibold">Service Partner</span>
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
            routerLink="/professional/dashboard"
            routerLinkActive="bg-[#0F2937] text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📊 Dashboard
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/requests"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🛠️ Service Requests
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/active-job"
            routerLinkActive="bg-[#2D7A5E] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ⚡ Active Job
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/history"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📜 Job History
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/services"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🔧 Offered Services
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/availability"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ⏰ Availability & Duty
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/service-area"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📍 Coverage Area
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/reviews"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ⭐ Customer Reviews
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/notifications"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🔔 Notifications
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/professional/profile"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            👤 Profile & Settings
          </a>
          <div class="pt-2 border-t border-slate-100">
            <button
              (click)="onLogout()"
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-grow p-4 sm:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Professional Role - Minimal Monochrome Lucide SVG) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-1 z-40 grid grid-cols-5 items-center justify-items-center shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <!-- Home -->
        <a
          routerLink="/professional/dashboard"
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

        <!-- Requests -->
        <a
          routerLink="/professional/requests"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Requests</span>
        </a>

        <!-- Active Jobs -->
        <a
          routerLink="/professional/active-job"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">Jobs</span>
        </a>

        <!-- History -->
        <a
          routerLink="/professional/history"
          routerLinkActive="text-[#2D7A5E] font-bold"
          class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-full text-center group"
        >
          <svg class="w-5 h-5 stroke-[1.8] group-[.font-bold]:stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">History</span>
        </a>

        <!-- Profile -->
        <a
          routerLink="/professional/profile"
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
export class ProfessionalLayoutComponent implements OnInit, OnDestroy {
  user: any = null;
  mobileMenuOpen: boolean = false;
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
    return this.user?.fullName || this.user?.name || 'Professional Partner';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'P';
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
