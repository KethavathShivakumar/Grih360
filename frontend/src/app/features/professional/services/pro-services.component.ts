import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { ServiceCategoryCode } from '../../../core/services/service-request.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-pro-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomerCareComponent,
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
            <span class="text-[#0F2937]">Offered Services</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Services & Specializations</h1>
          <p class="text-xs text-slate-500">Configure which of the 8 service categories you are verified and equipped to handle.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/service-area"
            class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl shadow-xs transition"
          >
            📍 Service Area Settings
          </a>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <!-- Success & Error Banners -->
      <div *ngIf="successMessage" class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>✓ {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
      </div>

      <div *ngIf="errorMessage" class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading your service configuration..."></app-loading-state>

      <!-- Form Container -->
      <div *ngIf="!isLoading" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-8">
        <div>
          <h2 class="text-base font-black text-[#0F2937]">Select Service Categories</h2>
          <p class="text-xs text-slate-500 mt-1">
            You will only receive automatic job matches and assignments for categories selected below.
          </p>
        </div>

        <!-- 8 Canonical Categories Bento Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            *ngFor="let cat of availableCategories"
            (click)="toggleCategory(cat.code)"
            [class]="isCategorySelected(cat.code) ? 'border-[#0F2937] bg-[#FAF9F5] ring-2 ring-[#0F2937]/10' : 'border-[#E8E6DF] hover:border-slate-400 bg-white'"
            class="p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group select-none"
          >
            <div class="flex items-start justify-between">
              <span class="text-2xl">{{ cat.icon }}</span>
              <span
                [class]="isCategorySelected(cat.code) ? 'bg-[#0F2937] text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'"
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors"
              >
                {{ isCategorySelected(cat.code) ? '✓' : '+' }}
              </span>
            </div>

            <div>
              <h3 class="text-sm font-black text-[#0F2937]">{{ cat.name }}</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ cat.desc }}</p>
            </div>

            <div class="pt-2 border-t border-slate-100 text-[10px] font-extrabold uppercase tracking-wider">
              <span [class]="isCategorySelected(cat.code) ? 'text-[#2D7A5E]' : 'text-slate-400'">
                {{ isCategorySelected(cat.code) ? '● Active' : '○ Not selected' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Experience & Bio Settings -->
        <div class="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Experience (Years) *</label>
            <input
              type="number"
              min="1"
              max="50"
              [(ngModel)]="experienceYears"
              class="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-sm font-bold text-[#0F2937] focus:outline-none focus:border-[#0F2937]"
            />
            <span class="text-[10px] text-slate-400 block">Total professional trade experience</span>
          </div>

          <div class="sm:col-span-2 space-y-1.5">
            <label class="block text-xs font-bold text-[#0F2937] uppercase tracking-wider">Professional Bio & Specializations</label>
            <textarea
              [(ngModel)]="bio"
              rows="3"
              placeholder="Highlight your trade certifications, tool sets, and specializations (e.g. Master certified in PPR/CPVC plumbing, RO filter membranes, and home appliance motor overhaul)..."
              class="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs text-[#0F2937] focus:outline-none focus:border-[#0F2937]"
            ></textarea>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <span class="text-xs text-slate-500 font-semibold">
            {{ selectedCategories.length }} of 8 categories selected
          </span>

          <button
            (click)="saveServices()"
            [disabled]="isSaving"
            type="button"
            class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isSaving ? 'Saving Changes...' : 'Save Services & Experience' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProServicesComponent implements OnInit {
  public profile?: ProfessionalProfile;
  public selectedCategories: ServiceCategoryCode[] = [];
  public experienceYears: number = 3;
  public bio: string = '';

  public isLoading: boolean = true;
  public isSaving: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  public availableCategories: { code: ServiceCategoryCode; name: string; desc: string; icon: string }[] = [
    { code: 'PLUMBING', name: 'Plumbing', desc: 'Tap fixes, pipe leakages, bathroom fittings, drainage clearance', icon: '🔧' },
    { code: 'ELECTRICAL', name: 'Electrical', desc: 'Wiring, MCBs, lightings, fans, and switchboard repairs', icon: '⚡' },
    { code: 'CARPENTRY', name: 'Carpentry', desc: 'Door locks, hinges, custom woodwork, and furniture fixes', icon: '🪵' },
    { code: 'PAINTING', name: 'Painting', desc: 'Touchup painting, full wall coating, and waterproofing solutions', icon: '🎨' },
    { code: 'CLEANING', name: 'Cleaning', desc: 'Deep home cleaning, sofa, carpet, and kitchen sanitation', icon: '✨' },
    { code: 'AC_APPLIANCE', name: 'AC & Appliance', desc: 'Air conditioner servicing, fridge, and washing machine repair', icon: '❄️' },
    { code: 'WATER_FILTER', name: 'Water Filter', desc: 'RO filter replacement, servicing, and TDS testing', icon: '💧' },
    { code: 'GENERAL_MAINTENANCE', name: 'General Maintenance', desc: 'Handyman services, tile repairs, and overall property upkeep', icon: '⚙️' },
  ];

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.isLoading = true;
    this.proService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.selectedCategories = (this.profile?.categories || []) as ServiceCategoryCode[];
        this.experienceYears = this.profile?.experienceYears || 3;
        this.bio = this.profile?.bio || '';
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load professional profile';
        this.isLoading = false;
      },
    });
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

  public saveServices(): void {
    if (this.selectedCategories.length === 0) {
      this.errorMessage = 'Please select at least one service category.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.proService
      .updateMyProfile({
        categories: this.selectedCategories,
        experienceYears: Number(this.experienceYears),
        bio: this.bio,
      })
      .subscribe({
        next: (res) => {
          this.profile = res.data;
          this.isSaving = false;
          this.successMessage = 'Service categories and experience updated successfully!';
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.message || 'Failed to update services';
        },
      });
  }
}
