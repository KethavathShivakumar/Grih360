import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { PropertyService } from '../../../core/services/property.service';
import {
  LocationService,
  StructuredLocation,
  PlacePrediction,
  LocationCoordinates,
} from '../../../core/services/location.service';
import { DistrictInfo } from '../../../core/config/geography.config';
import { Property, PropertyFilter } from '../../../shared/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';

export interface AmenityOption {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-find-homes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyCardComponent,
    LoadingStateComponent,
    GoogleMapComponent,
  ],
  template: `
    <div class="space-y-5">
      <!-- Hero Header & Geographic Search Hub -->
      <div class="relative bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] rounded-3xl p-5 sm:p-7 text-white shadow-lg overflow-visible space-y-4">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-2xl space-y-1 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>✨ Real Backend Search Engine</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Find verified homes across <span class="text-[#FACC15]">Telangana & AP</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-300">
            Real geographic & multidimensional database search across Hyderabad, Warangal, Mahabubnagar, Nalgonda, Karimnagar, Khammam, Nizamabad, Vijayawada, Guntur & Tirupati.
          </p>
        </div>

        <!-- Top Search Bar Bar Pill -->
        <div class="bg-white rounded-2xl p-3 relative z-30 text-slate-800 shadow-xl border border-white/20">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            <!-- 1. Google Places Autocomplete Input with Predictions Dropdown -->
            <div class="md:col-span-5 px-3 py-1 relative border-b md:border-b-0 md:border-r border-slate-200">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Locality / Landmark</label>
                <button
                  *ngIf="searchQuery"
                  (click)="clearLocalityInput()"
                  type="button"
                  class="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ Clear
                </button>
              </div>
              <div class="flex items-center space-x-2 mt-0.5">
                <span class="text-sm">📍</span>
                <input
                  #localityInput
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onLocalitySearchChange($event)"
                  (focus)="onLocalityFocus()"
                  placeholder="Gachibowli, Christian Pally, Benz Circle..."
                  class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <!-- Predictions Dropdown -->
              <div
                *ngIf="showPredictions && predictions.length > 0"
                class="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-64 overflow-y-auto"
              >
                <div class="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span>Google Places Suggestions</span>
                  <span class="text-[9px] text-[#2D7A5E]">✓ Live Geocoding</span>
                </div>
                <button
                  *ngFor="let pred of predictions"
                  (click)="selectPrediction(pred)"
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start space-x-2.5 border-b border-slate-50 last:border-0 cursor-pointer"
                >
                  <span class="text-xs mt-0.5 text-slate-400">🔍</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-900 truncate">{{ pred.mainText }}</p>
                    <p class="text-[11px] text-slate-500 truncate">{{ pred.secondaryText }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- 2. State Selector -->
            <div class="md:col-span-3 px-3 py-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">State</label>
              <select
                [(ngModel)]="selectedState"
                (change)="onStateChange()"
                class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All States (Telangana & AP)</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            <!-- 3. District Selector -->
            <div class="md:col-span-3 px-3 py-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">District / Hub</label>
              <select
                [(ngModel)]="selectedDistrict"
                (change)="onDistrictChange()"
                class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All Canonical Districts</option>
                <optgroup *ngFor="let group of districtGroups" [label]="group.stateName">
                  <option *ngFor="let dist of group.districts" [value]="dist.name">
                    {{ dist.name }} (Tier-{{ dist.tier }})
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- 4. GPS & Search Action -->
            <div class="md:col-span-1 flex items-center justify-end gap-1 px-1">
              <button
                (click)="useCurrentLocation()"
                [disabled]="isLocating"
                type="button"
                class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                title="Search Homes Near My GPS Location"
              >
                <span *ngIf="!isLocating">📍</span>
                <span *ngIf="isLocating" class="inline-block animate-spin">⏳</span>
              </button>
              <button
                (click)="onFilterChange()"
                type="button"
                class="p-2 sm:px-3 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black text-xs rounded-xl shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                title="Search Real Database"
              >
                <span>→</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Action & View Controls Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E6DF] shadow-2xs">
        <div class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>Showing <strong class="text-[#0F2937]">{{ totalProperties }}</strong> properties</span>
          
          <!-- Active Location Pill Badge -->
          <span
            *ngIf="activeLocationDisplayName"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[#2D7A5E] border border-emerald-200 rounded-full text-[11px] font-extrabold"
          >
            <span>📍 {{ activeLocationDisplayName }}</span>
            <button
              (click)="clearSelectedLocation()"
              type="button"
              class="hover:text-rose-600 font-bold ml-1 cursor-pointer"
              title="Clear Location"
            >
              ✕
            </button>
          </span>

          <!-- Radius Indicator -->
          <span *ngIf="searchRadiusKm" class="text-slate-400 text-[11px]">
            • Within {{ searchRadiusKm }} km
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Radius Selector -->
          <select
            [(ngModel)]="searchRadiusKm"
            (change)="onFilterChange()"
            class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option [value]="15">Radius: 15 km</option>
            <option [value]="25">Radius: 25 km</option>
            <option [value]="35">Radius: 35 km</option>
            <option [value]="50">Radius: 50 km</option>
            <option [value]="100">Radius: 100 km</option>
          </select>

          <!-- Sort Dropdown -->
          <select
            [(ngModel)]="selectedSort"
            (change)="onFilterChange()"
            class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="rent_asc">Rent: Low to High</option>
            <option value="rent_desc">Rent: High to Low</option>
          </select>

          <!-- Mobile View Switcher (List vs Map) -->
          <div class="lg:hidden flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              (click)="mobileView = 'list'"
              type="button"
              [class]="mobileView === 'list' ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'text-slate-600'"
              class="px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <span>📋</span>
              <span>List</span>
            </button>
            <button
              (click)="mobileView = 'map'"
              type="button"
              [class]="mobileView === 'map' ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'text-slate-600'"
              class="px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <span>🗺️</span>
              <span>Map</span>
            </button>
          </div>

          <!-- Mobile Filter Drawer Toggle Button -->
          <button
            (click)="toggleMobileFilters()"
            type="button"
            class="lg:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Filters</span>
            <span *ngIf="isFilterActive()" class="w-2 h-2 rounded-full bg-[#2D7A5E]"></span>
          </button>
        </div>
      </div>

      <!-- MAIN 3-ZONE LAYOUT (Desktop: Left Filters | Center Results | Right Map) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Desktop Persistent Filter Sidebar (Mobile: Drawer Modal) -->
        <div
          [class.hidden]="!showMobileFiltersDrawer"
          class="lg:block lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider flex items-center gap-1.5">
              <span>⚙️</span>
              <span>Search Filters</span>
            </h3>
            <button
              (click)="resetFilters()"
              type="button"
              class="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>

          <!-- Rent Range Filter & Presets -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-800">Monthly Rent (₹)</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="number"
                [(ngModel)]="minRent"
                (change)="onFilterChange()"
                placeholder="Min ₹"
                class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D7A5E]"
              />
              <input
                type="number"
                [(ngModel)]="maxRent"
                (change)="onFilterChange()"
                placeholder="Max ₹"
                class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D7A5E]"
              />
            </div>
            <!-- Quick Presets -->
            <div class="flex flex-wrap gap-1 pt-1">
              <button
                (click)="setRentPreset(null, 15000)"
                type="button"
                class="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              >
                &lt; ₹15k
              </button>
              <button
                (click)="setRentPreset(15000, 30000)"
                type="button"
                class="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              >
                ₹15k - ₹30k
              </button>
              <button
                (click)="setRentPreset(30000, 50000)"
                type="button"
                class="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              >
                ₹30k - ₹50k
              </button>
              <button
                (click)="setRentPreset(50000, null)"
                type="button"
                class="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              >
                ₹50k+
              </button>
            </div>
          </div>

          <!-- BHK Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-800">Bedrooms (BHK)</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                *ngFor="let bhk of [1, 2, 3, 4]"
                (click)="toggleBhk(bhk)"
                type="button"
                [class]="selectedBhkList.has(bhk) ? 'bg-[#0F2937] text-white font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                class="py-1.5 text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                {{ bhk }}{{ bhk === 4 ? '+' : '' }} BHK
              </button>
            </div>
          </div>

          <!-- Property Type Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-800">Property Type</label>
            <select
              [(ngModel)]="selectedPropertyType"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2D7A5E]"
            >
              <option value="">All Property Types</option>
              <option value="APARTMENT">Apartment / Flat</option>
              <option value="INDEPENDENT_HOUSE">Independent House</option>
              <option value="VILLA">Gated Community Villa</option>
              <option value="PG_HOSTEL">PG / Hostel</option>
              <option value="COMMERCIAL">Commercial Space</option>
            </select>
          </div>

          <!-- Furnishing Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-800">Furnishing</label>
            <select
              [(ngModel)]="selectedFurnishing"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2D7A5E]"
            >
              <option value="">Any Furnishing</option>
              <option value="FULLY_FURNISHED">Fully Furnished</option>
              <option value="SEMI_FURNISHED">Semi Furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>

          <!-- Availability Status Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-800">Availability</label>
            <select
              [(ngModel)]="selectedAvailability"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2D7A5E]"
            >
              <option value="">All Availability</option>
              <option value="VACANT">Ready to Move (Vacant)</option>
              <option value="RENTED">Rented</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
          </div>

          <!-- Amenities Filter (Checkboxes) -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Amenities</span>
              <span *ngIf="selectedAmenities.size > 0" class="text-[10px] text-[#2D7A5E] font-bold">
                ({{ selectedAmenities.size }} selected)
              </span>
            </label>
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <label
                *ngFor="let am of availableAmenities"
                class="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  [checked]="selectedAmenities.has(am.id)"
                  (change)="toggleAmenity(am.id)"
                  class="rounded text-[#2D7A5E] focus:ring-[#2D7A5E] border-slate-300"
                />
                <span class="text-xs">{{ am.icon }}</span>
                <span class="text-xs font-medium">{{ am.label }}</span>
              </label>
            </div>
          </div>

          <!-- Close Drawer on Mobile -->
          <button
            *ngIf="showMobileFiltersDrawer"
            (click)="showMobileFiltersDrawer = false"
            type="button"
            class="lg:hidden w-full py-2.5 bg-[#0F2937] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Apply Filters
          </button>
        </div>

        <!-- CENTER/RIGHT RESULTS COLUMN: Property Cards List -->
        <div
          [class.hidden]="mobileView === 'map'"
          class="lg:block lg:col-span-5 space-y-4"
        >
          <!-- Loading State -->
          <app-loading-state *ngIf="isLoading" message="Querying real backend property database..."></app-loading-state>

          <!-- Error State -->
          <div
            *ngIf="isError && !isLoading"
            class="bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3"
          >
            <p class="text-rose-600 font-bold text-sm">{{ errorMessage }}</p>
            <button
              (click)="loadProperties()"
              type="button"
              class="px-4 py-2 bg-[#0F2937] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Retry Search
            </button>
          </div>

          <!-- REAL LOCATION SEARCH EMPTY STATE (Phase 2 & 3 Requirement) -->
          <div
            *ngIf="!isLoading && !isError && properties.length === 0"
            class="bg-white p-8 rounded-3xl border border-[#E8E6DF] shadow-xs text-center space-y-5 animate-fade-in"
          >
            <div class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-3xl text-amber-600 border border-amber-200">
              🏡
            </div>
            
            <div class="max-w-md mx-auto space-y-2">
              <h3 class="text-lg font-extrabold text-[#0F2937]">
                No homes available in this area yet
              </h3>
              <p class="text-xs text-slate-500 leading-relaxed">
                We are actively onboarding verified landlords in
                <strong class="text-slate-800">{{ activeLocationDisplayName || 'this area' }}</strong>.
                Try expanding your search radius, changing locality, or adjusting your filters.
              </p>
            </div>

            <!-- 4 Required Empty State Actions -->
            <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                (click)="expandSearchArea()"
                type="button"
                class="px-3.5 py-2 bg-[#0F2937] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🌐</span>
                <span>Expand Search Area (+35km)</span>
              </button>

              <button
                (click)="focusChangeLocality()"
                type="button"
                class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Change Locality</span>
              </button>

              <button
                (click)="changeDistrictAction()"
                type="button"
                class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🏙️</span>
                <span>Change District</span>
              </button>

              <button
                (click)="resetFilters()"
                type="button"
                class="px-3.5 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>✕</span>
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          <!-- Property Cards List -->
          <div *ngIf="!isLoading && !isError && properties.length > 0" class="grid grid-cols-1 gap-4">
            <app-property-card
              *ngFor="let prop of properties"
              [property]="prop"
              [isSaved]="savedPropertyIds.has(prop.id)"
              (cardSelect)="openPropertyDetails($event)"
              (toggleSave)="onToggleSave($event)"
              (mouseenter)="hoverProperty(prop)"
              class="transition-all hover:scale-[1.008]"
            ></app-property-card>
          </div>
        </div>

        <!-- RIGHT COLUMN: Interactive Synchronized Google Map -->
        <div
          [class.hidden]="mobileView === 'list'"
          class="lg:block lg:col-span-4 lg:sticky lg:top-20 z-10 h-[500px] lg:h-[calc(100vh-120px)]"
        >
          <app-google-map
            [properties]="properties"
            [selectedProperty]="hoveredProperty"
            [centerCoords]="mapCenterCoords"
            [viewport]="mapViewport"
            [centerCity]="activeLocationDisplayName || 'Hyderabad'"
            (propertyClick)="openPropertyDetails($event)"
            (searchArea)="onMapSearchArea($event)"
          ></app-google-map>
        </div>

      </div>
    </div>
  `,
})
export class FindHomesComponent implements OnInit, OnDestroy {
  @ViewChild('localityInput') localityInputRef?: ElementRef<HTMLInputElement>;

