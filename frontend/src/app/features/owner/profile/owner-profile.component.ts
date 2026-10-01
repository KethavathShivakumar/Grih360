import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { OwnerService, OwnerDashboardMetrics } from '../../../core/services/owner.service';

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Property Owner Profile</h1>
          <p class="text-xs text-slate-500">Manage your landlord credentials, business contact info, and portfolio security settings.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            (click)="activeTab = 'overview'"
            type="button"
            [class]="activeTab === 'overview' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            (click)="activeTab = 'edit'"
            type="button"
            [class]="activeTab === 'edit' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            (click)="activeTab = 'security'"
            type="button"
            [class]="activeTab === 'security' ? 'bg-[#0F2937] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            Security & Password
          </button>
        </div>
      </div>

      <!-- Feedback Banners -->
      <div *ngIf="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>
      <div *ngIf="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <!-- TAB 1: OVERVIEW -->
      <div *ngIf="activeTab === 'overview'" class="space-y-6">
        <!-- Hero Card with Photo -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <!-- Profile Photo -->
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ ownerInitial }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">{{ userName }}</h2>
                <span class="inline-flex items-center text-[10px] font-extrabold text-[#E26D46] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                  Verified Property Owner
                </span>
              </div>
              <p class="text-xs text-slate-500">{{ user?.email }} • +91 {{ user?.phone || '9876543210' }}</p>
              <p class="text-xs text-slate-600 font-medium pt-1">
                📍 Operating Zone: {{ user?.city || 'Warangal & Hyderabad, Telangana' }}
              </p>
            </div>
          </div>

          <!-- Photo Actions -->
          <div class="flex sm:flex-col items-center gap-2">
            <label class="px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1">
              <span>📷</span>
              <span>{{ user?.profileImage ? 'Replace Photo' : 'Upload Photo' }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onPhotoFileChange($event)" class="hidden" />
            </label>
            <button
              *ngIf="user?.profileImage"
              (click)="removePhoto()"
              type="button"
              class="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Remove Photo
            </button>
          </div>
        </div>

        <!-- Portfolio Stats Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Total Properties -->
          <div routerLink="/owner/properties" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Properties</span>
              <span class="text-xl group-hover:scale-110 transition-transform">🏢</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.totalProperties || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Manage Properties →</span>
          </div>

          <!-- Active Rentals -->
          <div routerLink="/owner/rentals" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Leases</span>
              <span class="text-xl group-hover:scale-110 transition-transform">🔑</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.activeRentals || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">View Agreements →</span>
          </div>

          <!-- Pending Applications -->
          <div routerLink="/owner/applicants" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Applicants</span>
              <span class="text-xl group-hover:scale-110 transition-transform">📋</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ metrics?.pendingApplications || 0 }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Review Applicants →</span>
          </div>
        </div>

        <!-- Verification Credentials -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span>🛡️</span>
              <span>Landlord Civic Compliance & Title Deeds</span>
            </h3>
            <span class="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Title Deed
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Dharani / Meeseva Land Title Sync</span>
              <span class="font-bold text-slate-800 text-sm">Passbook # TG-WL-884210</span>
              <p class="text-[11px] text-emerald-700 font-semibold pt-1">✓ Property ownership authenticated</p>
            </div>

            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Model Tenancy Act Biometric Escrow</span>
              <span class="font-bold text-slate-800 text-sm">Escrow Bank Acct Verified</span>
              <p class="text-[11px] text-emerald-700 font-semibold pt-1">✓ Direct digital rent collection ready</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: EDIT PROFILE -->
      <div *ngIf="activeTab === 'edit'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-extrabold text-[#0F2937]">Edit Owner Profile Details</h2>
          <p class="text-xs text-slate-500">Update your public contact info, operating cities, and landlord business details.</p>
        </div>

        <form (ngSubmit)="onSaveProfile()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Full Name</label>
              <input
                type="text"
                [(ngModel)]="editName"
                name="name"
                required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Mobile Phone Number</label>
              <input
                type="text"
                [(ngModel)]="editPhone"
                name="phone"
                required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Operating City / Region</label>
              <input
                type="text"
                [(ngModel)]="editCity"
                name="city"
                placeholder="e.g. Warangal / Hyderabad"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Property Management Organization</label>
              <input
                type="text"
                [(ngModel)]="editOccupation"
                name="occupation"
                placeholder="e.g. Individual Owner / Sharma Realties"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-3">
            <button
              (click)="activeTab = 'overview'"
              type="button"
              class="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="isSaving"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {{ isSaving ? 'Saving Changes...' : 'Save Profile Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: SECURITY & PASSWORD -->
      <div *ngIf="activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-extrabold text-[#0F2937]">Change Owner Account Password</h2>
          <p class="text-xs text-slate-500">Protect your property portfolio and sensitive tenancy agreements.</p>
        </div>

        <form (ngSubmit)="onChangePassword()" class="space-y-4 max-w-md">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Current Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">New Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Confirm New Password <span class="text-rose-500">*</span></label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div class="pt-2">
            <button
              type="submit"
              [disabled]="isSavingPassword"
              class="px-6 py-2.5 bg-[#0F2937] hover:bg-[#164E63] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {{ isSavingPassword ? 'Updating Password...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Account Actions (Logout) -->
      <div class="p-6 bg-rose-50/60 rounded-3xl border border-rose-200/80 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-rose-900">Sign Out of Owner Console</h4>
          <p class="text-[11px] text-rose-700/80">End your active session securely on this device.</p>
        </div>
        <button
          (click)="onLogout()"
          type="button"
          class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Logout Now
        </button>
      </div>
    </div>
  `,
})
export class OwnerProfileComponent implements OnInit {
  user: any = null;
  activeTab: 'overview' | 'edit' | 'security' = 'overview';
  metrics: OwnerDashboardMetrics | null = null;

  editName: string = '';
  editPhone: string = '';
  editCity: string = '';
  editOccupation: string = '';

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isSaving: boolean = false;
  isSavingPassword: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private ownerService: OwnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.populateEditFields();
    this.loadOwnerMetrics();
    this.loadRealProfile();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Property Owner';
  }

  get ownerInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'O';
  }

  private populateEditFields(): void {
    if (this.user) {
      this.editName = this.user.fullName || this.user.name || '';
      this.editPhone = this.user.phone || '';
      this.editCity = this.user.city || 'Warangal & Hyderabad';
      this.editOccupation = this.user.occupation || 'Property Investor';
    }
  }

  private loadRealProfile(): void {
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.user = { ...this.user, ...res.data };
          this.populateEditFields();
        }
      },
      error: () => {},
    });
  }

  private loadOwnerMetrics(): void {
    this.ownerService.getDashboardMetrics().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.metrics = res.data;
        }
      },
      error: () => {},
    });
  }

  onPhotoFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, WebP).';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.userService.updateProfile({ profileImage: base64 }).subscribe({
        next: () => {
          this.user.profileImage = base64;
          this.successMessage = 'Owner photo updated successfully!';
          this.errorMessage = '';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to update photo.';
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      this.userService.updateProfile({ profileImage: '' }).subscribe({
        next: () => {
          if (this.user) this.user.profileImage = null;
          this.successMessage = 'Photo removed.';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to remove photo.';
        },
      });
    }
  }

  onSaveProfile(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.editName,
      phone: this.editPhone,
      city: this.editCity,
      occupation: this.editOccupation,
    };

    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.user = { ...this.user, ...payload };
        this.successMessage = 'Owner profile updated successfully!';
        this.activeTab = 'overview';
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Failed to update profile.';
      },
    });
  }

  onChangePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.errorMessage = 'Please provide both current and new passwords.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      return;
    }

    this.isSavingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.successMessage = 'Password updated successfully!';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.activeTab = 'overview';
      },
      error: (err: any) => {
        this.isSavingPassword = false;
        this.errorMessage = err?.error?.message || 'Incorrect current password or change failed.';
      },
    });
  }

  onLogout(): void {
    if (confirm('Are you sure you want to log out?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
