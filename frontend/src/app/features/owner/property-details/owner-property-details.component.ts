import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { MoneyService } from '../../../core/services/money.service';
import { Property } from '../../../shared/models/property.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-owner-property-details',
  standalone: true,
  imports: [
    CommonModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Back Navigation -->
      <div class="flex items-center justify-between">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to My Properties
        </button>

        <span class="text-xs font-semibold text-slate-500">Owner View — Property ID: {{ propertyId }}</span>
      </div>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property record..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Property details unavailable"
        [message]="errorMessage"
        (retry)="loadPropertyDetails()"
      ></app-error-state>

      <!-- Property Content -->
      <div *ngIf="!isLoading && !isError && property" class="space-y-6">
        <!-- Title & Action Bar -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-[#0F2937] text-white text-xs font-extrabold px-2.5 py-0.5 rounded">
                {{ property.propertyType }}
              </span>
              <span
                [class]="property.availabilityStatus === 'VACANT' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'"
                class="text-xs font-extrabold px-2.5 py-0.5 rounded-full border"
              >
                {{ property.availabilityStatus }}
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-[#0F2937] mt-2">{{ property.title }}</h1>
            <p class="text-sm text-slate-500 mt-1">
              📍 {{ property.propertyLocation.address }}, {{ property.propertyLocation.locality }}, {{ property.propertyLocation.city }}
            </p>
          </div>

          <!-- Owner Actions Toolbar -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              (click)="navigateTo('/owner/properties/' + propertyId + '/edit')"
              type="button"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              ✏️ Edit Property
            </button>
            <button
              (click)="navigateTo('/owner/properties/' + propertyId + '/applicants')"
              type="button"
              class="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
            >
              📋 Applicants
            </button>
            <button
              (click)="navigateTo('/owner/properties/' + propertyId + '/tenant')"
              type="button"
              class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
            >
              👤 Tenant Details
            </button>
            <button
              (click)="navigateTo('/owner/properties/' + propertyId + '/rent')"
              type="button"
              class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
            >
              💰 Rent Records
            </button>
          </div>
        </div>

        <!-- Image Gallery -->
        <div class="bento-card bg-white p-4 border border-[#E8E6DF] space-y-4">
          <div class="relative w-full h-80 md:h-[400px] bg-slate-100 rounded-xl overflow-hidden">
            <img
              [src]="selectedImageUrl || fallbackImageUrl"
              [alt]="property.title"
              class="w-full h-full object-cover"
            />
          </div>

          <div *ngIf="property.images && property.images.length > 1" class="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              *ngFor="let img of property.images"
              (click)="selectedImageUrl = img.url"
              type="button"
              [class]="selectedImageUrl === img.url ? 'ring-2 ring-[#2D7A5E]' : 'opacity-70 hover:opacity-100'"
              class="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 transition-all"
            >
              <img [src]="img.url" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Specs Overview -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Property Specifications</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-xs font-bold text-slate-400 uppercase">Monthly Rent</span>
              <span class="text-lg font-extrabold text-[#0F2937]">{{ formatRent(property.rentAmount) }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-xs font-bold text-slate-400 uppercase">Security Deposit</span>
              <span class="text-lg font-extrabold text-slate-700">{{ formatDeposit(property.depositAmount) }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-xs font-bold text-slate-400 uppercase">BHK Layout</span>
              <span class="text-lg font-extrabold text-[#2D7A5E]">{{ property.bhk }} BHK</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-xs font-bold text-slate-400 uppercase">Total Area</span>
              <span class="text-lg font-extrabold text-slate-700">{{ property.areaSqFt }} sqft</span>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200 text-xs text-slate-700 space-y-2">
            <p><strong>Bathrooms:</strong> {{ property.bathrooms }}</p>
            <p><strong>Furnishing:</strong> {{ property.furnishing }}</p>
            <p><strong>Description:</strong> {{ property.description }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerPropertyDetailsComponent implements OnInit {
  propertyId: string = '';
  property: Property | null = null;
  selectedImageUrl: string = '';
  fallbackImageUrl: string = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadPropertyDetails();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid property ID.';
      this.isLoading = false;
    }
  }

  loadPropertyDetails(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const p = res.data;
          this.property = p;
          const mainImg = p.images?.find((i: any) => i.isMain);
          this.selectedImageUrl = mainImg?.url || p.images?.[0]?.url || this.fallbackImageUrl;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Access denied or property not found.';
      },
    });
  }

  formatRent(amount: number): string {
    return this.moneyService.formatINR(amount) + '/mo';
  }

  formatDeposit(amount: number): string {
    return this.moneyService.formatINR(amount);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  goBack(): void {
    this.router.navigate(['/owner/properties']);
  }
}
