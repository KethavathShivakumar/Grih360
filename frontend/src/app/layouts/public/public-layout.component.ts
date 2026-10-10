import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
      <header class="bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] sticky top-0 z-50 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between min-h-[56px] sm:min-h-[64px] mobile-top-bar">
        <a routerLink="/" class="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-bold text-base sm:text-lg shadow-xs">
            G
          </div>
          <span class="text-lg sm:text-xl font-extrabold text-[#0F2937] tracking-tight">Grih<span class="text-[#2D7A5E]">360</span></span>
        </a>
        <div class="flex items-center gap-1.5 sm:space-x-3 shrink-0">
          <a routerLink="/auth/login" class="text-[11px] sm:text-xs font-bold text-slate-700 hover:text-[#0F2937] px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
            Sign In
          </a>
          <a routerLink="/auth/register" class="text-[11px] sm:text-xs font-bold text-white bg-[#2D7A5E] hover:bg-[#23614a] px-3 sm:px-3.5 py-1.5 rounded-lg shadow-xs transition-colors whitespace-nowrap">
            Register
          </a>
        </div>
      </header>

      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>

      <footer class="bg-white border-t border-[#E8E6DF] py-4 text-center text-xs text-slate-500">
        © 2026 Grih360 Technologies Pvt Ltd • Model Tenancy Act Compliant
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {}
