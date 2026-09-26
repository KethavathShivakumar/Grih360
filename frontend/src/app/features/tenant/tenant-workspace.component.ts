import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerCareComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col">
      <header class="bg-white border-b border-[#E8E6DF] px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <a routerLink="/" class="text-xl font-extrabold text-[#0F2937]">Nivas<span class="text-[#2D7A5E]">360</span></a>
          <span class="px-2.5 py-0.5 bg-[#EBF5F0] text-[#2D7A5E] text-xs font-bold rounded-full">Tenant Workspace</span>
        </div>
        <app-customer-care></app-customer-care>
      </header>

      <main class="flex-grow p-6">
        <div class="max-w-6xl mx-auto space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-black text-[#0F2937]">Tenant Workspace & Dashboard</h1>
              <p class="text-xs text-slate-500">Track current rental, applications, and home maintenance</p>
            </div>
            <app-status-badge status="VERIFIED"></app-status-badge>
          </div>
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
})
export class TenantWorkspaceComponent {
}
