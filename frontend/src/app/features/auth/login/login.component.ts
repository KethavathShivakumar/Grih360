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

export type AuthStep =
  | 'SIGN_IN'
  | 'ENTER_CODE'
  | 'GOOGLE_NO_PASSWORD'
  | 'ROLE_MISMATCH'
  | 'FORGOT_PASSWORD_RESET';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputRefs!: QueryList<ElementRef<HTMLInputElement>>;

  // Flow State
  currentStep: AuthStep = 'SIGN_IN';
  flowHistory: AuthStep[] = ['SIGN_IN'];

  // Sign-in Mode: 'otp' (default) vs 'password'
  loginMode: 'otp' | 'password' = 'otp';

  // Role: TENANT | OWNER | PROFESSIONAL
  selectedRole: string = 'TENANT';
  mismatchedRole: string = 'TENANT';

  // Input Fields
  email: string = '';
  maskedEmail: string = '';
  password: string = '';
  showPassword: boolean = false;
  newPassword: string = '';
  showNewPassword: boolean = false;

  // OTP State
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpPurpose: 'LOGIN_OTP' | 'FORGOT_PASSWORD' = 'LOGIN_OTP';
  resendCooldown: number = 0;
  private cooldownTimer: any = null;
  remainingAttempts: number = 3;

  // UI State
  isLoading: boolean = false;
  isGoogleLoading: boolean = false;
  errorMessage: string = '';
  noAccountFound: boolean = false;

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
    // Check saved sign-in mode (remembered on device, only the choice, never secrets)
    try {
      const savedMode = localStorage.getItem('grih360_login_mode');
      if (savedMode === 'otp' || savedMode === 'password') {
        this.loginMode = savedMode;
      }
    } catch (_) {}

    // Check query params for role and email prefill
    this.route.queryParams.subscribe((params) => {
      if (params['role']) {
        const r = params['role'].toUpperCase();
        if (['TENANT', 'OWNER', 'PROFESSIONAL'].includes(r)) {
          this.selectedRole = r;
        }
      }
      if (params['email']) {
        this.email = params['email'].trim().toLowerCase();
      }
    });

    // Restore flow state if reopening app
    this.restoreFlowState();

    // Register Android Back Button Listener via Capacitor App
    if (typeof window !== 'undefined') {
      try {
        App.addListener('backButton', () => {
          this.handleBackNavigation();
        }).then((handle) => {
          this.backButtonListener = handle;
        }).catch(() => {});
      } catch (_) {}
    }
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
        currentStep: this.currentStep,
        flowHistory: this.flowHistory,
        email: this.email,
        maskedEmail: this.maskedEmail,
        selectedRole: this.selectedRole,
        loginMode: this.loginMode,
        otpPurpose: this.otpPurpose,
        savedOtpCode: this.otpDigits.join(''),
        cooldownUntil: this.resendCooldown > 0 ? Date.now() + this.resendCooldown * 1000 : null,
      };
      localStorage.setItem('grih360_auth_flow', JSON.stringify(state));
    } catch (_) {}
  }

  private restoreFlowState(): void {
    try {
      const saved = localStorage.getItem('grih360_auth_flow');
      if (saved) {
        const data = JSON.parse(saved);
        const validSteps: AuthStep[] = ['ENTER_CODE', 'GOOGLE_NO_PASSWORD', 'ROLE_MISMATCH', 'FORGOT_PASSWORD_RESET'];
        if (data && validSteps.includes(data.currentStep) && data.email) {
          this.currentStep = data.currentStep;
          this.flowHistory = data.flowHistory && data.flowHistory.length ? data.flowHistory : ['SIGN_IN', data.currentStep];
          this.email = data.email || '';
          this.maskedEmail = data.maskedEmail || '';
          this.selectedRole = data.selectedRole || 'TENANT';
          this.loginMode = data.loginMode || 'otp';
          this.otpPurpose = data.otpPurpose || 'LOGIN_OTP';

          if (data.savedOtpCode && typeof data.savedOtpCode === 'string' && data.savedOtpCode.length === 6) {
            this.otpDigits = data.savedOtpCode.split('');
          }

          if (this.currentStep === 'FORGOT_PASSWORD_RESET' && !this.isOtpComplete) {
            this.currentStep = 'ENTER_CODE';
            this.flowHistory = ['SIGN_IN', 'ENTER_CODE'];
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
      localStorage.removeItem('grih360_auth_flow');
    } catch (_) {}
  }

  goToStep(step: AuthStep): void {
    this.flowHistory.push(step);
    this.currentStep = step;
    this.errorMessage = '';
    this.persistFlowState();
  }

  handleBackNavigation(): void {
    if (this.flowHistory.length > 1) {
      this.flowHistory.pop();
      this.currentStep = this.flowHistory[this.flowHistory.length - 1];
      this.errorMessage = '';
      this.persistFlowState();
    } else {
      this.currentStep = 'SIGN_IN';
      this.flowHistory = ['SIGN_IN'];
      this.clearFlowState();
    }
  }

  goToSignIn(): void {
    this.currentStep = 'SIGN_IN';
    this.flowHistory = ['SIGN_IN'];
    this.errorMessage = '';
    this.noAccountFound = false;
    this.persistFlowState();
  }

  changeEmail(): void {
    this.currentStep = 'SIGN_IN';
    this.flowHistory = ['SIGN_IN'];
    this.errorMessage = '';
    this.noAccountFound = false;
    this.otpDigits = ['', '', '', '', '', ''];
    this.password = '';
    this.newPassword = '';
    this.persistFlowState();
  }

  goToRegisterWithPrefill(): void {
    this.router.navigate(['/register'], {
      queryParams: {
        email: this.email,
        role: this.selectedRole,
      },
    });
  }

  // --- Segmented Role Toggle & Mode Switching ---

  onSelectRole(role: string): void {
    this.selectedRole = role;
    this.errorMessage = '';
    this.noAccountFound = false;
    this.persistFlowState();
  }

  setLoginMode(mode: 'otp' | 'password'): void {
    this.loginMode = mode;
    this.errorMessage = '';
    this.noAccountFound = false;
    try {
      localStorage.setItem('grih360_login_mode', mode);
    } catch (_) {}
    this.persistFlowState();
  }

  switchToPasswordMode(): void {
    this.setLoginMode('password');
    this.goToStep('SIGN_IN');
  }

  get isEmailValid(): boolean {
    const clean = (this.email || '').trim().toLowerCase();
    return clean.length >= 5 && clean.includes('@') && clean.includes('.');
  }

  get isMainButtonDisabled(): boolean {
    if (this.isLoading) return true;
    if (!this.isEmailValid) return true;
    if (this.loginMode === 'password' && !this.password) return true;
    return false;
  }

  get mainButtonLabel(): string {
    if (this.isLoading) {
      return this.loginMode === 'otp' ? 'Sending code...' : 'Signing in...';
    }
    return this.loginMode === 'otp' ? 'Continue with OTP' : 'Sign in';
  }

  onSubmitSignForm(): void {
    if (this.isMainButtonDisabled) return;

    if (this.loginMode === 'otp') {
      this.onContinueWithOtp();
    } else {
      this.onLoginWithPassword();
    }
  }

  // --- Action: Continue with OTP ---

  onContinueWithOtp(): void {
    const cleanEmail = (this.email || '').trim().toLowerCase();
    this.isLoading = true;
    this.errorMessage = '';
    this.noAccountFound = false;

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
          this.maskedEmail = info.emailMasked || this.maskEmail(cleanEmail);

          if (!info.exists) {
            // Unregistered email -> show friendly callout with Register button
            this.noAccountFound = true;
            this.errorMessage = 'No account found for this email.';
            return;
          }

          // Existing user -> send login OTP
          this.sendLoginOtp(cleanEmail);
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Unable to verify email address. Please try again.');
        },
      });
  }

  private sendLoginOtp(cleanEmail: string): void {
    this.isLoading = true;
    this.authService
      .requestLoginOtp(cleanEmail)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.otpPurpose = 'LOGIN_OTP';
          this.maskedEmail = res?.data?.emailMasked || res?.emailMasked || this.maskEmail(cleanEmail);
          this.startResendCooldown(60);
          this.otpDigits = ['', '', '', '', '', ''];
          this.goToStep('ENTER_CODE');
          setTimeout(() => this.focusFirstOtpBox(), 100);
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Unable to send login verification code. Please try again.');
        },
      });
  }

  triggerOtpLoginForEmail(): void {
    this.onContinueWithOtp();
  }

  // --- Action: Sign In with Password ---

  onLoginWithPassword(): void {
    const cleanEmail = (this.email || '').trim().toLowerCase();
    if (!cleanEmail || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.noAccountFound = false;

    this.authService
      .login(cleanEmail, this.password, this.selectedRole)
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
          const errCode = err?.error?.code;
          const errMsg = getCleanErrorMessage(err, 'Incorrect password. Please try again or use OTP.');

          if (
            err.status === 404 ||
            errCode === 'USER_NOT_FOUND' ||
            errCode === 'ACCOUNT_NOT_FOUND' ||
            errMsg.toLowerCase().includes('no account found') ||
            errMsg.toLowerCase().includes('user not found')
          ) {
            this.noAccountFound = true;
            this.errorMessage = 'No account found for this email.';
          } else if (errCode === 'NO_PASSWORD_SET' || errMsg.toLowerCase().includes('google') || errMsg.toLowerCase().includes('no password')) {
            this.goToStep('GOOGLE_NO_PASSWORD');
          } else if (errCode === 'ROLE_MISMATCH' || errMsg.toLowerCase().includes('workspace') || errMsg.toLowerCase().includes('role mismatch')) {
            const match = errMsg.match(/(TENANT|OWNER|PROFESSIONAL|ADMIN)/i);
            this.mismatchedRole = match ? match[1].toUpperCase() : (this.selectedRole === 'TENANT' ? 'OWNER' : 'TENANT');
            this.goToStep('ROLE_MISMATCH');
          } else {
            this.errorMessage = errMsg;
          }
        },
      });
  }

  // --- Action: Forgot Password ---

  onForgotPasswordClick(): void {
    const cleanEmail = (this.email || '').trim().toLowerCase();
    if (!this.isEmailValid) {
      this.errorMessage = 'Please enter your email address to reset password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.noAccountFound = false;

    this.authService
      .sendForgotPasswordOtp(cleanEmail)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.otpPurpose = 'FORGOT_PASSWORD';
          this.maskedEmail = res?.data?.emailMasked || res?.emailMasked || this.maskEmail(cleanEmail);
          this.startResendCooldown(60);
          this.otpDigits = ['', '', '', '', '', ''];
          this.goToStep('ENTER_CODE');
          setTimeout(() => this.focusFirstOtpBox(), 100);
        },
        error: (err: any) => {
          const errMsg = getCleanErrorMessage(err, 'Unable to initiate password reset.');
          if (err.status === 404 || errMsg.toLowerCase().includes('not found')) {
            this.noAccountFound = true;
            this.errorMessage = 'No account found for this email.';
          } else {
            this.errorMessage = errMsg;
          }
        },
      });
  }

  // --- OTP Verification Logic ---

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
      this.focusOtpBox(index + 1);
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        this.focusOtpBox(index - 1);
        this.otpDigits[index - 1] = '';
        this.persistFlowState();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusOtpBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focusOtpBox(index + 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipData = event.clipboardData?.getData('text') || '';
    const digits = clipData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = digits[i] || '';
      }
      this.errorMessage = '';
      const nextFocus = Math.min(digits.length, 5);
      this.focusOtpBox(nextFocus);
    }
  }

  private focusFirstOtpBox(): void {
    this.focusOtpBox(0);
  }

  private focusOtpBox(index: number): void {
    if (this.otpInputRefs && this.otpInputRefs.length > index) {
      const target = this.otpInputRefs.get(index);
      if (target && target.nativeElement) {
        target.nativeElement.focus();
        target.nativeElement.select();
      }
    }
  }

  get isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d.length === 1 && /^\d$/.test(d));
  }

  onVerifyOtp(): void {
    if (!this.isOtpComplete) return;

    const otpCode = this.otpDigits.join('');
    this.isLoading = true;
    this.errorMessage = '';

    if (this.otpPurpose === 'LOGIN_OTP') {
      this.authService
        .verifyLoginOtpDirect(this.email, otpCode, this.selectedRole)
        .pipe(
          timeout(15000),
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
            const errCode = err?.error?.code;
            const errMsg = getCleanErrorMessage(err, 'Incorrect or expired verification code. Please try again.');

            if (errCode === 'ROLE_MISMATCH' || errMsg.toLowerCase().includes('workspace') || errMsg.toLowerCase().includes('role mismatch')) {
              const match = errMsg.match(/(TENANT|OWNER|PROFESSIONAL|ADMIN)/i);
              this.mismatchedRole = match ? match[1].toUpperCase() : (this.selectedRole === 'TENANT' ? 'OWNER' : 'TENANT');
              this.goToStep('ROLE_MISMATCH');
            } else {
              this.remainingAttempts = err?.error?.remainingAttempts ?? this.remainingAttempts;
              this.errorMessage = errMsg;
            }
          },
        });
    } else if (this.otpPurpose === 'FORGOT_PASSWORD') {
      this.isLoading = false;
      this.persistFlowState();
      this.goToStep('FORGOT_PASSWORD_RESET');
    }
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;

    this.isLoading = true;
    this.errorMessage = '';

    if (this.otpPurpose === 'LOGIN_OTP') {
      this.authService
        .requestLoginOtp(this.email)
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
    } else if (this.otpPurpose === 'FORGOT_PASSWORD') {
      this.authService
        .sendForgotPasswordOtp(this.email)
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
  }

  // --- Password Rules & Reset ---

  hasNumber(val: string): boolean {
    return /\d/.test(val || '');
  }

  hasLetter(val: string): boolean {
    return /[a-zA-Z]/.test(val || '');
  }

  get isPasswordValid(): boolean {
    return (this.newPassword || '').length >= 8 && this.hasNumber(this.newPassword) && this.hasLetter(this.newPassword);
  }

  onResetPasswordSubmit(): void {
    if (!this.isPasswordValid) {
      this.errorMessage = 'Password must be at least 8 characters with 1 letter and 1 number.';
      return;
    }

    const otpCode = this.otpDigits.join('');
    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .resetPasswordWithOtp(this.email, otpCode, this.newPassword)
      .pipe(
        timeout(20000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.clearFlowState();
          this.authService
            .login(this.email, this.newPassword, this.selectedRole)
            .subscribe({
              next: (res: any) => {
                const user = res?.data?.user || res?.user;
                this.navigateByRole(user?.role || this.selectedRole);
              },
              error: () => {
                this.goToSignIn();
              },
            });
        },
        error: (err: any) => {
          this.errorMessage = getCleanErrorMessage(err, 'Unable to reset password. Please verify the code and try again.');
        },
      });
  }

  // --- Role Mismatch Actions ---

  switchPortalAndProceed(): void {
    this.selectedRole = this.mismatchedRole;
    this.currentStep = 'SIGN_IN';
    this.flowHistory = ['SIGN_IN'];
    this.errorMessage = '';
    this.noAccountFound = false;
    this.persistFlowState();
  }

  // --- Google Sign-in Handler ---

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

  // --- Utility Helpers ---

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
