import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { MobileRoleSelectionComponent } from './mobile-role-selection.component';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeComponent,
    MobileRoleSelectionComponent,
  ],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-role-selection></app-mobile-role-selection>
    } @else {
      <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-8">
        <header class="max-w-7xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#E8E6DF]">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-[#0F2937] text-white flex items-center justify-center font-bold text-xl">
              G
            </div>
            <div>
              <span class="text-xl font-extrabold text-[#0F2937]">Grih<span class="text-[#2D7A5E]">360</span></span>
              <span class="block text-[11px] text-slate-500 font-medium">Deccan Civic Rental Ecosystem</span>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <a routerLink="/auth/login" class="text-xs font-bold text-slate-700 hover:text-[#0F2937] px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              Sign In
            </a>
            <a routerLink="/auth/register" class="text-xs font-bold text-white bg-[#0F2937] hover:bg-[#164E63] px-4 py-2 rounded-xl shadow-xs transition-colors">
              Get Started
            </a>
          </div>
        </header>

        <main class="max-w-4xl mx-auto w-full my-auto py-12 space-y-8 text-center">
          <div class="space-y-3">
            <div class="inline-flex items-center space-x-2 bg-[#EBF5F0] border border-[#D1EADF] px-4 py-1.5 rounded-full text-xs font-bold text-[#2D7A5E]">
              <app-status-badge status="VERIFIED"></app-status-badge>
              <span>AP & TG Government Compliant Registry</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-[#0F2937] tracking-tight">
              Welcome to Grih360
            </h1>
            <p class="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Select how you would like to proceed with your verified tenancy workspace.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <!-- Property Owner Card -->
            <div
              (click)="selectOwner()"
              class="bento-card cursor-pointer text-left p-6 sm:p-8 border-2 hover:border-[#0F2937] group transition-all space-y-4 rounded-3xl bg-white shadow-xs">
              <div class="w-14 h-14 rounded-2xl bg-[#0F2937] text-white flex items-center justify-center transition-colors">
                <svg class="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-black text-[#0F2937]">Property Owner</h2>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                  List properties with maps, review tenant applicants, manage digital lease agreements, and track collections.
                </p>
              </div>
              <div class="pt-2 flex items-center space-x-2 text-xs font-bold text-[#0F2937] group-hover:text-[#2D7A5E]">
                <span>Enter Owner Console</span>
                <span>→</span>
              </div>
            </div>

            <!-- Home Seeker / Tenant Card -->
            <div
              (click)="selectTenant()"
              class="bento-card cursor-pointer text-left p-6 sm:p-8 border-2 hover:border-[#2D7A5E] group transition-all space-y-4 rounded-3xl bg-white shadow-xs">
              <div class="w-14 h-14 rounded-2xl bg-[#2D7A5E] text-white flex items-center justify-center transition-colors">
                <svg class="w-7 h-7 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-black text-[#0F2937]">Tenant / Resident</h2>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                  Direct rental listings across Telangana and AP with interactive map search, direct applications, and maintenance requests.
                </p>
              </div>
              <div class="pt-2 flex items-center space-x-2 text-xs font-bold text-[#2D7A5E] group-hover:text-[#0F2937]">
                <span>Explore Homes & Portal</span>
                <span>→</span>
              </div>
            </div>

            <!-- Service Professional Card -->
            <div
              (click)="selectProfessional()"
              class="bento-card cursor-pointer text-left p-6 sm:p-8 border-2 hover:border-[#164E63] group transition-all space-y-4 rounded-3xl bg-white shadow-xs">
              <div class="w-14 h-14 rounded-2xl bg-[#164E63] text-white flex items-center justify-center transition-colors">
                <svg class="w-7 h-7 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <h2 class="text-xl font-black text-[#0F2937]">Trade Professional</h2>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                  Certified electricians, plumbers, and technicians. Accept on-demand resident maintenance service requests.
                </p>
              </div>
              <div class="pt-2 flex items-center space-x-2 text-xs font-bold text-[#164E63] group-hover:text-[#2D7A5E]">
                <span>Enter Pro Workspace</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </main>

        <footer class="max-w-7xl mx-auto w-full py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-[#E8E6DF]">
          <span>© 2026 Grih360 Technologies Pvt Ltd • Model Tenancy Act Compliant</span>
          <a routerLink="/admin/login" class="text-slate-400 hover:text-[#0F2937] font-semibold transition">
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Admin Console →
          </a>
        </footer>
      </div>
    }
  `,
})
export class RoleSelectionComponent {
  constructor(
    private router: Router,
    public isMobile: IsMobileService
  ) {}

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
