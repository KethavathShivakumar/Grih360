import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
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

          <a routerLink="/auth/login" class="text-xs font-bold text-slate-500 hover:text-[#0F2937] transition-colors flex items-center gap-1.5">
            <span>Already registered?</span>
            <strong class="text-[#2D7A5E] hover:underline font-extrabold">Sign In →</strong>
          </a>
        </div>
      </header>

      <!-- Main Split-Screen Container -->
      <main class="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div class="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-[#E8E6DF] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          <!-- Left Visual Brand Showcase (Desktop) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0F2937] via-[#163A4D] to-[#0A1F2C] p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <!-- Ambient Background Glows -->
            <div class="absolute -top-24 -left-24 w-64 h-64 bg-[#2D7A5E]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FACC15]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div class="space-y-6 relative z-10">
              <div class="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                <span>🛡️ Model Tenancy Act Verified</span>
              </div>

              <div class="space-y-2">
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  Start your verified tenancy journey.
                </h2>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Join India's trusted residential ecosystem connecting tenants, homeowners, and certified service professionals.
                </p>
              </div>

              <!-- Trust Pillars -->
              <div class="space-y-3.5 pt-2">
                <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div class="w-8 h-8 rounded-xl bg-[#2D7A5E]/30 text-emerald-300 flex items-center justify-center text-sm shrink-0 font-bold">
                    🔒
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white">Two-Step Email OTP Security</h4>
                    <p class="text-[11px] text-slate-300 leading-normal">
                      Every account is safeguarded by 6-digit cryptographic verification dispatched instantly via Gmail API OAuth2.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div class="w-8 h-8 rounded-xl bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center text-sm shrink-0 font-bold">
                    📜
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white">Direct Digital Agreements</h4>
                    <p class="text-[11px] text-slate-300 leading-normal">
                      Standardized tenancy agreements with mutual owner-tenant approvals and automated rent records.
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center text-sm shrink-0 font-bold">
                    ⚡
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white">Zero Brokerage, 100% Direct</h4>
                    <p class="text-[11px] text-slate-300 leading-normal">
                      Connect straight with property owners and certified service technicians across Telangana & AP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Badge -->
            <div class="pt-6 border-t border-white/10 relative z-10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Nivas360 Security Cloud</span>
              <span class="flex items-center gap-1 font-semibold text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                API Online
              </span>
            </div>
          </div>

          <!-- Right Registration Form Panel -->
          <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
            
            <!-- Step Progress Indicator -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider">
                <span class="text-[#2D7A5E] flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#2D7A5E] text-white flex items-center justify-center text-[10px]">1</span>
                  Account Registration
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

            <!-- Form Header -->
            <div class="space-y-1">
              <h1 class="text-2xl font-extrabold text-[#0F2937] tracking-tight">
                Create Your Account
              </h1>
              <p class="text-xs text-slate-500">
                We'll dispatch a single-use 6-digit OTP code to verify your email address.
              </p>
            </div>

            <!-- Error Banner -->
            <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
              <span class="text-base shrink-0">⚠️</span>
              <span>{{ errorMessage }}</span>
            </div>

            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Role Selector Tabs -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700 block">
                  Select Your Workspace Role <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    (click)="setRole('TENANT')"
                    [class]="selectedRole === 'TENANT' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold ring-2 ring-[#0F2937] shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'"
                    class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  >
                    <span class="text-base">🏡</span>
                    <span>Tenant</span>
                  </button>

                  <button
                    type="button"
                    (click)="setRole('OWNER')"
                    [class]="selectedRole === 'OWNER' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold ring-2 ring-[#0F2937] shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'"
                    class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  >
                    <span class="text-base">🏛️</span>
                    <span>Property Owner</span>
                  </button>

                  <button
                    type="button"
                    (click)="setRole('PROFESSIONAL')"
                    [class]="selectedRole === 'PROFESSIONAL' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold ring-2 ring-[#0F2937] shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'"
                    class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                  >
                    <span class="text-base">🛠️</span>
                    <span>Service Pro</span>
                  </button>
                </div>
              </div>

              <!-- Full Name Field -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700 block">
                  Full Name <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="e.g. Ramesh Kumar"
                    class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                  />
                </div>
                <span *ngIf="f['name'].touched && f['name'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                  Full name is required (min. 2 characters).
                </span>
              </div>

              <!-- Email & Phone Dual Inputs -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <!-- Email Address -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 block">
                    Email Address <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="ramesh@example.com"
                    class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                  />
                  <span *ngIf="f['email'].touched && f['email'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                    Valid email address is required.
                  </span>
                </div>

                <!-- Mobile Number -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 block">
                    Mobile Number <span class="text-rose-500">*</span>
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      formControlName="phone"
                      placeholder="9848022338"
                      maxlength="10"
                      class="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-none rounded-r-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                    />
                  </div>
                  <span *ngIf="f['phone'].touched && f['phone'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                    Valid 10-digit mobile number required.
                  </span>
                </div>
              </div>

              <!-- Password & Confirm Password Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <!-- Password -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 block">
                    Password <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="password"
                      placeholder="Min. 6 characters"
                      class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium pr-10"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      {{ showPassword ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                  <span *ngIf="f['password'].touched && f['password'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                    Password must be at least 6 characters.
                  </span>
                </div>

                <!-- Confirm Password -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 block">
                    Confirm Password <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    formControlName="confirmPassword"
                    placeholder="Re-enter password"
                    class="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                  />
                  <span *ngIf="registerForm.errors?.['mismatch'] && f['confirmPassword'].touched" class="text-[11px] text-rose-600 font-semibold block">
                    Passwords do not match.
                  </span>
                </div>
              </div>

              <!-- Two-Step Email OTP Security Notice Callout -->
              <div class="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                <span class="text-base shrink-0">📩</span>
                <span>An instant 6-digit OTP code will be sent to your email to verify account ownership.</span>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="registerForm.invalid || isLoading"
                class="w-full py-3.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isLoading ? 'Creating Account & Generating OTP...' : 'Register & Verify Email →' }}</span>
              </button>
            </form>

            <!-- Login Redirect -->
            <div class="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
              Already have an account?
              <a routerLink="/auth/login" class="font-extrabold text-[#0F2937] hover:underline ml-1">
                Sign in to your portal →
              </a>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-4 text-center text-xs text-slate-400 border-t border-[#E8E6DF]">
        © 2026 Nivas360 Technologies Pvt Ltd • Model Tenancy Act Compliant
      </footer>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedRole: UserRole = 'TENANT';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const roleUpper = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(roleUpper)) {
          this.selectedRole = roleUpper as UserRole;
        }
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(g: FormGroup) {
    const pw = g.get('password')?.value;
    const cpw = g.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  }

  setRole(role: UserRole): void {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { name, email, phone, password } = this.registerForm.value;

    this.authService
      .register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: this.selectedRole,
      })
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

          // If OTP verification required (Standard flow):
          if (requiresOtp && challengeId) {
            this.authService.setActiveChallenge({
              challengeId,
              maskedEmail: maskedEmail || email,
              selectedRole: this.selectedRole,
            });

            this.router.navigate(['/auth/verify-email'], {
              state: {
                challengeId,
                maskedEmail: maskedEmail || email,
                selectedRole: this.selectedRole,
                isNewRegistration: true,
              },
            });
            return;
          }

          // Fallback if tokens returned directly:
          if (this.selectedRole === 'OWNER') {
            this.router.navigate(['/owner/dashboard']);
          } else if (this.selectedRole === 'PROFESSIONAL') {
            this.router.navigate(['/professional/dashboard']);
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
            this.errorMessage = err?.error?.message || 'Registration failed. An account with this email or phone may already exist.';
          }
        },
      });
  }
}
