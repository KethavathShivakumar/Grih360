import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-slate-800">
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-[#E8E6DF] px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-xs">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Left: Logo & Desktop Navigation -->
          <div class="flex items-center space-x-8">
            <a routerLink="/tenant/dashboard" class="flex items-center space-x-2 group">
              <div class="w-8 h-8 rounded-lg bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                N
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-bold text-slate-600">
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
                Saved Homes
              </a>
              <a
                routerLink="/tenant/applications"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Applications
              </a>
              <a
                routerLink="/tenant/services"
                routerLinkActive="bg-[#0F2937] text-white"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0F2937] transition-all"
              >
                Services
              </a>
            </nav>
          </div>

          <!-- Right: User Profile & Actions -->
          <div class="flex items-center space-x-3">
            <!-- User Profile Button (Desktop & Mobile) -->
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
            routerLink="/tenant/dashboard"
            routerLinkActive="bg-[#0F2937] text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🏠 Dashboard
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/homes"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🔍 Find Homes
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/saved"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            ❤️ Saved Homes
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/applications"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            📄 Rental Applications
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/services"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            🛠️ Home Services
          </a>
          <a
            (click)="closeMobileMenu()"
            routerLink="/tenant/profile"
            routerLinkActive="bg-[#0F2937] text-white"
            class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            👤 My Profile
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

      <!-- Main Content Area (extra bottom padding on mobile for bottom navigation bar) -->
      <main class="flex-grow p-4 sm:p-6 pb-20 md:pb-6 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>

      <!-- Mobile Bottom Navigation Bar (Requirement #7) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E6DF] py-2 px-3 z-40 flex items-center justify-around shadow-lg">
        <a
          routerLink="/tenant/dashboard"
          routerLinkActive="text-[#0F2937] font-black"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">🏠</span>
          <span>Home</span>
        </a>
        <a
          routerLink="/tenant/homes"
          routerLinkActive="text-[#0F2937] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">🔍</span>
          <span>Find</span>
        </a>
        <a
          routerLink="/tenant/saved"
          routerLinkActive="text-[#0F2937] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">❤️</span>
          <span>Saved</span>
        </a>
        <a
          routerLink="/tenant/applications"
          routerLinkActive="text-[#0F2937] font-black"
          class="flex flex-col items-center text-slate-400 text-[10px] font-semibold transition-colors"
        >
          <span class="text-lg">📄</span>
          <span>Apps</span>
        </a>
        <a
          routerLink="/tenant/profile"
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
export class TenantLayoutComponent implements OnInit, OnDestroy {
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
