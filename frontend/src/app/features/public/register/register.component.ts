import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MobileRegisterComponent } from './mobile-register.component';
import { getCleanErrorMessage } from '../../../core/utils/error-sanitizer.util';
import { finalize, timeout, Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MobileRegisterComponent],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-register
        [step]="step"
        [selectedRole]="selectedRole"
        [name]="name"
        (nameChange)="name = $event"
        [email]="email"
        (emailChange)="email = $event; emailAlreadyRegistered = false"
        [otp]="otp"
        (otpChange)="otp = $event"
        [password]="password"
        (passwordChange)="password = $event"
        [confirmPassword]="confirmPassword"
        (confirmPasswordChange)="confirmPassword = $event"
        [showPassword]="showPassword"
        (toggleShowPassword)="showPassword = !showPassword"
        [acceptTerms]="acceptTerms"
        (acceptTermsChange)="acceptTerms = $event"
        [isLoading]="isLoading"
        [errorMessage]="errorMessage"
        [emailAlreadyRegistered]="emailAlreadyRegistered"
        [isGoogleLoading]="isGoogleLoading"
        [resendCooldown]="resendCooldown"
        (setRole)="selectedRole = $event"
        (requestCode)="requestCode()"
        (resendCode)="resendCode()"
        (verifyAndCreate)="verifyAndCreate()"
        (googleSignIn)="onGoogleSignIn()"
        (goToLogin)="goToLogin()"
        (changeEmail)="changeEmail()"
      ></app-mobile-register>
    } @else {
      <div class="min-h-screen bg-n-50 flex flex-col justify-between font-sans text-n-900">
        <!-- Top Simple Header -->
        <header class="w-full bg-n-0/95 border-b border-n-200 py-3.5 px-4 sm:px-8">
          <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a routerLink="/" class="flex items-center space-x-2.5 group">
              <div class="w-9 h-9 rounded-xl bg-navy text-n-0 flex items-center justify-center font-semibold text-lg shadow-xs">
                G
              </div>
              <span class="text-xl font-semibold text-n-900 tracking-tight">Grih<span class="text-brand">360</span></span>
            </a>

            <a routerLink="/auth/login" class="text-xs font-bold text-n-600 hover:text-n-900 transition-colors flex items-center gap-1.5 min-h-[44px]">
              <span>Already registered?</span>
              <strong class="text-brand hover:underline font-semibold">Sign In →</strong>
            </a>
          </div>
        </header>

        <!-- Main Split-Screen Container -->
        <main class="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
          <div class="w-full max-w-5xl bg-n-0 rounded-2xl shadow-xl border border-n-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            
            <!-- Left Visual Brand Showcase (Desktop) -->
            <div class="lg:col-span-5 bg-navy p-6 sm:p-10 text-n-0 flex flex-col justify-between relative overflow-hidden">
              <div class="absolute -top-24 -left-24 w-64 h-64 bg-brand/20 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-brand/15 rounded-full blur-3xl pointer-events-none"></div>

              <div class="space-y-6 relative z-10">
                <div class="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                  <span>Model Tenancy Act Verified</span>
                </div>

                <div class="space-y-2">
                  <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                    Start your verified tenancy journey.
                  </h2>
                  <p class="text-xs sm:text-sm text-n-300 leading-relaxed font-normal">
                    Join India's trusted residential ecosystem connecting tenants, homeowners, and certified service professionals.
                  </p>
                </div>

                <!-- Trust Pillars -->
                <div class="space-y-3.5 pt-2">
                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div class="w-8 h-8 rounded-xl bg-brand/30 text-emerald-300 flex items-center justify-center text-sm shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-n-0">Two-Step Email OTP Security</h4>
                      <p class="text-[11px] text-n-300 leading-normal">
                        Every account is safeguarded by 6-digit cryptographic verification dispatched instantly via secure email service.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div class="w-8 h-8 rounded-xl bg-brand/20 text-brand flex items-center justify-center text-sm shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-n-0">Direct Digital Agreements</h4>
                      <p class="text-[11px] text-n-300 leading-normal">
                        Standardized tenancy agreements with mutual owner-tenant approvals and automated rent records.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center text-sm shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-n-0">Zero Brokerage, 100% Direct</h4>
                      <p class="text-[11px] text-n-300 leading-normal">
                        Connect straight with property owners and certified service technicians across Telangana & AP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Badge -->
              <div class="pt-6 border-t border-white/10 relative z-10 flex items-center justify-between text-[11px] text-n-400">
                <span>Grih360 Security Cloud</span>
                <span class="flex items-center gap-1 font-semibold text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  API Online
                </span>
              </div>
            </div>

            <!-- Right Registration Form Panel -->
            <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
              <!-- Top Choice Segmented Control: Register vs Sign In -->
              <div class="grid grid-cols-2 p-1 bg-n-100 rounded-xl text-xs font-semibold">
                <span class="py-2.5 text-center rounded-lg bg-n-0 text-n-900 shadow-xs cursor-default">
                  New here? Register
                </span>
                <a
                  routerLink="/auth/login"
                  class="py-2.5 text-center rounded-lg text-n-600 hover:text-n-900 transition-colors flex items-center justify-center min-h-[40px]"
                >
                  Already a user? Sign in
                </a>
              </div>

              <!-- STEP 1: Enter Details -->
              <div *ngIf="step === 1" class="space-y-5">
                <div class="space-y-1">
                  <h1 class="text-2xl font-semibold text-n-900 tracking-tight">
                    Create Your Account
                  </h1>
                  <p class="text-xs text-n-500">
                    We will send a 6-digit verification code to your email address.
                  </p>
                </div>

                <!-- Error Banner -->
                <div *ngIf="errorMessage && !emailAlreadyRegistered" class="p-3.5 bg-err-bg border border-err-border text-err-text rounded-xl text-xs font-semibold flex items-start gap-2">
                  <span class="text-base shrink-0">⚠</span>
                  <span>{{ errorMessage }}</span>
                </div>

                <!-- Email Already Registered Banner -->
                <div *ngIf="emailAlreadyRegistered" class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs text-amber-900">
                  <div class="font-semibold text-sm flex items-center gap-2">
                    <span>⚠</span>
                    <span>This email is already registered.</span>
                  </div>
                  <p class="text-xs text-amber-800">
                    An account with this email address already exists. Please sign in to access your portal or continue with Google.
                  </p>
                  <div class="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      (click)="goToLogin()"
                      class="px-4 py-2.5 bg-navy text-n-0 font-semibold text-xs rounded-xl min-h-[44px] cursor-pointer"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      (click)="onGoogleSignIn()"
                      class="px-4 py-2.5 bg-n-0 border border-n-300 text-n-800 font-semibold text-xs rounded-xl min-h-[44px] cursor-pointer hover:bg-n-50"
                    >
                      Continue with Google
                    </button>
                  </div>
                </div>

                <form (ngSubmit)="onFormSubmit($event)" class="space-y-4">
                  <!-- Role Selector -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-n-700 block">Workspace Role</label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        (click)="selectedRole = 'TENANT'"
                        [class]="selectedRole === 'TENANT' ? 'bg-navy text-n-0 font-semibold shadow-xs ring-2 ring-navy' : 'bg-n-50 text-n-600 border border-n-200 hover:bg-n-100 font-semibold'"
                        class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 min-h-[44px]"
                      >
                        <span>Tenant</span>
                      </button>
                      <button
                        type="button"
                        (click)="selectedRole = 'OWNER'"
                        [class]="selectedRole === 'OWNER' ? 'bg-navy text-n-0 font-semibold shadow-xs ring-2 ring-navy' : 'bg-n-50 text-n-600 border border-n-200 hover:bg-n-100 font-semibold'"
                        class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 min-h-[44px]"
                      >
                        <span>Owner</span>
                      </button>
                      <button
                        type="button"
                        (click)="selectedRole = 'PROFESSIONAL'"
                        [class]="selectedRole === 'PROFESSIONAL' ? 'bg-navy text-n-0 font-semibold shadow-xs ring-2 ring-navy' : 'bg-n-50 text-n-600 border border-n-200 hover:bg-n-100 font-semibold'"
                        class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 min-h-[44px]"
                      >
                        <span>Service Pro</span>
                      </button>
                    </div>
                  </div>

                  <!-- Full Name -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-n-700 block">Full Name</label>
                    <input
                      type="text"
                      [(ngModel)]="name"
                      name="name"
                      placeholder="e.g. Ramesh Kumar"
                      class="w-full px-4 py-2.5 sm:py-3 bg-n-50 border border-n-300 rounded-xl text-sm text-n-900 focus:ring-2 focus:ring-brand focus:outline-none focus:bg-n-0 font-medium min-h-[44px]"
                    />
                  </div>

                  <!-- Email Address (Mobile completely removed) -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-n-700 block">Email Address</label>
                    <input
                      type="email"
                      [(ngModel)]="email"
                      (ngModelChange)="emailAlreadyRegistered = false"
                      name="email"
                      placeholder="ramesh@example.com"
                      class="w-full px-4 py-2.5 sm:py-3 bg-n-50 border border-n-300 rounded-xl text-sm text-n-900 focus:ring-2 focus:ring-brand focus:outline-none focus:bg-n-0 font-medium min-h-[44px]"
                    />
                  </div>

                  <!-- Terms and Privacy Consent -->
                  <div class="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      [(ngModel)]="acceptTerms"
                      name="acceptTerms"
                      id="desktopAcceptTerms"
                      class="mt-1 h-4 w-4 rounded border-n-300 text-brand focus:ring-brand cursor-pointer"
                    />
                    <label for="desktopAcceptTerms" class="text-xs text-n-600 leading-relaxed cursor-pointer select-none">
                      I agree to the <a routerLink="/terms" target="_blank" class="text-brand font-bold hover:underline">Terms and Conditions</a>
                      and acknowledge the <a routerLink="/privacy" target="_blank" class="text-brand font-bold hover:underline">Privacy Policy</a>.
                    </label>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="button"
                    (click)="requestCode()"
                    [disabled]="!isStep1Valid || isLoading"
                    class="w-full py-3.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-n-0" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isLoading ? 'Sending verification code...' : 'Send verification code' }}</span>
                  </button>
                </form>

                <!-- Or Divider -->
                <div class="relative my-3.5 flex items-center justify-center">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-n-200"></div>
                  </div>
                  <div class="relative bg-n-0 px-3 text-[11px] font-bold text-n-400 uppercase tracking-wider">
                    or
                  </div>
                </div>

                <!-- Google Button -->
                <div class="w-full h-[44px] min-h-[44px] flex items-center justify-center">
                  <button
                    type="button"
                    (click)="onGoogleSignIn()"
                    [disabled]="isGoogleLoading"
                    class="w-full h-[44px] bg-n-0 hover:bg-n-50 active:bg-n-100 border border-n-300 rounded-xl text-n-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer select-none min-h-[44px]"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>{{ isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google' }}</span>
                  </button>
                </div>
              </div>

              <!-- STEP 2: Verify OTP & Set Password -->
              <div *ngIf="step === 2" class="space-y-5">
                <div class="space-y-1">
                  <h1 class="text-2xl font-semibold text-n-900 tracking-tight">
                    Set your password
                  </h1>
                  <p class="text-xs text-n-500">
                    Finish creating your account.
                  </p>
                </div>

                <div class="p-3.5 bg-brand-subtle border border-brand-border rounded-xl text-xs text-ok-text flex items-center justify-between">
                  <span>A 6-digit code was sent to <strong>{{ email }}</strong></span>
                  <button
                    type="button"
                    (click)="changeEmail()"
                    class="text-xs font-semibold text-brand underline cursor-pointer ml-3"
                  >
                    Change email
                  </button>
                </div>

                <!-- Error Banner -->
                <div *ngIf="errorMessage" class="p-3.5 bg-err-bg border border-err-border text-err-text rounded-xl text-xs font-semibold flex items-start gap-2">
                  <span class="text-base shrink-0">⚠</span>
                  <span>{{ errorMessage }}</span>
                </div>

                <!-- 6-digit OTP -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-n-700 block">6-digit code</label>
                  <input
                    type="text"
                    [(ngModel)]="otp"
                    maxlength="6"
                    placeholder="6-digit code"
                    class="w-full px-4 py-2.5 bg-n-50 border border-n-300 rounded-xl text-center text-lg tracking-widest font-mono text-n-900 min-h-[44px]"
                  />
                  <p class="text-[11px] text-n-400">Code never auto-submits. Enter the code and set your password below.</p>
                </div>

                <!-- New Password -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-n-700 block">New password</label>
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="text-xs font-semibold text-n-500 hover:text-n-900 min-h-[36px] flex items-center cursor-pointer"
                    >
                      {{ showPassword ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    placeholder="New password"
                    class="w-full px-4 py-2.5 sm:py-3 bg-n-50 border border-n-300 rounded-xl text-sm text-n-900 focus:ring-2 focus:ring-brand focus:outline-none focus:bg-n-0 font-medium min-h-[44px]"
                  />
                </div>

                <!-- Confirm Password -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-n-700 block">Confirm password</label>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    placeholder="Confirm password"
                    class="w-full px-4 py-2.5 sm:py-3 bg-n-50 border border-n-300 rounded-xl text-sm text-n-900 focus:ring-2 focus:ring-brand focus:outline-none focus:bg-n-0 font-medium min-h-[44px]"
                  />
                </div>

                <!-- Live Password Rules Validation Helper -->
                <div class="p-3 bg-n-100 rounded-xl border border-n-200 space-y-1.5 text-xs">
                  <div class="text-[11px] font-semibold text-n-500 uppercase tracking-wider">Password requirements:</div>
                  <div class="grid grid-cols-2 gap-1.5 text-xs">
                    <span [class]="hasMinLength ? 'text-emerald-700 font-semibold' : 'text-n-500'">
                      {{ hasMinLength ? '✓' : '○' }} 8+ characters
                    </span>
                    <span [class]="hasUpperLower ? 'text-emerald-700 font-semibold' : 'text-n-500'">
                      {{ hasUpperLower ? '✓' : '○' }} Upper & lower
                    </span>
                    <span [class]="hasNumber ? 'text-emerald-700 font-semibold' : 'text-n-500'">
                      {{ hasNumber ? '✓' : '○' }} At least 1 number
                    </span>
                    <span [class]="passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-n-500'">
                      {{ passwordsMatch ? '✓' : '○' }} Passwords match
                    </span>
                  </div>
                </div>

                <!-- Resend & Create Account -->
                <div class="flex items-center justify-between pt-2">
                  <button
                    *ngIf="resendCooldown > 0"
                    type="button"
                    disabled
                    class="text-xs text-n-400 font-medium min-h-[44px] flex items-center"
                  >
                    Resend code in {{ resendCooldown }}s
                  </button>
                  <button
                    *ngIf="resendCooldown <= 0"
                    type="button"
                    (click)="resendCode()"
                    [disabled]="isLoading"
                    class="text-xs font-semibold text-brand hover:underline min-h-[44px] flex items-center cursor-pointer"
                  >
                    Resend code
                  </button>

                  <button
                    type="button"
                    (click)="verifyAndCreate()"
                    [disabled]="isLoading || !isPasswordFormValid"
                    class="px-5 py-2.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-sm rounded-xl min-h-[44px] flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <svg *ngIf="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
                  </button>
                </div>
              </div>

              <!-- Login Link -->
              <div class="text-center pt-2 border-t border-n-100 text-xs text-n-500">
                Already have an account?
                <a routerLink="/auth/login" class="font-semibold text-n-900 hover:underline ml-1">
                  Sign in to your portal →
                </a>
              </div>
            </div>
          </div>
        </main>

        <!-- Footer -->
        <footer class="py-4 px-6 text-center text-xs text-n-500 border-t border-n-200">
          <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; 2026 Grih360 Technologies Pvt Ltd. Model Tenancy Act Compliant.</span>
            <div class="flex items-center gap-3 font-semibold">
              <a routerLink="/privacy" class="hover:text-brand transition-colors">Privacy Policy</a>
              <span>•</span>
              <a routerLink="/terms" class="hover:text-brand transition-colors">Terms and Conditions</a>
            </div>
          </div>
        </footer>
      </div>
    }
  `,
})
export class RegisterComponent implements OnInit, OnDestroy {
  step: number = 1;
  selectedRole: UserRole = 'TENANT';
  name: string = '';
  email: string = '';
  otp: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  acceptTerms: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  emailAlreadyRegistered: boolean = false;

  // Google Authentication State
  isGoogleLoading: boolean = false;
  resendCooldown: number = 0;
  private cooldownInterval: any = null;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public isMobile: IsMobileService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit(): void {
    // Restore mid-way email registration session if user left app
    try {
      const saved = localStorage.getItem('grih360_reg_onboarding');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed?.step === 2) {
          this.email = parsed.email;
          this.name = parsed.name || '';
          this.selectedRole = parsed.role || 'TENANT';
          this.step = 2;
          this.acceptTerms = true;
          this.startCooldown(60);
        }
      }
    } catch (_) {}

    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const roleUpper = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(roleUpper)) {
          this.selectedRole = roleUpper as UserRole;
        }
      }
      if (params['email']) {
        this.email = params['email'];
      }
    });

    if (!this.googleAuthService.isNative()) {
      this.googleAuthService.loadGsiScript().catch(() => {});
    }

    // If Google sign in triggers password setup, navigate to login where password setup modal opens
    const pwdSub = this.googleAuthService.passwordSetupRequired$.subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
    this.subscriptions.add(pwdSub);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.subscriptions.unsubscribe();
  }

  get isStep1Valid(): boolean {
    const validEmail = !!this.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
    return validEmail && this.acceptTerms;
  }

  get hasMinLength(): boolean {
    return (this.password || '').length >= 8;
  }

  get hasUpperLower(): boolean {
    const pw = this.password || '';
    return /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.password || '');
  }

  get passwordsMatch(): boolean {
    return !!this.password && this.password === this.confirmPassword;
  }

  get isPasswordFormValid(): boolean {
    return (
      (this.otp || '').trim().length === 6 &&
      this.hasMinLength &&
      this.hasUpperLower &&
      this.hasNumber &&
      this.passwordsMatch
    );
  }

  onFormSubmit(e: Event): void {
    e.preventDefault();
    if (this.isStep1Valid) {
      this.requestCode();
    }
  }

  requestCode(): void {
    if (!this.isStep1Valid) {
      this.errorMessage = 'Please enter a valid email and accept the terms.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.emailAlreadyRegistered = false;

    this.authService
      .requestRegistrationOtp({
        email: this.email.trim().toLowerCase(),
        name: this.name.trim(),
        role: this.selectedRole,
      })
      .pipe(
        timeout(45000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.step = 2;
          this.startCooldown(60);
          try {
            localStorage.setItem(
              'grih360_reg_onboarding',
              JSON.stringify({
                email: this.email.trim().toLowerCase(),
                name: this.name.trim(),
                role: this.selectedRole,
                step: 2,
              })
            );
          } catch (_) {}
        },
        error: (err: any) => {
          if (err.status === 409 || err?.error?.code === 'EMAIL_ALREADY_REGISTERED') {
            this.emailAlreadyRegistered = true;
            this.errorMessage = 'This email is already registered.';
            return;
          }
          if (err.name === 'TimeoutError' || err.status === 0) {
            this.errorMessage = 'Connection timeout. Please check your internet connection.';
          } else {
            this.errorMessage = getCleanErrorMessage(err, 'Failed to send verification code. Please try again.');
          }
        },
      });
  }

  resendCode(): void {
    if (this.resendCooldown > 0 || !this.email) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .requestRegistrationOtp({
        email: this.email.trim().toLowerCase(),
        name: this.name.trim(),
        role: this.selectedRole,
      })
      .pipe(
        timeout(45000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.startCooldown(60);
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Failed to resend code. Please try again.');
        },
      });
  }

  verifyAndCreate(): void {
    if (!this.isPasswordFormValid) {
      this.errorMessage = 'Please enter the 6-digit code and meet all password requirements.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyRegistrationOtpAndCreate({
        email: this.email.trim().toLowerCase(),
        otp: this.otp.trim(),
        password: this.password,
        confirmPassword: this.confirmPassword,
        name: this.name.trim(),
        role: this.selectedRole,
      })
      .pipe(
        timeout(45000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          try {
            localStorage.removeItem('grih360_reg_onboarding');
          } catch (_) {}
          const userRole = res?.data?.user?.role || res?.user?.role || this.selectedRole;
          this.navigateByRole(userRole);
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Invalid or expired verification code. Please try again.');
        },
      });
  }

  changeEmail(): void {
    this.step = 1;
    this.otp = '';
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    try {
      localStorage.removeItem('grih360_reg_onboarding');
    } catch (_) {}
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { email: this.email.trim() },
    });
  }

  onGoogleSignIn(): void {
    if (!this.googleAuthService.isAvailable()) {
      this.errorMessage = 'Google sign in is currently unavailable.';
      return;
    }

    this.isGoogleLoading = true;
    this.errorMessage = '';

    if (this.googleAuthService.isNative()) {
      this.googleAuthService
        .signInNative(this.selectedRole)
        .then((res) => {
          this.isGoogleLoading = false;
          if (!res.success && res.error && !res.cancelled) {
            this.errorMessage = res.error;
          }
        })
        .catch(() => {
          this.isGoogleLoading = false;
          this.errorMessage = 'Unable to complete Google sign in. Please try password login.';
        });
      return;
    }

    this.googleAuthService
      .initializeGsi((idToken: string) => {
        this.googleAuthService
          .submitGoogleToken(idToken, this.selectedRole)
          .then((res) => {
            this.isGoogleLoading = false;
            if (!res.success && res.error) {
              this.errorMessage = res.error;
            }
          });
      })
      .then(() => {
        this.googleAuthService.prompt();
      })
      .catch(() => {
        this.isGoogleLoading = false;
        this.errorMessage = 'Unable to launch Google sign in. Please check your internet connection.';
      });
  }

  private startCooldown(seconds: number): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.resendCooldown = seconds;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }

  private navigateByRole(role: string): void {
    if (role === 'OWNER') {
      this.router.navigate(['/owner/dashboard']);
    } else if (role === 'PROFESSIONAL') {
      this.router.navigate(['/professional/dashboard']);
    } else {
      this.router.navigate(['/tenant/dashboard']);
    }
  }
}
