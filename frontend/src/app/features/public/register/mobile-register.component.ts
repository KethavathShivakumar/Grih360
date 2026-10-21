import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserRole } from '../../../shared/models/user.model';

@Component({
  selector: 'app-mobile-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col justify-between font-sans text-n-900 p-4">
      <!-- Header with Brand & Sign In Link -->
      <header class="w-full flex items-center justify-between py-2.5 border-b border-n-200 mobile-top-bar">
        <a routerLink="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-navy text-n-0 flex items-center justify-center font-semibold text-base shadow-xs">
            G
          </div>
          <span class="text-lg font-semibold text-n-900">Grih<span class="text-brand">360</span></span>
        </a>
        <a routerLink="/auth/login" class="text-xs font-bold text-n-600 hover:text-n-900 flex items-center gap-1 min-h-[44px]">
          <span>Sign In →</span>
        </a>
      </header>

      <!-- Main Registration Card Area -->
      <main class="my-auto py-4 space-y-4 max-w-md mx-auto w-full">
        <!-- Top Segmented Tabs: Register vs Sign In -->
        <div class="grid grid-cols-2 p-1 bg-n-200/80 rounded-xl text-xs font-semibold">
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

        <!-- STEP 1: Role, Name, Email -->
        <div *ngIf="step === 1" class="space-y-4">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-n-900 tracking-tight">
              Create your account
            </h1>
            <p class="text-xs text-n-500">
              Enter your details to receive an email verification code.
            </p>
          </div>

          <!-- Error Banner -->
          <div *ngIf="errorMessage && !emailAlreadyRegistered" class="p-3 bg-err-bg border border-err-border text-err-text rounded-xl text-xs font-semibold flex items-start gap-2">
            <span class="text-sm shrink-0">⚠</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Email Already Registered Callout -->
          <div *ngIf="emailAlreadyRegistered" class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-xs text-amber-900">
            <div class="font-semibold flex items-center gap-1.5">
              <span>⚠</span>
              <span>This email is already registered.</span>
            </div>
            <p class="text-[11px] text-amber-800">
              An account with this email address already exists. Please sign in or continue with Google.
            </p>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                (click)="goToLogin.emit()"
                class="py-2.5 px-3 bg-navy text-n-0 font-semibold text-xs rounded-lg min-h-[44px] cursor-pointer"
              >
                Sign in
              </button>
              <button
                type="button"
                (click)="googleSignIn.emit()"
                class="py-2.5 px-3 bg-n-0 border border-n-300 text-n-800 font-semibold text-xs rounded-lg min-h-[44px] cursor-pointer"
              >
                Continue with Google
              </button>
            </div>
          </div>

          <form (ngSubmit)="onFormSubmit($event)" class="space-y-3.5">
            <!-- Role Selector Tabs -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-n-700 block">Workspace Role</label>
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-n-200/80 rounded-xl">
                <button
                  type="button"
                  (click)="setRole.emit('TENANT')"
                  [class]="selectedRole === 'TENANT' ? 'bg-navy text-n-0 font-semibold shadow-xs' : 'text-n-600 font-semibold'"
                  class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <span>Tenant</span>
                </button>
                <button
                  type="button"
                  (click)="setRole.emit('OWNER')"
                  [class]="selectedRole === 'OWNER' ? 'bg-navy text-n-0 font-semibold shadow-xs' : 'text-n-600 font-semibold'"
                  class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <span>Owner</span>
                </button>
                <button
                  type="button"
                  (click)="setRole.emit('PROFESSIONAL')"
                  [class]="selectedRole === 'PROFESSIONAL' ? 'bg-navy text-n-0 font-semibold shadow-xs' : 'text-n-600 font-semibold'"
                  class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
                >
                  <span>Pro</span>
                </button>
              </div>
            </div>

            <!-- Full Name -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-n-700 block">Full name</label>
              <input
                type="text"
                [ngModel]="name"
                (ngModelChange)="nameChange.emit($event)"
                name="name"
                placeholder="Full name"
                class="w-full px-3.5 py-3 bg-n-0 border border-n-300 rounded-xl text-base text-n-900 focus:ring-2 focus:ring-brand focus:outline-none font-medium min-h-[44px]"
              />
            </div>

            <!-- Email Address (Mobile completely removed) -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-n-700 block">Email address</label>
              <input
                type="email"
                [ngModel]="email"
                (ngModelChange)="emailChange.emit($event)"
                name="email"
                placeholder="Email address"
                class="w-full px-3.5 py-3 bg-n-0 border border-n-300 rounded-xl text-base text-n-900 focus:ring-2 focus:ring-brand focus:outline-none font-medium min-h-[44px]"
              />
            </div>

            <!-- Terms and Privacy Consent Checkbox -->
            <div class="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                [ngModel]="acceptTerms"
                (ngModelChange)="acceptTermsChange.emit($event)"
                name="acceptTerms"
                id="mobileAcceptTerms"
                class="mt-1 h-4 w-4 rounded border-n-300 text-brand focus:ring-brand cursor-pointer"
              />
              <label for="mobileAcceptTerms" class="text-xs text-n-600 leading-relaxed cursor-pointer select-none">
                I agree to the <a routerLink="/terms" target="_blank" class="text-brand font-bold underline">Terms and Conditions</a>
                and acknowledge the <a routerLink="/privacy" target="_blank" class="text-brand font-bold underline">Privacy Policy</a>.
              </label>
            </div>

            <!-- Send Code Button -->
            <button
              type="button"
              (click)="requestCode.emit()"
              [disabled]="!isStep1Valid || isLoading"
              class="w-full py-3.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-n-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Sending verification code...' : 'Send verification code' }}</span>
            </button>
          </form>

          <!-- Or Divider -->
          <div class="relative my-3 flex items-center justify-center">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-n-200"></div>
            </div>
            <div class="relative bg-n-50 px-3 text-[11px] font-bold text-n-400 uppercase tracking-wider">
              or
            </div>
          </div>

          <!-- Official Google Button (Reserved 44px Height) -->
          <div class="w-full h-[44px] min-h-[44px] flex items-center justify-center">
            <button
              type="button"
              (click)="googleSignIn.emit()"
              [disabled]="isGoogleLoading"
              class="w-full h-[44px] bg-n-0 hover:bg-n-100 active:bg-n-200 border border-n-300 rounded-xl text-n-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer select-none min-h-[44px]"
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
        <div *ngIf="step === 2" class="space-y-4">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-n-900 tracking-tight">
              Set your password
            </h1>
            <p class="text-xs text-n-500">
              Finish creating your account.
            </p>
          </div>

          <div class="p-3 bg-brand-subtle border border-brand-border rounded-xl text-xs text-ok-text flex items-center justify-between">
            <span>Code sent to <strong>{{ email }}</strong></span>
            <button
              type="button"
              (click)="changeEmail.emit()"
              class="text-xs font-semibold text-brand underline cursor-pointer ml-2"
            >
              Change
            </button>
          </div>

          <!-- Error Banner -->
          <div *ngIf="errorMessage" class="p-3 bg-err-bg border border-err-border text-err-text rounded-xl text-xs font-semibold flex items-start gap-2">
            <span class="text-sm shrink-0">⚠</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- 6-digit Code Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-n-700 block">6-digit code</label>
            <input
              type="text"
              [ngModel]="otp"
              (ngModelChange)="otpChange.emit($event)"
              maxlength="6"
              placeholder="6-digit code"
              class="w-full px-3.5 py-2.5 bg-n-0 border border-n-300 rounded-xl text-base text-center tracking-widest font-mono text-n-900 min-h-[44px]"
            />
            <p class="text-[11px] text-n-400">Code never auto-submits. Enter the code and set your password below.</p>
          </div>

          <!-- Password -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-n-700 block">New password</label>
              <button
                type="button"
                (click)="toggleShowPassword.emit()"
                class="text-xs font-semibold text-n-500 hover:text-n-900 min-h-[36px] flex items-center cursor-pointer"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <input
              [type]="showPassword ? 'text' : 'password'"
              [ngModel]="password"
              (ngModelChange)="passwordChange.emit($event)"
              placeholder="New password"
              class="w-full px-3.5 py-2.5 bg-n-0 border border-n-300 rounded-xl text-sm text-n-900 min-h-[44px]"
            />
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-n-700 block">Confirm password</label>
            <input
              [type]="showPassword ? 'text' : 'password'"
              [ngModel]="confirmPassword"
              (ngModelChange)="confirmPasswordChange.emit($event)"
              placeholder="Confirm password"
              class="w-full px-3.5 py-2.5 bg-n-0 border border-n-300 rounded-xl text-sm text-n-900 min-h-[44px]"
            />
          </div>

          <!-- Live Password Rules Validation Helper -->
          <div class="p-2.5 bg-n-100 rounded-xl border border-n-200 space-y-1.5 text-xs">
            <div class="text-[11px] font-semibold text-n-500 uppercase tracking-wider">Password requirements:</div>
            <div class="grid grid-cols-2 gap-1 text-[11px]">
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

          <!-- Cooldown & Submit -->
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
              (click)="resendCode.emit()"
              [disabled]="isLoading"
              class="text-xs font-semibold text-brand hover:underline min-h-[44px] flex items-center cursor-pointer"
            >
              Resend code
            </button>

            <button
              type="button"
              (click)="verifyAndCreate.emit()"
              [disabled]="isLoading || !isPasswordFormValid"
              class="px-4 py-2.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-xs rounded-xl min-h-[44px] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg *ngIf="isLoading" class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Creating...' : 'Create Account' }}</span>
            </button>
          </div>
        </div>

        <!-- Login Redirect Link -->
        <div class="text-center pt-2 border-t border-n-200 text-xs text-n-500">
          Already have an account?
          <a routerLink="/auth/login" class="font-semibold text-n-900 hover:underline ml-1">
            Sign In →
          </a>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-2.5 text-center text-[11px] text-n-500 border-t border-n-200 flex flex-col items-center gap-1">
        <div>&copy; 2026 Grih360 Technologies Pvt Ltd. Model Tenancy Act Compliant.</div>
        <div class="flex items-center gap-2 font-medium">
          <a routerLink="/privacy" class="hover:text-brand underline">Privacy Policy</a>
          <span>•</span>
          <a routerLink="/terms" class="hover:text-brand underline">Terms and Conditions</a>
        </div>
      </footer>
    </div>
  `,
})
export class MobileRegisterComponent {
  @Input() step: number = 1;
  @Input() selectedRole: UserRole = 'TENANT';
  @Input() name: string = '';
  @Input() email: string = '';
  @Input() otp: string = '';
  @Input() password: string = '';
  @Input() confirmPassword: string = '';
  @Input() showPassword: boolean = false;
  @Input() acceptTerms: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  @Input() emailAlreadyRegistered: boolean = false;
  @Input() isGoogleLoading: boolean = false;
  @Input() resendCooldown: number = 0;

  @Output() setRole = new EventEmitter<UserRole>();
  @Output() nameChange = new EventEmitter<string>();
  @Output() emailChange = new EventEmitter<string>();
  @Output() otpChange = new EventEmitter<string>();
  @Output() passwordChange = new EventEmitter<string>();
  @Output() confirmPasswordChange = new EventEmitter<string>();
  @Output() toggleShowPassword = new EventEmitter<void>();
  @Output() acceptTermsChange = new EventEmitter<boolean>();
  @Output() requestCode = new EventEmitter<void>();
  @Output() resendCode = new EventEmitter<void>();
  @Output() verifyAndCreate = new EventEmitter<void>();
  @Output() googleSignIn = new EventEmitter<void>();
  @Output() goToLogin = new EventEmitter<void>();
  @Output() changeEmail = new EventEmitter<void>();

  onFormSubmit(e: Event): void {
    e.preventDefault();
    if (this.isStep1Valid) {
      this.requestCode.emit();
    }
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
}
