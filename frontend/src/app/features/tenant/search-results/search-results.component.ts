import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyFilter } from '../../../shared/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-tenant-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PropertyCardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-2 text-xs text-slate-500">
          <a routerLink="/tenant/dashboard" class="hover:text-[#2D7A5E] font-medium">Dashboard</a>
          <span>/</span>
          <a routerLink="/tenant/homes" class="hover:text-[#2D7A5E] font-medium">Find Homes</a>
          <span>/</span>
          <span class="text-slate-800 font-bold">Search Results</span>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/tenant/homes"
            class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🗺️ Map & Geographic View</span>
          </a>
        </div>
      </div>

      <!-- Search & Filters Control Bar -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-center gap-3">
          <!-- Keyword / Locality Search Input -->
          <div class="relative flex-1 w-full">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="applyFilters()"
              placeholder="Search by locality, area, colony, or landmark..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E] focus:bg-white transition"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; applyFilters()"
              type="button"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <!-- City Filter -->
          <select
            [(ngModel)]="selectedCity"
            (ngModelChange)="applyFilters()"
            class="w-full md:w-48 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
          >
            <option value="">All Cities (TS & AP)</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Warangal">Warangal</option>
            <option value="Mahabubnagar">Mahabubnagar</option>
            <option value="Nalgonda">Nalgonda</option>
            <option value="Karimnagar">Karimnagar</option>
            <option value="Khammam">Khammam</option>
            <option value="Nizamabad">Nizamabad</option>
            <option value="Vijayawada">Vijayawada</option>
            <option value="Guntur">Guntur</option>
            <option value="Tirupati">Tirupati</option>
          </select>

          <!-- Property Type Filter -->
          <select
            [(ngModel)]="selectedType"
            (ngModelChange)="applyFilters()"
            class="w-full md:w-44 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D7A5E]"
          >
            <option value="">All Property Types</option>
            <option value="APARTMENT">Apartment / Flat</option>
            <option value="INDEPENDENT_HOUSE">Independent House</option>
            <option value="VILLA">Gated Villa</option>
            <option value="GATED_COMMUNITY">Gated Community</option>
          </select>

          <!-- Search Button -->
          <button
            (click)="applyFilters()"
            type="button"
            class="w-full md:w-auto px-6 py-2.5 bg-[#0F2937] hover:bg-[#1E3A8A] text-[#FACC15] font-extrabold text-xs rounded-2xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>

        <!-- Secondary Filter Chips: Bedrooms, Furnishing & Sort -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <!-- BHK Filter Chips -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-black uppercase text-slate-400 mr-1">Bedrooms:</span>
            <button
              *ngFor="let bhk of [1, 2, 3, 4]"
              (click)="toggleBhk(bhk)"
              type="button"
              [class]="selectedBhk === bhk ? 'bg-[#2D7A5E] text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              class="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer"
            >
              {{ bhk }} BHK
            </button>
            <button
              *ngIf="selectedBhk !== null"
              (click)="selectedBhk = null; applyFilters()"
              type="button"
              class="text-[10px] text-rose-600 font-bold ml-1 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          <!-- Furnishing Chips -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-black uppercase text-slate-400 mr-1">Furnishing:</span>
            <button
              *ngFor="let furn of furnishingOptions"
              (click)="toggleFurnishing(furn.value)"
              type="button"
              [class]="selectedFurnishing === furn.value ? 'bg-[#0F2937] text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              class="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer"
            >
              {{ furn.label }}
            </button>
          </div>

          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase text-slate-400">Sort By:</span>
            <select
              [(ngModel)]="sortBy"
              (ngModelChange)="sortResults()"
              class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="rent_asc">Rent: Low to High</option>
              <option value="rent_desc">Rent: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Result Count & Clear Filters -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full">
            {{ filteredProperties.length }} Homes Found
          </span>
          <span *ngIf="activeFiltersCount > 0" class="text-xs text-slate-400">
            ({{ activeFiltersCount }} filter{{ activeFiltersCount > 1 ? 's' : '' }} applied)
          </span>
        </div>

        <button
          *ngIf="activeFiltersCount > 0"
          (click)="clearAllFilters()"
          type="button"
          class="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>

      <!-- Loading State -->
      <app-loading-state *ngIf="isLoading" message="Searching verified rental properties..."></app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="isError && !isLoading"
        title="Search Error"
        [message]="errorMessage"
        (retry)="loadProperties()"
      ></app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !isError && filteredProperties.length === 0"
        title="No properties found"
        message="No properties matched your current search parameters. Try widening your filters or exploring another locality."
        actionText="Reset Search Filters"
        (action)="clearAllFilters()"
      ></app-empty-state>

      <!-- Results Grid -->
      <div *ngIf="!isLoading && !isError && filteredProperties.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <app-property-card
          *ngFor="let prop of filteredProperties"
          [property]="prop"
          [isSaved]="isPropertySaved(prop)"
          (cardSelect)="openPropertyDetails($event)"
          (toggleSave)="toggleSaveProperty($event)"
        ></app-property-card>
      </div>
    </div>
  `,
})
export class TenantSearchResultsComponent implements OnInit {
  searchQuery: string = '';
  selectedCity: string = '';
  selectedType: string = '';
  selectedBhk: number | null = null;
  selectedFurnishing: string = '';
  sortBy: string = 'newest';

  furnishingOptions = [
    { label: 'Furnished', value: 'FURNISHED' },
    { label: 'Semi-Furnished', value: 'SEMI_FURNISHED' },
    { label: 'Unfurnished', value: 'UNFURNISHED' },
  ];

  allProperties: Property[] = [];
  filteredProperties: Property[] = [];
  savedPropertyIds: Set<string> = new Set();

  isLoading: boolean = true;
  isError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    // Read query parameters from URL
    this.route.queryParams.subscribe((params) => {
      if (params['q']) this.searchQuery = params['q'];
      if (params['city']) this.selectedCity = params['city'];
      if (params['propertyType']) this.selectedType = params['propertyType'];
      if (params['bedrooms']) this.selectedBhk = Number(params['bedrooms']) || null;
      if (params['furnishing']) this.selectedFurnishing = params['furnishing'];
      if (params['sort']) this.sortBy = params['sort'];

      this.loadProperties();
      this.loadSavedProperties();
    });
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedCity) count++;
    if (this.selectedType) count++;
    if (this.selectedBhk !== null) count++;
    if (this.selectedFurnishing) count++;
    return count;
  }

  loadProperties(): void {
    this.isLoading = true;
    this.isError = false;

    const filter: PropertyFilter = {};
    if (this.selectedCity) filter.city = this.selectedCity;
    if (this.selectedType) filter.propertyType = this.selectedType as any;
    if (this.selectedBhk !== null) filter['bhk'] = this.selectedBhk;
    if (this.selectedFurnishing) filter.furnishing = this.selectedFurnishing as any;

    this.propertyService.searchProperties(filter).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.allProperties = res.data;
          this.filterAndSort();
        } else {
          this.allProperties = [];
          this.filteredProperties = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = err?.error?.message || 'Failed to search properties. Please try again.';
      },
    });
  }

  loadSavedProperties(): void {
    this.propertyService.getSavedProperties().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.savedPropertyIds = new Set(res.data.map((p) => p.id || (p as any)._id));
        }
      },
      error: () => {},
    });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchQuery || null,
        city: this.selectedCity || null,
        propertyType: this.selectedType || null,
        bedrooms: this.selectedBhk || null,
        furnishing: this.selectedFurnishing || null,
        sort: this.sortBy,
      },
      queryParamsHandling: 'merge',
    });
  }

  filterAndSort(): void {
    let result = [...this.allProperties];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const loc = p.propertyLocation;
        const locStr = `${loc?.locality || ''} ${loc?.address || ''} ${loc?.city || ''}`.toLowerCase();
        return title.includes(q) || desc.includes(q) || locStr.includes(q);
      });
    }

    if (this.selectedBhk !== null) {
      result = result.filter((p) => p.bhk === this.selectedBhk || (p as any).bedrooms === this.selectedBhk);
    }

    if (this.selectedFurnishing) {
      result = result.filter((p) => p.furnishing === this.selectedFurnishing);
    }

    this.filteredProperties = result;
    this.sortResults();
  }

  sortResults(): void {
    if (this.sortBy === 'rent_asc') {
      this.filteredProperties.sort((a, b) => a.rentAmount - b.rentAmount);
    } else if (this.sortBy === 'rent_desc') {
      this.filteredProperties.sort((a, b) => b.rentAmount - a.rentAmount);
    } else {
      // Newest
      this.filteredProperties.sort((a, b) => {
        const da = new Date((a as any).createdAt || 0).getTime();
        const db = new Date((b as any).createdAt || 0).getTime();
        return db - da;
      });
    }
  }

  toggleBhk(bhk: number): void {
    this.selectedBhk = this.selectedBhk === bhk ? null : bhk;
    this.applyFilters();
  }

  toggleFurnishing(val: string): void {
    this.selectedFurnishing = this.selectedFurnishing === val ? '' : val;
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedType = '';
    this.selectedBhk = null;
    this.selectedFurnishing = '';
    this.applyFilters();
  }

  isPropertySaved(prop: Property): boolean {
    const id = prop.id || (prop as any)._id || '';
    return this.savedPropertyIds.has(id);
  }

  openPropertyDetails(prop: Property): void {
    const id = prop.id || (prop as any)._id;
    if (id) {
      this.router.navigate(['/tenant/homes', id]);
    }
  }

  toggleSaveProperty(prop: Property): void {
    const id = prop.id || (prop as any)._id;
    if (!id) return;

    if (this.savedPropertyIds.has(id)) {
      this.propertyService.unsaveProperty(id).subscribe({
        next: () => {
          this.savedPropertyIds.delete(id);
        },
      });
    } else {
      this.propertyService.saveProperty(id).subscribe({
        next: () => {
          this.savedPropertyIds.add(id);
        },
      });
    }
  }
}
