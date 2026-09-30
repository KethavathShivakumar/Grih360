import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-pro-availability',
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
            <span class="text-[#0F2937]">Availability & Duty</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Availability & Shift Status</h1>
          <p class="text-xs text-slate-500">Toggle whether you are actively on-duty and accepting real-time automated job matches.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/active-job"
            class="px-4 py-2 bg-[#0F2937] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            ⚡ View Active Work
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

      <app-loading-state *ngIf="isLoading" message="Fetching availability status..."></app-loading-state>

      <!-- Main Status Card -->
      <div *ngIf="!isLoading && profile" class="space-y-6">
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div class="flex items-center space-x-4">
              <div
                [class]="profile.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
              >
                {{ profile.isAvailable ? '🟢' : '🔴' }}
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Duty Status</span>
                <h2 class="text-xl sm:text-2xl font-black text-[#0F2937]">
                  {{ profile.isAvailable ? 'On-Duty: Accepting Job Requests' : 'Off-Duty: Temporarily Unavailable' }}
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ profile.isAvailable ? 'You are receiving automated matches for customer service requests in your area.' : 'You will not receive any new service job assignments until you toggle back online.' }}
                </p>
              </div>
            </div>

            <!-- Instant Toggle Button -->
            <button
              (click)="toggleStatus()"
              [disabled]="isUpdating"
              type="button"
              [class]="profile.isAvailable ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-[#2D7A5E] hover:bg-[#206f54] text-white'"
              class="px-8 py-3.5 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {{ isUpdating ? 'Updating Status...' : (profile.isAvailable ? 'Turn OFF Duty (Go Offline)' : 'Turn ON Duty (Accept Jobs)') }}
            </button>
          </div>

          <!-- Algorithm Explanation Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">🎯</span>
                <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Automated Dispatch</h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                When online, incoming requests from nearby tenants within your service radius matching your categories are automatically assigned to you.
              </p>
            </div>

            <div class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">⚡</span>
                <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Fast Response SLA</h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                Aim to review and accept assigned requests within 15 minutes to maintain a top matching rank and high customer satisfaction ratings.
              </p>
            </div>

            <div class="p-4 bg-[#FAF9F5] border border-[#E8E6DF] rounded-2xl space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">🛡️</span>
                <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider">Fair Assignment Policy</h3>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                No fake completed jobs or fictitious assignments. Every request matches real tenant residences with genuine maintenance requirements.
              </p>
            </div>
          </div>
        </div>

        <!-- Weekly Operating Schedule -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-black text-[#0F2937]">Operating Hours & Days</h3>
            <span class="text-xs text-[#2D7A5E] font-bold">Standard Network Hours: 08:00 AM – 08:00 PM</span>
          </div>
          <p class="text-xs text-slate-500">
            Tenants schedule appointments primarily between 09:00 AM to 08:00 PM. Keep your status online during these peak hours for maximum bookings.
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2 text-center text-xs font-bold">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">MON</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">TUE</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">WED</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">THU</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">FRI</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span class="block text-[10px] text-emerald-600 font-extrabold">SAT</span>
              <span>Available</span>
            </div>
            <div class="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600">
              <span class="block text-[10px] text-slate-400 font-extrabold">SUN</span>
              <span>Optional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProAvailabilityComponent implements OnInit {
  public profile?: ProfessionalProfile;
  public isLoading: boolean = true;
  public isUpdating: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(private proService: ProfessionalService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.isLoading = true;
    this.proService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load availability';
        this.isLoading = false;
      },
    });
  }

  public toggleStatus(): void {
    if (!this.profile) return;
    const newStatus = !this.profile.isAvailable;
    this.isUpdating = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.proService.toggleAvailability(newStatus).subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isUpdating = false;
        this.successMessage = `Availability updated to ${newStatus ? 'ON-DUTY (Available)' : 'OFF-DUTY (Offline)'}!`;
      },
      error: (err) => {
        this.isUpdating = false;
        this.errorMessage = err.error?.message || 'Failed to update availability';
      },
    });
  }
}
