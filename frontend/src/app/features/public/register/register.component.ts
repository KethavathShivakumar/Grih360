import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800">
      <!-- Header -->
      <header class="w-full bg-white/95 backdrop-blur-md border-b border-[#E8E6DF] py-3.5 px-4 sm:px-8">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <a routerLink="/" class="flex items-center space-x-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <span class="text-xl font-extrabold text-[#0F2937] tracking-tight">Nivas<span class="text-[#2D7A5E]">360</span></span>
          </a>

          <a routerLink="/auth/login" class="text-xs font-bold text-slate-500 hover:text-[#0F2937] transition-colors flex items-center gap-1">
            <span>Already have an account? <strong class="text-[#2D7A5E] hover:underline">Sign In</strong></span>
          </a>
        </div>
      </header>

      <!-- Main Form Container -->
      <main class="flex-grow flex items-center justify-center p-4 sm:p-6 my-auto">
        <div class="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#E8E6DF] space-y-6">
          <div class="text-center space-y-2">
            <div class="inline-flex items-center space-x-2 bg-emerald-50 text-[#2D7A5E] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <span>✨ Fast Digital Onboarding</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">
              Create your Nivas360 Account
            </h1>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              Join Telangana & AP's Model Tenancy Act verified residential network.
            </p>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
            <span class="text-base shrink-0">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Role Selection (Tenant, Owner, Service Professional - NO Admin) -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">
                Choose Account Type <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="setRole('TENANT')"
                  [class]="selectedRole === 'TENANT' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm border-[#0F2937]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-semibold'"
                  class="p-2.5 text-xs rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span class="text-base">🏡</span>
                  <span>Tenant</span>
                </button>
                <button
                  type="button"
                  (click)="setRole('OWNER')"
                  [class]="selectedRole === 'OWNER' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm border-[#0F2937]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-semibold'"
                  class="p-2.5 text-xs rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span class="text-base">🏛️</span>
                  <span>Property Owner</span>
                </button>
                <button
                  type="button"
                  (click)="setRole('PROFESSIONAL')"
                  [class]="selectedRole === 'PROFESSIONAL' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm border-[#0F2937]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-semibold'"
                  class="p-2.5 text-xs rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span class="text-base">🛠️</span>
                  <span>Service Pro</span>
                </button>
              </div>
            </div>

            <!-- Full Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 block">
                Full Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. Ramesh Kumar"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
              />
              <span *ngIf="f['name'].touched && f['name'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                Full name is required.
              </span>
            </div>

            <!-- Email & Phone Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Email -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700 block">
                  Email Address <span class="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="ramesh@example.com"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                />
                <span *ngIf="f['email'].touched && f['email'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                  Valid email is required.
                </span>
              </div>

              <!-- Phone -->
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
                    class="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-none rounded-r-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                  />
                </div>
                <span *ngIf="f['phone'].touched && f['phone'].invalid" class="text-[11px] text-rose-600 font-semibold block">
                  10-digit mobile number required.
                </span>
              </div>
            </div>

            <!-- Password & Confirm Password Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium pr-10"
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
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none focus:bg-white font-medium"
                />
                <span *ngIf="registerForm.errors?.['mismatch'] && f['confirmPassword'].touched" class="text-[11px] text-rose-600 font-semibold block">
                  Passwords do not match.
                </span>
              </div>
            </div>

            <!-- Terms notice -->
            <p class="text-[11px] text-slate-500 leading-relaxed pt-1">
              By registering, you agree to Nivas360's Standardized Tenancy Agreement terms and Aadhaar digital identity guidelines.
            </p>

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
              <span>{{ isLoading ? 'Creating Account...' : 'Complete Registration' }}</span>
            </button>
          </form>

          <div class="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Already registered?
            <a routerLink="/auth/login" class="font-extrabold text-[#0F2937] hover:underline ml-1">
              Sign In Instead →
            </a>
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
export class RegisterComponent {
  registerForm: FormGroup;
  selectedRole: UserRole = 'TENANT';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
        next: () => {
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
