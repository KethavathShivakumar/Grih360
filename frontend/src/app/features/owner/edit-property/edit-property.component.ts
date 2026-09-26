import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { MoneyService } from '../../../core/services/money.service';
import { Property } from '../../../shared/models/property.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Edit Property Listing</h1>
          <p class="text-xs text-slate-500">Update specifications, monthly rent, location, and images for Property ID: {{ propertyId }}</p>
        </div>
        <button
          (click)="goBack()"
          type="button"
          class="text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          ← Cancel
        </button>
      </div>

      <!-- Stitch Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property details..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Unable to load property for editing"
        [message]="errorMessage"
        (retry)="loadProperty()"
      ></app-error-state>

      <!-- Edit Form -->
      <form *ngIf="!isLoading && !isError && property" (ngSubmit)="onUpdateProperty()" class="space-y-6">
        <!-- Section 1: Basic Specifications -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">1. Basic Property Information</h2>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Property Title *</label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Description *</label>
            <textarea
              [(ngModel)]="description"
              name="description"
              required
              rows="3"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Property Type *</label>
              <select
                [(ngModel)]="propertyType"
                name="propertyType"
                required
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="INDEPENDENT_HOUSE">Independent House</option>
                <option value="VILLA">Villa</option>
                <option value="PG_HOSTEL">PG / Hostel</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">BHK Count *</label>
              <select
                [(ngModel)]="bhk"
                name="bhk"
                required
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              >
                <option [ngValue]="1">1 BHK</option>
                <option [ngValue]="2">2 BHK</option>
                <option [ngValue]="3">3 BHK</option>
                <option [ngValue]="4">4 BHK</option>
                <option [ngValue]="5">5+ BHK</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Availability Status *</label>
              <select
                [(ngModel)]="availabilityStatus"
                name="availabilityStatus"
                required
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold"
              >
                <option value="VACANT">VACANT (Available for Rent)</option>
                <option value="RENTED">RENTED (Occupied by Tenant)</option>
                <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                <option value="RESERVED">RESERVED</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Monthly Rent (₹) *</label>
              <input
                type="number"
                [(ngModel)]="rentAmount"
                name="rentAmount"
                required
                min="1"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E]"
              />
              <span *ngIf="rentAmount" class="text-[11px] text-[#2D7A5E] font-bold block">
                Formatted: {{ formatINR(rentAmount) }}/mo
              </span>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Security Deposit (₹) *</label>
              <input
                type="number"
                [(ngModel)]="depositAmount"
                name="depositAmount"
                required
                min="0"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Built-Up Area (sqft) *</label>
              <input
                type="number"
                [(ngModel)]="areaSqFt"
                name="areaSqFt"
                required
                min="1"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Location -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">2. Property Location</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Address *</label>
              <input
                type="text"
                [(ngModel)]="address"
                name="address"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Locality *</label>
              <input
                type="text"
                [(ngModel)]="locality"
                name="locality"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">City *</label>
              <input
                type="text"
                [(ngModel)]="city"
                name="city"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">State *</label>
              <input
                type="text"
                [(ngModel)]="state"
                name="state"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Pincode *</label>
              <input
                type="text"
                [(ngModel)]="pincode"
                name="pincode"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Image Management -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">3. Manage Photos</h2>
            <label class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-bold cursor-pointer transition-colors">
              + Upload Photos / Camera
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                (change)="onFileSelected($event)"
                class="hidden"
              />
            </label>
          </div>

          <div *ngIf="images.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div
              *ngFor="let img of images; let idx = index"
              [class]="img.isMain ? 'ring-2 ring-[#2D7A5E]' : 'border-slate-200'"
              class="relative bg-slate-100 rounded-xl overflow-hidden border h-32 group"
            >
              <img [src]="img.url" class="w-full h-full object-cover" />
              <div class="absolute top-2 left-2 bg-[#0F2937]/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded" *ngIf="img.isMain">
                MAIN
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity">
                <button
                  *ngIf="!img.isMain"
                  (click)="setAsMain(idx)"
                  type="button"
                  class="p-1 bg-white/90 text-xs font-bold text-slate-800 rounded shadow"
                >
                  Set Main
                </button>
                <button
                  (click)="removeImage(idx)"
                  type="button"
                  class="p-1 bg-rose-500 text-white text-xs font-bold rounded shadow"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submission Error Alert -->
        <div *ngIf="submitError" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
          {{ submitError }}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end space-x-3 pt-4">
          <button
            (click)="goBack()"
            type="button"
            class="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="isSubmitting"
            class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            {{ isSubmitting ? 'Saving Changes...' : 'Save Property Changes' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class EditPropertyComponent implements OnInit {
  propertyId: string = '';
  property: Property | null = null;

  title: string = '';
  description: string = '';
  propertyType: string = 'APARTMENT';
  bhk: number = 2;
  bathrooms: number = 2;
  rentAmount: number = 0;
  depositAmount: number = 0;
  areaSqFt: number = 0;
  furnishing: string = 'SEMI_FURNISHED';
  availabilityStatus: string = 'VACANT';

  address: string = '';
  locality: string = '';
  city: string = '';
  state: string = '';
  pincode: string = '';

  images: Array<{ url: string; isMain: boolean; caption?: string }> = [];

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  submitError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadProperty();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid Property ID.';
      this.isLoading = false;
    }
  }

  loadProperty(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const p = res.data;
          this.property = p;
          this.title = p.title || '';
          this.description = p.description || '';
          this.propertyType = p.propertyType || 'APARTMENT';
          this.bhk = p.bhk || 2;
          this.bathrooms = p.bathrooms || 2;
          this.rentAmount = p.rentAmount || 0;
          this.depositAmount = p.depositAmount || 0;
          this.areaSqFt = p.areaSqFt || 0;
          this.furnishing = p.furnishing || 'SEMI_FURNISHED';
          this.availabilityStatus = p.availabilityStatus || 'VACANT';

          const loc = p.propertyLocation || {};
          this.address = loc.address || '';
          this.locality = loc.locality || '';
          this.city = loc.city || '';
          this.state = loc.state || '';
          this.pincode = loc.pincode || '';

          this.images = p.images || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Property record could not be loaded.';
      },
    });
  }

  formatINR(val: number): string {
    return this.moneyService.formatINR(val);
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result;
        this.images.push({
          url,
          isMain: this.images.length === 0,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  setAsMain(index: number): void {
    this.images.forEach((img, idx) => (img.isMain = idx === index));
  }

  removeImage(index: number): void {
    const wasMain = this.images[index].isMain;
    this.images.splice(index, 1);
    if (wasMain && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }

  onUpdateProperty(): void {
    if (!this.title || !this.description || !this.rentAmount) {
      this.submitError = 'Please complete all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const payload = {
      title: this.title,
      description: this.description,
      propertyType: this.propertyType,
      bhk: Number(this.bhk),
      bathrooms: Number(this.bathrooms),
      rentAmount: Number(this.rentAmount),
      depositAmount: Number(this.depositAmount),
      areaSqFt: Number(this.areaSqFt),
      furnishing: this.furnishing as any,
      availabilityStatus: this.availabilityStatus as any,
      propertyLocation: {
        address: this.address,
        locality: this.locality,
        city: this.city,
        state: this.state,
        pincode: this.pincode,
      },
      images: this.images,
    };

    this.propertyService.updateProperty(this.propertyId, payload as any).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.router.navigate(['/owner/properties', this.propertyId]);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.submitError = err?.error?.message || 'Failed to update property details.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/owner/properties', this.propertyId]);
  }
}