  properties: Property[] = [];
  savedPropertyIds = new Set<string>();
  totalProperties: number = 0;

  // Search Fields
  searchQuery: string = '';
  selectedState: string = '';
  selectedDistrict: string = '';
  selectedPropertyType: string = '';
  selectedBhkList = new Set<number>();
  minRent: number | null = null;
  maxRent: number | null = null;
  selectedFurnishing: string = '';
  selectedAvailability: string = '';
  selectedSort: string = 'newest';
  searchRadiusKm: number = 35;
  selectedAmenities = new Set<string>();

  // Canonical Amenities List
  availableAmenities: AmenityOption[] = [
    { id: 'POWER_BACKUP', label: '100% Power Backup', icon: '⚡' },
    { id: 'LIFT', label: 'Elevator / Lift', icon: '🛗' },
    { id: 'COVERED_PARKING', label: 'Covered Car Parking', icon: '🚗' },
    { id: 'SECURITY', label: '24x7 Security & CCTV', icon: '🛡️' },
    { id: 'GYM', label: 'Gymnasium & Fitness', icon: '💪' },
    { id: 'SWIMMING_POOL', label: 'Swimming Pool', icon: '🏊' },
    { id: 'GAS_PIPELINE', label: 'Piped Gas Connection', icon: '🔥' },
    { id: 'WATER_SUPPLY_24X7', label: '24x7 Water Supply', icon: '💧' },
  ];

