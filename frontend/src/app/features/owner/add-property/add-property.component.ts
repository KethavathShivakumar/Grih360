import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { MoneyService } from '../../../core/services/money.service';
import { GoogleMapPickerComponent, SelectedLocationData } from '../../../shared/components/google-map/google-map-picker.component';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapPickerComponent],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto pb-12">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-[#0F2937]">Add New Property Listing</h1>
          <p class="text-xs text-slate-500">List your property for verified tenants across Telangana and Andhra Pradesh.</p>
        </div>
        <button
          (click)="goBack()"
          type="button"
          class="px-3.5 py-1.5 border border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          ← Cancel
        </button>
      </div>

      <!-- Main Form -->
      <form (ngSubmit)="onSubmitProperty()" class="space-y-6">
        <!-- Section 1: Basic Specifications -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-lg bg-[#0F2937] text-white flex items-center justify-center text-xs font-black">1</span>
            <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Basic Property Information</h2>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Property Title <span class="text-rose-500">*</span></label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="e.g. Luxurious 3 BHK Gated Flat in Gachibowli"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Description <span class="text-rose-500">*</span></label>
            <textarea
              [(ngModel)]="description"
              name="description"
              required
              rows="3"
              placeholder="Detail nearby landmarks, ventilation, water supply, preferred tenants, society rules..."
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Property Type <span class="text-rose-500">*</span></label>
              <select
                [(ngModel)]="propertyType"
                name="propertyType"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="INDEPENDENT_HOUSE">Independent House</option>
                <option value="VILLA">Villa</option>
                <option value="PG_HOSTEL">PG / Hostel</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">BHK Count <span class="text-rose-500">*</span></label>
              <select
                [(ngModel)]="bhk"
                name="bhk"
                required
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              >
                <option [ngValue]="1">1 BHK</option>
                <option [ngValue]="2">2 BHK</option>
                <option [ngValue]="3">3 BHK</option>
                <option [ngValue]="4">4 BHK</option>
                <option [ngValue]="5">5+ BHK</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Bathrooms <span class="text-rose-500">*</span></label>
              <input
                type="number"
                [(ngModel)]="bathrooms"
                name="bathrooms"
                required
                min="1"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Monthly Rent (₹) <span class="text-rose-500">*</span></label>
              <input
                type="number"
                [(ngModel)]="rentAmount"
                name="rentAmount"
                required
                min="1000"
                placeholder="e.g. 25000"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
              <span *ngIf="rentAmount" class="text-[11px] text-[#2D7A5E] font-bold block">
                {{ formatINR(rentAmount) }}/mo
              </span>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Security Deposit (₹) <span class="text-rose-500">*</span></label>
              <input
                type="number"
                [(ngModel)]="depositAmount"
                name="depositAmount"
                required
                min="0"
                placeholder="e.g. 50000"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
              <span *ngIf="depositAmount" class="text-[11px] text-slate-500 font-bold block">
                {{ formatINR(depositAmount) }}
              </span>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Built-Up Area (sqft) <span class="text-rose-500">*</span></label>
              <input
                type="number"
                [(ngModel)]="areaSqFt"
                name="areaSqFt"
                required
                min="100"
                placeholder="e.g. 1500"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 block">Furnishing Status <span class="text-rose-500">*</span></label>
            <select
              [(ngModel)]="furnishing"
              name="furnishing"
              required
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
            >
              <option value="FULLY_FURNISHED">Fully Furnished</option>
              <option value="SEMI_FURNISHED">Semi Furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>
        </div>

        <!-- Section 2: Interactive Google Map Location Picker (Requirements #8, #9, #11) -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-lg bg-[#0F2937] text-white flex items-center justify-center text-xs font-black">2</span>
            <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Property Location & Interactive Map Pin</h2>
          </div>

          <!-- Embedded Map Picker -->
          <app-google-map-picker
            [initialLat]="lat"
            [initialLng]="lng"
            (locationSelected)="onMapLocationSelected($event)"
          ></app-google-map-picker>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Address / Building Name <span class="text-rose-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="address"
                name="address"
                required
                placeholder="e.g. Flat 402, Sri Sai Towers"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Locality / Colony <span class="text-rose-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="locality"
                name="locality"
                required
                placeholder="e.g. Subedari / Gachibowli / Benz Circle"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">City <span class="text-rose-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="city"
                name="city"
                required
                placeholder="e.g. Warangal / Hyderabad / Vijayawada"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">State <span class="text-rose-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="state"
                name="state"
                required
                placeholder="Telangana"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Postal Pincode <span class="text-rose-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="pincode"
                name="pincode"
                required
                placeholder="506001"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Amenities Checklist -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-lg bg-[#0F2937] text-white flex items-center justify-center text-xs font-black">3</span>
            <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Amenities & Features</h2>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <label *ngFor="let am of availableAmenities" class="flex items-center space-x-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                [checked]="isAmenitySelected(am.code)"
                (change)="toggleAmenity(am.code)"
                class="rounded text-[#2D7A5E] focus:ring-[#2D7A5E]"
              />
              <span>{{ am.label }}</span>
            </label>
          </div>
        </div>

        <!-- Section 4: Property Photos -->
        <div class="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span class="w-6 h-6 rounded-lg bg-[#0F2937] text-white flex items-center justify-center text-xs font-black">4</span>
            <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Property Photos</h2>
          </div>

          <!-- Upload Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <label class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer flex items-center transition-colors">
              <span class="mr-2">📷</span>
              Upload Photos / Take Photo
              <input
                type="file"
                accept="image/*"
                multiple
                (change)="onFileSelected($event)"
                class="hidden"
              />
            </label>
            <span class="text-xs text-slate-400 font-semibold">{{ images.length }} photo(s) attached</span>
          </div>

          <!-- Image Previews -->
          <div *ngIf="images.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div
              *ngFor="let img of images; let idx = index"
              [class]="img.isMain ? 'ring-2 ring-[#2D7A5E]' : 'border-slate-200'"
              class="relative bg-slate-100 rounded-xl overflow-hidden border h-32 group"
            >
              <img [src]="img.url" class="w-full h-full object-cover" />
              <div *ngIf="img.isMain" class="absolute top-2 left-2 bg-[#0F2937] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                MAIN
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity">
                <button
                  *ngIf="!img.isMain"
                  (click)="setAsMain(idx)"
                  type="button"
                  class="px-2 py-1 bg-white text-[10px] font-bold text-slate-800 rounded shadow-xs cursor-pointer"
                >
                  Set Main
                </button>
                <button
                  (click)="removeImage(idx)"
                  type="button"
                  class="px-2 py-1 bg-rose-600 text-[10px] font-bold text-white rounded shadow-xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submission Error Alert -->
        <div *ngIf="submitError" class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ submitError }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end space-x-3 pt-4">
          <button
            (click)="goBack()"
            type="button"
            class="px-5 py-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="isSubmitting"
            class="px-8 py-3.5 bg-[#2D7A5E] hover:bg-[#23614a] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <svg *ngIf="isSubmitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Saving Property Listing...' : 'Publish Property Listing →' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AddPropertyComponent {
  title: string = '';
  description: string = '';
  propertyType: string = 'APARTMENT';
  bhk: number = 2;
  bathrooms: number = 2;
  rentAmount: number | null = null;
  depositAmount: number | null = null;
  areaSqFt: number | null = null;
  furnishing: string = 'SEMI_FURNISHED';

  address: string = '';
  locality: string = '';
  city: string = 'Warangal';
  state: string = 'Telangana';
  pincode: string = '506001';

  lat: number = 17.9689;
  lng: number = 79.5941;

  selectedAmenities: string[] = ['POWER_BACKUP', 'LIFT', 'SECURITY', 'PARKING'];
  images: Array<{ url: string; isMain: boolean; caption?: string }> = [
    { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', isMain: true, caption: 'Main Room' },
  ];

  isSubmitting: boolean = false;
  submitError: string = '';

  availableAmenities = [
    { code: 'POWER_BACKUP', label: '⚡ 100% Power Backup' },
    { code: 'LIFT', label: '🛗 High Speed Lift' },
    { code: 'SECURITY', label: '🛡️ 24/7 Security / CCTV' },
    { code: 'PARKING', label: '🚗 Covered Parking' },
    { code: 'GYM', label: '🏋️ Fitness Gym' },
    { code: 'SWIMMING_POOL', label: '🏊 Swimming Pool' },
    { code: 'GAS_PIPELINE', label: '🔥 Piped Cooking Gas' },
    { code: 'AIR_CONDITIONING', label: '❄️ Air Conditioning' },
  ];

  constructor(
    private propertyService: PropertyService,
    private moneyService: MoneyService,
    private router: Router
  ) {}

  formatINR(val: number): string {
    return this.moneyService.formatINR(val);
  }

  onMapLocationSelected(data: SelectedLocationData): void {
    this.lat = data.lat;
    this.lng = data.lng;
    if (data.address) this.address = data.address;
    if (data.locality) this.locality = data.locality;
    if (data.city) this.city = data.city;
    if (data.state) this.state = data.state;
    if (data.pincode) this.pincode = data.pincode;
  }

  isAmenitySelected(code: string): boolean {
    return this.selectedAmenities.includes(code);
  }

  toggleAmenity(code: string): void {
    if (this.selectedAmenities.includes(code)) {
      this.selectedAmenities = this.selectedAmenities.filter((a) => a !== code);
    } else {
      this.selectedAmenities.push(code);
    }
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.images.push({
          url: e.target.result,
          isMain: this.images.length === 0,
          caption: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  setAsMain(idx: number): void {
    this.images.forEach((img, i) => {
      img.isMain = i === idx;
    });
  }

  removeImage(idx: number): void {
    this.images.splice(idx, 1);
    if (this.images.length > 0 && !this.images.some((img) => img.isMain)) {
      this.images[0].isMain = true;
    }
  }

  goBack(): void {
    this.router.navigate(['/owner/properties']);
  }

  onSubmitProperty(): void {
    if (!this.title || !this.description || !this.rentAmount || !this.depositAmount || !this.areaSqFt || !this.address || !this.city) {
      this.submitError = 'Please fill in all required fields marked with *.';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const payload: any = {
      title: this.title,
      description: this.description,
      propertyType: this.propertyType,
      bhk: Number(this.bhk),
      bathrooms: Number(this.bathrooms),
      rentAmount: Number(this.rentAmount),
      depositAmount: Number(this.depositAmount),
      areaSqFt: Number(this.areaSqFt),
      furnishing: this.furnishing,
      propertyLocation: {
        address: this.address,
        locality: this.locality || this.city,
        city: this.city,
        state: this.state,
        pincode: this.pincode,
        coordinates: {
          lat: this.lat,
          lng: this.lng,
        },
      },
      amenities: this.selectedAmenities,
      images: this.images,
    };

    this.propertyService.createProperty(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/owner/properties']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.submitError = err?.error?.message || 'Failed to publish property listing. Please try again.';
      },
    });
  }
}
