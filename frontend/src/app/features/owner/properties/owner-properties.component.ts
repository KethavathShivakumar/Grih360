import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { MoneyService } from '../../../core/services/money.service';
import { Property } from '../../../shared/models/property.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-owner-properties',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Bar -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">My Properties</h1>
          <p class="text-xs text-slate-500">Manage your real estate listings, applicants, active rentals, and rent records.</p>
        </div>
        <button
          (click)="navigateToAddProperty()"
          type="button"
          class="px-4 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          + Add New Property
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching your properties..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Could not load properties"
        [message]="errorMessage"
        (retry)="loadOwnerProperties()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && properties.length === 0"
        title="You haven't listed any properties yet"
        message="Add your first property listing to start receiving tenant applications and managing rental agreements."
        actionText="Add Property Now"
        (action)="navigateToAddProperty()"
      ></app-empty-state>

      <!-- Properties List -->
      <div *ngIf="!isLoading && !isError && properties.length > 0" class="space-y-4">
        <div
          *ngFor="let prop of properties"
          class="bento-card bg-white p-5 border border-[#E8E6DF] space-y-4 shadow-xs"
        >
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <!-- Left Summary -->
            <div class="flex items-center space-x-4">
              <div class="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                <img
                  [src]="getMainImageUrl(prop)"
                  [alt]="prop.title"
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="bg-[#0F2937] text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                    {{ prop.propertyType }}
                  </span>
                  <span
                    [class]="prop.availabilityStatus === 'VACANT' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'"
                    class="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
                  >
                    {{ prop.availabilityStatus }}
                  </span>
                </div>
                <h3 (click)="viewPropertyDetails(prop.id)" class="text-base font-bold text-slate-900 hover:text-[#2D7A5E] cursor-pointer mt-1">
                  {{ prop.title }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ prop.propertyLocation.locality || prop.propertyLocation.address }}, {{ prop.propertyLocation.city }}
                </p>
              </div>
            </div>

            <!-- Rent & Specs Summary -->
            <div class="flex items-center space-x-6">
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Monthly Rent</span>
                <span class="text-base font-extrabold text-[#0F2937]">{{ formatRent(prop) }}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 font-bold uppercase">Layout</span>
                <span class="text-xs font-bold text-slate-700">{{ prop.bhk }} BHK | {{ prop.areaSqFt }} sqft</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons Toolbar -->
          <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="viewPropertyDetails(prop.id)"
                type="button"
                class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors"
              >
                View Listing
              </button>
              <button
                (click)="editProperty(prop.id)"
                type="button"
                class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                (click)="viewApplicants(prop.id)"
                type="button"
                class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition-colors"
              >
                Applicants
              </button>
              <button
                (click)="viewTenant(prop.id)"
                type="button"
                class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md transition-colors"
              >
                Tenant Details
              </button>
              <button
                (click)="viewRentTracking(prop.id)"
                type="button"
                class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md transition-colors"
              >
                Rent Records
              </button>
            </div>

            <button
              (click)="confirmDelete(prop)"
              type="button"
              class="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OwnerPropertiesComponent implements OnInit {
  properties: Property[] = [];
  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private propertyService: PropertyService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOwnerProperties();
  }

  loadOwnerProperties(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getOwnerProperties().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.properties = res.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to load owner properties.';
      },
    });
  }

  getMainImageUrl(prop: Property): string {
    const main = prop.images?.find((i) => i.isMain);
    return main?.url || prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  formatRent(prop: Property): string {
    return prop.formattedRent || this.moneyService.formatINR(prop.rentAmount) + '/mo';
  }

  viewPropertyDetails(id: string): void {
    this.router.navigate(['/owner/properties', id]);
  }

  editProperty(id: string): void {
    this.router.navigate(['/owner/properties', id, 'edit']);
  }

  viewApplicants(id: string): void {
    this.router.navigate(['/owner/properties', id, 'applicants']);
  }

  viewTenant(id: string): void {
    this.router.navigate(['/owner/properties', id, 'tenant']);
  }

  viewRentTracking(id: string): void {
    this.router.navigate(['/owner/properties', id, 'rent']);
  }

  navigateToAddProperty(): void {
    this.router.navigate(['/owner/properties/new']);
  }

  confirmDelete(prop: Property): void {
    if (confirm(`Are you sure you want to delete "${prop.title}"?`)) {
      this.propertyService.deleteProperty(prop.id).subscribe({
        next: () => this.loadOwnerProperties(),
        error: (err: any) => alert(err?.error?.message || 'Failed to delete property listing.'),
      });
    }
  }
}
