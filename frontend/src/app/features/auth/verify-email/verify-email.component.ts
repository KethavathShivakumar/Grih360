import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-verify-email',
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

          <button
            (click)="onBackToLogin()"
            type="button"
            class="text-xs font-bold text-slate-500 hover:text-[#0F2937] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>← Back to Login</span>
          </button>
        </div>
      </header>

      <!-- Centered Verification Card -->
      <main class="flex-grow flex items-center justify-center p-4 sm:p-6 my-auto">
        <div class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#E8E6DF] space-y-6">
          
          <!-- Step Progress Indicator -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider">
              <span class="text-emerald-700 flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">✓</span>
                Credentials Accepted
              </span>
              <span class="text-[#2D7A5E] flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-full bg-[#2D7A5E] text-white flex items-center justify-center text-[10px] font-black">2</span>
                Email OTP Verification
              </span>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-[#2D7A5E] h-full w-full rounded-full transition-all duration-500"></div>
            </div>
          </div>

          <!-- Corporate Badge & Instruction Header -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center space-x-2 bg-emerald-50 text-[#2D7A5E] px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
              <span>🔒 Two-Step Identity Verification</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">
              Verify Your Identity
            </h1>
            <p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We've dispatched a single-use 6-digit security code to your registered email address:
            </p>
            <div class="pt-1 flex flex-col items-center gap-1.5">
              <span class="inline-block px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-[#0F2937] tracking-wide font-mono">
                {{ maskedEmail }}
              </span>
              <span class="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <span>{{ getRoleIcon() }}</span>
                <span>Unlocking {{ getRoleDisplayName() }}</span>
              </span>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
            <span class="text-base shrink-0">⚠️</span>
            <div class="flex-1">
              <span>{{ errorMessage }}</span>
              <span *ngIf="remainingAttempts !== null && remainingAttempts > 0" class="block mt-0.5 text-rose-600 font-bold">
                ({{ remainingAttempts }} attempt{{ remainingAttempts === 1 ? '' : 's' }} left)
              </span>
            </div>
          </div>

          <!-- Success Alert Banner -->
          <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-[#2D7A5E] rounded-xl text-xs font-semibold flex items-start gap-2">
            <span class="text-base shrink-0">✅</span>
            <span>{{ successMessage }}</span>
          </div>

          <!-- 6-Digit OTP Form with Single Native Input & 6 Rendered Visual Boxes -->
          <form (ngSubmit)="onVerifySubmit()" class="space-y-6">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 block">
                  Enter 6-Digit Security Code <span class="text-rose-500">*</span>
                </label>
                <span class="text-[11px] font-semibold text-slate-400">
                  ⏱️ Code expires in {{ formatExpiryTime() }}
                </span>
              </div>

              <!-- Single Native Input Overlay + 6 Visual Boxes -->
              <div class="relative w-full cursor-text" (click)="focusInput()">
                <!-- Single hidden transparent native input capturing all keyboard, paste, and mobile numeric input -->
                <input
                  #otpInput
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  autocomplete="one-time-code"
                  maxlength="6"
                  [value]="otpCode"
                  (input)="onOtpInput($event)"
                  (keydown)="onOtpKeyDown($event)"
                  (paste)="onOtpPaste($event)"
                  (focus)="isInputFocused = true"
                  (blur)="isInputFocused = false"
                  class="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text pointer-events-auto select-none"
                  aria-label="6-Digit Security Code"
                />

                <!-- 6 Rendered Visual Boxes -->
                <div class="flex items-center justify-between gap-2 sm:gap-2.5 pointer-events-none relative z-10">
                  <div
                    *ngFor="let slot of [0, 1, 2, 3, 4, 5]"
                    class="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center text-center text-2xl font-black rounded-2xl border transition-all bg-white"
                    [ngClass]="{
                      'border-[#2D7A5E] ring-2 ring-[#2D7A5E]/20 bg-emerald-50/30 text-[#0F2937] shadow-xs': getSlotDigit(slot),
                      'border-[#2D7A5E] ring-2 ring-[#2D7A5E]/40 bg-white text-[#0F2937] shadow-xs': isSlotActive(slot),
                      'border-slate-300 bg-slate-50 text-slate-900': !getSlotDigit(slot) && !isSlotActive(slot),
                      'border-rose-300 bg-rose-50/30': errorMessage && !getSlotDigit(slot)
                    }"
                  >
                    <span *ngIf="getSlotDigit(slot)">{{ getSlotDigit(slot) }}</span>
                    <!-- Blinking Caret Indicator for Active Slot -->
                    <span
                      *ngIf="isSlotActive(slot) && !getSlotDigit(slot)"
                      class="inline-block w-0.5 h-6 bg-[#2D7A5E] animate-pulse"
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Primary Submit Button -->
            <button
              type="submit"
              [disabled]="!isCodeComplete || isLoading || isLockedOut"
              class="w-full py-3.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Verifying Code...' : 'Verify Code' }}</span>
            </button>
          </form>

          <!-- Secondary Actions & Cooldown Ticker -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">Didn't receive the email?</span>
              <button
                type="button"
                (click)="onResendCode()"
                [disabled]="resendCooldown > 0 || isResending || isLockedOut"
                class="font-bold text-[#2D7A5E] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                <span *ngIf="resendCooldown > 0">Resend Code ({{ resendCooldown }}s)</span>
                <span *ngIf="resendCooldown <= 0">{{ isResending ? 'Sending...' : 'Resend Code ↻' }}</span>
              </button>
            </div>

            <div class="text-center pt-2">
              <button
                (click)="onBackToLogin()"
                type="button"
                class="text-xs font-bold text-slate-500 hover:text-[#0F2937] transition-colors cursor-pointer"
              >
                Change account / Back to login
              </button>
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
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.4s ease-in-out;
    }
  `],
})
export class VerifyEmailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('otpInput') otpInputElement?: ElementRef<HTMLInputElement>;

  challengeId: string = '';
  maskedEmail: string = '';
  selectedRole: string = 'TENANT';

  otpCode: string = '';
  isInputFocused: boolean = false;

  isLoading: boolean = false;
  isResending: boolean = false;
  isLockedOut: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  remainingAttempts: number | null = null;

  // 60-second Resend Cooldown Counter
  resendCooldown: number = 60;
  private cooldownInterval: any = null;

  // 5-minute (300 seconds) Code Expiry Counter
  expirySeconds: number = 300;
  private expiryInterval: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const navState = navigation?.extras?.state || (history.state as any);
    const activeChallenge = this.authService.getActiveChallenge();

    this.challengeId = navState?.challengeId || activeChallenge?.challengeId || '';
    this.maskedEmail = navState?.maskedEmail || activeChallenge?.maskedEmail || '';
    this.selectedRole = navState?.selectedRole || activeChallenge?.selectedRole || 'TENANT';

    if (!this.challengeId) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return;
    }

    this.startResendCooldown(60);
    this.startExpiryTimer(300);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.focusInput();
    }, 200);
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  private clearIntervals(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
  }

  private startResendCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }

  private startExpiryTimer(seconds: number): void {
    this.expirySeconds = seconds;
    if (this.expiryInterval) clearInterval(this.expiryInterval);
    this.expiryInterval = setInterval(() => {
      if (this.expirySeconds > 0) {
        this.expirySeconds--;
      } else {
        clearInterval(this.expiryInterval);
        this.expiryInterval = null;
        this.errorMessage = 'Verification code has expired. Please request a new code.';
      }
    }, 1000);
  }

  formatExpiryTime(): string {
    const minutes = Math.floor(this.expirySeconds / 60);
    const seconds = this.expirySeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  get isCodeComplete(): boolean {
    return this.otpCode.length === 6 && /^\d{6}$/.test(this.otpCode);
  }

  get code(): string {
    return this.otpCode;
  }

  getSlotDigit(slot: number): string {
    return this.otpCode[slot] || '';
  }

  isSlotActive(slot: number): boolean {
    if (!this.isInputFocused) return false;
    const activeIndex = Math.min(this.otpCode.length, 5);
    return slot === activeIndex;
  }

  focusInput(slot?: number): void {
    if (this.otpInputElement?.nativeElement) {
      this.otpInputElement.nativeElement.focus();
    }
  }

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value || '';
    const cleaned = rawValue.replace(/\D/g, '').slice(0, 6);

    this.otpCode = cleaned;
    this.errorMessage = '';

    // Only update DOM input.value if it differs from cleaned (e.g. non-digits or overflow entered)
    // Avoids mutating DOM input.value on normal keystrokes which prevents character duplication
    if (input.value !== cleaned) {
      input.value = cleaned;
    }

    if (this.isCodeComplete && !this.isLoading) {
      this.onVerifySubmit();
    }
  }

  onOtpKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    // Block non-digit keys
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const cleaned = pastedText.replace(/\D/g, '').slice(0, 6);
    this.otpCode = cleaned;
    if (this.otpInputElement?.nativeElement) {
      this.otpInputElement.nativeElement.value = cleaned;
    }
    this.errorMessage = '';

    if (this.isCodeComplete && !this.isLoading) {
      this.onVerifySubmit();
    }
  }

  clearOtpInputs(): void {
    this.otpCode = '';
    if (this.otpInputElement?.nativeElement) {
      this.otpInputElement.nativeElement.value = '';
    }
    this.focusInput();
  }

  onVerifySubmit(): void {
    if (!this.isCodeComplete || this.isLoading || this.isLockedOut) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const enteredCode = this.code;

    this.authService
      .verifyLoginOtp(this.challengeId, enteredCode)
      .pipe(
        timeout(25000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.successMessage = 'Verification successful! Redirecting to workspace...';
          const userRole = res?.data?.user?.role || this.selectedRole;

          setTimeout(() => {
            if (userRole === 'OWNER') {
              this.router.navigate(['/owner/dashboard']);
            } else if (userRole === 'PROFESSIONAL') {
              this.router.navigate(['/professional/dashboard']);
            } else if (userRole === 'ADMIN') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/tenant/dashboard']);
            }
          }, 600);
        },
        error: (err: any) => {
          if (err.name === 'TimeoutError') {
            this.errorMessage = 'Verification timed out. Please check your connection and retry.';
            return;
          }

          const status = err?.status;
          const errorBody = err?.error;
          const msg = errorBody?.message || 'Invalid verification code. Please try again.';

          if (errorBody?.remainingAttempts !== undefined) {
            this.remainingAttempts = errorBody.remainingAttempts;
          }

          if (status === 401 && (msg.includes('Too many') || errorBody?.remainingAttempts === 0)) {
            this.isLockedOut = true;
            this.errorMessage = 'Too many failed attempts. In accordance with security protocols, please sign in again.';
            setTimeout(() => {
              this.onBackToLogin();
            }, 2500);
            return;
          }

          if (status === 400 && msg.includes('expired')) {
            this.errorMessage = 'Verification code has expired. Please request a new code.';
            return;
          }

          this.errorMessage = msg;
          this.clearOtpInputs();
        },
      });
  }

  onResendCode(): void {
    if (this.resendCooldown > 0 || this.isResending || this.isLockedOut) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .resendLoginOtp(this.challengeId)
      .pipe(
        timeout(25000),
        finalize(() => {
          this.isResending = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.successMessage = 'New verification code has been dispatched to your email.';
          this.clearOtpInputs();
          this.remainingAttempts = null;
          this.startResendCooldown(res?.data?.cooldownSeconds || 60);
          this.startExpiryTimer(res?.data?.expiresInSeconds || 300);
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err: any) => {
          if (err.status === 429) {
            const remaining = err?.error?.remainingSeconds || 60;
            this.startResendCooldown(remaining);
            this.errorMessage = err?.error?.message || `Please wait ${remaining}s before requesting a new code.`;
          } else {
            this.errorMessage = err?.error?.message || 'Failed to resend verification code. Please try again.';
          }
        },
      });
  }

  onBackToLogin(): void {
    this.authService.clearActiveChallenge();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  getRoleIcon(): string {
    switch (this.selectedRole) {
      case 'OWNER': return '🏛️';
      case 'PROFESSIONAL': return '🛠️';
      default: return '🏡';
    }
  }

  getRoleDisplayName(): string {
    switch (this.selectedRole) {
      case 'OWNER': return 'Property Owner Workspace';
      case 'PROFESSIONAL': return 'Service Professional Workspace';
      default: return 'Tenant Portal';
    }
  }
}
