import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { ServiceCategoryCode } from '../../../core/services/service-request.service';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-pro-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingStateComponent,
    CustomerCareComponent,
    SafeHtmlPipe,
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
          <h1 class="text-2xl sm:text-3xl font-semibold text-[#0F2937] tracking-tight">Services & Specializations</h1>
          <p class="text-xs text-slate-500">Configure which of the 8 service categories you are verified and equipped to handle.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/service-area"
            class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl shadow-xs transition"
          >
            <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Service Area Settings
          </a>
          <app-customer-care></app-customer-care>
        </div>
      </div>

      <!-- Success & Error Banners -->
      <div *ngIf="successMessage" class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
        <span> {{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-600 hover:text-emerald-900 cursor-pointer"></button>
      </div>

      <div *ngIf="errorMessage" class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between">
        <span><svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> {{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-600 hover:text-rose-900 cursor-pointer"></button>
      </div>

      <app-loading-state *ngIf="isLoading" message="Loading your service configuration..."></app-loading-state>

      <!-- Form Container -->
      <div *ngIf="!isLoading" class="bg-white p-6 sm:p-8 rounded-xl border border-[#E8E6DF] shadow-xs space-y-8">
        <div>
          <h2 class="text-base font-semibold text-[#0F2937]">Select Service Categories</h2>
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
            class="p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group select-none"
          >
            <div class="flex items-start justify-between">
              <span [innerHTML]="cat.icon | safeHtml" class="w-6 h-6 flex items-center justify-center text-slate-700 [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[1.8]"></span>
              <span
                [class]="isCategorySelected(cat.code) ? 'bg-[#0F2937] text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'"
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
              >
                {{ isCategorySelected(cat.code) ? '' : '+' }}
              </span>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-[#0F2937]">{{ cat.name }}</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ cat.desc }}</p>
            </div>

            <div class="pt-2 border-t border-slate-100 text-[10px] font-semibold uppercase tracking-wider">
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
            class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
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
    { code: 'PLUMBING', name: 'Plumbing', desc: 'Tap fixes, pipe leakages, bathroom fittings, drainage clearance', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' },
    { code: 'ELECTRICAL', name: 'Electrical', desc: 'Wiring, MCBs, lightings, fans, and switchboard repairs', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' },
    { code: 'CARPENTRY', name: 'Carpentry', desc: 'Door locks, hinges, custom woodwork, and furniture fixes', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
    { code: 'PAINTING', name: 'Painting', desc: 'Touchup painting, full wall coating, and waterproofing solutions', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.7 0 1.34.18 1.9.5L18 4.6a2 2 0 012.8 2.8L11.9 16.3c.3.56.5 1.2.5 1.9a4 4 0 01-4 4z"/></svg>' },
    { code: 'CLEANING', name: 'Cleaning', desc: 'Deep home cleaning, sofa, carpet, and kitchen sanitation', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>' },
    { code: 'AC_APPLIANCE', name: 'AC & Appliance', desc: 'Air conditioner servicing, fridge, and washing machine repair', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' },
    { code: 'WATER_FILTER', name: 'Water Filter', desc: 'RO filter replacement, servicing, and TDS testing', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>' },
    { code: 'GENERAL_MAINTENANCE', name: 'General Maintenance', desc: 'Handyman services, tile repairs, and overall property upkeep', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' },
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
