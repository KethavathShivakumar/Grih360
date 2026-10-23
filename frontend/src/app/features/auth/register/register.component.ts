import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { IsMobileService } from '../../../core/services/is-mobile.service';
import { getCleanErrorMessage } from '../../../core/utils/error-sanitizer.util';
import { App } from '@capacitor/app';
import { finalize, timeout, Subscription } from 'rxjs';

export type RegisterStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputRefs!: QueryList<ElementRef<HTMLInputElement>>;

  // Step 1 = Account Type, 2 = Email/Google, 3 = Verify Code, 4 = Password
  step: RegisterStep = 1;
  flowHistory: RegisterStep[] = [1];

  // User input & role
  selectedRole: string = 'TENANT';
  email: string = '';
  maskedEmail: string = '';
  emailAlreadyRegistered: boolean = false;

  // Step 3 OTP state
  otpDigits: string[] = ['', '', '', '', '', ''];
  registrationToken: string = '';
  resendCooldown: number = 0;
  private cooldownTimer: any = null;
  remainingAttempts: number = 3;

  // Step 4 Password state
  newPassword: string = '';
  showNewPassword: boolean = false;

  // UI state
  isLoading: boolean = false;
  isGoogleLoading: boolean = false;
  errorMessage: string = '';

  private subscriptions: Subscription = new Subscription();
  private backButtonListener: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public isMobile: IsMobileService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit(): void {
    // 1. Check query parameters
    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const r = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(r)) {
          this.selectedRole = r;
          this.step = 2;
          this.flowHistory = [1, 2];
        }
      }
      if (params['email']) {
        this.email = params['email'].trim().toLowerCase();
        if (this.step < 2) {
          this.step = 2;
          this.flowHistory = [1, 2];
        }
      }
    });

    // 2. Restore persisted state if on same session and no query override
    if (this.step === 1 && !this.email) {
      this.restoreFlowState();
    }

    // 3. Android Back Button handling (Capacitor)
    try {
      App.addListener('backButton', () => {
        this.handleBackNavigation();
      }).then((listener) => {
        this.backButtonListener = listener;
      });
    } catch (_) {}
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    if (this.backButtonListener && typeof this.backButtonListener.remove === 'function') {
      this.backButtonListener.remove();
    }
    this.subscriptions.unsubscribe();
  }

  // --- Flow & State Management ---

  private persistFlowState(): void {
    try {
      const state = {
        step: this.step,
        flowHistory: this.flowHistory,
        email: this.email,
        maskedEmail: this.maskedEmail,
        selectedRole: this.selectedRole,
        registrationToken: this.registrationToken,
        savedOtpCode: this.otpDigits.join(''),
        cooldownUntil: this.resendCooldown > 0 ? Date.now() + this.resendCooldown * 1000 : null,
      };
      localStorage.setItem('grih360_register_flow', JSON.stringify(state));
    } catch (_) {}
  }

  private restoreFlowState(): void {
    try {
      const saved = localStorage.getItem('grih360_register_flow');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.step && data.step >= 1 && data.step <= 4) {
          this.step = data.step;
          this.flowHistory = data.flowHistory && data.flowHistory.length ? data.flowHistory : [1, this.step];
          this.email = data.email || '';
          this.maskedEmail = data.maskedEmail || '';
          this.selectedRole = data.selectedRole || 'TENANT';
          this.registrationToken = data.registrationToken || '';

          if (data.savedOtpCode && typeof data.savedOtpCode === 'string' && data.savedOtpCode.length === 6) {
            this.otpDigits = data.savedOtpCode.split('');
          }

          if (this.step === 4 && !this.registrationToken) {
            this.step = 3;
            this.flowHistory = [1, 2, 3];
          }

          if (data.cooldownUntil) {
            const diff = Math.ceil((data.cooldownUntil - Date.now()) / 1000);
            if (diff > 0) {
              this.startResendCooldown(diff);
            }
          }
        }
      }
    } catch (_) {}
  }

  private clearFlowState(): void {
    try {
      localStorage.removeItem('grih360_register_flow');
    } catch (_) {}
  }

  goToStep(newStep: RegisterStep): void {
    this.flowHistory.push(newStep);
    this.step = newStep;
    this.errorMessage = '';
    this.emailAlreadyRegistered = false;
    this.persistFlowState();
  }

  handleBackNavigation(): void {
    if (this.flowHistory.length > 1) {
      this.flowHistory.pop();
      this.step = this.flowHistory[this.flowHistory.length - 1];
      this.errorMessage = '';
      this.emailAlreadyRegistered = false;
      this.persistFlowState();
    } else if (this.step > 1) {
      this.step = (this.step - 1) as RegisterStep;
      this.flowHistory = [1, this.step];
      this.errorMessage = '';
      this.emailAlreadyRegistered = false;
      this.persistFlowState();
    } else {
      this.router.navigate(['/login']);
    }
  }

  changeEmail(): void {
    this.step = 2;
    this.flowHistory = [1, 2];
    this.errorMessage = '';
    this.emailAlreadyRegistered = false;
    this.otpDigits = ['', '', '', '', '', ''];
    this.newPassword = '';
    this.registrationToken = '';
    this.persistFlowState();
  }

  // --- Step 1: Account Type Selection ---

  selectAccountType(role: string): void {
    this.selectedRole = role;
    this.goToStep(2);
  }

  // --- Step 2: Email & Google Entry ---

  get isEmailValid(): boolean {
    const clean = (this.email || '').trim().toLowerCase();
    return clean.length >= 5 && clean.includes('@') && clean.includes('.');
  }

  onSubmitEmailStep(): void {
    if (!this.isEmailValid || this.isLoading) return;

    const cleanEmail = (this.email || '').trim().toLowerCase();
    this.isLoading = true;
    this.errorMessage = '';
    this.emailAlreadyRegistered = false;

    this.authService
      .checkEmail(cleanEmail)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (checkRes: any) => {
          const info = checkRes?.data || checkRes;
          this.email = cleanEmail;

          if (info.exists) {
            this.emailAlreadyRegistered = true;
            this.errorMessage = 'This email is already registered.';
            return;
          }

          // Email is new -> request registration OTP
          this.sendRegistrationOtp(cleanEmail);
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Unable to verify email address. Please try again.');
        },
      });
  }

  private sendRegistrationOtp(cleanEmail: string): void {
    this.isLoading = true;
    this.authService
      .requestRegistrationOtp({ email: cleanEmail, role: this.selectedRole })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.maskedEmail = res?.data?.emailMasked || res?.emailMasked || this.maskEmail(cleanEmail);
          this.startResendCooldown(60);
          this.otpDigits = ['', '', '', '', '', ''];
          this.goToStep(3);
          setTimeout(() => this.focusFirstOtpBox(), 100);
        },
        error: (err: any) => {
          if (err.status === 409 || err?.error?.code === 'EMAIL_ALREADY_REGISTERED') {
            this.emailAlreadyRegistered = true;
            this.errorMessage = 'This email is already registered.';
          } else {
            this.errorMessage = getCleanErrorMessage(err, 'Unable to send verification code. Please try again.');
          }
        },
      });
  }

  goToLoginWithPrefill(): void {
    this.router.navigate(['/login'], {
      queryParams: {
        email: this.email,
        role: this.selectedRole,
      },
    });
  }

  // --- Step 3: OTP Code Card ---

  get isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d.length === 1 && /^\d$/.test(d));
  }

  onOtpDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;

    if (val && !/^\d$/.test(val)) {
      val = val.replace(/\D/g, '').slice(-1);
      input.value = val;
    }
    this.otpDigits[index] = val;
    this.errorMessage = '';
    this.persistFlowState();

    if (val && index < 5) {
      const nextInput = this.otpInputRefs?.toArray()[index + 1]?.nativeElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = this.otpInputRefs?.toArray()[index - 1]?.nativeElement;
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
        this.persistFlowState();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').trim();
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = digits[i] || '';
    }
    this.persistFlowState();

    const focusIndex = Math.min(digits.length, 5);
    const targetInput = this.otpInputRefs?.toArray()[focusIndex]?.nativeElement;
    if (targetInput) targetInput.focus();
  }

  private focusFirstOtpBox(): void {
    const first = this.otpInputRefs?.first?.nativeElement;
    if (first) first.focus();
  }

  onVerifyOtp(): void {
    if (this.registrationToken) {
      this.goToStep(4);
      return;
    }

    if (!this.isOtpComplete || this.isLoading) return;

    const otpCode = this.otpDigits.join('');
    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyRegistrationOtpCode(this.email, otpCode, this.selectedRole)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.registrationToken = res?.data?.registrationToken || res?.registrationToken || '';
          this.persistFlowState();
          this.goToStep(4);
        },
        error: (err: any) => {
          this.remainingAttempts = err?.error?.remainingAttempts ?? this.remainingAttempts;
          this.errorMessage = getCleanErrorMessage(err, 'Incorrect verification code. Please try again.');
        },
      });
  }

  resendCode(): void {
    if (this.resendCooldown > 0 || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.registrationToken = '';
    this.persistFlowState();

    this.authService
      .requestRegistrationOtp({ email: this.email, role: this.selectedRole })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.startResendCooldown(60);
          this.otpDigits = ['', '', '', '', '', ''];
          this.focusFirstOtpBox();
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Unable to resend verification code.');
        },
      });
  }

  // --- Step 4: Create Password ---

  hasNumber(val: string): boolean {
    return /\d/.test(val || '');
  }

  hasLetter(val: string): boolean {
    return /[a-zA-Z]/.test(val || '');
  }

  get isPasswordValid(): boolean {
    return (this.newPassword || '').length >= 8 && this.hasNumber(this.newPassword) && this.hasLetter(this.newPassword);
  }

  onCompleteAccountCreation(): void {
    if (!this.isPasswordValid) {
      this.errorMessage = 'Password must be at least 8 characters with 1 letter and 1 number.';
      return;
    }

    if (!this.registrationToken) {
      this.errorMessage = 'Registration session expired. Please verify your email again.';
      this.goToStep(3);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyRegistrationOtpAndCreate({
        registrationToken: this.registrationToken,
        email: this.email,
        password: this.newPassword,
        role: this.selectedRole,
      })
      .pipe(
        timeout(20000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.clearFlowState();
          this.navigateByRole(this.selectedRole);
        },
        error: (err: any) => {
          const errMsg = getCleanErrorMessage(err, 'Unable to complete account registration. Please try again.');
          const errCode = err?.error?.code;
          if (
            errCode === 'SESSION_EXPIRED' ||
            errCode === 'REGISTRATION_SESSION_EXPIRED' ||
            errCode === 'INVALID_TOKEN' ||
            errMsg.toLowerCase().includes('expired') ||
            errMsg.toLowerCase().includes('session')
          ) {
            this.registrationToken = '';
            this.persistFlowState();
            this.errorMessage = 'Registration session expired. Please verify your email again.';
            this.goToStep(3);
          } else {
            this.errorMessage = errMsg;
          }
        },
      });
  }

  // --- Google OAuth Sign In ---

  onGoogleSignIn(): void {
    if (!this.googleAuthService.isAvailable()) {
      this.errorMessage = 'Google sign-in is currently unavailable.';
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
          this.errorMessage = 'Google sign-in could not be completed.';
        });
    } else {
      this.googleAuthService
        .initializeGsi((idToken: string) => {
          this.handleGoogleCredential(idToken);
        })
        .then(() => {
          this.isGoogleLoading = false;
          this.googleAuthService.prompt();
        })
        .catch(() => {
          this.isGoogleLoading = false;
          this.errorMessage = 'Unable to open Google sign-in window.';
        });
    }
  }

  private handleGoogleCredential(idToken: string): void {
    this.isLoading = true;
    this.authService
      .loginWithGoogle(idToken, this.selectedRole)
      .pipe(
        timeout(20000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.clearFlowState();
          const user = res?.data?.user || res?.user;
          this.navigateByRole(user?.role || this.selectedRole);
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Google authentication failed.';
        },
      });
  }

  // --- Helpers ---

  private startResendCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownTimer);
        this.resendCooldown = 0;
      }
    }, 1000);
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  maskEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 1) return `${name}***@${domain}`;
    return `${name.charAt(0)}***@${domain}`;
  }

  getRoleName(role: string): string {
    if (role === 'OWNER') return 'Owner';
    if (role === 'PROFESSIONAL') return 'Service professional';
    if (role === 'ADMIN') return 'Admin';
    return 'Tenant';
  }

  navigateByRole(role: string): void {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'OWNER') {
      this.router.navigate(['/owner/dashboard']);
    } else if (role === 'PROFESSIONAL') {
      this.router.navigate(['/professional/dashboard']);
    } else {
      this.router.navigate(['/tenant/dashboard']);
    }
  }
}
