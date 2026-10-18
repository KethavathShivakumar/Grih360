import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MobileLoginComponent } from './mobile-login.component';
import { finalize, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
        [isGoogleLoading]="isGoogleLoading"
        (googleSignIn)="onGoogleSignIn()"
        [showProfileSheet]="showProfileCompletionModal"
        (closeProfileSheet)="showProfileCompletionModal = false"
        [(profilePhone)]="profilePhone"
        [profileError]="profileError"
        [isCompletingProfile]="isCompletingProfile"
        (completeProfile)="submitProfileCompletion()"
        (loginSubmit)="onLoginSubmit()"
        (togglePasswordVisibility)="togglePasswordVisibility()"
        (openForgotPassword)="showForgotPassword = true"
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
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#2D7A5E;">
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
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#2D7A5E;">
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
            <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center gap-6">
              
              <!-- Step indicator -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-brand flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-brand text-n-0 flex items-center justify-center" style="font-size:10px;">1</span>
                    Password
                  </span>
                  <span class="text-n-400 flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-n-200 text-n-500 flex items-center justify-center" style="font-size:10px;">2</span>
                    Email code
                  </span>
                </div>
                <div class="w-full bg-n-200 h-1 rounded-full overflow-hidden">
                  <div class="bg-brand h-full w-1/2 rounded-full transition-all"></div>
                </div>
              </div>

              <div class="space-y-1">
                <h1 class="text-xl font-semibold text-n-900">Sign in</h1>
                <p class="text-sm text-n-500">A verification code will be sent to your email after sign in.</p>
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
                    class="py-2 text-sm rounded-md transition-colors text-center cursor-pointer"
                  >
                    {{ role.label }}
                  </button>
                </div>
              </div>

              <!-- Error -->
              <div *ngIf="errorMessage" class="p-3 bg-err-bg border border-err-border text-err-text rounded-lg text-sm flex items-start gap-2">
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Login form -->
              <form (ngSubmit)="onLoginSubmit()" class="space-y-4">
                <!-- Identifier -->
                <div class="space-y-1">
                  <label class="form-label" for="login-identifier">Email or mobile number</label>
                  <input
                    id="login-identifier"
                    type="text"
                    [(ngModel)]="identifier"
                    name="identifier"
                    required
                    placeholder="email@example.com or 9876543210"
                    class="form-input"
                  />
                </div>

                <!-- Password -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="form-label" for="login-password">Password</label>
                    <button
                      (click)="showForgotPassword = true"
                      type="button"
                      class="text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer">
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
                      class="form-input pr-16"
                    />
                    <button
                      type="button"
                      (click)="togglePasswordVisibility()"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-n-500 hover:text-n-900 cursor-pointer"
                      [title]="showPassword ? 'Hide password' : 'Show password'">
                      {{ showPassword ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                </div>

                <!-- Email OTP notice -->
                <div class="p-3 bg-brand-subtle border border-brand-border rounded-lg flex items-start gap-2 text-sm text-ok-text">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span>A verification code will be sent to your email after entering your password.</span>
                </div>

                <!-- Submit -->
                <button
                  type="submit"
                  [disabled]="isLoading || !identifier || !password"
                  class="btn-primary w-full cursor-pointer">
                  <svg *ngIf="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
                </button>
              </form>

              <!-- Divider -->
              <div class="relative flex items-center">
                <div class="flex-grow border-t border-n-200"></div>
                <span class="mx-3 text-xs text-n-400 font-semibold">or</span>
                <div class="flex-grow border-t border-n-200"></div>
              </div>

              <!-- Google sign in -->
              <button
                type="button"
                (click)="onGoogleSignIn()"
                [disabled]="isGoogleLoading"
                class="btn-secondary w-full cursor-pointer">
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
                No account?
                <a [routerLink]="['/auth/register']" [queryParams]="{ role: selectedRole }" class="font-semibold text-brand hover:text-brand-hover ml-1">
                  Create one
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

        <!-- Profile completion modal -->
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
                  class="py-2 text-sm rounded-md transition-colors text-center cursor-pointer"
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
                  class="form-input rounded-l-none" style="border-radius: 0 8px 8px 0;"
                />
              </div>
              <span *ngIf="profileError" class="text-xs text-err-text font-semibold block">{{ profileError }}</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button (click)="showProfileCompletionModal = false" type="button" class="btn-ghost cursor-pointer">Cancel</button>
              <button
                (click)="submitProfileCompletion()"
                [disabled]="isCompletingProfile || !profilePhone"
                type="button"
                class="btn-primary cursor-pointer">
                {{ isCompletingProfile ? 'Saving...' : 'Complete registration' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Forgot password modal -->
        <div *ngIf="showForgotPassword" class="fixed inset-0 bg-n-900/50 z-50 flex items-center justify-center p-4">
          <div class="bg-n-0 rounded-xl p-6 max-w-md w-full shadow-sm border border-n-200 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-n-900">Reset password</h3>
              <button (click)="showForgotPassword = false" class="text-n-400 hover:text-n-900 cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p class="text-sm text-n-500">Enter your registered email or mobile number. Recovery instructions will be sent if the account exists.</p>
            <div class="space-y-1">
              <label class="form-label" for="forgot-id">Email or phone</label>
              <input id="forgot-id" type="text" [(ngModel)]="forgotIdentifier" placeholder="Email or phone" class="form-input"/>
            </div>
            <div *ngIf="forgotSent" class="p-3 bg-ok-bg border border-ok-border rounded-lg text-sm text-ok-text font-semibold">
              Recovery instructions sent if the account exists.
            </div>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button (click)="showForgotPassword = false" type="button" class="btn-ghost cursor-pointer">Close</button>
              <button (click)="forgotSent = true" type="button" class="btn-primary cursor-pointer">Send link</button>
            </div>
          </div>
        </div>

        <footer class="py-4 text-center text-xs text-n-400 border-t border-n-200">
          &copy; 2026 Grih360 Technologies Pvt Ltd
        </footer>
      </div>
    }

    <!-- Forgot password modal (mobile) -->
    <div *ngIf="showForgotPassword && isMobile.isMobile()" class="fixed inset-0 bg-n-900/50 z-50 flex items-center justify-center p-4">
      <div class="bg-n-0 rounded-xl p-5 max-w-sm w-full shadow-sm border border-n-200 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-n-900">Reset password</h3>
          <button (click)="showForgotPassword = false" class="text-n-400 hover:text-n-900 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p class="text-sm text-n-500">Recovery instructions will be sent if the account exists.</p>
        <div class="space-y-1">
          <label class="form-label" for="mobile-forgot-id">Email or phone</label>
          <input id="mobile-forgot-id" type="text" [(ngModel)]="forgotIdentifier" placeholder="Email or phone" class="form-input"/>
        </div>
        <div *ngIf="forgotSent" class="p-3 bg-ok-bg border border-ok-border rounded-lg text-sm text-ok-text font-semibold">
          Instructions sent if the account exists.
        </div>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button (click)="showForgotPassword = false" type="button" class="btn-ghost cursor-pointer min-h-[44px]">Close</button>
          <button (click)="forgotSent = true" type="button" class="btn-primary cursor-pointer min-h-[44px]">Send link</button>
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

  // Google Authentication State
  isGoogleLoading: boolean = false;
  showProfileCompletionModal: boolean = false;
  googleProfileData: any = null;
  profileRole: string = 'TENANT';
  profilePhone: string = '';
  profileError: string = '';
  isCompletingProfile: boolean = false;
  pendingIdToken: string = '';

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
    this.googleAuthService.profileRequired$.subscribe((data) => {
      this.googleProfileData = data;
      this.pendingIdToken = data.idToken;
      this.profileRole = data.suggestedRole || this.selectedRole;
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
          if (!environment.production) {
            console.error('[Login Technical Error]:', err);
          }
          if (err.name === 'TimeoutError' || err.status === 0) {
            this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          } else if (err.status === 401) {
            this.errorMessage = err?.error?.message || 'Invalid email or password. Please try again.';
          } else if (err.status === 403) {
            this.errorMessage = err?.error?.message || 'Your account has been deactivated or suspended.';
          } else if (err.status === 404) {
            this.errorMessage = 'No registered account found with this email or mobile number.';
          } else if (err.status === 429) {
            this.errorMessage = 'Too many sign-in attempts. Please wait a few minutes and try again.';
          } else if (err.status === 503) {
            this.errorMessage = err?.error?.message || 'Authentication service is temporarily unavailable. Please try again shortly.';
          } else {
            this.errorMessage = 'A server error occurred. Please try again in a few moments.';
          }
        },
      });
  }
}
