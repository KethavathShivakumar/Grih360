import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { MobileLoginComponent } from './mobile-login.component';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MobileLoginComponent],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-login
        [(identifier)]="identifier"
        [(password)]="password"
        [(selectedRole)]="selectedRole"
        [isLoading]="isLoading"
        [errorMessage]="errorMessage"
        [showPassword]="showPassword"
        (loginSubmit)="onLoginSubmit()"
        (togglePasswordVisibility)="togglePasswordVisibility()"
        (openForgotPassword)="showForgotPassword = true"
      ></app-mobile-login>
    } @else {
      <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
        <!-- Top Simple Header -->
        <header class="w-full bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] py-3.5 px-4 sm:px-8">
          <div class="max-w-7xl mx-auto flex items-center justify-between">
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

        <!-- Main Split-Screen Container -->
        <main class="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
          <div class="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#E8E6DF] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
            
            <!-- Left Visual Brand Showcase (Desktop) -->
            <div class="lg:col-span-5 bg-gradient-to-br from-[#0F2937] via-[#163A4D] to-[#0A1F2C] p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <!-- Ambient Background Glows -->
              <div class="absolute -top-24 -left-24 w-64 h-64 bg-[#2D7A5E]/20 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FACC15]/15 rounded-full blur-3xl pointer-events-none"></div>

              <div class="space-y-6 relative z-10">
                <div class="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                  <span>🔒 Two-Step Security Active</span>
                </div>

                <div class="space-y-2">
                  <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                    Secure access to your residential hub.
                  </h2>
                  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    Manage verified leases, digital agreements, and maintenance requests with bank-grade security.
                  </p>
                </div>

                <!-- Feature Highlights -->
                <div class="space-y-3.5 pt-2">
                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div class="w-8 h-8 rounded-xl bg-[#2D7A5E]/30 text-emerald-300 flex items-center justify-center text-sm shrink-0 font-bold">
                      🔑
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">Instant Email OTP Authentication</h4>
                      <p class="text-[11px] text-slate-300 leading-normal">
                        Password entry triggers a temporary 6-digit cryptographic challenge dispatched directly to your inbox.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div class="w-8 h-8 rounded-xl bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center text-sm shrink-0 font-bold">
                      📊
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">Dedicated Workspace Control</h4>
                      <p class="text-[11px] text-slate-300 leading-normal">
                        Custom dashboards tailored for verified Tenants, Property Owners, and Certified Home Service Specialists.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center text-sm shrink-0 font-bold">
                      🏛️
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-white">Model Tenancy Act Compliant</h4>
                      <p class="text-[11px] text-slate-300 leading-normal">
                        Digitally binding rental agreements and transparent deposit safekeeping across Telangana & AP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Badge -->
              <div class="pt-6 border-t border-white/10 relative z-10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Nivas360 Identity Guard</span>
                <span class="flex items-center gap-1 font-semibold text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Two-Factor Enforced
                </span>
              </div>
            </div>

            <!-- Right Login Form Panel -->
            <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
              
              <!-- Step Progress Indicator -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider">
                  <span class="text-[#2D7A5E] flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-[#2D7A5E] text-white flex items-center justify-center text-[10px]">1</span>
                    Password Authentication
                  </span>
                  <span class="text-slate-400 flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                    Email OTP Verification
                  </span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#2D7A5E] h-full w-1/2 rounded-full transition-all duration-500"></div>
                </div>
              </div>

              <!-- Header & Title -->
              <div class="space-y-1">
                <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">
                  Sign in to {{ getRoleDisplayName() }}
                </h1>
                <p class="text-xs text-slate-500">
                  Enter your registered credentials. A 6-digit security code will be sent to your email.
                </p>
              </div>

              <!-- Role Selector Tabs -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Choose Your Workspace
                </label>
                <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    *ngFor="let role of roles"
                    (click)="selectRole(role.value)"
                    type="button"
                    [class]="selectedRole === role.value ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'"
                    class="py-2 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{{ role.icon }}</span>
                    <span>{{ role.label }}</span>
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
                      class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white transition-all font-medium"
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
                      class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white transition-all font-medium pr-12"
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

                <!-- Security Callout Notice -->
                <div class="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                  <span class="text-base shrink-0">🛡️</span>
                  <span>Protected by Two-Step Verification: A secure OTP code will be sent to your registered email upon password verification.</span>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="isLoading || !identifier || !password"
                  class="w-full py-3.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isLoading ? 'Checking Credentials & Generating OTP...' : 'Sign In & Get Code →' }}</span>
                </button>
              </form>

              <!-- Register Link -->
              <div class="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                Don't have an account yet?
                <a [routerLink]="['/auth/register']" [queryParams]="{ role: selectedRole }" class="font-extrabold text-[#2D7A5E] hover:underline ml-1">
                  Create Account →
                </a>
              </div>

              <!-- Admin Portal Link -->
              <div class="text-center pt-1">
                <a routerLink="/admin/login" class="text-[11px] font-bold text-slate-400 hover:text-[#0F2937] transition-colors">
                  🛡️ Platform Administrator? Access Admin Console →
                </a>
              </div>
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
              Enter your registered email address or mobile number. Account recovery instructions will be sent.
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
    }

    <!-- Forgot Password Modal for Mobile view if triggered -->
    <div *ngIf="showForgotPassword && isMobile.isMobile()" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3.5 border border-[#E8E6DF]">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-extrabold text-[#0F2937]">Reset Your Password</h3>
          <button (click)="showForgotPassword = false" class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer p-1">✕</button>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed">
          Enter your registered email address or mobile number. Recovery instructions will be sent.
        </p>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Email or Phone</label>
          <input
            type="text"
            [(ngModel)]="forgotIdentifier"
            placeholder="Registered email or phone"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
          />
        </div>
        <div *ngIf="forgotSent" class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
          Password reset instructions sent.
        </div>
        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            (click)="showForgotPassword = false"
            type="button"
            class="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
          >
            Close
          </button>
          <button
            (click)="forgotSent = true"
            type="button"
            class="px-4 py-2 text-xs font-bold bg-[#0F2937] text-white rounded-xl shadow-xs min-h-[44px]"
          >
            Send Reset Link
          </button>
        </div>
      </div>
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
    { label: 'Tenant', value: 'TENANT', icon: '🏡' },
    { label: 'Owner', value: 'OWNER', icon: '🏛️' },
    { label: 'Pro', value: 'PROFESSIONAL', icon: '🛠️' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public isMobile: IsMobileService
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
        timeout(45000),
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
