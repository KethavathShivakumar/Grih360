import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PropertyService } from '../../../core/services/property.service';
import { LocationService } from '../../../core/services/location.service';
import { Property, PropertyFilter } from '../../../shared/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { GoogleMapComponent } from '../../../shared/components/google-map/google-map.component';

@Component({
  selector: 'app-find-homes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    GoogleMapComponent,
  ],
  template: `
    <div class="space-y-5">
      <!-- Hero Header & Search Bar -->
      <div class="relative bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] rounded-3xl p-5 sm:p-8 text-white shadow-lg overflow-hidden space-y-5">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-2xl space-y-1.5 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#FACC15] border border-white/15">
            <span>✨ Model Tenancy Act Verified Homes</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Rent your <span class="text-[#FACC15]">dream flat</span> in Telangana & AP
          </h1>
          <p class="text-xs sm:text-sm text-slate-300">
            Zero-brokerage verified apartments and independent houses in Hyderabad, Warangal, Vijayawada & Visakhapatnam.
          </p>
        </div>

        <!-- Search Controls Pill -->
        <div class="bg-white rounded-2xl p-2.5 sm:p-3 relative z-10 text-slate-800 shadow-xl border border-white/20">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <!-- Locality / Keyword Input -->
            <div class="md:col-span-4 px-3 py-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Locality / Landmark</label>
              <div class="flex items-center space-x-2 mt-0.5">
                <span class="text-sm">🔍</span>
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchInput($event)"
                  placeholder="Gachibowli, Hanamkonda, Benz Circle..."
                  class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <!-- City Dropdown -->
            <div class="md:col-span-3 px-3 py-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">City</label>
              <select
                [(ngModel)]="searchLocation"
                (change)="onFilterChange()"
                class="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All Telangana & AP Cities</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Warangal">Warangal / Hanamkonda</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
              </select>
            </div>

            <!-- BHK Selector -->
            <div class="md:col-span-3 px-3 py-1 flex flex-col">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bedrooms</label>
              <div class="flex items-center gap-1 mt-0.5">
                <button
                  *ngFor="let bhk of [1, 2, 3, 4]"
                  (click)="selectBhk(bhk)"
                  type="button"
                  [class]="selectedBhk === bhk ? 'bg-[#0F2937] text-white font-extrabold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                  class="px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer"
                >
                  {{ bhk }}BHK
                </button>
              </div>
            </div>

            <!-- GPS Button & Search Action -->
            <div class="md:col-span-2 flex items-center justify-end gap-1.5 px-1">
              <button
                (click)="useCurrentLocation()"
                type="button"
                class="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Use Current Device Location"
              >
                📍 GPS
              </button>
              <button
                (click)="onFilterChange()"
                type="button"
                class="px-4 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black text-xs rounded-xl shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
              >
                <span>Search</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile View Toggle & Filter Action Bar -->
      <div class="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E6DF] shadow-2xs">
        <div class="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <span>Showing <strong class="text-[#0F2937]">{{ totalProperties }}</strong> properties</span>
          <span *ngIf="searchLocation" class="text-slate-400">• in {{ searchLocation }}</span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Sort Dropdown (Desktop & Mobile) -->
          <select
            [(ngModel)]="selectedSort"
            (change)="onFilterChange()"
            class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="rent_asc">Rent: Low to High</option>
            <option value="rent_desc">Rent: High to Low</option>
          </select>

          <!-- Mobile View Switcher: List vs Map (Requirement #10) -->
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

      <!-- Expandable Filter Drawer Panel -->
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

      <!-- MAIN SPLIT VIEW: PROPERTIES ON LEFT | MAP ON RIGHT (User Annotation on Screenshot) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT: Properties List (Visible on desktop, or on mobile when mobileView === 'list') -->
        <div
          [class.hidden]="mobileView === 'map'"
          class="lg:block lg:col-span-7 space-y-4"
        >
          <!-- Loading State -->
          <app-loading-state *ngIf="isLoading" message="Searching verified homes in Telangana & AP..."></app-loading-state>

          <!-- Error State -->
          <app-error-state
            *ngIf="isError && !isLoading"
            title="Unable to load properties"
            [message]="errorMessage"
            (retry)="loadProperties()"
          ></app-error-state>

          <!-- Empty State -->
          <app-empty-state
            *ngIf="!isLoading && !isError && properties.length === 0"
            title="No matching properties found"
            message="Try widening your rent range, searching another locality, or resetting filters."
            actionText="Reset All Filters"
            (action)="resetFilters()"
          ></app-empty-state>

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

        <!-- RIGHT: Interactive Google Map (Visible on desktop, or on mobile when mobileView === 'map') -->
        <div
          [class.hidden]="mobileView === 'list'"
          class="lg:block lg:col-span-5 lg:sticky lg:top-20 z-10 h-[500px] lg:h-[calc(100vh-120px)]"
        >
          <app-google-map
            [properties]="properties"
            [selectedProperty]="hoveredProperty"
            [centerCity]="searchLocation || 'Hyderabad'"
            (propertyClick)="openPropertyDetails($event)"
          ></app-google-map>
        </div>
      </div>
    </div>
  `,
})
export class FindHomesComponent implements OnInit, OnDestroy {
  properties: Property[] = [];
  savedPropertyIds = new Set<string>();
  totalProperties: number = 0;

