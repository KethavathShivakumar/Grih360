import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-n-50 flex flex-col justify-between font-sans text-n-900 p-4">
      <!-- Slim Mobile Header -->
      <header class="w-full flex items-center justify-between py-2 border-b border-n-200 mobile-top-bar">
        <a routerLink="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-navy text-n-0 flex items-center justify-center font-semibold text-sm">
            G
          </div>
          <span class="text-base font-semibold text-navy">Grih<span class="text-brand">360</span></span>
        </a>
        <a routerLink="/" class="text-xs font-semibold text-n-500 hover:text-n-900 flex items-center gap-1 min-h-[44px]">
          <span>← Back</span>
        </a>
      </header>

      <!-- Main Login Container -->
      <main class="my-auto py-4 space-y-4">
        
        <!-- Header & Title -->
        <div class="space-y-1 text-left">
          <div class="inline-flex items-center gap-1.5 bg-brand-subtle text-brand px-2.5 py-0.5 rounded-full text-xs font-semibold border border-brand-border">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span>Verified Rentals Portal</span>
          </div>
          <h1 class="text-xl font-semibold text-n-900 tracking-tight mt-1">
            Sign in to {{ getRoleDisplayName() }}
          </h1>
          <p class="text-xs text-n-500">
            Enter your details. A verification code will be sent to your email.
          </p>
        </div>

        <!-- Role Selector Tabs -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-n-500 uppercase tracking-wider block">
            Workspace
          </label>
          <div class="grid grid-cols-3 gap-1 p-1 bg-n-100 border border-n-200 rounded-lg">
            <button
              *ngFor="let role of roles"
              (click)="onSelectRole(role.value)"
              type="button"
              [class]="selectedRole === role.value ? 'bg-navy text-n-0 font-semibold' : 'text-n-500 font-semibold hover:text-n-900'"
              class="py-2 text-xs rounded-md transition-colors text-center cursor-pointer flex items-center justify-center min-h-[40px]"
            >
              <span>{{ role.label }}</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Banner -->
        <div *ngIf="errorMessage" class="p-3 bg-err-bg border border-err-border text-err-text rounded-lg text-xs font-semibold space-y-2.5">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span class="leading-relaxed">{{ errorMessage }}</span>
          </div>
          <div *ngIf="isGoogleOnlyAccount" class="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              (click)="googleSignIn.emit()"
              class="w-full sm:w-auto px-3.5 py-2 bg-navy text-n-0 text-xs font-semibold rounded-lg hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer min-h-[38px]">
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
              (click)="openSetPassword.emit()"
              class="w-full sm:w-auto px-3.5 py-2 bg-n-0 border border-n-300 text-n-900 hover:bg-n-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <span>Set a password</span>
            </button>
          </div>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-3.5">
          <!-- Identifier Field -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-n-700 block">
              Email or Mobile Number
            </label>
            <input
              type="text"
              [(ngModel)]="identifier"
              (ngModelChange)="identifierChange.emit($event)"
              name="identifier"
              required
              placeholder="Email or 10-digit mobile"
              class="w-full px-3.5 py-2.5 bg-n-0 border border-n-200 rounded-lg text-sm text-n-900 placeholder-n-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors min-h-[44px]"
            />
          </div>

          <!-- Password Field with Show/Hide Toggle -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-n-700 block">
                Password
              </label>
              <button
                (click)="onForgotPassword()"
                type="button"
                class="text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer min-h-[44px] flex items-center"
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
                placeholder="Enter password"
                class="w-full px-3.5 py-2.5 bg-n-0 border border-n-200 rounded-lg text-sm text-n-900 placeholder-n-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors pr-14 min-h-[44px]"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility.emit()"
                class="absolute right-2 px-2.5 py-1 text-n-500 hover:text-n-900 text-xs font-semibold cursor-pointer min-h-[36px] flex items-center justify-center rounded bg-n-100 hover:bg-n-200 transition-colors"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isLoading || !identifier || !password"
            class="w-full py-2.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <svg *ngIf="isLoading" class="animate-spin h-4 w-4 text-n-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Sending code...' : 'Sign In →' }}</span>
          </button>
        </form>

        <!-- Or Divider -->
        <div class="relative my-3 flex items-center justify-center">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-n-200"></div>
          </div>
          <div class="relative bg-n-50 px-3 text-xs font-semibold text-n-400 uppercase tracking-wider">
            or
          </div>
        </div>

        <!-- Official Google Button -->
        <div class="w-full min-h-[44px] flex items-center justify-center">
          <button
            type="button"
            (click)="googleSignIn.emit()"
            [disabled]="isGoogleLoading"
            class="w-full h-[44px] bg-n-0 hover:bg-n-50 active:bg-n-100 border border-n-200 rounded-lg text-n-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer select-none"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{{ isGoogleLoading ? 'Connecting...' : 'Continue with Google' }}</span>
          </button>
        </div>

        <!-- Register Link -->
        <div class="text-center pt-2 border-t border-n-200 text-xs text-n-500">
          Don't have an account yet?
          <a [routerLink]="['/auth/register']" [queryParams]="{ role: selectedRole }" class="font-semibold text-brand hover:underline ml-1 min-h-[44px] inline-flex items-center">
            Create Account →
          </a>
        </div>

        <!-- Admin Portal Link -->
        <div class="text-center">
          <a routerLink="/admin/login" class="text-xs font-semibold text-n-400 hover:text-n-700 transition-colors">
            Admin Console →
          </a>
        </div>
      </main>

      <!-- Profile Completion Bottom Sheet (Mobile) -->
      <div *ngIf="showProfileSheet" class="fixed inset-0 bg-n-900/50 z-50 flex items-end justify-center p-0">
        <div class="bg-n-0 rounded-t-xl p-5 w-full max-w-md shadow-sm space-y-4 border-t border-n-200 animate-in slide-in-from-bottom duration-200">
          <div class="flex items-center justify-between pb-2 border-b border-n-200">
            <div>
              <h3 class="text-base font-semibold text-n-900">Complete Profile</h3>
              <p class="text-xs text-n-500">Select role and enter mobile number</p>
            </div>
            <button (click)="closeProfileSheet.emit()" class="text-n-400 hover:text-n-700 text-base font-semibold p-2 cursor-pointer">✕</button>
          </div>

          <!-- Role Selector -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-n-500 uppercase tracking-wider block">Workspace Role</label>
            <div class="grid grid-cols-3 gap-1.5 p-1 bg-n-100 rounded-lg border border-n-200">
              <button
                *ngFor="let r of roles"
                type="button"
                (click)="onSelectRole(r.value)"
                [class]="selectedRole === r.value ? 'bg-navy text-n-0 font-semibold' : 'text-n-500 font-semibold'"
                class="py-2 text-xs rounded-md transition-colors text-center cursor-pointer min-h-[40px]"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Phone Number Input -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-n-700 block">Mobile Number</label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-n-200 bg-n-100 text-xs font-semibold text-n-600">
                +91
              </span>
              <input
                type="tel"
                [(ngModel)]="profilePhone"
                (ngModelChange)="profilePhoneChange.emit($event)"
                placeholder="10-digit mobile number"
                maxlength="10"
                class="w-full px-3.5 py-2.5 bg-n-0 border border-n-200 rounded-none rounded-r-lg text-sm text-n-900 placeholder-n-400 focus:border-brand outline-none font-medium min-h-[44px]"
              />
            </div>
            <span *ngIf="profileError" class="text-xs text-err-text font-semibold block">
              {{ profileError }}
            </span>
          </div>

          <div class="pt-2">
            <button
              (click)="completeProfile.emit()"
              [disabled]="isCompletingProfile || !profilePhone"
              type="button"
              class="w-full py-2.5 bg-brand hover:bg-brand-hover active:bg-brand disabled:opacity-50 text-n-0 font-semibold text-sm rounded-lg min-h-[44px] cursor-pointer transition-colors"
            >
              {{ isCompletingProfile ? 'Registering...' : 'Complete Registration →' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="py-2 text-center text-[10px] text-n-400 border-t border-n-200 space-y-0.5">
        <p>© 2026 Grih360 Technologies</p>
        <p class="font-mono text-slate-500 font-medium">v{{ appVersion }} ({{ commitHash }}) • {{ apiUrl }}</p>
      </footer>
    </div>
  `,
})
export class MobileLoginComponent {
  appVersion: string = (environment as any).appVersion || '1.4.8';
  commitHash: string = (environment as any).commitHash || 'ebb30e1';
  apiUrl: string = environment.apiUrl;

  @Input() identifier: string = '';
  @Output() identifierChange = new EventEmitter<string>();

  @Input() password: string = '';
  @Output() passwordChange = new EventEmitter<string>();

  @Input() selectedRole: string = 'TENANT';
  @Output() selectedRoleChange = new EventEmitter<string>();

  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  @Input() isGoogleOnlyAccount: boolean = false;
  @Input() showPassword: boolean = false;

  @Input() isGoogleLoading: boolean = false;
  @Output() googleSignIn = new EventEmitter<void>();
  @Output() openSetPassword = new EventEmitter<void>();

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
