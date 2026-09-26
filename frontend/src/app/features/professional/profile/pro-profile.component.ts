import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { ServiceCategoryCode } from '../../../core/services/service-request.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-pro-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold text-[#64748B] mb-1">
            <a routerLink="/professional/dashboard" class="hover:text-[#0F2937]">Professional Dashboard</a>
            <span>/</span>
            <span class="text-[#0F2937]">Profile & Service Settings</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Professional Profile & Services</h1>
          <p class="text-xs text-slate-500">Manage business details, categories served, service radius, and customer reviews.</p>
        </div>
        <div class="flex items-center space-x-2">
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
            Edit Profile & Services
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

      <app-loading-state *ngIf="isLoading" message="Loading professional profile..."></app-loading-state>

      <!-- TAB 1: OVERVIEW -->
      <div *ngIf="!isLoading && activeTab === 'overview'" class="space-y-6">
        <!-- Hero Card with Photo Management -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <!-- Profile Photo with Default Placeholder and Upload Actions -->
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-[#0F2937] text-[#FACC15] flex items-center justify-center font-extrabold text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
                <img *ngIf="user?.profileImage" [src]="user?.profileImage" [alt]="userName" class="w-full h-full object-cover" />
                <span *ngIf="!user?.profileImage">{{ userInitial }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">{{ userName }}</h2>
                <span [class]="getVerificationClass(profile?.verificationStatus || 'PENDING')">
                  {{ profile?.verificationStatus || 'VERIFIED PRO' }}
                </span>
                <span *ngIf="profile?.isAvailable" class="inline-flex items-center text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ● Available for Jobs
                </span>
                <span *ngIf="!profile?.isAvailable" class="inline-flex items-center text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  ○ On Leave
                </span>
              </div>
              <p class="text-xs text-slate-600 font-bold">{{ profile?.businessName || 'Certified Trade Specialist' }}</p>
              <p class="text-xs text-slate-500">{{ user?.email }} • +91 {{ user?.phone || 'Not set' }}</p>
              <p class="text-xs text-slate-600 font-medium pt-1">
                📍 Serving {{ serviceAreasStr || 'Hyderabad & Warangal' }} ({{ profile?.serviceRadiusKm || 15 }} km radius)
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
            <button
              (click)="toggleAvailability()"
              type="button"
              [class]="profile?.isAvailable ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'"
              class="px-3 py-1.5 border text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {{ profile?.isAvailable ? 'Set as On Leave' : 'Set as Available' }}
            </button>
          </div>
        </div>

        <!-- Performance & Job Statistics Bento -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating</span>
            <div class="flex items-center space-x-1.5 mt-2">
              <span class="text-2xl font-black text-[#2D7A5E]">⭐ {{ profile?.rating || '5.0' }}</span>
              <span class="text-xs text-slate-400">/ 5.0</span>
            </div>
            <span class="text-xs text-slate-500 font-medium mt-1 block">Based on {{ profile?.reviewCount || 14 }} reviews</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience</span>
            <span class="text-2xl font-black text-[#0F2937] mt-2 block">{{ profile?.experienceYears || 5 }} Years</span>
            <span class="text-xs text-slate-500 font-medium mt-1 block">Field Experience</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Service Categories</span>
            <span class="text-2xl font-black text-[#0F2937] mt-2 block">{{ profile?.categories?.length || 2 }}</span>
            <span class="text-xs text-slate-500 font-medium mt-1 block">Active Trades</span>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verification</span>
            <span class="text-lg font-black text-[#2D7A5E] mt-2 block">ID Verified</span>
            <span class="text-xs text-slate-500 font-medium mt-1 block">Aadhaar & Trade License</span>
          </div>
        </div>

        <!-- Services & Reviews Bento -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Active Services -->
          <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-black text-[#0F2937]">Active Service Categories</h3>
              <button (click)="activeTab = 'edit'" class="text-xs text-[#2D7A5E] font-bold hover:underline cursor-pointer">
                Manage Services
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let cat of profile?.categories" class="px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs font-bold text-[#0F2937]">
                {{ getCategoryLabel(cat) }}
              </span>
              <span *ngIf="!profile?.categories?.length" class="text-xs text-slate-400 italic">No categories assigned yet.</span>
            </div>
            <div class="pt-2">
              <h4 class="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Professional Bio</h4>
              <p class="text-xs text-slate-600 leading-relaxed bg-[#FAF9F5] p-3.5 rounded-2xl border border-slate-100">
                {{ profile?.bio || 'Certified technician providing prompt home maintenance and installations with transparent pricing.' }}
              </p>
            </div>
          </div>

          <!-- Customer Reviews Feed -->
          <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-black text-[#0F2937]">Customer Reviews</h3>
              <span class="text-xs text-slate-400 font-medium">{{ reviews.length }} reviews</span>
            </div>

            <div *ngIf="reviews.length === 0" class="text-xs text-slate-500 text-center py-6 bg-[#FAF9F5] rounded-2xl border border-dashed border-slate-200">
              No customer reviews yet. Ratings are submitted upon completion of service requests.
            </div>

            <div *ngIf="reviews.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div *ngFor="let rev of reviews" class="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DF] space-y-1 text-xs">
                <div class="flex items-center justify-between font-bold text-[#0F2937]">
                  <span class="text-[#2D7A5E]">⭐ {{ rev.rating }} / 5</span>
                  <span class="text-[10px] text-slate-400">{{ rev.createdAt | date: 'mediumDate' }}</span>
                </div>
                <p class="text-slate-600 italic">"{{ rev.comment }}"</p>
                <div class="text-[10px] text-slate-500 font-semibold">&mdash; {{ rev.reviewerId?.name || 'Verified Tenant' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs flex items-center justify-between">
          <div>
            <h4 class="text-sm font-bold text-slate-900">Sign Out</h4>
            <p class="text-xs text-slate-500">Sign out of your professional workspace securely.</p>
          </div>
          <button
            (click)="onLogout()"
            type="button"
            class="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <!-- TAB 2: EDIT PROFILE & SERVICES -->
      <div *ngIf="!isLoading && activeTab === 'edit'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
        <div>
          <h2 class="text-lg font-black text-[#0F2937]">Edit Professional Details & Services</h2>
          <p class="text-xs text-slate-500">Update your trade credentials, contact numbers, and service radius.</p>
        </div>

        <form (ngSubmit)="onSaveProfile()" class="space-y-5 text-xs text-[#0F2937]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Full Name *</label>
              <input
                type="text"
                [(ngModel)]="editName"
                name="editName"
                required
                class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold text-sm outline-none focus:border-[#0F2937]"
              />
            </div>
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Business / Trade Name *</label>
              <input
                type="text"
                [(ngModel)]="businessName"
                name="businessName"
                required
                placeholder="e.g. Hyderabad Precision Electricals"
                class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold text-sm outline-none focus:border-[#0F2937]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Phone Number (10 digits) *</label>
              <input
                type="tel"
                [(ngModel)]="editPhone"
                name="editPhone"
                required
                class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold text-sm outline-none focus:border-[#0F2937]"
              />
            </div>
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Email Address (Read-only)</label>
              <input
                type="email"
                [value]="user?.email"
                disabled
                class="w-full p-3 bg-slate-100 border border-[#E8E6DF] rounded-xl font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Categories Checklist -->
          <div class="space-y-2">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">Categories Served (Select all that apply) *</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <label *ngFor="let cat of allCategories" class="flex items-center space-x-2.5 p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl cursor-pointer hover:border-[#0F2937] transition">
                <input
                  type="checkbox"
                  [checked]="isCategorySelected(cat.code)"
                  (change)="toggleCategory(cat.code)"
                  class="rounded text-[#0F2937] h-4 w-4"
                />
                <span class="font-bold text-xs">{{ cat.label }}</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Years of Experience</label>
              <input
                type="number"
                [(ngModel)]="experienceYears"
                name="experienceYears"
                min="0"
                class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold outline-none focus:border-[#0F2937]"
              />
            </div>
            <div class="space-y-1">
              <label class="font-bold uppercase text-[11px] text-[#64748B]">Service Radius (Km)</label>
              <input
                type="number"
                [(ngModel)]="serviceRadiusKm"
                name="serviceRadiusKm"
                min="1"
                class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold outline-none focus:border-[#0F2937]"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">Service Areas / Localities (Comma separated)</label>
            <input
              type="text"
              [(ngModel)]="serviceAreasStr"
              name="serviceAreasStr"
              placeholder="Gachibowli, Hitec City, Kondapur, Warangal..."
              class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-medium outline-none focus:border-[#0F2937]"
            />
          </div>

          <div class="space-y-1">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">Bio & Experience Summary</label>
            <textarea
              [(ngModel)]="bio"
              name="bio"
              rows="3"
              placeholder="Share your specialization, certifications, or past project highlights..."
              class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-normal outline-none focus:border-[#0F2937]"
            ></textarea>
          </div>

          <div class="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              [disabled]="isSaving"
              class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {{ isSaving ? 'Saving Changes...' : 'Save Profile Changes' }}
            </button>
            <button
              type="button"
              (click)="activeTab = 'overview'"
              class="px-5 py-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: SECURITY & PASSWORD -->
      <div *ngIf="!isLoading && activeTab === 'security'" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
        <div>
          <h2 class="text-lg font-black text-[#0F2937]">Account Security & Password</h2>
          <p class="text-xs text-slate-500">Keep your professional credentials secure with regular password updates.</p>
        </div>

        <form (ngSubmit)="onChangePassword()" class="space-y-4 max-w-md text-xs text-[#0F2937]">
          <div class="space-y-1">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">Current Password *</label>
            <input
              type="password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold outline-none focus:border-[#0F2937]"
            />
          </div>

          <div class="space-y-1">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">New Password (min 8 chars) *</label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="8"
              class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold outline-none focus:border-[#0F2937]"
            />
          </div>

          <div class="space-y-1">
            <label class="font-bold uppercase text-[11px] text-[#64748B]">Confirm New Password *</label>
            <input
              type="password"
              [(ngModel)]="confirmNewPassword"
              name="confirmNewPassword"
              required
              class="w-full p-3 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl font-bold outline-none focus:border-[#0F2937]"
            />
          </div>

          <div class="pt-2">
            <button
              type="submit"
              [disabled]="isChangingPassword || !currentPassword || !newPassword"
              class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {{ isChangingPassword ? 'Updating Password...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ProProfileComponent implements OnInit {
  public activeTab: 'overview' | 'edit' | 'security' = 'overview';
  public user?: User | null;
  public profile?: ProfessionalProfile;
  public reviews: any[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public successMessage: string = '';

  public editName: string = '';
  public editPhone: string = '';
  public businessName: string = '';
  public selectedCategories: ServiceCategoryCode[] = [];
  public experienceYears: number = 1;
  public serviceRadiusKm: number = 15;
  public serviceAreasStr: string = '';
  public bio: string = '';

  public currentPassword: string = '';
  public newPassword: string = '';
  public confirmNewPassword: string = '';
  public isChangingPassword: boolean = false;

  public isSaving: boolean = false;

  public allCategories: { code: ServiceCategoryCode; label: string }[] = [
    { code: 'PLUMBING', label: '🔧 Plumbing' },
    { code: 'ELECTRICAL', label: '⚡ Electrical' },
    { code: 'CARPENTRY', label: '🪵 Carpentry' },
    { code: 'PAINTING', label: '🎨 Painting' },
    { code: 'CLEANING', label: '✨ Cleaning' },
    { code: 'AC_APPLIANCE', label: '❄️ AC & Appliance' },
    { code: 'WATER_FILTER', label: '💧 Water Filter' },
    { code: 'GENERAL_MAINTENANCE', label: '⚙️ Maintenance' },
  ];

  constructor(
    private proService: ProfessionalService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  public get userName(): string {
    return this.user?.name || 'Service Professional';
  }

  public get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Fetch user profile and pro profile
    this.userService.getProfile().subscribe({
      next: (userRes) => {
        this.user = userRes.data;
        this.editName = this.user?.name || '';
        this.editPhone = this.user?.phone || '';

        this.proService.getMyProfile().subscribe({
          next: (proRes) => {
            this.profile = proRes.data;
            this.businessName = this.profile.businessName || '';
            this.selectedCategories = [...(this.profile.categories || [])];
            this.experienceYears = this.profile.experienceYears || 5;
            this.serviceRadiusKm = this.profile.serviceRadiusKm || 15;
            this.serviceAreasStr = (this.profile.serviceAreas || []).join(', ');
            this.bio = this.profile.bio || '';

            const proUserId = this.profile.userId?._id || this.profile.userId?.id || this.profile.userId;
            if (proUserId) {
              this.loadReviews(proUserId);
            } else {
              this.isLoading = false;
            }
          },
          error: () => {
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load profile';
        this.isLoading = false;
      },
    });
  }

  private loadReviews(proUserId: string): void {
    this.proService.getReviews(proUserId).subscribe({
      next: (res) => {
        this.reviews = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  public getCategoryLabel(code: ServiceCategoryCode): string {
    const match = this.allCategories.find((c) => c.code === code);
    return match ? match.label : code;
  }

  public isCategorySelected(code: ServiceCategoryCode): boolean {
    return this.selectedCategories.includes(code);
  }

  public toggleCategory(code: ServiceCategoryCode): void {
    if (this.isCategorySelected(code)) {
      this.selectedCategories = this.selectedCategories.filter((c) => c !== code);
    } else {
      this.selectedCategories.push(code);
    }
  }

  public toggleAvailability(): void {
    if (!this.profile) return;
    const newStatus = !this.profile.isAvailable;
    this.proService.toggleAvailability(newStatus).subscribe({
      next: (res) => {
        this.profile = res.data;
        this.successMessage = `Availability updated: ${newStatus ? 'Available for Jobs' : 'On Leave'}`;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update availability';
      },
    });
  }

  public getVerificationClass(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'inline-flex items-center text-[10px] font-extrabold text-[#2D7A5E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide';
      case 'PENDING':
        return 'inline-flex items-center text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide';
      default:
        return 'inline-flex items-center text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide';
    }
  }

  public onPhotoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.errorMessage = 'Please upload a valid image (JPEG, PNG, WebP).';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Profile image must be less than 2 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      this.userService.updateProfile({ profileImage: base64Data }).subscribe({
        next: (res) => {
          if (this.user) {
            this.user.profileImage = res.data.profileImage;
          }
          this.successMessage = 'Profile photo updated successfully.';
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to save profile photo.';
        },
      });
    };
    reader.readAsDataURL(file);
  }

  public removePhoto(): void {
    this.userService.updateProfile({ profileImage: '' }).subscribe({
      next: () => {
        if (this.user) {
          this.user.profileImage = undefined;
        }
        this.successMessage = 'Profile photo removed.';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to remove profile photo.';
      },
    });
  }

  public onSaveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    const areas = this.serviceAreasStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const proPayload = {
      businessName: this.businessName,
      categories: this.selectedCategories,
      experienceYears: Number(this.experienceYears),
      serviceRadiusKm: Number(this.serviceRadiusKm),
      serviceAreas: areas,
      bio: this.bio,
    };

    // Update Pro Profile and User profile
    this.proService.updateMyProfile(proPayload).subscribe({
      next: (proRes) => {
        this.profile = proRes.data;
        this.userService.updateProfile({ name: this.editName, phone: this.editPhone }).subscribe({
          next: (userRes) => {
            this.user = userRes.data;
            this.isSaving = false;
            this.successMessage = 'Professional profile details saved successfully.';
            this.activeTab = 'overview';
          },
          error: (err) => {
            this.isSaving = false;
            this.errorMessage = err.error?.message || 'Failed to update personal details.';
          },
        });
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Failed to update service profile.';
      },
    });
  }

  public onChangePassword(): void {
    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'New password and confirmation do not match.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.successMessage = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.activeTab = 'overview';
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.errorMessage = err.error?.message || 'Failed to change password. Please check your current password.';
      },
    });
  }

  public onLogout(): void {
    if (confirm('Are you sure you want to log out of your Nivas360 account?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
