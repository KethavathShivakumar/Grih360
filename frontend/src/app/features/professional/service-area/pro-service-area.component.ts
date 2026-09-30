import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfessionalService, ProfessionalProfile } from '../../../core/services/professional.service';
import { CustomerCareComponent } from '../../../shared/components/customer-care/customer-care.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-pro-service-area',
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
            <span class="text-[#0F2937]">Service Area</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] tracking-tight">Service Coverage & Radius</h1>
          <p class="text-xs text-slate-500">Define your primary operating cities, localities, and travel radius.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a
            routerLink="/professional/services"
            class="px-4 py-2 bg-white border border-[#E8E6DF] hover:bg-[#FAF9F5] text-[#0F2937] text-xs font-bold rounded-xl shadow-xs transition"
          >
            🛠️ Offered Services
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

      <app-loading-state *ngIf="isLoading" message="Fetching coverage configuration..."></app-loading-state>

      <div *ngIf="!isLoading" class="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-8">
        <!-- Service Radius Slider / Select -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-black text-[#0F2937]">Maximum Travel Radius</h2>
              <p class="text-xs text-slate-500">Only service requests within this distance from your base will be assigned to you.</p>
            </div>
            <span class="px-4 py-1.5 bg-[#FAF9F5] border border-[#E8E6DF] text-sm font-black text-[#2D7A5E] rounded-xl">
              {{ serviceRadiusKm }} km Radius
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <button
              *ngFor="let r of radiusOptions"
              (click)="serviceRadiusKm = r"
              type="button"
              [class]="serviceRadiusKm === r ? 'bg-[#0F2937] text-white border-[#0F2937]' : 'bg-[#FAF9F5] text-slate-700 border-[#E8E6DF] hover:bg-slate-100'"
              class="p-4 rounded-2xl border text-center transition cursor-pointer"
            >
              <span class="block text-lg font-black">{{ r }} km</span>
              <span class="text-[10px] opacity-75 font-semibold">{{ getRadiusDescription(r) }}</span>
            </button>
          </div>
        </div>

        <!-- Operating Cities -->
        <div class="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <h2 class="text-base font-black text-[#0F2937]">Active Operating Cities</h2>
            <p class="text-xs text-slate-500">Select all metro hubs and cities where you operate regular service routes.</p>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <button
              *ngFor="let city of commonCities"
              (click)="toggleCity(city)"
              type="button"
              [class]="hasArea(city) ? 'bg-[#2D7A5E] text-white border-[#2D7A5E]' : 'bg-[#FAF9F5] text-slate-700 border-[#E8E6DF] hover:border-slate-400'"
              class="px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer"
            >
              {{ hasArea(city) ? '✓ ' : '+ ' }}{{ city }}
            </button>
          </div>
        </div>

        <!-- Custom Localities / Local Areas -->
        <div class="space-y-3 pt-6 border-t border-slate-100">
          <div>
            <h2 class="text-base font-black text-[#0F2937]">Preferred Localities & Neighborhoods</h2>
            <p class="text-xs text-slate-500">Add specific postal localities (e.g. Banjara Hills, Gachibowli, Madhapur, Hitec City, Jubilee Hills, Secunderabad).</p>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="newAreaInput"
              (keyup.enter)="addArea()"
              placeholder="Type locality name (e.g. Kondapur, Kukatpally) and press Enter"
              class="flex-1 px-4 py-2.5 bg-[#FAF9F5] border border-[#E8E6DF] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0F2937]"
            />
            <button
              (click)="addArea()"
              type="button"
              class="px-5 py-2.5 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              + Add
            </button>
          </div>

          <!-- Active Area Chips -->
          <div *ngIf="serviceAreas.length > 0" class="flex flex-wrap gap-2 pt-2">
            <span
              *ngFor="let area of serviceAreas"
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg"
            >
              <span>📍 {{ area }}</span>
              <button (click)="removeArea(area)" type="button" class="text-slate-400 hover:text-rose-600 font-black cursor-pointer">×</button>
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-6 border-t border-slate-100">
          <span class="text-xs text-slate-500 font-semibold">
            {{ serviceAreas.length }} service zones specified
          </span>

          <button
            (click)="saveAreaSettings()"
            [disabled]="isSaving"
            type="button"
            class="px-8 py-3 bg-[#0F2937] hover:bg-[#133E4D] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isSaving ? 'Saving Changes...' : 'Save Service Coverage' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProServiceAreaComponent implements OnInit {
  public profile?: ProfessionalProfile;
  public serviceRadiusKm: number = 15;
  public serviceAreas: string[] = [];
  public newAreaInput: string = '';

  public radiusOptions = [5, 10, 15, 25, 50];
  public commonCities = [
    'Hyderabad',
    'Secunderabad',
    'Cyberabad',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Khammam',
  ];

  public isLoading: boolean = true;
  public isSaving: boolean = false;
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
        this.serviceRadiusKm = this.profile?.serviceRadiusKm || 15;
        this.serviceAreas = [...(this.profile?.serviceAreas || [])];
        if (this.serviceAreas.length === 0) {
          this.serviceAreas = ['Hyderabad', 'Banjara Hills', 'Gachibowli'];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load service area settings';
        this.isLoading = false;
      },
    });
  }

  public getRadiusDescription(r: number): string {
    switch (r) {
      case 5: return 'Immediate local';
      case 10: return 'Standard city';
      case 15: return 'Greater metro';
      case 25: return 'Extended district';
      default: return 'Full zone';
    }
  }

  public hasArea(area: string): boolean {
    return this.serviceAreas.some((a) => a.toLowerCase() === area.toLowerCase());
  }

  public toggleCity(city: string): void {
    if (this.hasArea(city)) {
      this.serviceAreas = this.serviceAreas.filter((a) => a.toLowerCase() !== city.toLowerCase());
    } else {
      this.serviceAreas.push(city);
    }
  }

  public addArea(): void {
    if (!this.newAreaInput || this.newAreaInput.trim() === '') return;
    const trimmed = this.newAreaInput.trim();
    if (!this.hasArea(trimmed)) {
      this.serviceAreas.push(trimmed);
    }
    this.newAreaInput = '';
  }

  public removeArea(area: string): void {
    this.serviceAreas = this.serviceAreas.filter((a) => a !== area);
  }

  public saveAreaSettings(): void {
    if (this.serviceAreas.length === 0) {
      this.errorMessage = 'Please specify at least one service city or area.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.proService
      .updateMyProfile({
        serviceRadiusKm: Number(this.serviceRadiusKm),
        serviceAreas: this.serviceAreas,
      })
      .subscribe({
        next: (res) => {
          this.profile = res.data;
          this.isSaving = false;
          this.successMessage = 'Service area and travel radius updated successfully!';
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.message || 'Failed to update service area';
        },
      });
  }
}
