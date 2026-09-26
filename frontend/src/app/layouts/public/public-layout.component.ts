import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
      <header class="bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <a routerLink="/" class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-bold text-lg shadow-xs">
            N
          </div>
          <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
        </a>
        <div class="flex items-center space-x-3">
          <a routerLink="/auth/login" class="text-xs font-bold text-slate-700 hover:text-[#0F2937] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            Sign In
          </a>
          <a routerLink="/auth/register" class="text-xs font-bold text-white bg-[#2D7A5E] hover:bg-[#23614a] px-3.5 py-1.5 rounded-lg shadow-xs transition-colors">
            Register
          </a>
        </div>
      </header>

      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>

      <footer class="bg-white border-t border-[#E8E6DF] py-4 text-center text-xs text-slate-500">
        © 2026 Nivas360 Technologies Pvt Ltd • Model Tenancy Act Compliant
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {}
