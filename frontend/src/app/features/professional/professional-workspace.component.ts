import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerCareComponent } from '../../shared/components/customer-care/customer-care.component';

@Component({
  selector: 'app-professional-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerCareComponent],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col">
      <header class="bg-white border-b border-[#E8E6DF] px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <a routerLink="/" class="text-xl font-extrabold text-[#0F2937]">Grih<span class="text-[#2D7A5E]">360</span></a>
          <span class="px-2.5 py-0.5 bg-[#E26D46] text-white text-xs font-bold rounded-full">Service Professional Workspace</span>
        </div>
        <app-customer-care></app-customer-care>
      </header>

      <main class="flex-grow p-6">
        <div class="max-w-6xl mx-auto space-y-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
})
export class ProfessionalWorkspaceComponent {
}