  searchQuery: string = '';
  searchLocation: string = '';
  selectedPropertyType: string = '';
  selectedBhk: number | null = null;
  minRent: number | null = null;
  maxRent: number | null = null;
  selectedFurnishing: string = '';
  selectedSort: string = 'newest';

  mobileView: 'list' | 'map' = 'list';
  showFiltersDrawer: boolean = false;
  hoveredProperty: Property | null = null;

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
    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if (params['search']) this.searchQuery = params['search'];
        if (params['city']) this.searchLocation = params['city'];
        if (params['propertyType']) this.selectedPropertyType = params['propertyType'];
        if (params['bhk']) this.selectedBhk = Number(params['bhk']);
        if (params['minRent']) this.minRent = Number(params['minRent']);
        if (params['maxRent']) this.maxRent = Number(params['maxRent']);
        if (params['furnishing']) this.selectedFurnishing = params['furnishing'];
        if (params['sort']) this.selectedSort = params['sort'];

        this.loadSavedPropertyIds();
        this.loadProperties();
      })
    );

    this.subscriptions.push(
      this.searchDebounce$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
        this.onFilterChange();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  onSearchInput(val: string): void {
    this.searchDebounce$.next(val);
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

  useCurrentLocation(): void {
    this.locationService.getCurrentPosition().subscribe({
      next: (pos) => {
        if (pos) {
          this.searchLocation = 'Hyderabad';
          this.onFilterChange();
        }
      },
      error: () => {
        this.searchLocation = 'Hyderabad';
        this.onFilterChange();
      },
    });
  }

  isFilterActive(): boolean {
    return !!(
      this.searchQuery ||
      this.searchLocation ||
      this.selectedPropertyType ||
      this.selectedBhk ||
      this.minRent ||
      this.maxRent ||
      this.selectedFurnishing
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.searchLocation = '';
    this.selectedPropertyType = '';
    this.selectedBhk = null;
    this.minRent = null;
    this.maxRent = null;
    this.selectedFurnishing = '';
    this.selectedSort = 'newest';
    this.onFilterChange();
  }

  onFilterChange(): void {
    const queryParams: any = {};
    if (this.searchQuery) queryParams.search = this.searchQuery;
    if (this.searchLocation) queryParams.city = this.searchLocation;
    if (this.selectedPropertyType) queryParams.propertyType = this.selectedPropertyType;
    if (this.selectedBhk) queryParams.bhk = this.selectedBhk;
    if (this.minRent) queryParams.minRent = this.minRent;
    if (this.maxRent) queryParams.maxRent = this.maxRent;
    if (this.selectedFurnishing) queryParams.furnishing = this.selectedFurnishing;
    if (this.selectedSort !== 'newest') queryParams.sort = this.selectedSort;

    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  loadProperties(): void {
    this.isLoading = true;
    this.isError = false;

    const filter: PropertyFilter = {
      searchLocation: this.searchQuery || undefined,
      city: this.searchLocation || undefined,
      propertyType: (this.selectedPropertyType as any) || undefined,
      bhk: this.selectedBhk || undefined,
      minRent: this.minRent || undefined,
      maxRent: this.maxRent || undefined,
      furnishing: (this.selectedFurnishing as any) || undefined,
      sort: this.selectedSort,
    };

    this.propertyService.searchProperties(filter).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            this.properties = res.data;
            this.totalProperties = res.data.length;
          } else if (res.data.properties) {
            this.properties = res.data.properties;
            this.totalProperties = res.data.total || res.data.properties.length;
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
