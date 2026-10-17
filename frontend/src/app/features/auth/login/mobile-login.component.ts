import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] flex flex-col justify-between font-sans text-slate-800 p-4">
      <!-- Slim Mobile Header -->
      <header class="w-full flex items-center justify-between py-2 border-b border-[#E8E6DF] mobile-top-bar">
        <a routerLink="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-black text-base shadow-xs">
            G
          </div>
          <span class="text-lg font-black text-[#0F2937]">Grih<span class="text-[#2D7A5E]">360</span></span>
        </a>
        <a routerLink="/" class="text-xs font-bold text-slate-500 hover:text-[#0F2937] flex items-center gap-1 min-h-[44px]">
          <span>← Back</span>
        </a>
      </header>

      <!-- Main Login Container -->
      <main class="my-auto py-4 space-y-4">
        
        <!-- Header & Title -->
        <div class="space-y-1 text-left">
          <div class="inline-flex items-center gap-1.5 bg-emerald-50 text-[#2D7A5E] px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
            <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Two-Step Security Active</span>
          </div>
          <h1 class="text-xl font-extrabold text-[#0F2937] tracking-tight mt-1">
            Sign in to {{ getRoleDisplayName() }}
          </h1>
          <p class="text-xs text-slate-500">
            Enter credentials. A 6-digit code will be sent to your email.
          </p>
        </div>

        <!-- Role Selector Tabs -->
        <div class="space-y-1">
          <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Choose Your Workspace
          </label>
          <div class="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              *ngFor="let role of roles"
              (click)="onSelectRole(role.value)"
              type="button"
              [class]="selectedRole === role.value ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 font-semibold'"
              class="py-2 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 min-h-[40px]"
            >
              <span>{{ role.label }}</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Banner -->
        <div *ngIf="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <span class="text-sm shrink-0"><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-3.5">
          <!-- Identifier Field -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">
              Email or Mobile Number <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="identifier"
              (ngModelChange)="identifierChange.emit($event)"
              name="identifier"
              required
              placeholder="Email or 10 digit mobile"
              class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium min-h-[44px]"
            />
          </div>

          <!-- Password Field with Show/Hide Toggle -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700 block">
                Password <span class="text-rose-500">*</span>
              </label>
              <button
                (click)="onForgotPassword()"
                type="button"
                class="text-xs font-bold text-[#2D7A5E] hover:underline cursor-pointer min-h-[44px] flex items-center"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative flex items-center">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                (ngModelChange)="passwordChange.emit($event)"
                name="password"
                required
                placeholder="Enter your password"
                class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none font-medium pr-14 min-h-[44px]"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility.emit()"
                class="absolute right-2 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer min-h-[40px] flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isLoading || !identifier || !password"
            class="w-full py-3.5 bg-[#0F2937] active:bg-[#164E63] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Generating OTP...' : 'Sign In & Get Code →' }}</span>
          </button>
        </form>

        <!-- Or Divider -->
        <div class="relative my-3 flex items-center justify-center">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative bg-[#FAF9F5] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            or
          </div>
        </div>

        <!-- Official Google Button (Reserved 44px Height) -->
        <div class="w-full h-[44px] min-h-[44px] flex items-center justify-center">
          <button
            type="button"
            (click)="googleSignIn.emit()"
            [disabled]="isGoogleLoading"
            class="w-full h-[44px] bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer select-none min-h-[44px]"
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

        <!-- Register Link -->
        <div class="text-center pt-2 border-t border-slate-200 text-xs text-slate-500">
          Don't have an account yet?
          <a [routerLink]="['/auth/register']" [queryParams]="{ role: selectedRole }" class="font-extrabold text-[#2D7A5E] hover:underline ml-1 min-h-[44px] inline-flex items-center">
            Create Account →
          </a>
        </div>

        <!-- Admin Portal Link -->
        <div class="text-center">
          <a routerLink="/admin/login" class="text-[11px] font-bold text-slate-400 hover:text-[#0F2937] transition-colors">
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Admin Console →
          </a>
        </div>
      </main>

      <!-- Profile Completion Bottom Sheet (Mobile) -->
      <div *ngIf="showProfileSheet" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-0">
        <div class="bg-white rounded-t-3xl p-5 w-full max-w-md shadow-2xl space-y-4 border-t border-[#E8E6DF] animate-in slide-in-from-bottom duration-200">
          <div class="flex items-center justify-between pb-1 border-b border-slate-100">
            <div>
              <h3 class="text-base font-extrabold text-[#0F2937]">Complete Your Profile</h3>
              <p class="text-xs text-slate-500">Select your workspace role and enter phone</p>
            </div>
            <button (click)="closeProfileSheet.emit()" class="text-slate-400 hover:text-slate-700 text-base font-bold p-2 cursor-pointer">✕</button>
          </div>

          <!-- Role Selector -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Workspace Role</label>
            <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                *ngFor="let r of roles"
                type="button"
                (click)="onSelectRole(r.value)"
                [class]="selectedRole === r.value ? 'bg-[#0F2937] text-[#FACC15] font-extrabold shadow-sm' : 'text-slate-600 font-semibold'"
                class="py-2 text-xs rounded-lg transition-all text-center cursor-pointer min-h-[40px]"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Phone Number Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Mobile Number <span class="text-rose-500">*</span></label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-xs font-bold text-slate-600">
                +91
              </span>
              <input
                type="tel"
                [(ngModel)]="profilePhone"
                (ngModelChange)="profilePhoneChange.emit($event)"
                placeholder="10 digit mobile number"
                maxlength="10"
                class="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-none rounded-r-xl text-base text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] font-medium min-h-[44px]"
              />
            </div>
            <span *ngIf="profileError" class="text-[11px] text-rose-600 font-semibold block">
              {{ profileError }}
            </span>
          </div>

          <div class="pt-2">
            <button
              (click)="completeProfile.emit()"
              [disabled]="isCompletingProfile || !profilePhone"
              type="button"
              class="w-full py-3.5 bg-[#0F2937] active:bg-[#164E63] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md min-h-[48px] cursor-pointer"
            >
              {{ isCompletingProfile ? 'Registering...' : 'Complete Registration →' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="py-2 text-center text-[11px] text-slate-400 border-t border-[#E8E6DF]">
        © 2026 Grih360 Technologies
      </footer>
    </div>
  `,
})
export class MobileLoginComponent {
  @Input() identifier: string = '';
  @Output() identifierChange = new EventEmitter<string>();

  @Input() password: string = '';
  @Output() passwordChange = new EventEmitter<string>();

  @Input() selectedRole: string = 'TENANT';
  @Output() selectedRoleChange = new EventEmitter<string>();

  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  @Input() showPassword: boolean = false;

  @Input() isGoogleLoading: boolean = false;
  @Output() googleSignIn = new EventEmitter<void>();

  @Input() showProfileSheet: boolean = false;
  @Output() closeProfileSheet = new EventEmitter<void>();
  @Input() profilePhone: string = '';
  @Output() profilePhoneChange = new EventEmitter<string>();
  @Input() profileError: string = '';
  @Input() isCompletingProfile: boolean = false;
  @Output() completeProfile = new EventEmitter<void>();

  @Output() loginSubmit = new EventEmitter<void>();
  @Output() togglePasswordVisibility = new EventEmitter<void>();
  @Output() openForgotPassword = new EventEmitter<void>();

  roles = [
    { label: 'Tenant', value: 'TENANT' },
    { label: 'Owner', value: 'OWNER' },
    { label: 'Pro', value: 'PROFESSIONAL' },
  ];

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

  onSelectRole(role: string): void {
    this.selectedRoleChange.emit(role);
  }

  onForgotPassword(): void {
    this.openForgotPassword.emit();
  }

  onSubmit(): void {
    this.loginSubmit.emit();
  }
}
