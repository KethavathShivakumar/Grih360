import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PropertyService } from '../../../core/services/property.service';
import { ApplicationService } from '../../../core/services/application.service';

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Tenant Account & Profile</h1>
          <p class="text-xs text-slate-500">Manage your profile details, photo, security settings, and verified tenancy documents.</p>
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

      <!-- Success / Error Banners -->
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
        <!-- Hero Card with Photo Management -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <!-- Profile Photo with Default Placeholder and Upload Actions -->
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">{{ userName }}</h2>
                <span
                  *ngIf="verificationState === 'verified'"
                  class="inline-flex items-center text-[10px] font-extrabold text-[#2D7A5E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide"
                >
                  Verified Tenant
                </span>
                <span
                  *ngIf="verificationState !== 'verified'"
                  class="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide"
                >
                  Tenant
                </span>
              </div>
              <p class="text-xs text-slate-500">{{ user?.email }} • +91 {{ user?.phone || 'Not set' }}</p>
              <p class="text-xs text-slate-600 font-medium pt-1">
                📍 {{ user?.city || 'Hyderabad, Telangana' }} • 💼 {{ user?.occupation || 'Software Professional' }}
              </p>
            </div>
          </div>

          <!-- Photo Action Buttons -->
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

        <!-- Tenancy Portfolio Stats Summary (Requirement #6) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Saved Homes -->
          <div routerLink="/tenant/saved" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bookmarked Homes</span>
              <span class="text-xl group-hover:scale-110 transition-transform">❤️</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ savedCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">View Saved Listings →</span>
          </div>

          <!-- Applications Summary -->
          <div routerLink="/tenant/applications" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted Applications</span>
              <span class="text-xl group-hover:scale-110 transition-transform">📄</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">{{ applicationCount }}</span>
            <span class="text-xs text-[#2D7A5E] font-bold mt-1 block">Track Applications →</span>
          </div>

          <!-- Active Rental Agreement Summary -->
          <div routerLink="/tenant/rental" class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs hover:border-[#2D7A5E] transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rental Agreements</span>
              <span class="text-xl group-hover:scale-110 transition-transform">🔑</span>
            </div>
            <span class="text-3xl font-black text-[#0F2937] mt-2 block">1</span>
            <span class="text-xs text-slate-400 font-bold mt-1 block">Model Tenancy Act Compliant</span>
          </div>
        </div>

        <!-- Identity & Document Verification Section -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider flex items-center gap-2">
              <span>🛡️</span>
              <span>Identity & Document Verification</span>
            </h3>
            <span [ngClass]="verificationBadgeClass" class="text-xs font-extrabold px-2.5 py-1 rounded-full border">
              {{ verificationStateLabel }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <!-- Government ID Status Card -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Government Photo ID</span>
                <span class="font-bold text-slate-800 text-sm block">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'" class="text-emerald-700">✓ ID Verified</span>
                    <span *ngSwitchCase="'pending_review'" class="text-amber-700">⏳ ID Document Under Review</span>
                    <span *ngSwitchCase="'rejected'" class="text-rose-700">⚠️ ID Document Rejected</span>
                    <span *ngSwitchDefault class="text-slate-600">ID Document: Not Submitted</span>
                  </ng-container>
                </span>
                <p class="text-[11px] text-slate-500 pt-0.5">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'">Verified for digital tenancy agreements.</span>
                    <span *ngSwitchCase="'pending_review'">Document received and pending administrative compliance check.</span>
                    <span *ngSwitchCase="'rejected'">Your submission was rejected. Please re-upload a valid government ID.</span>
                    <span *ngSwitchDefault>Passport, Voter ID, or Driving License.</span>
                  </ng-container>
                </p>
              </div>
              <div *ngIf="verificationState === 'not_submitted' || verificationState === 'rejected'">
                <a
                  routerLink="/tenant/verification"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-[11px] font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <span>📄</span>
                  <span>Upload Document</span>
                </a>
              </div>
            </div>

            <!-- Employment / Income Proof Status Card -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Employment & Income Proof</span>
                <span class="font-bold text-slate-800 text-sm block">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'" class="text-emerald-700">✓ Income Proof Verified</span>
                    <span *ngSwitchCase="'pending_review'" class="text-amber-700">⏳ Income Proof Under Review</span>
                    <span *ngSwitchCase="'rejected'" class="text-rose-700">⚠️ Income Proof Rejected</span>
                    <span *ngSwitchDefault class="text-slate-600">Income Proof: Not Submitted</span>
                  </ng-container>
                </span>
                <p class="text-[11px] text-slate-500 pt-0.5">
                  <ng-container [ngSwitch]="verificationState">
                    <span *ngSwitchCase="'verified'">Salary slip / employment status verified.</span>
                    <span *ngSwitchCase="'pending_review'">Salary slip or bank statement under review.</span>
                    <span *ngSwitchCase="'rejected'">Document was rejected. Please re-upload a valid salary slip.</span>
                    <span *ngSwitchDefault>Upload salary slip or offer letter to verify rent eligibility.</span>
                  </ng-container>
                </p>
              </div>
              <div *ngIf="verificationState === 'not_submitted' || verificationState === 'rejected'">
                <a
                  routerLink="/tenant/verification"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2937] hover:bg-[#164E63] text-white text-[11px] font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <span>📄</span>
                  <span>Upload Document</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: EDIT PROFILE -->
      <div *ngIf="activeTab === 'edit'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-extrabold text-[#0F2937]">Edit Tenant Information</h2>
          <p class="text-xs text-slate-500">Update your public contact info, occupation, and preferred residential city.</p>
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
              <label class="text-xs font-bold text-slate-700 block">Current City / Locality</label>
              <input
                type="text"
                [(ngModel)]="editCity"
                name="city"
                placeholder="e.g. Hyderabad / Warangal"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Occupation / Organization</label>
              <input
                type="text"
                [(ngModel)]="editOccupation"
                name="occupation"
                placeholder="e.g. Software Engineer / Consultant"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">About / Tenant Bio</label>
            <textarea
              [(ngModel)]="editBio"
              name="bio"
              rows="3"
              placeholder="Brief details for property owners (family size, move-in preferences, non-smoker, etc.)..."
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            ></textarea>
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
          <h2 class="text-base font-extrabold text-[#0F2937]">Change Account Password</h2>
          <p class="text-xs text-slate-500">Ensure your account is protected with a secure password.</p>
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
          <h4 class="text-xs font-bold text-rose-900">Sign Out of Account</h4>
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
export class TenantProfileComponent implements OnInit {
  user: any = null;
  activeTab: 'overview' | 'edit' | 'security' = 'overview';

  savedCount: number = 0;
  applicationCount: number = 0;

  editName: string = '';
  editPhone: string = '';
  editCity: string = '';
  editOccupation: string = '';
  editBio: string = '';

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
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.populateEditFields();
    this.loadStats();
    this.loadRealProfile();
  }

  get userName(): string {
    return this.user?.fullName || this.user?.name || 'Tenant User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase() || 'T';
  }

  get verificationState(): 'not_submitted' | 'pending_review' | 'verified' | 'rejected' {
    const rawStatus = (this.user?.identityVerificationStatus || '').toUpperCase();
    if (rawStatus === 'VERIFIED') return 'verified';
    if (rawStatus === 'PENDING' || rawStatus === 'UNDER_REVIEW') return 'pending_review';
    if (rawStatus === 'REJECTED') return 'rejected';
    return 'not_submitted';
  }

  get verificationStateLabel(): string {
    switch (this.verificationState) {
      case 'verified':
        return 'Verified';
      case 'pending_review':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Submitted';
    }
  }

  get verificationBadgeClass(): string {
    switch (this.verificationState) {
      case 'verified':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'pending_review':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'rejected':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  }

  private populateEditFields(): void {
    if (this.user) {
      this.editName = this.user.fullName || this.user.name || '';
      this.editPhone = this.user.phone || '';
      this.editCity = this.user.city || 'Hyderabad';
      this.editOccupation = this.user.occupation || 'Software Professional';
      this.editBio = this.user.bio || '';
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

  private loadStats(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedCount = res.data.length;
        }
      },
    });

    this.applicationService.getApplications().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.applicationCount = res.data.length;
        }
      },
    });
  }

  onPhotoFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, WebP).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Profile photo file size must be less than 5MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.userService.updateProfile({ profileImage: base64 }).subscribe({
        next: (res: any) => {
          this.user.profileImage = base64;
          this.successMessage = 'Profile photo updated successfully!';
          this.errorMessage = '';
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Failed to upload photo.';
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
          this.successMessage = 'Profile photo removed.';
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
      bio: this.editBio,
    };

    this.userService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.user = { ...this.user, ...payload };
        this.successMessage = 'Profile updated successfully!';
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
        this.successMessage = 'Password changed successfully!';
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
