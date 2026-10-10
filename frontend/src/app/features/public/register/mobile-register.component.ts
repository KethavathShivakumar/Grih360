import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserRole } from '../../../shared/models/user.model';

@Component({
  selector: 'app-mobile-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800 p-4">
      <!-- Header -->
      <header class="w-full flex items-center justify-between py-2 border-b border-[#E8E6DF] mobile-top-bar">
        <a routerLink="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-xs">
            G
          </div>
          <span class="text-lg font-black text-[#0F2937]">Grih<span class="text-[#2D7A5E]">360</span></span>
        </a>
        <a routerLink="/auth/login" class="text-xs font-bold text-slate-500 hover:text-[#0F2937] flex items-center gap-1 min-h-[44px]">
          <span>Sign In →</span>
        </a>
      </header>

      <!-- Main Form Area -->
      <main class="my-auto py-4 space-y-4">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-1 bg-emerald-50 text-[#2D7A5E] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
            <span>🛡️ Model Tenancy Act Verified</span>
          </div>
          <h1 class="text-xl font-extrabold text-[#0F2937] tracking-tight mt-1">
            Create Your Account
          </h1>
          <p class="text-xs text-slate-500">
            We'll send a single-use 6-digit OTP code to verify your email address.
          </p>
        </div>

        <!-- Error Banner -->
        <div *ngIf="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <span class="text-sm shrink-0">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-3.5">
          <!-- Role Selector Tabs -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Workspace Role <span class="text-rose-500">*</span>
            </label>
            <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                (click)="onSetRole('TENANT')"
                [class]="selectedRole === 'TENANT' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 font-semibold'"
                class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
              >
                <span>🏡</span>
                <span>Tenant</span>
              </button>

              <button
                type="button"
                (click)="onSetRole('OWNER')"
                [class]="selectedRole === 'OWNER' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 font-semibold'"
                class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
              >
                <span>🏛️</span>
                <span>Owner</span>
              </button>

              <button
                type="button"
                (click)="onSetRole('PROFESSIONAL')"
                [class]="selectedRole === 'PROFESSIONAL' ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 font-semibold'"
                class="py-2 text-xs rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
              >
                <span>🛠️</span>
                <span>Pro</span>
              </button>
            </div>
          </div>

          <!-- Full Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Full Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Ramesh Kumar"
              class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium min-h-[44px]"
            />
            <span *ngIf="f['name'].touched && f['name'].invalid" class="text-[11px] text-rose-600 font-semibold block">
              Full name is required.
            </span>
          </div>

          <!-- Email -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="ramesh@example.com"
              class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium min-h-[44px]"
            />
            <span *ngIf="f['email'].touched && f['email'].invalid" class="text-[11px] text-rose-600 font-semibold block">
              Valid email is required.
            </span>
          </div>

          <!-- Mobile Phone -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Mobile Number <span class="text-rose-500">*</span>
            </label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-xs font-bold text-slate-600 min-h-[44px]">
                +91
              </span>
              <input
                type="tel"
                formControlName="phone"
                placeholder="10-digit phone"
                maxlength="10"
                class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-none rounded-r-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium min-h-[44px]"
              />
            </div>
            <span *ngIf="f['phone'].touched && f['phone'].invalid" class="text-[11px] text-rose-600 font-semibold block">
              Valid 10-digit phone required.
            </span>
          </div>

          <!-- Password -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Password <span class="text-rose-500">*</span>
            </label>
            <div class="relative flex items-center">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="Min. 6 characters"
                class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium pr-14 min-h-[44px]"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-2 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer min-h-[40px] flex items-center justify-center rounded-lg bg-slate-100"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <span *ngIf="f['password'].touched && f['password'].invalid" class="text-[11px] text-rose-600 font-semibold block">
              Min. 6 characters required.
            </span>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Confirm Password <span class="text-rose-500">*</span>
            </label>
            <input
              type="password"
              formControlName="confirmPassword"
              placeholder="Re-enter password"
              class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium min-h-[44px]"
            />
            <span *ngIf="registerForm.errors?.['mismatch'] && f['confirmPassword'].touched" class="text-[11px] text-rose-600 font-semibold block">
              Passwords do not match.
            </span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="registerForm.invalid || isLoading"
            class="w-full py-3.5 bg-[#2D7A5E] active:bg-[#23614a] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Creating Account...' : 'Register & Verify Email →' }}</span>
          </button>
        </form>

        <!-- Login Redirect -->
        <div class="text-center pt-2 border-t border-slate-200 text-xs text-slate-500">
          Already registered?
          <a routerLink="/auth/login" class="font-extrabold text-[#0F2937] hover:underline ml-1">
            Sign In →
          </a>
        </div>
      </main>

      <footer class="py-2 text-center text-[11px] text-slate-400 border-t border-[#E8E6DF]">
        © 2026 Grih360 Technologies
      </footer>
    </div>
  `,
})
export class MobileRegisterComponent {
  @Input() registerForm!: FormGroup;
  @Input() selectedRole: UserRole = 'TENANT';
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';

  @Output() setRole = new EventEmitter<UserRole>();
  @Output() registerSubmit = new EventEmitter<void>();

  showPassword: boolean = false;

  get f() {
    return this.registerForm.controls;
  }

  onSetRole(role: UserRole): void {
    this.setRole.emit(role);
  }

  onSubmit(): void {
    this.registerSubmit.emit();
  }
}
