import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-n-50 text-n-900 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <!-- Top Bar -->
      <header class="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-n-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center font-semibold text-n-0 text-sm">
            G
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-n-100 text-n-700 border border-n-200 uppercase tracking-wide">
                Admin
              </span>
            </div>
            <p class="text-xs text-n-500">Platform operations & verification queue</p>
          </div>
        </div>

        <a routerLink="/" class="text-xs font-semibold text-n-500 hover:text-n-900 transition-colors flex items-center gap-1">
          <span>← Public site</span>
        </a>
      </header>

      <!-- Centered Security Card -->
      <main class="max-w-md w-full mx-auto my-12">
        <div class="card p-6 sm:p-8 space-y-6">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-n-900 tracking-tight">Admin Console Sign In</h1>
            <p class="text-xs text-n-500">
              Sign in with your administrator credentials to access the ID review queue and platform tools.
            </p>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="p-3 bg-err-bg border border-err-border text-err-text text-xs font-semibold rounded-lg flex items-center justify-between gap-2">
            <span>{{ errorMessage }}</span>
            <button (click)="errorMessage = ''" type="button" class="text-err-text hover:opacity-75 cursor-pointer">×</button>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-semibold text-xs text-n-700">Administrator Email</label>
              <input
                type="text"
                [(ngModel)]="identifier"
                name="identifier"
                required
                autocomplete="username"
                placeholder="admin@grih360.com"
                class="w-full px-3.5 py-2.5 bg-n-0 border border-n-200 rounded-lg text-n-900 placeholder-n-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block font-semibold text-xs text-n-700">Password</label>
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="text-xs text-brand hover:text-brand-hover font-semibold cursor-pointer"
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
                class="w-full px-3.5 py-2.5 bg-n-0 border border-n-200 rounded-lg text-n-900 placeholder-n-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading || !identifier || !password"
              class="w-full py-2.5 bg-brand hover:bg-brand-hover active:bg-brand text-n-0 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm mt-2 min-h-[44px]"
            >
              {{ isLoading ? 'Verifying...' : 'Sign In as Administrator' }}
            </button>
          </form>

          <!-- Security Notice -->
          <div class="pt-4 border-t border-n-200 text-xs text-n-400 text-center space-y-1">
            <p>Encrypted session with role-based verification.</p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="max-w-4xl mx-auto w-full text-center py-4 border-t border-n-200 text-xs text-n-400">
        Grih360 Operations Portal &copy; 2026.
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
        if (!environment.production) {
          console.error('[Admin Login Technical Error]:', err);
        }
        if (err.name === 'TimeoutError' || err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (err.status === 401) {
          this.errorMessage = err.error?.message || 'Invalid administrator credentials.';
        } else if (err.status === 403) {
          this.errorMessage = err.error?.message || 'Access Denied: Administrative account suspended or forbidden.';
        } else if (err.status === 429) {
          this.errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
        } else if (err.status >= 500) {
          this.errorMessage = 'Authentication service is temporarily unavailable. Please try again shortly.';
        } else {
          this.errorMessage = 'A server error occurred. Please try again later.';
        }
      },
    });
  }
}
