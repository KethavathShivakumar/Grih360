import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Owner Workspace Settings</h1>
          <p class="text-xs text-slate-500">Configure automated rent payouts, digital lease defaults, alert channels, and account security.</p>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.id"
            type="button"
            [class]="activeTab === tab.id ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span>{{ tab.icon }}</span>
            <span class="ml-1">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Loading settings preferences..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load settings"
        [message]="errorMessage"
        (retry)="loadSettings()"
      ></app-error-state>

      <!-- Main Form Container -->
      <div *ngIf="!isLoading && !isError" class="space-y-6">

        <!-- TAB 1: PAYOUTS & BANKING -->
        <div *ngIf="activeTab === 'payouts'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Rent Collection & Bank Account Payouts</h2>
            <p class="text-xs text-slate-500 mt-0.5">Automated direct-to-bank monthly rent disbursements processed via RBI-compliant payment gateways.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Account Holder Name *</label>
              <input
                type="text"
                [(ngModel)]="bankDetails.accountHolder"
                placeholder="Name as registered in bank"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Bank Name *</label>
              <input
                type="text"
                [(ngModel)]="bankDetails.bankName"
                placeholder="e.g., State Bank of India, HDFC Bank, ICICI"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Account Number *</label>
              <input
                type="text"
                [(ngModel)]="bankDetails.accountNumber"
                placeholder="11-16 digit account number"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">IFSC Code *</label>
              <input
                type="text"
                [(ngModel)]="bankDetails.ifsc"
                placeholder="e.g., SBIN0001234, HDFC0000456"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 uppercase focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="text-xs font-bold text-slate-700">UPI ID for Instant Settlement (Optional)</label>
              <input
                type="text"
                [(ngModel)]="bankDetails.upiId"
                placeholder="e.g., landlord@okhdfcbank or 9876543210@paytm"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
              <p class="text-[10px] text-slate-400">Rent collections will settle instantly to this UPI ID once tenant pays online.</p>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button
              (click)="saveBankDetails()"
              [disabled]="isSaving"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save Bank Details' }}
            </button>
          </div>
        </div>

        <!-- TAB 2: LEASE & TENANCY DEFAULTS -->
        <div *ngIf="activeTab === 'lease'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Lease Agreement Defaults & Compliance</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pre-fill standard clauses for all new property listings and tenant applications.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Standard Agreement Period</label>
              <select
                [(ngModel)]="leaseDefaults.durationMonths"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option [value]="11">11 Months (Standard Registration Exemption)</option>
                <option [value]="24">24 Months</option>
                <option [value]="36">36 Months</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Notice Period</label>
              <select
                [(ngModel)]="leaseDefaults.noticePeriodDays"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option [value]="30">30 Days (Standard 1 Month Notice)</option>
                <option [value]="60">60 Days</option>
                <option [value]="90">90 Days</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Default Security Deposit Multiplier</label>
              <select
                [(ngModel)]="leaseDefaults.depositMultiplier"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option [value]="2">2 Months Rent (Telangana Model Tenancy Cap)</option>
                <option [value]="3">3 Months Rent</option>
                <option [value]="5">5 Months Rent</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Monthly Rent Due Date</label>
              <select
                [(ngModel)]="leaseDefaults.dueDay"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option [value]="1">1st of Every Month</option>
                <option [value]="5">5th of Every Month (Recommended)</option>
                <option [value]="10">10th of Every Month</option>
              </select>
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="text-xs font-bold text-slate-700">Preferred Tenant Category</label>
              <div class="grid grid-cols-3 gap-3 pt-1">
                <label class="p-3 border rounded-xl flex items-center gap-2 cursor-pointer" [ngClass]="leaseDefaults.preferredCategory === 'ANY' ? 'border-[#2D7A5E] bg-emerald-50/50' : 'border-slate-200'">
                  <input type="radio" name="tenantCat" value="ANY" [(ngModel)]="leaseDefaults.preferredCategory" />
                  <span class="text-xs font-bold text-slate-800">Any Verified</span>
                </label>
                <label class="p-3 border rounded-xl flex items-center gap-2 cursor-pointer" [ngClass]="leaseDefaults.preferredCategory === 'FAMILY' ? 'border-[#2D7A5E] bg-emerald-50/50' : 'border-slate-200'">
                  <input type="radio" name="tenantCat" value="FAMILY" [(ngModel)]="leaseDefaults.preferredCategory" />
                  <span class="text-xs font-bold text-slate-800">Families Only</span>
                </label>
                <label class="p-3 border rounded-xl flex items-center gap-2 cursor-pointer" [ngClass]="leaseDefaults.preferredCategory === 'BACHELORS' ? 'border-[#2D7A5E] bg-emerald-50/50' : 'border-slate-200'">
                  <input type="radio" name="tenantCat" value="BACHELORS" [(ngModel)]="leaseDefaults.preferredCategory" />
                  <span class="text-xs font-bold text-slate-800">Bachelors / Pros</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button
              (click)="saveLeaseDefaults()"
              [disabled]="isSaving"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save Tenancy Defaults' }}
            </button>
          </div>
        </div>

        <!-- TAB 3: NOTIFICATION CHANNELS -->
        <div *ngIf="activeTab === 'notifications'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Notification & Alert Preferences</h2>
            <p class="text-xs text-slate-500 mt-0.5">Control how and when you receive real-time updates regarding tenant applications and rent payments.</p>
          </div>

          <div class="space-y-4">
            <label class="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <div class="space-y-0.5 pr-4">
                <span class="text-xs font-bold text-slate-900 block">Email Notifications</span>
                <span class="text-[11px] text-slate-500 block">Receive instant emails via Gmail SMTP when new tenant applications are submitted or leases signed.</span>
              </div>
              <input type="checkbox" [(ngModel)]="notificationPrefs.email" class="w-4 h-4 text-[#2D7A5E] rounded accent-[#2D7A5E] mt-1" />
            </label>

            <label class="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <div class="space-y-0.5 pr-4">
                <span class="text-xs font-bold text-slate-900 block">SMS Alerts</span>
                <span class="text-[11px] text-slate-500 block">Direct SMS messages sent to your registered mobile number for rent payments and OTP alerts.</span>
              </div>
              <input type="checkbox" [(ngModel)]="notificationPrefs.sms" class="w-4 h-4 text-[#2D7A5E] rounded accent-[#2D7A5E] mt-1" />
            </label>

            <label class="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <div class="space-y-0.5 pr-4">
                <span class="text-xs font-bold text-slate-900 block">WhatsApp Tenancy Alerts</span>
                <span class="text-[11px] text-slate-500 block">Automated WhatsApp receipt dispatch upon successful online rent settlement.</span>
              </div>
              <input type="checkbox" [(ngModel)]="notificationPrefs.whatsapp" class="w-4 h-4 text-[#2D7A5E] rounded accent-[#2D7A5E] mt-1" />
            </label>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button
              (click)="saveNotificationPrefs()"
              [disabled]="isSaving"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save Notification Preferences' }}
            </button>
          </div>
        </div>

        <!-- TAB 4: SECURITY & MFA -->
        <div *ngIf="activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Account Security & Two-Step Verification</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage your credentials, change password, and verify two-step authentication status.</p>
          </div>

          <!-- Two-Step Verification Status Box -->
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-emerald-900">🛡️ Two-Step Verification: Active</span>
                <span class="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-[10px] font-black rounded-md uppercase">Enforced</span>
              </div>
              <p class="text-[11px] text-emerald-800 font-medium">
                Logins require password validation followed by a secure 6-digit one-time PIN dispatched to your email address via Gmail SMTP.
              </p>
            </div>
            <span class="text-2xl">🔒</span>
          </div>

          <!-- Change Password Form -->
          <div class="space-y-4 pt-2">
            <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Change Password</h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Current Password *</label>
                <input
                  type="password"
                  [(ngModel)]="currentPassword"
                  placeholder="Enter current password"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">New Password *</label>
                <input
                  type="password"
                  [(ngModel)]="newPassword"
                  placeholder="Min 6 characters"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Confirm New Password *</label>
                <input
                  type="password"
                  [(ngModel)]="confirmPassword"
                  placeholder="Re-enter new password"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
                />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button
                (click)="changePassword()"
                [disabled]="!currentPassword || !newPassword || !confirmPassword || isSaving"
                type="button"
                class="px-6 py-2.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {{ isSaving ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerSettingsComponent implements OnInit {
  activeTab: string = 'payouts';
  isLoading: boolean = true;
  isError: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  readonly tabs = [
    { id: 'payouts', label: 'Payouts & Banking', icon: '🏦' },
    { id: 'lease', label: 'Lease Defaults', icon: '📜' },
    { id: 'notifications', label: 'Alert Channels', icon: '🔔' },
    { id: 'security', label: 'Security & 2-Step', icon: '🔒' },
  ];

  bankDetails = {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  };

  leaseDefaults = {
    durationMonths: 11,
    noticePeriodDays: 30,
    depositMultiplier: 2,
    dueDay: 5,
    preferredCategory: 'ANY',
  };

  notificationPrefs = {
    email: true,
    sms: true,
    whatsapp: true,
  };

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';

    this.userService.getProfile().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const user = res.data?.user || res.data || {};
        this.bankDetails.accountHolder = user.fullName || user.name || '';
        if (user.payoutSettings) {
          this.bankDetails = { ...this.bankDetails, ...user.payoutSettings };
        }
        if (user.leaseDefaults) {
          this.leaseDefaults = { ...this.leaseDefaults, ...user.leaseDefaults };
        }
        if (user.notificationPreferences) {
          this.notificationPrefs = { ...this.notificationPrefs, ...user.notificationPreferences };
        }
      },
      error: () => {
        // Fallback to active logged in user signal
        const user = this.authService.currentUserSignal();
        this.isLoading = false;
        if (user) {
          this.bankDetails.accountHolder = user.fullName || user.name || '';
        }
      },
    });
  }

  saveBankDetails(): void {
    if (!this.bankDetails.accountNumber || !this.bankDetails.ifsc) {
      this.errorMessage = 'Please provide both Account Number and IFSC code.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.userService.updateProfile({ payoutSettings: this.bankDetails } as any).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Bank account payout details saved successfully!';
        setTimeout(() => (this.successMessage = ''), 3500);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to save bank account settings.';
      },
    });
  }

  saveLeaseDefaults(): void {
    this.isSaving = true;
    this.errorMessage = '';

    this.userService.updateProfile({ leaseDefaults: this.leaseDefaults } as any).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Tenancy lease defaults updated successfully!';
        setTimeout(() => (this.successMessage = ''), 3500);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to save tenancy defaults.';
      },
    });
  }

  saveNotificationPrefs(): void {
    this.isSaving = true;
    this.errorMessage = '';

    this.userService.updateProfile({ notificationPreferences: this.notificationPrefs } as any).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Notification alert channels updated successfully!';
        setTimeout(() => (this.successMessage = ''), 3500);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to save notification preferences.';
      },
    });
  }

  changePassword(): void {
    if (!this.currentPassword) {
      this.errorMessage = 'Please enter your current password.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirmation password do not match.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.userService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.isSaving = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.successMessage = 'Password updated successfully! Next login will require your new password.';
        setTimeout(() => (this.successMessage = ''), 3500);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to update password.';
      },
    });
  }
}
