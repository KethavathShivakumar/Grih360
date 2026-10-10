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
            <span>🔒 Two-Step Security Active</span>
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
              <span>{{ role.icon }}</span>
              <span>{{ role.label }}</span>
            </button>
          </div>
        </div>

        <!-- Error Alert Banner -->
        <div *ngIf="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <span class="text-sm shrink-0">⚠️</span>
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
              placeholder="Email or 10-digit mobile"
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
            🛡️ Admin Console →
          </a>
        </div>
      </main>

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

  @Output() loginSubmit = new EventEmitter<void>();
  @Output() togglePasswordVisibility = new EventEmitter<void>();
  @Output() openForgotPassword = new EventEmitter<void>();

  roles = [
    { label: 'Tenant', value: 'TENANT', icon: '🏡' },
    { label: 'Owner', value: 'OWNER', icon: '🏛️' },
    { label: 'Pro', value: 'PROFESSIONAL', icon: '🛠️' },
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
