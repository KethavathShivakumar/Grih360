import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerCareComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-8">
      <header class="max-w-7xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#E8E6DF]">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-[#0F2937] text-white flex items-center justify-center font-bold text-xl">
            N
          </div>
          <div>
            <span class="text-xl font-extrabold text-[#0F2937]">Nivas<span class="text-[#2D7A5E]">360</span></span>
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
            Welcome to Nivas360
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
            <div class="w-14 h-14 rounded-2xl bg-[#0F2937] text-white flex items-center justify-center text-2xl font-bold group-hover:scale-105 transition-transform">
              🏛️
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
            <div class="w-14 h-14 rounded-2xl bg-[#2D7A5E] text-white flex items-center justify-center text-2xl font-bold group-hover:scale-105 transition-transform">
              🏡
            </div>
            <div>
              <h2 class="text-xl font-black text-[#0F2937]">Tenant / Resident</h2>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Discover zero-brokerage verified homes across Telangana & AP with Google Maps, apply directly, and book maintenance.
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
            <div class="w-14 h-14 rounded-2xl bg-[#164E63] text-white flex items-center justify-center text-2xl font-bold group-hover:scale-105 transition-transform">
              ⚡
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
        <span>© 2026 Nivas360 Technologies Pvt Ltd • Model Tenancy Act Compliant</span>
        <a routerLink="/admin/login" class="text-slate-400 hover:text-[#0F2937] font-semibold transition">
          🛡️ Admin Console →
        </a>
      </footer>
    </div>
  `,
})
export class RoleSelectionComponent {
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
