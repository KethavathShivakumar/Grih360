import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/tenant/dashboard" class="hover:text-[#2D7A5E] font-medium">Dashboard</a>
            <span>/</span>
            <span class="text-slate-800 font-bold">Settings</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Tenant Settings & Preferences</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage notifications, search criteria, credentials, and security configurations.</p>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.id"
            type="button"
            [class]="activeTab === tab.id ? 'bg-[#0F2937] text-[#FACC15]' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-black rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span>{{ tab.icon }}</span>
            <span class="ml-1.5">{{ tab.label }}</span>
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

      <!-- Main Form Container -->
      <div class="space-y-6">

        <!-- TAB 1: NOTIFICATIONS & ALERTS -->
        <div *ngIf="activeTab === 'notifications'" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Alerts & Automated Communications</h2>
            <p class="text-xs text-slate-500 mt-0.5">Stay informed about rent cycle dates, new home matches, and maintenance updates.</p>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span class="text-xs font-extrabold text-[#0F2937] block">Rent Due & Receipt Email Notifications</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Receive monthly rent reminders 5 days prior to cycle due date and PDF receipts upon payment.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="notifications.rentReminders"
                class="w-5 h-5 text-[#2D7A5E] rounded-md border-slate-300 focus:ring-[#2D7A5E] cursor-pointer"
              />
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span class="text-xs font-extrabold text-[#0F2937] block">WhatsApp Home Service Tracking</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Receive real-time professional dispatch updates and service technician arrival notices on WhatsApp.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="notifications.whatsappServices"
                class="w-5 h-5 text-[#2D7A5E] rounded-md border-slate-300 focus:ring-[#2D7A5E] cursor-pointer"
              />
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span class="text-xs font-extrabold text-[#0F2937] block">Instant Home Match Alerts</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Get notified immediately when a new zero-brokerage listing matches your preferred locality and budget.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="notifications.homeAlerts"
                class="w-5 h-5 text-[#2D7A5E] rounded-md border-slate-300 focus:ring-[#2D7A5E] cursor-pointer"
              />
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span class="text-xs font-extrabold text-[#0F2937] block">SMS Security & Verification Codes</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Standard authentication and tenant login security pin notifications.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="notifications.smsAlerts"
                class="w-5 h-5 text-[#2D7A5E] rounded-md border-slate-300 focus:ring-[#2D7A5E] cursor-pointer"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="saveNotificationSettings()"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>

        <!-- TAB 2: SEARCH PREFERENCES -->
        <div *ngIf="activeTab === 'preferences'" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Rental Matching & Discovery Criteria</h2>
            <p class="text-xs text-slate-500 mt-0.5">Configure your home search preferences for customized recommendations.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div class="space-y-1">
              <label class="font-bold text-slate-700">Preferred Primary City</label>
              <select
                [(ngModel)]="searchPrefs.city"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#2D7A5E]"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Warangal">Warangal</option>
                <option value="Mahabubnagar">Mahabubnagar</option>
                <option value="Nalgonda">Nalgonda</option>
                <option value="Karimnagar">Karimnagar</option>
                <option value="Khammam">Khammam</option>
                <option value="Nizamabad">Nizamabad</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Guntur">Guntur</option>
                <option value="Tirupati">Tirupati</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-bold text-slate-700">Preferred BHK</label>
              <select
                [(ngModel)]="searchPrefs.bedrooms"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#2D7A5E]"
              >
                <option [ngValue]="1">1 BHK</option>
                <option [ngValue]="2">2 BHK</option>
                <option [ngValue]="3">3 BHK</option>
                <option [ngValue]="4">4+ BHK</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-bold text-slate-700">Maximum Budget (₹ / Month)</label>
              <input
                type="number"
                [(ngModel)]="searchPrefs.maxBudget"
                placeholder="e.g. 35000"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="font-bold text-slate-700">Furnishing Preference</label>
              <select
                [(ngModel)]="searchPrefs.furnishing"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#2D7A5E]"
              >
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="FURNISHED">Fully Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="saveSearchPreferences()"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Update Search Preferences
            </button>
          </div>
        </div>

        <!-- TAB 3: SECURITY & PASSWORD -->
        <div *ngIf="activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Password & Security Credentials</h2>
            <p class="text-xs text-slate-500 mt-0.5">Ensure your account uses a secure password to protect personal data and rental contracts.</p>
          </div>

          <div class="max-w-md space-y-4 text-xs">
            <div class="space-y-1">
              <label class="font-bold text-slate-700">Current Password *</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.currentPassword"
                placeholder="Enter current password"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="font-bold text-slate-700">New Password *</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.newPassword"
                placeholder="Minimum 6 characters"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="font-bold text-slate-700">Confirm New Password *</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.confirmPassword"
                placeholder="Re-enter new password"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="pt-2">
              <button
                (click)="changePassword()"
                [disabled]="isUpdatingPassword"
                type="button"
                class="w-full px-6 py-2.5 bg-[#0F2937] hover:bg-[#1E3A8A] text-[#FACC15] font-black text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {{ isUpdatingPassword ? 'Updating Password...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 4: ACCOUNT MANAGEMENT -->
        <div *ngIf="activeTab === 'account'" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h2 class="text-lg font-black text-[#0F2937]">Account Management & Privacy</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage your tenant profile information and data privacy.</p>
          </div>

          <div class="space-y-4 text-xs">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="font-extrabold text-slate-900 block">Personal Profile & Contact Info</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Update your display name, phone number, bio, and employment data.</span>
              </div>
              <a
                routerLink="/tenant/profile"
                class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Edit Profile →
              </a>
            </div>

            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="font-extrabold text-slate-900 block">Download Personal Data Archive</span>
                <span class="text-[11px] text-slate-500 block mt-0.5">Export a copy of your tenancy contracts, applications, and receipts.</span>
              </div>
              <button
                (click)="exportData()"
                type="button"
                class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Export JSON Archive
              </button>
            </div>

            <div class="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="font-extrabold text-rose-900 block">Sign Out of Nivas360</span>
                <span class="text-[11px] text-rose-700 block mt-0.5">Safely end your current session across devices.</span>
              </div>
              <button
                (click)="signOut()"
                type="button"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TenantSettingsComponent implements OnInit {
  activeTab: string = 'notifications';
  successMessage: string = '';
  errorMessage: string = '';
  isUpdatingPassword: boolean = false;

  tabs = [
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Search Criteria', icon: '🔍' },
    { id: 'security', label: 'Security & Password', icon: '🔒' },
    { id: 'account', label: 'Account & Data', icon: '👤' },
  ];

  notifications = {
    rentReminders: true,
    whatsappServices: true,
    homeAlerts: true,
    smsAlerts: true,
  };

  searchPrefs = {
    city: 'Hyderabad',
    bedrooms: 2,
    maxBudget: 35000,
    furnishing: 'SEMI_FURNISHED',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Restore locally saved preferences if present
    const savedNotifs = localStorage.getItem('tenant_settings_notifications');
    if (savedNotifs) {
      try {
        this.notifications = JSON.parse(savedNotifs);
      } catch (e) {}
    }
    const savedPrefs = localStorage.getItem('tenant_settings_search');
    if (savedPrefs) {
      try {
        this.searchPrefs = JSON.parse(savedPrefs);
      } catch (e) {}
    }
  }

  saveNotificationSettings(): void {
    localStorage.setItem('tenant_settings_notifications', JSON.stringify(this.notifications));
    this.successMessage = 'Notification preferences updated successfully.';
    setTimeout(() => (this.successMessage = ''), 3500);
  }

  saveSearchPreferences(): void {
    localStorage.setItem('tenant_settings_search', JSON.stringify(this.searchPrefs));
    this.successMessage = 'Home search preferences saved successfully.';
    setTimeout(() => (this.successMessage = ''), 3500);
  }

  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.passwordForm.currentPassword) {
      this.errorMessage = 'Please provide your current password.';
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage = 'New password and confirmation password do not match.';
      return;
    }

    this.isUpdatingPassword = true;
    this.userService
      .changePassword({
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: () => {
          this.isUpdatingPassword = false;
          this.successMessage = 'Password updated successfully!';
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
          setTimeout(() => (this.successMessage = ''), 4000);
        },
        error: (err: any) => {
          this.isUpdatingPassword = false;
          this.errorMessage = err?.error?.message || 'Failed to change password. Please verify current password.';
        },
      });
  }

  exportData(): void {
    const user = this.authService.getCurrentUser();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ user, exportedAt: new Date().toISOString() }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nivas360_tenant_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  signOut(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
