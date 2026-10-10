import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#0A192F] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-400 selection:text-slate-900">
      <!-- Top Bar -->
      <header class="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
            360
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-black tracking-tight text-white">Grih360</span>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Admin Console
              </span>
            </div>
            <p class="text-[11px] text-slate-400">Platform Governance & Operational Infrastructure</p>
          </div>
        </div>

        <a routerLink="/" class="text-xs font-bold text-slate-400 hover:text-white transition flex items-center space-x-1">
          <span>← Return to Public Site</span>
        </a>
      </header>

      <!-- Centered Security Card -->
      <main class="max-w-md w-full mx-auto my-12">
        <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              🛡️
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">Administrative Sign In</h1>
            <p class="text-xs text-slate-400">
              Restricted portal. Unauthorized access attempts are monitored and logged.
            </p>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-2xl flex items-center justify-between">
            <span>⚠️ {{ errorMessage }}</span>
            <button (click)="errorMessage = ''" class="text-rose-400 hover:text-rose-200">✕</button>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label class="font-bold uppercase tracking-wider text-[11px] text-slate-400">Administrator Email / ID</label>
              <input
                type="text"
                [(ngModel)]="identifier"
                name="identifier"
                required
                autocomplete="username"
                placeholder="admin@grih360.com"
                class="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold uppercase tracking-wider text-[11px] text-slate-400">Master Password</label>
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="••••••••••••"
                class="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading || !identifier || !password"
              class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm mt-2"
            >
              {{ isLoading ? 'Verifying Credentials...' : 'Authenticate as Administrator' }}
            </button>
          </form>

          <!-- Security Notice -->
          <div class="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center space-y-1">
            <p>🔒 256-bit TLS encrypted administrative session</p>
            <p>Role-based access verification enforced on every API request.</p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-800 text-xs text-slate-500">
        Grih360 Enterprise Platform &copy; 2026. All rights reserved.
      </footer>
    </div>
  `,
})
export class AdminLoginComponent implements OnInit {
  public identifier: string = '';
  public password: string = '';
  public showPassword: boolean = false;
  public isLoading: boolean = false;
  public errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  public onSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Please enter both your administrator email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.adminLogin(this.identifier.trim(), this.password).subscribe({
      next: (res) => {
        const user = res.data?.user;
        if (!user || user.role !== 'ADMIN') {
          // Reject non-admin users attempting to access the admin portal
          this.authService.logout();
          this.isLoading = false;
          this.errorMessage = 'Access Denied: This console is strictly reserved for authorized platform administrators.';
          return;
        }

        this.isLoading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid administrator credentials. Access logged.';
      },
    });
  }
}
