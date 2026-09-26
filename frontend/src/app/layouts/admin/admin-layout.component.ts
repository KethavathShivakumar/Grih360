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
                N
              </div>
              <span class="text-xl font-black text-[#0F2937] tracking-tight">
                Nivas<span class="text-[#2D7A5E]">360</span>
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
            📊 Dashboard
          </a>
          <a
            routerLink="/admin/users"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            👥 Users
          </a>
          <a
            routerLink="/admin/properties"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            🏠 Properties
          </a>
          <a
            routerLink="/admin/applications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            📄 Applications
          </a>
          <a
            routerLink="/admin/rentals"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            🔑 Rentals
          </a>
          <a
            routerLink="/admin/verifications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            🛡️ Verifications
          </a>
          <a
            routerLink="/admin/services"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            🛠️ Services
          </a>
          <a
            routerLink="/admin/professionals"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            👷 Professionals
          </a>
          <a
            routerLink="/admin/notifications"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            🔔 Broadcasts
          </a>
          <a
            routerLink="/admin/audit"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            📜 Audit Logs
          </a>
          <a
            routerLink="/admin/system"
            routerLinkActive="bg-white text-[#0F2937] shadow-xs font-bold"
            class="px-3 py-1.5 rounded-md hover:bg-white/60 transition-all whitespace-nowrap"
          >
            ⚡ System Health
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
