import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col justify-between">
      <!-- Minimal top bar -->
      <header class="bg-n-0 border-b border-n-200 px-4 sm:px-6 flex items-center justify-between h-14 mobile-top-bar sticky top-0 z-50">
        <a routerLink="/" class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
          <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
        </a>
        <div class="flex items-center gap-2">
          <a routerLink="/login"
            class="text-sm font-semibold text-n-500 hover:text-n-900 px-3 py-1.5 rounded-lg hover:bg-n-100 transition-colors whitespace-nowrap">
            Sign in
          </a>
          <a routerLink="/register"
            class="btn-primary text-sm" style="padding: 8px 16px; min-height: 36px;">
            Register
          </a>
        </div>
      </header>

      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>

      <footer class="bg-n-0 border-t border-n-200 py-4 px-6 text-center text-xs text-n-500">
        <div class="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Grih360 Technologies Pvt Ltd.</span>
          <div class="flex items-center gap-3 font-semibold">
            <a routerLink="/privacy" class="hover:text-brand transition-colors">Privacy Policy</a>
            <span class="text-n-300">•</span>
            <a routerLink="/terms" class="hover:text-brand transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {}
