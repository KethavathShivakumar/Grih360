import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MobileRegisterComponent } from './mobile-register.component';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MobileRegisterComponent],
  template: `
    @if (isMobile.isMobile()) {
      <app-mobile-register
        [registerForm]="registerForm"
        [selectedRole]="selectedRole"
        [isLoading]="isLoading"
        [errorMessage]="errorMessage"
        (setRole)="setRole($event)"
        (registerSubmit)="onSubmit()"
        [isGoogleLoading]="isGoogleLoading"
        (googleSignIn)="onGoogleSignIn()"
        [showProfileSheet]="showProfileCompletionModal"
        (closeProfileSheet)="showProfileCompletionModal = false"
        [(profilePhone)]="profilePhone"
        [profileError]="profileError"
        [isCompletingProfile]="isCompletingProfile"
        (completeProfile)="submitProfileCompletion()"
      ></app-mobile-register>
    } @else {
      <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
        <!-- Top Simple Header -->
        <header class="w-full bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] py-3.5 px-4 sm:px-8">
          <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a routerLink="/" class="flex items-center space-x-2.5 group">
              <div class="w-9 h-9 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-lg shadow-xs  transition-transform">
                G
              </div>
              <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Grih<span class="text-[#2D7A5E]">360</span></span>
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
            <div class="lg:col-span-5 bg-[#0F2937] p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <!-- Ambient Background Glows -->
              <div class="absolute -top-24 -left-24 w-64 h-64 bg-[#2D7A5E]/20 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FACC15]/15 rounded-full blur-3xl pointer-events-none"></div>

              <div class="space-y-6 relative z-10">
                <div class="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                  <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Model Tenancy Act Verified</span>
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
                      <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
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
                      <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
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
                <span>Grih360 Security Cloud</span>
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
                <span class="text-base shrink-0"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>
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
                      <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></span>
                      <span>Tenant</span>
                    </button>

                    <button
                      type="button"
                      (click)="setRole('OWNER')"
                      [class]="selectedRole === 'OWNER' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold ring-2 ring-[#0F2937] shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'"
                      class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span class="text-base"></span>
                      <span>Property Owner</span>
                    </button>

                    <button
                      type="button"
                      (click)="setRole('PROFESSIONAL')"
                      [class]="selectedRole === 'PROFESSIONAL' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold ring-2 ring-[#0F2937] shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'"
                      class="p-2.5 text-xs rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span class="text-base"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></span>
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
                      Valid 10 digit mobile number required.
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
                  <span class="text-base shrink-0"></span>
                  <span>An instant 6-digit OTP code will be sent to your email to verify account ownership.</span>
                </div>

                <!-- Terms and Privacy Consent Checkbox -->
                <div class="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    formControlName="acceptTerms"
                    id="acceptTerms"
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2D7A5E] focus:ring-[#2D7A5E] cursor-pointer"
                  />
                  <label for="acceptTerms" class="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                    I agree to the <a routerLink="/terms" target="_blank" class="text-[#2D7A5E] font-bold hover:underline">Terms and Conditions</a>
                    and acknowledge the <a routerLink="/privacy" target="_blank" class="text-[#2D7A5E] font-bold hover:underline">Privacy Policy</a>.
                  </label>
                </div>
                <span *ngIf="f['acceptTerms']?.touched && f['acceptTerms']?.invalid" class="text-[11px] text-rose-600 font-semibold block">
                  You must agree to the Terms and Privacy Policy to proceed.
                </span>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="registerForm.invalid || isLoading"
                  class="w-full py-3.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isLoading ? 'Creating Account & Generating OTP...' : 'Register & Verify Email →' }}</span>
                </button>
              </form>

              <!-- Or Divider -->
              <div class="relative my-3.5 flex items-center justify-center">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-slate-200"></div>
                </div>
                <div class="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  or
                </div>
              </div>

              <!-- Official Google Button (Reserved 44px Height) -->
              <div class="w-full h-[44px] min-h-[44px] flex items-center justify-center">
                <button
                  type="button"
                  (click)="onGoogleSignIn()"
                  [disabled]="isGoogleLoading"
                  class="w-full h-[44px] bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer select-none"
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

        <!-- Profile Completion Modal (Role & Phone for New Google Users) -->
        <div *ngIf="showProfileCompletionModal" class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-[#E8E6DF]">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-extrabold text-[#0F2937]">Complete Your Profile</h3>
                <p class="text-xs text-slate-500 mt-0.5">Welcome, {{ googleProfileData?.name || 'User' }}</p>
              </div>
              <button (click)="showProfileCompletionModal = false" class="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            <!-- Role Selector -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">Choose Workspace Role</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="profileRole = 'TENANT'"
                  [class]="profileRole === 'TENANT' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200'"
                  class="py-2.5 px-2 text-xs rounded-xl transition text-center cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span>Tenant</span>
                </button>
                <button
                  type="button"
                  (click)="profileRole = 'OWNER'"
                  [class]="profileRole === 'OWNER' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200'"
                  class="py-2.5 px-2 text-xs rounded-xl transition text-center cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span>Owner</span>
                </button>
                <button
                  type="button"
                  (click)="profileRole = 'PROFESSIONAL'"
                  [class]="profileRole === 'PROFESSIONAL' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200'"
                  class="py-2.5 px-2 text-xs rounded-xl transition text-center cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span>Service Pro</span>
                </button>
              </div>
            </div>

            <!-- Phone Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">Mobile Number <span class="text-rose-500">*</span></label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-xs font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  [(ngModel)]="profilePhone"
                  placeholder="10 digit mobile number"
                  maxlength="10"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-none rounded-r-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] font-medium"
                />
              </div>
              <span *ngIf="profileError" class="text-[11px] text-rose-600 font-semibold block">
                {{ profileError }}
              </span>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-2">
              <button
                (click)="showProfileCompletionModal = false"
                type="button"
                class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                (click)="submitProfileCompletion()"
                [disabled]="isCompletingProfile || !profilePhone"
                type="button"
                class="px-5 py-2.5 text-xs font-bold bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
              >
                {{ isCompletingProfile ? 'Registering...' : 'Complete Registration →' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="py-4 px-6 text-center text-xs text-slate-500 border-t border-[#E8E6DF]">
          <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; 2026 Grih360 Technologies Pvt Ltd. Model Tenancy Act Compliant.</span>
            <div class="flex items-center gap-3 font-semibold">
              <a routerLink="/privacy" class="hover:text-[#2D7A5E] transition-colors">Privacy Policy</a>
              <span>•</span>
              <a routerLink="/terms" class="hover:text-[#2D7A5E] transition-colors">Terms and Conditions</a>
            </div>
          </div>
        </footer>
      </div>
    }
  `,
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedRole: UserRole = 'TENANT';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  // Google Authentication State
  isGoogleLoading: boolean = false;
  showProfileCompletionModal: boolean = false;
  googleProfileData: any = null;
  profileRole: UserRole = 'TENANT';
  profilePhone: string = '';
  profileError: string = '';
  isCompletingProfile: boolean = false;
  pendingIdToken: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public isMobile: IsMobileService,
    private googleAuthService: GoogleAuthService
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
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

    // Dynamically load Google Identity Services client script for web only
    if (!this.googleAuthService.isNative()) {
      this.googleAuthService.loadGsiScript().catch(() => {});
    }

    // Listen for profile completion requirements (role and phone for new Google users)
    this.googleAuthService.profileRequired$.subscribe((data) => {
      this.googleProfileData = data;
      this.pendingIdToken = data.idToken;
      this.profileRole = (data.suggestedRole || this.selectedRole) as UserRole;
      this.showProfileCompletionModal = true;
      this.isGoogleLoading = false;
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
            this.errorMessage = 'Connection timeout. Please check your internet connection and retry.';
          } else if (err.status === 0) {
            this.errorMessage = 'Network connection error. Please check your internet connection and retry.';
          } else {
            this.errorMessage = err?.error?.message || 'Registration failed. An account with this email or phone may already exist.';
          }
        },
      });
  }
}
