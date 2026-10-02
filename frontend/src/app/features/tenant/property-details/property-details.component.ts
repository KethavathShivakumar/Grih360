import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { ApplicationService } from '../../../core/services/application.service';
import { MoneyService } from '../../../core/services/money.service';
import { Property } from '../../../shared/models/property.model';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Back Navigation & Breadcrumb -->
      <div class="flex items-center justify-between">
        <button
          (click)="goBack()"
          type="button"
          class="inline-flex items-center text-sm font-bold text-[#0F2937] hover:text-[#2D7A5E] transition-colors"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Find Homes
        </button>

        <span class="text-xs font-semibold text-slate-500">Property ID: {{ propertyId }}</span>
      </div>

      <!-- Stitch Request Banner -->
      

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Fetching property details..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Property details unavailable"
        [message]="errorMessage"
        (retry)="loadPropertyDetails()"
      ></app-error-state>

      <!-- Property Details Content -->
      <div *ngIf="!isLoading && !isError && property" class="space-y-6">
        <!-- Title & Header Bar -->
        <div class="bento-card bg-white p-6 border border-[#E8E6DF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-[#0F2937] text-white text-xs font-extrabold px-2.5 py-0.5 rounded">
                {{ property.propertyType }}
              </span>
              <span class="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {{ property.availabilityStatus }}
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-[#0F2937] mt-2">{{ property.title }}</h1>
            <p class="text-sm text-slate-500 flex items-center mt-1">
              <svg class="w-4 h-4 text-[#2D7A5E] mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              {{ property.propertyLocation.address }}, {{ property.propertyLocation.locality }}, {{ property.propertyLocation.city }}, {{ property.propertyLocation.state }} - {{ property.propertyLocation.pincode }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="toggleSaveProperty()"
              type="button"
              [class]="isSaved ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'"
              class="px-4 py-2.5 border rounded-lg text-sm font-bold flex items-center shadow-xs transition-colors"
            >
              <svg class="w-4 h-4 mr-1.5" [attr.fill]="isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {{ isSaved ? 'Saved Home' : 'Save Property' }}
            </button>

            <button
              (click)="openApplicationModal()"
              type="button"
              class="px-6 py-2.5 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
            >
              Apply Now
            </button>
          </div>
        </div>

        <!-- Image Gallery Component -->
        <div class="bento-card bg-white p-4 border border-[#E8E6DF] space-y-4">
          <div class="relative w-full h-80 md:h-[420px] bg-slate-100 rounded-xl overflow-hidden">
            <img
              [src]="selectedImageUrl || fallbackImageUrl"
              [alt]="property.title"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Thumbnail Strip -->
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

        <!-- Details Grid: Left Specs + Right Owner & Quick Info -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Main Specs & Description -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Key Specs Card -->
            <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
              <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Property Overview</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span class="block text-xs font-bold text-slate-400 uppercase">Monthly Rent</span>
                  <span class="text-lg font-extrabold text-[#0F2937]">{{ formattedRent }}</span>
                </div>
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span class="block text-xs font-bold text-slate-400 uppercase">Deposit</span>
                  <span class="text-lg font-extrabold text-slate-700">{{ formattedDeposit }}</span>
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

              <div class="pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                <div><span class="text-slate-400 font-bold">Bathrooms:</span> {{ property.bathrooms }}</div>
                <div><span class="text-slate-400 font-bold">Furnishing:</span> {{ property.furnishing }}</div>
                <div><span class="text-slate-400 font-bold">Available From:</span> {{ property.availableFrom || 'Immediate' }}</div>
              </div>
            </div>

            <!-- Description Card -->
            <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-3">
              <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Property Description</h2>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ property.description }}</p>
            </div>

            <!-- Amenities Card -->
            <div *ngIf="property.amenities && property.amenities.length > 0" class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-3">
              <h2 class="text-sm font-extrabold text-[#0F2937] uppercase tracking-wider">Included Amenities</h2>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let item of property.amenities"
                  class="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center"
                >
                  <svg class="w-3.5 h-3.5 mr-1.5 text-[#2D7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ item }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Sidebar Owner & Quick Actions -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Owner Public Summary Card -->
            <div class="bento-card bg-white p-6 border border-[#E8E6DF] space-y-4">
              <h2 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Property Owner</h2>
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-full bg-[#0F2937] text-white flex items-center justify-center font-extrabold text-lg">
                  {{ ownerInitial }}
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">{{ ownerName }}</h3>
                  <span class="inline-flex items-center text-[11px] font-bold text-[#2D7A5E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Verified Owner
                  </span>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Nivas360 ID:</strong> Verified Owner Account</p>
                <p class="text-[11px] text-slate-400">Direct tenant applications supported via secure workspace.</p>
              </div>

              <button
                (click)="openApplicationModal()"
                type="button"
                class="w-full py-3 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-sm font-bold shadow-sm transition-colors text-center cursor-pointer"
              >
                Apply to Rent This Home
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Sticky Bottom Bar (Only on viewports < 768px) -->
        <div class="md:hidden fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 z-30 flex items-center justify-between shadow-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rent / Month</span>
            <span class="text-base font-extrabold text-[#0F2937]">{{ formattedRent }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              (click)="toggleSaveProperty()"
              type="button"
              [class]="isSaved ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'"
              class="p-2.5 border rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Save Home"
            >
              <svg class="w-5 h-5" [attr.fill]="isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
            <button
              (click)="openApplicationModal()"
              type="button"
              class="px-5 py-2.5 bg-[#2D7A5E] active:bg-[#23614a] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer min-h-[44px]"
            >
              Apply Now →
            </button>
          </div>
        </div>
      </div>

      <!-- Application Form Modal -->
      <div *ngIf="showAppModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 relative my-auto">
          <button
            (click)="showAppModal = false"
            type="button"
            class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div class="space-y-1">
            <h3 class="text-xl font-extrabold text-[#0F2937]">Submit Rental Application</h3>
            <p class="text-xs text-slate-500">Property: {{ property?.title }}</p>
          </div>

          <form (ngSubmit)="submitApplication()" class="space-y-4">
            <!-- Proposed Rent & Move in Date -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Proposed Rent (₹/mo)</label>
                <input
                  type="number"
                  [(ngModel)]="appProposedRent"
                  name="proposedRent"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E]"
                />
                <span class="text-[10px] text-slate-400">Listing: {{ formattedRent }}</span>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Move-in Date</label>
                <input
                  type="date"
                  [(ngModel)]="appMoveInDate"
                  name="moveInDate"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
                />
              </div>
            </div>

            <!-- Employment Status & Monthly Income -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Employment Status</label>
                <select
                  [(ngModel)]="appEmploymentStatus"
                  name="employmentStatus"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
                >
                  <option value="Salaried">Salaried (Corporate / IT / MNC)</option>
                  <option value="Self-Employed">Self-Employed / Business</option>
                  <option value="Government / PSU">Government / PSU</option>
                  <option value="Freelancer / Consultant">Freelancer / Consultant</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Monthly Income (₹)</label>
                <input
                  type="number"
                  [(ngModel)]="appMonthlyIncome"
                  name="monthlyIncome"
                  required
                  min="0"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2D7A5E]"
                />
              </div>
            </div>

            <!-- Occupants Count -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Number of Occupants</label>
              <input
                type="number"
                [(ngModel)]="appOccupantsCount"
                name="occupantsCount"
                required
                min="1"
                max="20"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              />
            </div>

            <!-- Message to Owner -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Message / Cover Note to Owner (Optional)</label>
              <textarea
                [(ngModel)]="appMessage"
                name="message"
                rows="2"
                placeholder="Introduce yourself, preferred lease duration, background..."
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#2D7A5E]"
              ></textarea>
            </div>

            <!-- Error Banner -->
            <div *ngIf="modalError" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              {{ modalError }}
            </div>

            <div class="pt-3 flex items-center justify-end space-x-3">
              <button
                (click)="showAppModal = false"
                type="button"
                class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSubmittingApp"
                class="px-5 py-2 bg-[#2D7A5E] hover:bg-[#23614a] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                {{ isSubmittingApp ? 'Submitting...' : 'Confirm Application' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class PropertyDetailsComponent implements OnInit {
  propertyId: string = '';
  property: Property | null = null;
  selectedImageUrl: string = '';
  fallbackImageUrl: string = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';
  isSaved: boolean = false;

  // Application Modal State
  showAppModal: boolean = false;
  appProposedRent: number = 0;
  appMoveInDate: string = '';
  appEmploymentStatus: string = 'Salaried';
  appMonthlyIncome: number = 0;
  appOccupantsCount: number = 1;
  appMessage: string = '';
  isSubmittingApp: boolean = false;
  modalError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private applicationService: ApplicationService,
    private moneyService: MoneyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.propertyId) {
      this.loadPropertyDetails();
      this.checkSavedStatus();
    } else {
      this.isError = true;
      this.errorMessage = 'Invalid property ID specified.';
      this.isLoading = false;
    }
  }

  loadPropertyDetails(): void {
    this.isLoading = true;
    this.isError = false;

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.property = res.data;
          this.appProposedRent = this.property.rentAmount;
          this.appMonthlyIncome = this.property.rentAmount * 3;

          const mainImg = this.property.images?.find((i) => i.isMain);
          this.selectedImageUrl = mainImg?.url || this.property.images?.[0]?.url || this.fallbackImageUrl;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Property details could not be retrieved.';
      },
    });
  }

  checkSavedStatus(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.isSaved = res.data.some((p) => p.id === this.propertyId);
        }
      },
    });
  }

  toggleSaveProperty(): void {
    if (!this.propertyId) return;

    if (this.isSaved) {
      this.isSaved = false;
      this.propertyService.unsaveProperty(this.propertyId).subscribe({
        error: () => (this.isSaved = true),
      });
    } else {
      this.isSaved = true;
      this.propertyService.saveProperty(this.propertyId).subscribe({
        error: () => (this.isSaved = false),
      });
    }
  }

  get formattedRent(): string {
    return this.property?.formattedRent || (this.property ? this.moneyService.formatINR(this.property.rentAmount) + '/mo' : '');
  }

  get formattedDeposit(): string {
    return this.property?.formattedDeposit || (this.property ? this.moneyService.formatINR(this.property.depositAmount) : '');
  }

  get ownerName(): string {
    return (this.property as any)?.ownerId?.name || 'Nivas360 Property Owner';
  }

  get ownerInitial(): string {
    return this.ownerName.charAt(0).toUpperCase();
  }

  openApplicationModal(): void {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    this.appMoveInDate = today.toISOString().split('T')[0];
    this.appProposedRent = this.property?.rentAmount || 0;
    this.appMonthlyIncome = (this.property?.rentAmount || 15000) * 3;
    this.appEmploymentStatus = 'Salaried';
    this.appOccupantsCount = 1;
    this.appMessage = '';
    this.modalError = '';
    this.showAppModal = true;
  }

  submitApplication(): void {
    if (!this.propertyId) return;
    if (!this.appProposedRent || !this.appMoveInDate) {
      this.modalError = 'Please provide proposed rent and valid move-in date.';
      return;
    }

    this.isSubmittingApp = true;
    this.modalError = '';

    this.applicationService
      .submitApplication({
        propertyId: this.propertyId,
        proposedRent: Number(this.appProposedRent),
        moveInDate: this.appMoveInDate,
        message: this.appMessage,
        employmentStatus: this.appEmploymentStatus,
        monthlyIncome: Number(this.appMonthlyIncome),
        occupantsCount: Number(this.appOccupantsCount),
        notes: this.appMessage,
      })
      .subscribe({
        next: (res) => {
          this.isSubmittingApp = false;
          this.showAppModal = false;
          if (res.success && res.data) {
            this.router.navigate(['/tenant/applications', res.data.id || (res.data as any)._id]);
          } else {
            this.router.navigate(['/tenant/applications']);
          }
        },
        error: (err) => {
          this.isSubmittingApp = false;
          this.modalError = err?.error?.message || 'Failed to submit application. Please check your submission details.';
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/tenant/homes']);
  }
}
