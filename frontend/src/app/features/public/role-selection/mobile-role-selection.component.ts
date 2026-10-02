import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-mobile-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 font-sans text-slate-800">
      <!-- Slim Top Bar Header -->
      <header class="w-full flex items-center justify-between py-3 border-b border-[#E8E6DF]">
        <div class="flex items-center space-x-2 shrink-0">
          <div class="w-8 h-8 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-xs">
            N
          </div>
          <div class="flex flex-col">
            <span class="text-base font-black text-[#0F2937] leading-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
            <span class="text-[10px] text-slate-500 font-medium leading-none">Civic Rental Hub</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <a routerLink="/auth/login" class="text-xs font-bold text-slate-700 hover:text-[#0F2937] px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap min-h-[44px] flex items-center">
            Sign In
          </a>
          <a routerLink="/auth/register" class="text-xs font-bold text-white bg-[#0F2937] active:bg-[#164E63] px-3 py-2 rounded-lg shadow-xs transition-colors whitespace-nowrap min-h-[44px] flex items-center">
            Get Started
          </a>
        </div>
      </header>

      <!-- Main Body -->
      <main class="my-auto py-6 space-y-5">
        <div class="space-y-2 text-center">
          <div class="inline-flex items-center gap-1.5 bg-[#EBF5F0] border border-[#D1EADF] px-3 py-1 rounded-full text-[11px] font-bold text-[#2D7A5E]">
            <app-status-badge status="VERIFIED"></app-status-badge>
            <span>AP & TG Government Compliant</span>
          </div>
          <h1 class="text-2xl font-black text-[#0F2937] tracking-tight">
            Welcome to Nivas360
          </h1>
          <p class="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Select how you would like to proceed with your verified tenancy workspace.
          </p>
        </div>

        <div class="space-y-3 pt-1">
          <!-- Property Owner Card -->
          <div
            (click)="selectOwner()"
            class="p-4 border-2 border-slate-200 active:border-[#0F2937] bg-white rounded-2xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[72px]"
          >
            <div class="w-11 h-11 rounded-xl bg-[#0F2937] text-white flex items-center justify-center text-xl shrink-0 font-bold">
              🏛️
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-[#0F2937]">Property Owner</h2>
                <span class="text-xs font-bold text-[#0F2937]">→</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                List properties, review applicants, digital leases & collections.
              </p>
            </div>
          </div>

          <!-- Home Seeker / Tenant Card -->
          <div
            (click)="selectTenant()"
            class="p-4 border-2 border-slate-200 active:border-[#2D7A5E] bg-white rounded-2xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[72px]"
          >
            <div class="w-11 h-11 rounded-xl bg-[#2D7A5E] text-white flex items-center justify-center text-xl shrink-0 font-bold">
              🏡
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-[#0F2937]">Tenant / Resident</h2>
                <span class="text-xs font-bold text-[#2D7A5E]">→</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                Zero-brokerage verified homes with Google Maps & direct apply.
              </p>
            </div>
          </div>

          <!-- Service Professional Card -->
          <div
            (click)="selectProfessional()"
            class="p-4 border-2 border-slate-200 active:border-[#164E63] bg-white rounded-2xl shadow-xs flex items-center gap-3.5 cursor-pointer min-h-[72px]"
          >
            <div class="w-11 h-11 rounded-xl bg-[#164E63] text-white flex items-center justify-center text-xl shrink-0 font-bold">
              ⚡
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-[#0F2937]">Trade Professional</h2>
                <span class="text-xs font-bold text-[#164E63]">→</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                Certified technicians & home maintenance service requests.
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-3 text-center text-[11px] text-slate-500 border-t border-[#E8E6DF] flex items-center justify-between">
        <span>© 2026 Nivas360</span>
        <a routerLink="/admin/login" class="text-slate-400 font-semibold hover:text-[#0F2937]">
          Admin Console →
        </a>
      </footer>
    </div>
  `,
})
export class MobileRoleSelectionComponent {
  constructor(private router: Router) {}

  selectOwner(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'OWNER' } });
  }

  selectTenant(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'TENANT' } });
  }

  selectProfessional(): void {
    this.router.navigate(['/auth/login'], { queryParams: { role: 'PROFESSIONAL' } });
  }
}
