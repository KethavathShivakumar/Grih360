import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
      <!-- Top Simple Header -->
      <header class="w-full bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] py-3.5 px-4 sm:px-8">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <a routerLink="/" class="flex items-center space-x-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
          </a>

          <a routerLink="/" class="text-xs font-bold text-slate-500 hover:text-[#0F2937] transition-colors flex items-center gap-1">
            <span>← Back to Home</span>
          </a>
        </div>
      </header>

      <!-- Centered Authentication Card -->
      <main class="flex-grow flex items-center justify-center p-4 sm:p-6 my-auto">
        <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#E8E6DF] space-y-6">
          <!-- Header & Title -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center space-x-2 bg-emerald-50 text-[#2D7A5E] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <span>🔒 Secure Portal Login</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">
              Sign in to Nivas360
            </h1>
            <p class="text-xs text-slate-500 max-w-xs mx-auto">
              Access your verified rental workspace, direct agreements, and property command center.
            </p>
          </div>

          <!-- Role Selector Tabs -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Select Your Workspace
            </label>
            <div class="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                *ngFor="let role of roles"
                (click)="selectRole(role.value)"
                type="button"
                [class]="selectedRole === role.value ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                class="py-2 text-[11px] rounded-lg transition-all text-center cursor-pointer"
              >
                {{ role.label }}
              </button>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
            <span class="text-base shrink-0">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Real Login Form -->
          <form (ngSubmit)="onLoginSubmit()" class="space-y-4">
            <!-- Identifier Field -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">
                Email Address or Mobile Number <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="identifier"
                  name="identifier"
                  required
                  placeholder="e.g. tenant@nivas360.com or 9876543210"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <!-- Password Field with Show/Hide Toggle -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 block">
                  Password <span class="text-rose-500">*</span>
                </label>
                <button
                  (click)="showForgotPassword = true"
                  type="button"
                  class="text-xs font-bold text-[#2D7A5E] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white transition-all font-medium pr-12"
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  [title]="showPassword ? 'Hide password' : 'Show password'"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>


            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading"
              class="w-full py-3.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Authenticating...' : 'Sign In to ' + getRoleDisplayName() }}</span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
            Don't have an account yet?
            <a routerLink="/auth/register" class="font-extrabold text-[#2D7A5E] hover:underline ml-1">
              Create Account →
            </a>
          </div>

          <!-- Admin Portal Link -->
          <div class="text-center pt-2">
            <a routerLink="/admin/login" class="text-[11px] font-bold text-slate-400 hover:text-[#0F2937] transition-colors">
              🛡️ Platform Administrator? Access Admin Console →
            </a>
          </div>
        </div>
      </main>

      <!-- Forgot Password Modal -->
      <div *ngIf="showForgotPassword" class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-[#E8E6DF]">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#0F2937]">Reset Your Password</h3>
            <button (click)="showForgotPassword = false" class="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer">✕</button>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">
            Enter your registered email address or mobile number. In accordance with Telangana Tenancy protocols, account recovery instructions will be sent.
          </p>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Email or Phone</label>
            <input
              type="text"
              [(ngModel)]="forgotIdentifier"
              placeholder="Registered email or phone"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>
          <div *ngIf="forgotSent" class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            Password reset instructions have been dispatched if the account exists.
          </div>
          <div class="flex items-center justify-end space-x-2 pt-2">
            <button
              (click)="showForgotPassword = false"
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              (click)="forgotSent = true"
              type="button"
              class="px-4 py-2 text-xs font-bold bg-[#0F2937] text-white rounded-xl shadow-xs"
            >
              Send Reset Link
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="py-4 text-center text-xs text-slate-400 border-t border-[#E8E6DF]">
        © 2026 Nivas360 Technologies Pvt Ltd • Model Tenancy Act Compliant
      </footer>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  identifier: string = '';
  password: string = '';
  selectedRole: string = 'TENANT';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  showForgotPassword: boolean = false;
  forgotIdentifier: string = '';
  forgotSent: boolean = false;

  roles = [
    { label: 'Tenant', value: 'TENANT' },
    { label: 'Owner', value: 'OWNER' },
    { label: 'Pro', value: 'PROFESSIONAL' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const roleUpper = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(roleUpper)) {
          this.selectedRole = roleUpper;
        }
      }
    });
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getRoleDisplayName(): string {
    switch (this.selectedRole) {
      case 'OWNER':
        return 'Owner Console';
      case 'PROFESSIONAL':
        return 'Pro Workspace';
      default:
        return 'Tenant Portal';
    }
  }

  onLoginSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Please enter both your email/phone and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .login(this.identifier, this.password)
      .pipe(
        timeout(25000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          const requiresOtp = res?.requiresEmailOtp || res?.data?.requiresEmailOtp;
          const challengeId = res?.challengeId || res?.data?.challengeId;
          const maskedEmail = res?.maskedEmail || res?.data?.maskedEmail;

          if (requiresOtp && challengeId) {
            this.authService.setActiveChallenge({
              challengeId,
              maskedEmail: maskedEmail || this.identifier,
              selectedRole: this.selectedRole,
            });

            this.router.navigate(['/auth/verify-email'], {
              state: {
                challengeId,
                maskedEmail: maskedEmail || this.identifier,
                selectedRole: this.selectedRole,
              },
            });
            return;
          }

          const userRole = res?.data?.user?.role || this.selectedRole;
          if (userRole === 'OWNER') {
            this.router.navigate(['/owner/dashboard']);
          } else if (userRole === 'PROFESSIONAL') {
            this.router.navigate(['/professional/dashboard']);
          } else if (userRole === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/tenant/dashboard']);
          }
        },
        error: (err: any) => {
          if (err.name === 'TimeoutError') {
            this.errorMessage = 'Connection timeout. Please verify backend server is reachable and retry.';
          } else if (err.status === 0) {
            this.errorMessage = 'Network connection error or server unreachable. Please check your internet connection.';
          } else {
            this.errorMessage = err?.error?.message || 'Invalid email/phone or password. Please try again.';
          }
        },
      });
  }
}
