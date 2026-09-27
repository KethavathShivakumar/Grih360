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
  UserLocationState,
} from '../../../core/services/location.service';
import { DistrictInfo, StateInfo } from '../../../core/config/geography.config';
import { Property, PropertyFilter } from '../../../shared/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';

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
      <!-- Hero Header & Search Bar -->
      <div class="relative bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] rounded-3xl p-5 sm:p-7 text-white shadow-lg overflow-visible space-y-4">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-2xl space-y-1 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>✨ Model Tenancy Act Verified Homes</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Rent your <span class="text-[#FACC15]">dream home</span> in Telangana & AP
          </h1>
          <p class="text-xs sm:text-sm text-slate-300">
            Real geographic search across Hyderabad, Warangal, Mahabubnagar, Nalgonda, Karimnagar, Khammam, Nizamabad, Vijayawada, Guntur & Tirupati.
          </p>
        </div>

        <!-- Search Controls Box -->
        <div class="bg-white rounded-2xl p-3 relative z-30 text-slate-800 shadow-xl border border-white/20">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            <!-- 1. Google Places Autocomplete Input with Predictions Dropdown -->
            <div class="md:col-span-4 px-3 py-1 relative border-b md:border-b-0 md:border-r border-slate-200">
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
                  placeholder="Type locality, city, district..."
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

            <!-- 2. State & Canonical District Selection Flow -->
            <div class="md:col-span-2 px-3 py-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">State</label>
              <select
                [(ngModel)]="selectedState"
                (change)="onStateChange()"
                class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All States (TG & AP)</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

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

            <!-- 3. BHK Selector -->
            <div class="md:col-span-2 px-2 py-1 flex flex-col">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">BHK</label>
              <div class="flex items-center gap-1 mt-0.5">
                <button
                  *ngFor="let bhk of [1, 2, 3, 4]"
                  (click)="selectBhk(bhk)"
                  type="button"
                  [class]="selectedBhk === bhk ? 'bg-[#0F2937] text-white font-extrabold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                  class="px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer"
                >
                  {{ bhk }}B
                </button>
              </div>
            </div>

            <!-- 4. GPS & Action Buttons -->
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
                title="Search"
              >
                <span>→</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Filter Action Bar & Breadcrumbs -->
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

          <!-- Filter Drawer Button -->
          <button
            (click)="toggleFilters()"
            type="button"
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Filters</span>
            <span *ngIf="isFilterActive()" class="w-2 h-2 rounded-full bg-[#2D7A5E]"></span>
          </button>
        </div>
      </div>

      <!-- Expandable Refine Filter Drawer Panel -->
      <div *ngIf="showFiltersDrawer" class="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-xs space-y-4 animate-fade-in">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider">Refine Property Filters</h3>
          <button (click)="resetFilters()" class="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
            Reset All Filters
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Property Type Filter -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Property Type</label>
            <select
              [(ngModel)]="selectedPropertyType"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">All Property Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="INDEPENDENT_HOUSE">Independent House</option>
              <option value="VILLA">Villa</option>
              <option value="PG_HOSTEL">PG / Hostel</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>

          <!-- Furnishing Filter -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Furnishing</label>
            <select
              [(ngModel)]="selectedFurnishing"
              (change)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">Any Furnishing</option>
              <option value="FULLY_FURNISHED">Fully Furnished</option>
              <option value="SEMI_FURNISHED">Semi Furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>

          <!-- Rent Range -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Monthly Rent (₹)</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="number"
                [(ngModel)]="minRent"
                (change)="onFilterChange()"
                placeholder="Min ₹"
                class="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
              <input
                type="number"
                [(ngModel)]="maxRent"
                (change)="onFilterChange()"
                placeholder="Max ₹"
                class="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN SPLIT VIEW: PROPERTIES ON LEFT | MAP ON RIGHT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT: Properties List -->
        <div [class.hidden]="mobileView === 'map'" class="lg:block lg:col-span-7 space-y-4">
          <!-- Loading State -->
          <app-loading-state *ngIf="isLoading" message="Searching verified homes in Telangana & AP..."></app-loading-state>

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

          <!-- REAL LOCATION SEARCH EMPTY STATE (Nivas360 Phase 2 Requirement) -->
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
                <strong class="text-slate-800">{{ activeLocationDisplayName || 'this locality' }}</strong>.
                Try expanding your search radius or exploring neighboring hubs across Telangana & AP.
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

          <!-- Property Cards Grid -->
          <div *ngIf="!isLoading && !isError && properties.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-property-card
              *ngFor="let prop of properties"
              [property]="prop"
              [isSaved]="savedPropertyIds.has(prop.id)"
              (cardSelect)="openPropertyDetails($event)"
              (toggleSave)="onToggleSave($event)"
              (mouseenter)="hoverProperty(prop)"
              class="transition-all hover:scale-[1.01]"
            ></app-property-card>
          </div>
        </div>

        <!-- RIGHT: Interactive Google Map -->
        <div
          [class.hidden]="mobileView === 'list'"
          class="lg:block lg:col-span-5 lg:sticky lg:top-20 z-10 h-[500px] lg:h-[calc(100vh-120px)]"
        >
          <app-google-map
            [properties]="properties"
            [selectedProperty]="hoveredProperty"
            [centerCoords]="mapCenterCoords"
            [viewport]="mapViewport"
            [centerCity]="activeLocationDisplayName || 'Hyderabad'"
            (propertyClick)="openPropertyDetails($event)"
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
  selectedBhk: number | null = null;
  minRent: number | null = null;
  maxRent: number | null = null;
  selectedFurnishing: string = '';
  selectedSort: string = 'newest';
  searchRadiusKm: number = 35;

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
  showFiltersDrawer: boolean = false;
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

    // Watch query params
    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if (params['search']) this.searchQuery = params['search'];
        if (params['state']) this.selectedState = params['state'];
        if (params['district']) this.selectedDistrict = params['district'];
        if (params['city']) this.searchQuery = this.searchQuery || params['city'];
        if (params['propertyType']) this.selectedPropertyType = params['propertyType'];
        if (params['bhk']) this.selectedBhk = Number(params['bhk']);
        if (params['minRent']) this.minRent = Number(params['minRent']);
        if (params['maxRent']) this.maxRent = Number(params['maxRent']);
        if (params['furnishing']) this.selectedFurnishing = params['furnishing'];
        if (params['sort']) this.selectedSort = params['sort'];
        if (params['radiusKm']) this.searchRadiusKm = Number(params['radiusKm']);

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

  selectBhk(bhk: number): void {
    this.selectedBhk = this.selectedBhk === bhk ? null : bhk;
    this.onFilterChange();
  }

  toggleFilters(): void {
    this.showFiltersDrawer = !this.showFiltersDrawer;
  }

  hoverProperty(prop: Property): void {
    this.hoveredProperty = prop;
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

  // --- EMPTY STATE HELPER ACTIONS ---
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
      this.selectedBhk ||
      this.minRent ||
      this.maxRent ||
      this.selectedFurnishing
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedState = '';
    this.selectedDistrict = '';
    this.selectedLocation = null;
    this.activeLocationDisplayName = '';
    this.selectedPropertyType = '';
    this.selectedBhk = null;
    this.minRent = null;
    this.maxRent = null;
    this.selectedFurnishing = '';
    this.selectedSort = 'newest';
    this.searchRadiusKm = 35;
    this.mapCenterCoords = null;
    this.mapViewport = null;
    this.initDistrictGroups();
    this.onFilterChange();
  }

  onFilterChange(): void {
    const queryParams: any = {};
    if (this.searchQuery) queryParams.search = this.searchQuery;
    if (this.selectedState) queryParams.state = this.selectedState;
    if (this.selectedDistrict) queryParams.district = this.selectedDistrict;
    if (this.selectedPropertyType) queryParams.propertyType = this.selectedPropertyType;
    if (this.selectedBhk) queryParams.bhk = this.selectedBhk;
    if (this.minRent) queryParams.minRent = this.minRent;
    if (this.maxRent) queryParams.maxRent = this.maxRent;
    if (this.selectedFurnishing) queryParams.furnishing = this.selectedFurnishing;
    if (this.selectedSort !== 'newest') queryParams.sort = this.selectedSort;
    if (this.searchRadiusKm !== 35) queryParams.radiusKm = this.searchRadiusKm;

    if (this.mapCenterCoords) {
      queryParams.lat = this.mapCenterCoords.lat;
      queryParams.lng = this.mapCenterCoords.lng;
    }

    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  loadProperties(): void {
    this.isLoading = true;
    this.isError = false;

    const filter: PropertyFilter = {
      search: this.searchQuery || undefined,
      state: this.selectedState || undefined,
      district: this.selectedDistrict || undefined,
      propertyType: (this.selectedPropertyType as any) || undefined,
      bhk: this.selectedBhk || undefined,
      minRent: this.minRent || undefined,
      maxRent: this.maxRent || undefined,
      furnishing: (this.selectedFurnishing as any) || undefined,
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