  // Autocomplete & Structured Geocoding
  predictions: PlacePrediction[] = [];
  showPredictions: boolean = false;
  selectedLocation: StructuredLocation | null = null;
  activeLocationDisplayName: string = '';
  mapCenterCoords: LocationCoordinates | null = null;
  mapViewport: any = null;

  // Canonical Geography Structure
  districtGroups: { stateName: string; districts: DistrictInfo[] }[] = [];

  // Mobile / UI state
  mobileView: 'list' | 'map' = 'list';
  showMobileFiltersDrawer: boolean = false;
  hoveredProperty: Property | null = null;
  isLocating: boolean = false;

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  private searchDebounce$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private propertyService: PropertyService,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initDistrictGroups();

    // Debounced Google Places Autocomplete Predictions
    this.subscriptions.push(
      this.searchDebounce$
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((val) => this.locationService.getPlacePredictions(val))
        )
        .subscribe((preds) => {
          this.predictions = preds;
          this.showPredictions = preds.length > 0;
        })
    );

    // Watch query params & initiate backend search
    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if (params['search']) this.searchQuery = params['search'];
        if (params['state']) this.selectedState = params['state'];
        if (params['district']) this.selectedDistrict = params['district'];
        if (params['city']) this.searchQuery = this.searchQuery || params['city'];
        if (params['propertyType']) this.selectedPropertyType = params['propertyType'];

        this.selectedBhkList.clear();
        if (params['bhk']) {
          String(params['bhk'])
            .split(',')
            .map(Number)
            .filter((n) => !isNaN(n))
            .forEach((n) => this.selectedBhkList.add(n));
        }

        if (params['minRent']) this.minRent = Number(params['minRent']);
        if (params['maxRent']) this.maxRent = Number(params['maxRent']);
        if (params['furnishing']) this.selectedFurnishing = params['furnishing'];
        if (params['availabilityStatus']) this.selectedAvailability = params['availabilityStatus'];
        if (params['sort']) this.selectedSort = params['sort'];
        if (params['radiusKm']) this.searchRadiusKm = Number(params['radiusKm']);

        this.selectedAmenities.clear();
        if (params['amenities']) {
          String(params['amenities'])
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((a) => this.selectedAmenities.add(a));
        }

        if (params['lat'] && params['lng']) {
          this.mapCenterCoords = {
            lat: Number(params['lat']),
            lng: Number(params['lng']),
          };
        }

        this.updateActiveDisplayName();
        this.loadSavedPropertyIds();
        this.loadProperties();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private initDistrictGroups(): void {
    const states = this.locationService.getStates();
    this.districtGroups = states.map((s) => ({
      stateName: s.name,
      districts: s.districts,
    }));
  }

  onLocalitySearchChange(val: string): void {
    if (!val || val.trim().length < 2) {
      this.predictions = [];
      this.showPredictions = false;
      return;
    }
    this.searchDebounce$.next(val);
  }

  onLocalityFocus(): void {
    if (this.predictions.length > 0) {
      this.showPredictions = true;
    }
  }

  clearLocalityInput(): void {
    this.searchQuery = '';
    this.predictions = [];
    this.showPredictions = false;
    this.selectedLocation = null;
    this.onFilterChange();
  }

  /**
   * Selection from Google Places Autocomplete dropdown
   */
  selectPrediction(pred: PlacePrediction): void {
    this.showPredictions = false;
    this.searchQuery = pred.mainText;

    this.locationService.getStructuredPlaceDetails(pred.placeId, pred.description).subscribe({
      next: (structured) => {
        this.selectedLocation = structured;
        this.activeLocationDisplayName = structured.displayName;

        if (structured.state) {
          this.selectedState = structured.state;
        }
        if (structured.district) {
          this.selectedDistrict = structured.district;
        }

        if (structured.coordinates) {
          this.mapCenterCoords = structured.coordinates;
        }
        if (structured.viewport) {
          this.mapViewport = structured.viewport;
        }

        this.onFilterChange();
      },
      error: () => {
        this.activeLocationDisplayName = pred.mainText;
        this.onFilterChange();
      },
    });
  }

  /**
   * State selection dropdown change
   */
  onStateChange(): void {
    if (!this.selectedState) {
      this.initDistrictGroups();
    } else {
      const districts = this.locationService.getDistrictsByState(this.selectedState);
      this.districtGroups = [
        {
          stateName: this.selectedState,
          districts,
        },
      ];
    }
    this.selectedDistrict = '';
    this.onFilterChange();
  }

  /**
   * District selection dropdown change
   */
  onDistrictChange(): void {
    if (this.selectedDistrict) {
      const distInfo = this.locationService.findDistrict(this.selectedDistrict);
      if (distInfo) {
        this.selectedState = distInfo.stateName;
        this.mapCenterCoords = distInfo.center;
        this.mapViewport = null;
        this.activeLocationDisplayName = `${distInfo.name}, ${distInfo.stateName}`;
      }
    }
    this.onFilterChange();
  }

  toggleBhk(bhk: number): void {
    if (this.selectedBhkList.has(bhk)) {
      this.selectedBhkList.delete(bhk);
    } else {
      this.selectedBhkList.add(bhk);
    }
    this.onFilterChange();
  }

  setRentPreset(min: number | null, max: number | null): void {
    this.minRent = min;
    this.maxRent = max;
    this.onFilterChange();
  }

  toggleAmenity(amenityId: string): void {
    if (this.selectedAmenities.has(amenityId)) {
      this.selectedAmenities.delete(amenityId);
    } else {
      this.selectedAmenities.add(amenityId);
    }
    this.onFilterChange();
  }

  toggleMobileFilters(): void {
    this.showMobileFiltersDrawer = !this.showMobileFiltersDrawer;
  }

  hoverProperty(prop: Property): void {
    this.hoveredProperty = prop;
  }

  /**
   * "Search this area" Map action
   */
  onMapSearchArea(event: { lat: number; lng: number; radiusKm: number }): void {
    this.mapCenterCoords = { lat: event.lat, lng: event.lng };
    this.searchRadiusKm = event.radiusKm;
    this.activeLocationDisplayName = `Map Search (${Math.round(event.lat * 100) / 100}, ${Math.round(event.lng * 100) / 100})`;
    this.onFilterChange();
  }

  /**
   * GPS device location action
   */
  useCurrentLocation(): void {
    this.isLocating = true;
    this.locationService.requestDeviceLocation().then((coords) => {
      this.isLocating = false;
      if (coords) {
        this.mapCenterCoords = coords;
        this.activeLocationDisplayName = 'My GPS Location';
        this.searchRadiusKm = 25;
        this.onFilterChange();
      } else {
        alert('Could not determine current location. Defaulting to Hyderabad.');
      }
    });
  }

  clearSelectedLocation(): void {
    this.selectedLocation = null;
    this.activeLocationDisplayName = '';
    this.searchQuery = '';
    this.selectedDistrict = '';
    this.selectedState = '';
    this.mapCenterCoords = null;
    this.mapViewport = null;
    this.onFilterChange();
  }

  private updateActiveDisplayName(): void {
    if (this.searchQuery) {
      this.activeLocationDisplayName = this.searchQuery;
    } else if (this.selectedDistrict) {
      this.activeLocationDisplayName = `${this.selectedDistrict}${this.selectedState ? ', ' + this.selectedState : ''}`;
    } else if (this.selectedState) {
      this.activeLocationDisplayName = this.selectedState;
    } else {
      this.activeLocationDisplayName = '';
    }
  }

  // --- EMPTY STATE ACTIONS (Nivas360 Phase 2 & 3 Spec) ---
  expandSearchArea(): void {
    this.searchRadiusKm = Math.min(100, this.searchRadiusKm + 35);
    this.onFilterChange();
  }

  focusChangeLocality(): void {
    this.searchQuery = '';
    this.predictions = [];
    if (this.localityInputRef) {
      this.localityInputRef.nativeElement.focus();
    }
  }

  changeDistrictAction(): void {
    this.searchQuery = '';
    this.selectedDistrict = this.selectedState === 'Andhra Pradesh' ? 'Vijayawada' : 'Warangal';
    this.onDistrictChange();
  }

  isFilterActive(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedState ||
      this.selectedDistrict ||
      this.selectedPropertyType ||
      this.selectedBhkList.size > 0 ||
      this.minRent ||
      this.maxRent ||
      this.selectedFurnishing ||
      this.selectedAvailability ||
      this.selectedAmenities.size > 0
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedState = '';
    this.selectedDistrict = '';
    this.selectedLocation = null;
    this.activeLocationDisplayName = '';
    this.selectedPropertyType = '';
    this.selectedBhkList.clear();
    this.minRent = null;
    this.maxRent = null;
    this.selectedFurnishing = '';
    this.selectedAvailability = '';
    this.selectedAmenities.clear();
    this.selectedSort = 'newest';
    this.searchRadiusKm = 35;
    this.mapCenterCoords = null;
    this.mapViewport = null;
    this.initDistrictGroups();
    this.onFilterChange();
  }

  /**
   * Synchronize all filters into URL parameters and trigger backend search
   */
  onFilterChange(): void {
    const queryParams: any = {};
    if (this.searchQuery) queryParams.search = this.searchQuery;
    if (this.selectedState) queryParams.state = this.selectedState;
    if (this.selectedDistrict) queryParams.district = this.selectedDistrict;
    if (this.selectedPropertyType) queryParams.propertyType = this.selectedPropertyType;

    if (this.selectedBhkList.size > 0) {
      queryParams.bhk = Array.from(this.selectedBhkList).join(',');
    }

    if (this.minRent) queryParams.minRent = this.minRent;
    if (this.maxRent) queryParams.maxRent = this.maxRent;
    if (this.selectedFurnishing) queryParams.furnishing = this.selectedFurnishing;
    if (this.selectedAvailability) queryParams.availabilityStatus = this.selectedAvailability;
    if (this.selectedSort !== 'newest') queryParams.sort = this.selectedSort;
    if (this.searchRadiusKm !== 35) queryParams.radiusKm = this.searchRadiusKm;

    if (this.selectedAmenities.size > 0) {
      queryParams.amenities = Array.from(this.selectedAmenities).join(',');
    }

    if (this.mapCenterCoords) {
      queryParams.lat = this.mapCenterCoords.lat;
      queryParams.lng = this.mapCenterCoords.lng;
    }

    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  /**
   * Query the real Backend API
   * Note: NEVER filter on frontend - all parameters passed to backend
   */
  loadProperties(): void {
    this.isLoading = true;
    this.isError = false;

    const filter: PropertyFilter = {
      search: this.searchQuery || undefined,
      state: this.selectedState || undefined,
      district: this.selectedDistrict || undefined,
      propertyType: this.selectedPropertyType || undefined,
      bhk: this.selectedBhkList.size > 0 ? Array.from(this.selectedBhkList).join(',') : undefined,
      minRent: this.minRent || undefined,
      maxRent: this.maxRent || undefined,
      furnishing: this.selectedFurnishing || undefined,
      availabilityStatus: this.selectedAvailability || undefined,
      amenities: this.selectedAmenities.size > 0 ? Array.from(this.selectedAmenities).join(',') : undefined,
      sort: this.selectedSort,
      radiusKm: this.searchRadiusKm,
    };

    if (this.selectedLocation?.placeId && !this.selectedLocation.placeId.startsWith('canon_')) {
      filter.placeId = this.selectedLocation.placeId;
    }

    if (this.mapCenterCoords) {
      filter.lat = this.mapCenterCoords.lat;
      filter.lng = this.mapCenterCoords.lng;
    }

    this.propertyService.searchProperties(filter).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            this.properties = res.data;
            this.totalProperties = res.data.length;
          } else if (res.data.properties) {
            this.properties = res.data.properties;
            this.totalProperties = res.data.total ?? res.data.properties.length;
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to connect to property search server.';
      },
    });
  }

  loadSavedPropertyIds(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedPropertyIds = new Set(res.data.map((p: any) => p.id));
        }
      },
      error: () => {},
    });
  }

  onToggleSave(property: Property): void {
    if (this.savedPropertyIds.has(property.id)) {
      this.savedPropertyIds.delete(property.id);
      this.propertyService.unsaveProperty(property.id).subscribe({
        error: () => this.savedPropertyIds.add(property.id),
      });
    } else {
      this.savedPropertyIds.add(property.id);
      this.propertyService.saveProperty(property.id).subscribe({
        error: () => this.savedPropertyIds.delete(property.id),
      });
    }
  }

  openPropertyDetails(property: Property): void {
    this.router.navigate(['/tenant/homes', property.id]);
  }
}
