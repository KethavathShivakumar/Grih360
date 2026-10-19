import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MobileLoginComponent } from './mobile-login.component';
import { finalize, timeout, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MobileLoginComponent],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-login
        [loginMethod]="loginMethod"
        (loginMethodChange)="setLoginMethod($event)"
        [(identifier)]="identifier"
        [(password)]="password"
        [(selectedRole)]="selectedRole"
        [isLoading]="isLoading"
        [errorMessage]="errorMessage"
        [loginSuccessMessage]="loginSuccessMessage"
        [isGoogleOnlyAccount]="isGoogleOnlyAccount"
        [showPassword]="showPassword"
        [isGoogleLoading]="isGoogleLoading"
        (googleSignIn)="onGoogleSignIn()"
        (openSetPassword)="openForgotPasswordModal(identifier)"
        [otpSent]="otpSent"
        [(otpCode)]="otpCode"
        [isOtpSending]="isOtpSending"
        [resendCooldown]="resendCooldown"
        (sendOtp)="sendLoginOtp()"
        (verifyOtp)="verifyLoginOtp()"
        (changeEmail)="changeEmail()"
        [showProfileSheet]="showProfileCompletionModal"
        (closeProfileSheet)="showProfileCompletionModal = false"
        [(profilePhone)]="profilePhone"
        [profileError]="profileError"
        [isCompletingProfile]="isCompletingProfile"
        (completeProfile)="submitProfileCompletion()"
        (loginSubmit)="onLoginSubmit()"
        (togglePasswordVisibility)="togglePasswordVisibility()"
        (openForgotPassword)="openForgotPasswordModal(identifier)"
        [showGooglePasswordModal]="showGooglePasswordModal"
        (closeGooglePasswordModal)="showGooglePasswordModal = false"
        [googleOnboardingData]="googleOnboardingData"
        [(googlePassword)]="googlePassword"
        [(googleConfirmPassword)]="googleConfirmPassword"
        [(googleOtp)]="googleOtp"
        [showGooglePassword]="showGooglePassword"
        (toggleGooglePasswordVisibility)="showGooglePassword = !showGooglePassword"
        [isGooglePasswordSubmitting]="isGooglePasswordSubmitting"
        [googlePasswordError]="googlePasswordError"
        [googleResendCooldown]="googleResendCooldown"
        (submitGooglePassword)="submitGooglePassword()"
        (resendGoogleOtp)="resendGoogleOtp()"
      ></app-mobile-login>
    } @else {
      <div class="min-h-screen bg-n-50 flex flex-col justify-between">
        <!-- Top bar -->
        <header class="bg-n-0 border-b border-n-200 px-4 sm:px-8 flex items-center justify-between h-14 mobile-top-bar">
          <a routerLink="/" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
            <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
          </a>
          <a routerLink="/" class="text-sm font-semibold text-n-500 hover:text-n-900 transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
            Home
          </a>
        </header>

        <!-- Main content -->
        <main class="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div class="w-full max-w-5xl bg-n-0 rounded-xl shadow-sm border border-n-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            
            <!-- Left brand panel -->
            <div class="hidden lg:flex lg:col-span-5 bg-navy p-8 sm:p-10 text-n-0 flex-col justify-between">
              <div class="space-y-8">
                <!-- Logo -->
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-n-0 font-semibold text-sm">G</div>
                  <span class="text-base font-semibold">Grih<span class="text-brand" style="color:#2D7A5E;">360</span></span>
                </div>

                <!-- Headline -->
                <div class="space-y-3">
                  <h2 class="text-2xl font-semibold leading-snug text-n-0">
                    Find a home. Sign digitally. Track your rent.
                  </h2>
                  <p class="text-sm text-n-300 leading-relaxed">
                    Grih360 connects tenants with verified owners. Browse real listings, apply online, sign a digital agreement, and manage rent — all in one place.
                  </p>
                </div>

                <!-- Three real feature points -->
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#2D7A5E;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-n-0">Search verified listings</p>
                      <p class="text-xs text-n-400 mt-0.5">Real homes from owners. Locations across Telangana and AP.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#2D7A5E;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-n-0">Digital rental agreement</p>
                      <p class="text-xs text-n-400 mt-0.5">Apply and sign online. No paperwork, no broker fees.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#2D7A5E;">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-n-0">Track rent and maintenance</p>
                      <p class="text-xs text-n-400 mt-0.5">Monthly rent receipts, OTP-closed service requests.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="pt-6 border-t border-n-0/10 text-xs text-n-400">
                Grih360 Technologies Pvt Ltd
              </div>
            </div>

            <!-- Right login form -->
            <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center gap-5">
              
              <div class="space-y-1">
                <h1 class="text-xl font-semibold text-n-900">Sign in</h1>
                <p class="text-sm text-n-500">Sign in directly with your password or use an email verification code.</p>
              </div>

              <!-- Role selector -->
              <div class="space-y-1.5">
                <label class="form-label" style="font-size:12px;">I am a</label>
                <div class="grid grid-cols-3 gap-1.5 p-1 bg-n-100 rounded-lg border border-n-200">
                  <button
                    *ngFor="let role of roles"
                    (click)="selectRole(role.value)"
                    type="button"
                    [class]="selectedRole === role.value ? 'bg-n-0 text-navy font-semibold shadow-xs border border-n-200' : 'text-n-500 hover:text-n-900 font-semibold'"
                    class="py-2 text-sm rounded-md transition-colors text-center cursor-pointer min-h-[44px]"
                  >
                    {{ role.label }}
                  </button>
                </div>
              </div>

              <!-- Success Message -->
              <div *ngIf="loginSuccessMessage" class="p-3 bg-ok-bg border border-ok-border text-ok-text rounded-lg text-sm flex items-start gap-2">
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{{ loginSuccessMessage }}</span>
              </div>

              <!-- Error Banner -->
              <div *ngIf="errorMessage" class="p-3.5 bg-err-bg border border-err-border text-err-text rounded-lg text-sm space-y-2.5">
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span class="leading-relaxed">{{ errorMessage }}</span>
                </div>
                <!-- Google only action buttons -->
                <div *ngIf="isGoogleOnlyAccount" class="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    (click)="setLoginMethod('otp')"
                    class="px-3.5 py-2 bg-brand text-n-0 text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1.5 cursor-pointer min-h-[44px]">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span>Use Email Code (OTP)</span>
                  </button>
                  <button
                    type="button"
                    (click)="onGoogleSignIn()"
                    class="px-3.5 py-2 bg-navy text-n-0 text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1.5 cursor-pointer min-h-[44px]">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    (click)="openForgotPasswordModal(identifier)"
                    class="px-3.5 py-2 bg-n-0 border border-n-300 text-n-900 hover:bg-n-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer min-h-[44px]">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    <span>Set with Forgot Password</span>
                  </button>
                </div>
              </div>

              <!-- Identifier (Email or phone) -->
              <div class="space-y-1">
                <label class="form-label" for="login-identifier">Email or mobile number</label>
                <input
                  id="login-identifier"
                  type="text"
                  [(ngModel)]="identifier"
                  (ngModelChange)="isGoogleOnlyAccount = false; errorMessage = ''"
                  name="identifier"
                  required
                  placeholder="email@example.com or 9876543210"
                  class="form-input min-h-[44px]"
                />
              </div>

              <!-- Segmented choice: Password vs Email code (OTP) -->
              <div class="space-y-1">
                <label class="form-label" style="font-size:12px;">Sign in method</label>
                <div class="grid grid-cols-2 gap-1 p-1 bg-n-100 rounded-lg border border-n-200">
                  <button
                    type="button"
                    (click)="setLoginMethod('password')"
                    [class]="loginMethod === 'password' ? 'bg-n-0 text-navy font-semibold shadow-xs border border-n-200' : 'text-n-500 hover:text-n-900 font-semibold'"
                    class="py-2 text-xs rounded-md transition-colors text-center cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    <span>Password</span>
                  </button>
                  <button
                    type="button"
                    (click)="setLoginMethod('otp')"
                    [class]="loginMethod === 'otp' ? 'bg-n-0 text-navy font-semibold shadow-xs border border-n-200' : 'text-n-500 hover:text-n-900 font-semibold'"
                    class="py-2 text-xs rounded-md transition-colors text-center cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span>Email code (OTP)</span>
                  </button>
                </div>
              </div>

              <!-- ================= METHOD 1: PASSWORD ================= -->
              <div *ngIf="loginMethod === 'password'" class="space-y-4">
                <form (ngSubmit)="onLoginSubmit()" class="space-y-4">
                  <!-- Password -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="form-label" for="login-password">Password</label>
                      <button
                        (click)="openForgotPasswordModal(identifier)"
                        type="button"
                        class="text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer min-h-[44px] flex items-center">
                        Forgot password?
                      </button>
                    </div>
                    <div class="relative">
                      <input
                        id="login-password"
                        [type]="showPassword ? 'text' : 'password'"
                        [(ngModel)]="password"
                        name="password"
                        required
                        placeholder="Your password"
                        class="form-input pr-16 min-h-[44px]"
                      />
                      <button
                        type="button"
                        (click)="togglePasswordVisibility()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-n-500 hover:text-n-900 cursor-pointer min-h-[36px] flex items-center px-1"
                        [title]="showPassword ? 'Hide password' : 'Show password'">
                        {{ showPassword ? 'Hide' : 'Show' }}
                      </button>
                    </div>
                  </div>

                  <!-- Submit button (Direct Token Issuance, No Extra OTP step) -->
                  <button
                    type="submit"
                    [disabled]="isLoading || !identifier || !password"
                    class="btn-primary w-full cursor-pointer min-h-[44px] flex items-center justify-center gap-2">
                    <svg *ngIf="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
                  </button>
                </form>
              </div>

              <!-- ================= METHOD 2: EMAIL CODE (OTP) ================= -->
              <div *ngIf="loginMethod === 'otp'" class="space-y-4">
                <!-- Step A: Before Code Sent -->
                <div *ngIf="!otpSent" class="space-y-3">
                  <p class="text-xs text-n-500 leading-relaxed">
                    Enter your email address above. We'll send a 6-digit verification code. No password is required.
                  </p>
                  <button
                    type="button"
                    (click)="sendLoginOtp()"
                    [disabled]="isOtpSending || !identifier"
                    class="btn-primary w-full cursor-pointer min-h-[44px] flex items-center justify-center gap-2">
                    <svg *ngIf="isOtpSending" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isOtpSending ? 'Sending Code...' : 'Send Code' }}</span>
                  </button>
                </div>

                <!-- Step B: After Code Sent -->
                <div *ngIf="otpSent" class="space-y-3">
                  <div class="p-3 bg-brand-subtle border border-brand-border rounded-lg text-xs text-ok-text flex items-center justify-between">
                    <span>If this email is registered, a code was sent.</span>
                    <button
                      type="button"
                      (click)="changeEmail()"
                      class="text-brand font-semibold hover:underline cursor-pointer min-h-[36px] flex items-center">
                      Change email
                    </button>
                  </div>

                  <div class="space-y-1">
                    <label class="form-label" for="desktop-otp">6-Digit Verification Code</label>
                    <input
                      id="desktop-otp"
                      type="text"
                      [(ngModel)]="otpCode"
                      name="otpCode"
                      maxlength="6"
                      placeholder="Enter 6-digit code"
                      class="form-input text-center text-lg tracking-widest font-mono min-h-[44px]"
                      autocomplete="one-time-code"
                    />
                    <p class="text-[11px] text-n-400">The code will not auto-submit. Tap Verify and Sign In below.</p>
                  </div>

                  <button
                    type="button"
                    (click)="verifyLoginOtp()"
                    [disabled]="isLoading || !otpCode || otpCode.length !== 6"
                    class="btn-primary w-full cursor-pointer min-h-[44px] flex items-center justify-center gap-2">
                    <svg *ngIf="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isLoading ? 'Verifying...' : 'Verify and Sign In' }}</span>
                  </button>

                  <div class="text-center pt-1">
                    <span *ngIf="resendCooldown > 0" class="text-xs text-n-400 font-semibold block min-h-[36px] flex items-center justify-center">
                      Resend code in {{ resendCooldown }}s
                    </span>
                    <button
                      *ngIf="resendCooldown === 0"
                      type="button"
                      (click)="sendLoginOtp()"
                      [disabled]="isOtpSending"
                      class="text-xs text-brand hover:underline font-semibold cursor-pointer min-h-[44px] inline-flex items-center">
                      Resend verification code
                    </button>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="relative flex items-center my-1">
                <div class="flex-grow border-t border-n-200"></div>
                <span class="mx-3 text-xs text-n-400 font-semibold">or</span>
                <div class="flex-grow border-t border-n-200"></div>
              </div>

              <!-- Google sign in (Third Option) -->
              <button
                type="button"
                (click)="onGoogleSignIn()"
                [disabled]="isGoogleLoading"
                class="btn-secondary w-full cursor-pointer min-h-[44px] flex items-center justify-center gap-2.5">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{{ isGoogleLoading ? 'Connecting...' : 'Continue with Google' }}</span>
              </button>

              <!-- Register link -->
              <div class="text-center pt-2 border-t border-n-200 text-sm text-n-500">
                New here?
                <a [routerLink]="['/auth/register']" [queryParams]="{ role: selectedRole }" class="font-semibold text-brand hover:text-brand-hover ml-1 min-h-[44px] inline-flex items-center">
                  Register
                </a>
              </div>

              <!-- Admin link -->
              <div class="text-center">
                <a routerLink="/admin/login" class="text-xs text-n-400 hover:text-n-700 transition-colors font-semibold">
                  Admin console
                </a>
              </div>
            </div>
          </div>
        </main>

        <!-- Profile completion modal (Google missing phone) -->
        <div *ngIf="showProfileCompletionModal" class="fixed inset-0 bg-n-900/50 z-50 flex items-center justify-center p-4">
          <div class="bg-n-0 rounded-xl p-6 max-w-md w-full shadow-sm border border-n-200 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-n-900">Complete your profile</h3>
                <p class="text-sm text-n-500 mt-0.5">Welcome, {{ googleProfileData?.name || 'User' }}</p>
              </div>
              <button (click)="showProfileCompletionModal = false" class="text-n-400 hover:text-n-900 cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="space-y-1">
              <label class="form-label" style="font-size:12px;">I am a</label>
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-n-100 rounded-lg border border-n-200">
                <button
                  *ngFor="let r of roles"
                  type="button"
                  (click)="profileRole = r.value"
                  [class]="profileRole === r.value ? 'bg-n-0 text-navy font-semibold shadow-xs border border-n-200' : 'text-n-500 hover:text-n-900 font-semibold'"
                  class="py-2 text-sm rounded-md transition-colors text-center cursor-pointer min-h-[44px]"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <label class="form-label" for="profile-phone">Mobile number</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-n-200 bg-n-100 text-sm font-semibold text-n-700">+91</span>
                <input
                  id="profile-phone"
                  type="tel"
                  [(ngModel)]="profilePhone"
                  placeholder="10-digit number"
                  maxlength="10"
                  class="form-input rounded-l-none min-h-[44px]" style="border-radius: 0 8px 8px 0;"
                />
              </div>
              <span *ngIf="profileError" class="text-xs text-err-text font-semibold block">{{ profileError }}</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button (click)="showProfileCompletionModal = false" type="button" class="btn-ghost cursor-pointer min-h-[44px]">Cancel</button>
              <button
                (click)="submitProfileCompletion()"
                [disabled]="isCompletingProfile || !profilePhone"
                type="button"
                class="btn-primary cursor-pointer min-h-[44px] flex items-center gap-2">
                <svg *ngIf="isCompletingProfile" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isCompletingProfile ? 'Saving...' : 'Continue' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Google First Login "Set Your Password" Modal -->
        <div *ngIf="showGooglePasswordModal" class="fixed inset-0 bg-n-900/50 z-50 flex items-center justify-center p-4">
          <div class="bg-n-0 rounded-xl p-6 max-w-md w-full shadow-sm border border-n-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-2 border-b border-n-200">
              <div>
                <h3 class="text-base font-semibold text-n-900">Set your password</h3>
                <p class="text-xs text-n-500 mt-0.5">Finish creating your account</p>
              </div>
              <button (click)="showGooglePasswordModal = false" class="text-n-400 hover:text-n-900 cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-3 bg-brand-subtle border border-brand-border rounded-lg text-xs text-ok-text">
              <span>A 6-digit verification code was sent to <strong>{{ googleOnboardingData?.emailMasked || 'your Google email' }}</strong>.</span>
            </div>

            <div *ngIf="googlePasswordError" class="p-3 bg-err-bg border border-err-border text-err-text rounded-lg text-xs font-semibold">
              {{ googlePasswordError }}
            </div>

            <!-- OTP input -->
            <div class="space-y-1">
              <label class="form-label" for="google-otp">6-Digit Email Code</label>
              <input
                id="google-otp"
                type="text"
                [(ngModel)]="googleOtp"
                maxlength="6"
                placeholder="Enter 6-digit code"
                class="form-input text-center text-lg tracking-widest font-mono min-h-[44px]"
              />
            </div>

            <!-- Password -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="form-label" for="google-new-pwd">Password</label>
                <button
                  type="button"
                  (click)="showGooglePassword = !showGooglePassword"
                  class="text-xs font-semibold text-n-500 hover:text-n-900">
                  {{ showGooglePassword ? 'Hide' : 'Show' }}
                </button>
              </div>
              <input
                id="google-new-pwd"
                [type]="showGooglePassword ? 'text' : 'password'"
                [(ngModel)]="googlePassword"
                placeholder="Min 8 characters (upper, lower, num)"
                class="form-input min-h-[44px]"
              />
            </div>

            <!-- Confirm Password -->
            <div class="space-y-1">
              <label class="form-label" for="google-confirm-pwd">Confirm Password</label>
              <input
                id="google-confirm-pwd"
                [type]="showGooglePassword ? 'text' : 'password'"
                [(ngModel)]="googleConfirmPassword"
                placeholder="Re-enter password"
                class="form-input min-h-[44px]"
              />
            </div>

            <div class="flex items-center justify-between pt-2">
              <button
                *ngIf="googleResendCooldown > 0"
                type="button"
                disabled
                class="text-xs text-n-400 font-semibold">
                Resend code in {{ googleResendCooldown }}s
              </button>
              <button
                *ngIf="googleResendCooldown === 0"
                type="button"
                (click)="resendGoogleOtp()"
                class="text-xs text-brand hover:underline font-semibold cursor-pointer min-h-[44px] flex items-center">
                Resend code
              </button>

              <button
                type="button"
                (click)="submitGooglePassword()"
                [disabled]="isGooglePasswordSubmitting || !googleOtp || googleOtp.length !== 6 || !googlePassword || !googleConfirmPassword"
                class="btn-primary cursor-pointer min-h-[44px] flex items-center gap-2">
                <svg *ngIf="isGooglePasswordSubmitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isGooglePasswordSubmitting ? 'Saving...' : 'Set Password' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Forgot password / Set password modal -->
        <div *ngIf="showForgotPassword" class="fixed inset-0 bg-n-900/50 z-50 flex items-center justify-center p-4">
          <div class="bg-n-0 rounded-xl p-6 max-w-md w-full shadow-sm border border-n-200 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-n-900">Reset or set password</h3>
                <p class="text-xs text-n-500 mt-0.5">Secure identity verification via email OTP</p>
              </div>
              <button (click)="showForgotPassword = false" class="text-n-400 hover:text-n-900 cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div *ngIf="forgotErrorMessage" class="p-3 bg-err-bg border border-err-border text-err-text rounded-lg text-xs font-semibold flex items-start gap-2">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{{ forgotErrorMessage }}</span>
            </div>

            <div *ngIf="forgotSuccessMessage" class="p-3 bg-ok-bg border border-ok-border text-ok-text rounded-lg text-xs font-semibold flex items-start gap-2">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ forgotSuccessMessage }}</span>
            </div>

            <!-- Step 1: Email Form -->
            <div *ngIf="forgotStep === 'EMAIL'" class="space-y-4">
              <div class="space-y-1">
                <label class="form-label" for="forgot-email">Registered Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  [(ngModel)]="forgotEmail"
                  placeholder="name@example.com"
                  class="form-input min-h-[44px]"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button (click)="showForgotPassword = false" type="button" class="btn-ghost cursor-pointer min-h-[44px]">Cancel</button>
                <button
                  (click)="sendForgotOtp()"
                  [disabled]="isForgotLoading || !forgotEmail"
                  type="button"
                  class="btn-primary cursor-pointer min-h-[44px] flex items-center gap-2">
                  <svg *ngIf="isForgotLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isForgotLoading ? 'Sending OTP...' : 'Send Verification OTP' }}</span>
                </button>
              </div>
            </div>

            <!-- Step 2: OTP & New Password Form -->
            <div *ngIf="forgotStep === 'RESET'" class="space-y-3.5">
              <div class="p-2.5 bg-n-100 rounded-lg text-xs text-n-700 flex items-center justify-between">
                <span>Code sent to: <strong class="text-n-900">{{ forgotEmail }}</strong></span>
                <button (click)="forgotStep = 'EMAIL'; forgotErrorMessage = ''; forgotSuccessMessage = ''" class="text-brand font-semibold hover:underline cursor-pointer min-h-[36px] flex items-center">Change</button>
              </div>

              <div class="space-y-1">
                <label class="form-label" for="forgot-otp">6-Digit Email Code</label>
                <input
                  id="forgot-otp"
                  type="text"
                  [(ngModel)]="forgotOtp"
                  placeholder="Enter 6-digit code"
                  maxlength="6"
                  class="form-input font-mono tracking-widest text-center text-base min-h-[44px]"
                />
              </div>

              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="form-label" for="forgot-new-pwd">New Password</label>
                  <button
                    type="button"
                    (click)="showForgotNewPassword = !showForgotNewPassword"
                    class="text-xs font-semibold text-n-500 hover:text-n-900">
                    {{ showForgotNewPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
                <input
                  id="forgot-new-pwd"
                  [type]="showForgotNewPassword ? 'text' : 'password'"
                  [(ngModel)]="forgotNewPassword"
                  placeholder="Min 8 characters (upper, lower, num, sym)"
                  class="form-input min-h-[44px]"
                />
              </div>

              <div class="space-y-1">
                <label class="form-label" for="forgot-confirm-pwd">Confirm New Password</label>
                <input
                  id="forgot-confirm-pwd"
                  [type]="showForgotNewPassword ? 'text' : 'password'"
                  [(ngModel)]="forgotConfirmPassword"
                  placeholder="Re-enter new password"
                  class="form-input min-h-[44px]"
                />
              </div>

              <div class="flex items-center justify-between pt-2">
                <button
                  (click)="sendForgotOtp()"
                  [disabled]="isForgotLoading"
                  type="button"
                  class="text-xs font-semibold text-brand hover:underline cursor-pointer min-h-[44px] flex items-center">
                  Resend code
                </button>
                <div class="flex items-center gap-2">
                  <button (click)="showForgotPassword = false" type="button" class="btn-ghost cursor-pointer min-h-[44px]">Cancel</button>
                  <button
                    (click)="submitForgotReset()"
                    [disabled]="isForgotLoading || !forgotOtp || !forgotNewPassword || !forgotConfirmPassword"
                    type="button"
                    class="btn-primary cursor-pointer min-h-[44px] flex items-center gap-2">
                    <svg *ngIf="isForgotLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isForgotLoading ? 'Saving...' : 'Set Password' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="py-4 text-center text-xs text-n-400 border-t border-n-200">
          &copy; 2026 Grih360 Technologies Pvt Ltd
        </footer>
      </div>
    }
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  // Method choice: 'password' (default) vs 'otp'
  loginMethod: 'password' | 'otp' = 'password';

  identifier: string = '';
  password: string = '';
  selectedRole: string = 'TENANT';
  isLoading: boolean = false;
  errorMessage: string = '';
  loginSuccessMessage: string = '';
  isGoogleOnlyAccount: boolean = false;
  showPassword: boolean = false;

  // OTP Login Method state
  otpSent: boolean = false;
  otpCode: string = '';
  isOtpSending: boolean = false;
  resendCooldown: number = 0;
  private cooldownTimer: any = null;

  // Forgot password / Set password state
  showForgotPassword: boolean = false;
  forgotStep: 'EMAIL' | 'RESET' = 'EMAIL';
  forgotEmail: string = '';
  forgotOtp: string = '';
  forgotNewPassword: string = '';
  forgotConfirmPassword: string = '';
  showForgotNewPassword: boolean = false;
  isForgotLoading: boolean = false;
  forgotErrorMessage: string = '';
  forgotSuccessMessage: string = '';

  // Google Authentication State
  isGoogleLoading: boolean = false;
  showProfileCompletionModal: boolean = false;
  googleProfileData: any = null;
  profileRole: string = 'TENANT';
  profilePhone: string = '';
  profileError: string = '';
  isCompletingProfile: boolean = false;
  pendingIdToken: string = '';

  // Google First Login "Set Your Password" state
  showGooglePasswordModal: boolean = false;
  googleOnboardingData: any = null;
  googlePassword: string = '';
  googleConfirmPassword: string = '';
  googleOtp: string = '';
  showGooglePassword: boolean = false;
  isGooglePasswordSubmitting: boolean = false;
  googlePasswordError: string = '';
  googleResendCooldown: number = 0;
  private googleCooldownTimer: any = null;

  private subscriptions: Subscription = new Subscription();

  roles = [
    { label: 'Tenant', value: 'TENANT' },
    { label: 'Owner', value: 'OWNER' },
    { label: 'Pro', value: 'PROFESSIONAL' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public isMobile: IsMobileService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit(): void {
    // Restore remembered sign-in method on device (only the choice, never secrets)
    try {
      const savedMethod = localStorage.getItem('grih360_login_method');
      if (savedMethod === 'password' || savedMethod === 'otp') {
        this.loginMethod = savedMethod;
      }
    } catch (_) {}

    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const roleUpper = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(roleUpper)) {
          this.selectedRole = roleUpper;
        }
      }
    });

    // Dynamically load Google Identity Services client script for web only
    if (!this.googleAuthService.isNative()) {
      this.googleAuthService.loadGsiScript().catch(() => {});
    }

    // Listen for profile completion requirements (role and phone for new Google users)
    const profileSub = this.googleAuthService.profileRequired$.subscribe((data) => {
      this.googleProfileData = data;
      this.pendingIdToken = data.idToken;
      this.profileRole = data.suggestedRole || this.selectedRole;
      this.showProfileCompletionModal = true;
      this.isGoogleLoading = false;
    });
    this.subscriptions.add(profileSub);

    // Listen for password setup requirements (first-time Google onboarding)
    const pwdSub = this.googleAuthService.passwordSetupRequired$.subscribe((data) => {
      this.googleOnboardingData = data;
      this.googlePassword = '';
      this.googleConfirmPassword = '';
      this.googleOtp = '';
      this.googlePasswordError = '';
      this.showGooglePasswordModal = true;
      this.isGoogleLoading = false;
      this.startGoogleCooldown(60);
    });
    this.subscriptions.add(pwdSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    if (this.googleCooldownTimer) clearInterval(this.googleCooldownTimer);
  }

  setLoginMethod(method: 'password' | 'otp'): void {
    this.loginMethod = method;
    try {
      localStorage.setItem('grih360_login_method', method);
    } catch (_) {}
    this.errorMessage = '';
    this.otpSent = false;
    this.otpCode = '';
    this.isGoogleOnlyAccount = false;
  }

  changeEmail(): void {
    this.otpSent = false;
    this.otpCode = '';
    this.errorMessage = '';
  }

  private startResendCooldown(seconds: number = 60): void {
    this.resendCooldown = seconds;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }

  private startGoogleCooldown(seconds: number = 60): void {
    this.googleResendCooldown = seconds;
    if (this.googleCooldownTimer) clearInterval(this.googleCooldownTimer);
    this.googleCooldownTimer = setInterval(() => {
      if (this.googleResendCooldown > 0) {
        this.googleResendCooldown--;
      } else {
        clearInterval(this.googleCooldownTimer);
        this.googleCooldownTimer = null;
      }
    }, 1000);
  }

  sendLoginOtp(): void {
    const cleanId = (this.identifier || '').trim();
    if (!cleanId) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isOtpSending = true;
    this.errorMessage = '';

    this.authService
      .requestLoginOtp(cleanId)
      .pipe(
        timeout(30000),
        finalize(() => {
          this.isOtpSending = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.otpSent = true;
          this.startResendCooldown(60);
          this.errorMessage = '';
        },
        error: (err: any) => {
          if (err?.status === 429) {
            this.errorMessage = err?.error?.message || 'Please wait before requesting another code.';
          } else {
            // Anti-enumeration: still transition to OTP entry with neutral prompt
            this.otpSent = true;
            this.startResendCooldown(60);
          }
        },
      });
  }

  verifyLoginOtp(): void {
    const cleanId = (this.identifier || '').trim();
    const cleanOtp = (this.otpCode || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyLoginOtpDirect(cleanId, cleanOtp, this.selectedRole)
      .pipe(
        timeout(30000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          const userRole = res?.data?.user?.role || res?.user?.role || this.selectedRole;
          this.navigateByRole(userRole);
        },
        error: (err: any) => {
          const errCode = err?.error?.code;
          const errMsg = err?.error?.message;
          if (errCode === 'ACCOUNT_SUSPENDED' || err?.status === 403) {
            this.errorMessage = errMsg || 'Your account has been deactivated or suspended.';
          } else if (errCode === 'ROLE_MISMATCH') {
            this.errorMessage = errMsg || 'This account is registered for a different workspace portal.';
          } else if (err?.status === 401 || errCode === 'INVALID_OTP') {
            this.errorMessage = errMsg || 'Incorrect or expired verification code. Please try again.';
          } else if (err?.status === 429) {
            this.errorMessage = errMsg || 'Too many attempts. Please request a new verification code.';
          } else {
            this.errorMessage = errMsg || 'Unable to verify code. Please try again.';
          }
        },
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
          this.errorMessage = 'Unable to complete Google sign in at this time. Please try again or use password login.';
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
        this.errorMessage = 'Unable to launch Google sign in. Please verify your internet connection.';
      });
  }

  submitProfileCompletion(): void {
    this.profileError = '';
    const cleanPhone = this.profilePhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      this.profileError = 'Please enter a valid 10 digit mobile number.';
      return;
    }

    this.isCompletingProfile = true;
    this.googleAuthService
      .submitGoogleToken(this.pendingIdToken, this.profileRole, cleanPhone)
      .then((res) => {
        this.isCompletingProfile = false;
        if (res.success && !res.needsProfile) {
          this.showProfileCompletionModal = false;
        } else if (res.error) {
          this.profileError = res.error;
        }
      })
      .catch(() => {
        this.isCompletingProfile = false;
        this.profileError = 'Failed to complete profile. Please try again.';
      });
  }

  submitGooglePassword(): void {
    this.googlePasswordError = '';
    const cleanOtp = (this.googleOtp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      this.googlePasswordError = 'Please enter the 6-digit code sent to your Google email.';
      return;
    }
    if (!this.googlePassword) {
      this.googlePasswordError = 'Please enter a password.';
      return;
    }
    if (this.googlePassword.length < 8) {
      this.googlePasswordError = 'Password must be at least 8 characters long.';
      return;
    }
    if (
      !/[A-Z]/.test(this.googlePassword) ||
      !/[a-z]/.test(this.googlePassword) ||
      !/[0-9]/.test(this.googlePassword)
    ) {
      this.googlePasswordError = 'Password must include uppercase, lowercase, and a number.';
      return;
    }
    if (this.googlePassword !== this.googleConfirmPassword) {
      this.googlePasswordError = 'Passwords do not match.';
      return;
    }

    this.isGooglePasswordSubmitting = true;
    this.authService
      .setGoogleInitialPassword({
        onboardingToken: this.googleOnboardingData.onboardingToken,
        otp: cleanOtp,
        password: this.googlePassword,
        confirmPassword: this.googleConfirmPassword,
      })
      .pipe(
        finalize(() => {
          this.isGooglePasswordSubmitting = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.showGooglePasswordModal = false;
          const userRole = res?.data?.user?.role || res?.user?.role || this.selectedRole;
          this.navigateByRole(userRole);
        },
        error: (err: any) => {
          this.googlePasswordError = err?.error?.message || 'Failed to set password. Please check the code and try again.';
        },
      });
  }

  resendGoogleOtp(): void {
    if (!this.googleOnboardingData?.onboardingToken) return;
    this.authService.resendGoogleOnboardingOtp(this.googleOnboardingData.onboardingToken).subscribe({
      next: () => {
        this.startGoogleCooldown(60);
      },
      error: (err: any) => {
        this.googlePasswordError = err?.error?.message || 'Failed to resend code.';
      },
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

  openForgotPasswordModal(prefillEmail?: string): void {
    this.showForgotPassword = true;
    this.forgotStep = 'EMAIL';
    this.forgotEmail = (prefillEmail || this.identifier || '').trim();
    this.forgotOtp = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
  }

  sendForgotOtp(): void {
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
    const cleanEmail = this.forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      this.forgotErrorMessage = 'Please enter a valid email address.';
      return;
    }
    this.isForgotLoading = true;
    this.authService.sendForgotPasswordOtp(cleanEmail).subscribe({
      next: (res: any) => {
        this.isForgotLoading = false;
        this.forgotStep = 'RESET';
        this.forgotSuccessMessage = res.message || 'Verification code sent to your email.';
      },
      error: (err: any) => {
        this.isForgotLoading = false;
        this.forgotErrorMessage = err?.error?.message || 'Unable to send verification code. Please check your email.';
      },
    });
  }

  submitForgotReset(): void {
    this.forgotErrorMessage = '';
    const cleanEmail = this.forgotEmail.trim().toLowerCase();
    const cleanOtp = this.forgotOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      this.forgotErrorMessage = 'Please enter the 6-digit verification code sent to your email.';
      return;
    }
    if (!this.forgotNewPassword) {
      this.forgotErrorMessage = 'Please enter your new password.';
      return;
    }
    if (this.forgotNewPassword.length < 8) {
      this.forgotErrorMessage = 'Password must be at least 8 characters long.';
      return;
    }
    if (
      !/[A-Z]/.test(this.forgotNewPassword) ||
      !/[a-z]/.test(this.forgotNewPassword) ||
      !/[0-9]/.test(this.forgotNewPassword)
    ) {
      this.forgotErrorMessage = 'Password must contain uppercase, lowercase, and a number.';
      return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotErrorMessage = 'New password and confirm password do not match.';
      return;
    }

    this.isForgotLoading = true;
    this.authService.resetPasswordWithOtp(cleanEmail, cleanOtp, this.forgotNewPassword).subscribe({
      next: () => {
        this.isForgotLoading = false;
        this.showForgotPassword = false;
        this.isGoogleOnlyAccount = false;
        this.errorMessage = '';
        this.loginSuccessMessage = 'Password set successfully! You can now sign in with your email and password.';
        this.identifier = cleanEmail;
        this.password = '';
        this.setLoginMethod('password');
      },
      error: (err: any) => {
        this.isForgotLoading = false;
        this.forgotErrorMessage = err?.error?.message || 'Failed to reset password. Please check the OTP and try again.';
      },
    });
  }

  onLoginSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Please enter both your email/phone and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .login(this.identifier, this.password, this.selectedRole)
      .pipe(
        timeout(45000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          // Direct login token issuance (No extra OTP step)
          const userRole = res?.data?.user?.role || res?.user?.role || this.selectedRole;
          this.navigateByRole(userRole);
        },
        error: (err: any) => {
          if (!environment.production) {
            console.error('[Login Technical Error]:', err);
          }
          const errCode = err?.error?.code;
          const errMsg = err?.error?.message;
          if (
            errCode === 'GOOGLE_AUTH_REQUIRED' ||
            errMsg?.includes('No password set for this account') ||
            errMsg?.includes('This account uses Google sign-in')
          ) {
            this.isGoogleOnlyAccount = true;
            this.errorMessage = 'No password set for this account. Use an email code or Continue with Google, or set one with Forgot Password.';
            return;
          }
          this.isGoogleOnlyAccount = false;
          if (err.name === 'TimeoutError' || err.status === 0) {
            this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          } else if (errCode === 'ACCOUNT_LOCKED' || err.status === 429) {
            this.errorMessage = errMsg || 'Account temporarily locked due to repeated failed login attempts. Please try again in 15 minutes.';
          } else if (errCode === 'ACCOUNT_SUSPENDED' || (err.status === 403 && errMsg?.includes('suspended'))) {
            this.errorMessage = errMsg || 'Your account has been deactivated or suspended.';
          } else if (errCode === 'ROLE_MISMATCH' || (err.status === 403 && errMsg?.includes('portal'))) {
            this.errorMessage = errMsg || 'This account is registered for a different workspace portal.';
          } else if (err.status === 400 || err.status === 401 || err.status === 404) {
            this.errorMessage = 'Incorrect email or password. Please try again.';
          } else if (err.status === 503) {
            this.errorMessage = errMsg || 'Authentication service is temporarily unavailable. Please try again shortly.';
          } else {
            this.errorMessage = 'A server error occurred. Please try again in a few moments.';
          }
        },
      });
  }

  private navigateByRole(role: string): void {
    if (role === 'OWNER') {
      this.router.navigate(['/owner/dashboard']);
    } else if (role === 'PROFESSIONAL') {
      this.router.navigate(['/professional/dashboard']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/tenant/dashboard']);
    }
  }
}
