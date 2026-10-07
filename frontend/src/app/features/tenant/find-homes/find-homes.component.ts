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
      <!-- MOBILE LAYOUT (< 768px) -->
      <div class="md:hidden space-y-3 pb-6">
        <!-- Top Compact Header Bar (Solid Navy #0F2937) -->
        <div class="bg-[#0F2937] text-white p-3 rounded-2xl shadow-md space-y-2">
          <div class="flex items-center gap-2">
            <!-- Locality Search Input -->
            <div class="relative flex-1 bg-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/15">
              <svg class="w-4 h-4 text-[#FACC15] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                #localityInputMobile
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onLocalitySearchChange($event)"
                (focus)="onLocalityFocus()"
                placeholder="Search locality..."
                class="w-full text-xs font-bold text-white bg-transparent focus:outline-none placeholder:text-slate-300"
              />
              <button
                *ngIf="searchQuery"
                (click)="clearLocalityInput()"
                type="button"
                class="text-xs text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <!-- Use My Location Icon Button -->
            <button
              (click)="useCurrentLocation()"
              [disabled]="isLocating"
              type="button"
              class="p-2.5 bg-white/10 hover:bg-white/20 text-[#FACC15] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/15 shrink-0 flex items-center justify-center"
              title="Use My Location"
            >
              <svg *ngIf="!isLocating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span *ngIf="isLocating" class="inline-block animate-spin text-xs">⏳</span>
            </button>

            <!-- Filters Button -->
            <button
              (click)="toggleMobileFilters()"
              type="button"
              class="px-3 py-2 bg-white text-[#0F2937] hover:bg-slate-100 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <span>Filters</span>
              <span *ngIf="activeFilterCount > 0" class="px-1.5 py-0.5 bg-[#2D7A5E] text-white text-[9px] font-black rounded-full">
                {{ activeFilterCount }}
              </span>
            </button>
          </div>

          <!-- Mobile Suggestions Dropdown -->
          <div
            *ngIf="showPredictions && predictions.length > 0"
            class="bg-white rounded-xl shadow-2xl border border-slate-200 py-1 text-slate-800 max-h-48 overflow-y-auto"
          >
            <button
              *ngFor="let pred of predictions"
              (click)="selectPrediction(pred)"
              type="button"
              class="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer"
            >
              <p class="text-xs font-bold text-slate-900 truncate">{{ pred.mainText }}</p>
              <p class="text-[10px] text-slate-500 truncate">{{ pred.secondaryText }}</p>
            </button>
          </div>
        </div>

        <!-- Mobile Always Visible Map (40% Screen Height ~ h-72) -->
        <div class="relative w-full h-72 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
          <app-google-map
            [properties]="properties"
            [selectedProperty]="selectedProperty"
            [centerCoords]="mapCenterCoords"
            [viewport]="mapViewport"
            [centerCity]="activeLocationDisplayName || 'Hyderabad'"
            (propertyClick)="onMapPropertySelect($event)"
            (searchArea)="onMapSearchArea($event)"
          ></app-google-map>

          <!-- Fullscreen Map Expand Button -->
          <button
            (click)="isMobileMapExpanded = true"
            type="button"
            class="absolute top-2.5 right-2.5 z-20 px-2.5 py-1.5 bg-[#0F2937]/90 text-white hover:bg-[#0F2937] text-[11px] font-black rounded-xl shadow-md backdrop-blur-md flex items-center gap-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
            <span>Full Map</span>
          </button>
        </div>

        <!-- Fullscreen Map Modal -->
        <div *ngIf="isMobileMapExpanded" class="fixed inset-0 z-50 bg-white flex flex-col">
          <div class="bg-[#0F2937] text-white p-3 flex items-center justify-between shadow-md shrink-0">
            <button
              (click)="isMobileMapExpanded = false"
              type="button"
              class="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              ← Back to List
            </button>
            <span class="text-xs font-extrabold text-white">Full Screen Map View</span>
            <div class="w-16"></div>
          </div>
          <div class="flex-1 w-full relative">
            <app-google-map
              [properties]="properties"
              [selectedProperty]="selectedProperty"
              [centerCoords]="mapCenterCoords"
              [viewport]="mapViewport"
              [centerCity]="activeLocationDisplayName || 'Hyderabad'"
              (propertyClick)="onMapPropertySelect($event)"
              (searchArea)="onMapSearchArea($event)"
            ></app-google-map>
          </div>
        </div>

        <!-- Below Map: Result Count & Sort Chip -->
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-black text-[#0F2937]">
            {{ totalProperties }} Homes Found
          </span>
          <select
            [(ngModel)]="selectedSort"
            (change)="onFilterChange()"
            class="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs cursor-pointer focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="rent_asc">Rent: Low → High</option>
            <option value="rent_desc">Rent: High → Low</option>
          </select>
        </div>

        <!-- Mobile Loading Skeleton -->
        <div *ngIf="isLoading" class="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3">
          <div *ngFor="let i of [1,2,3,4]" class="bg-white rounded-2xl border border-slate-200 p-2.5 space-y-2 animate-pulse">
            <div class="w-full aspect-[4/3] bg-slate-200 rounded-xl"></div>
            <div class="h-3 bg-slate-200 rounded w-3/4"></div>
            <div class="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Mobile Error State -->
        <div *ngIf="isError && !isLoading" class="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <p class="text-xs font-bold text-rose-800">{{ errorMessage }}</p>
          <button (click)="loadProperties()" type="button" class="px-3 py-1.5 bg-[#0F2937] text-white text-xs font-bold rounded-xl cursor-pointer">
            Retry Search
          </button>
        </div>

        <!-- Mobile Empty State -->
        <div *ngIf="!isLoading && !isError && properties.length === 0" class="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <div class="text-3xl">🏡</div>
          <h4 class="text-xs font-bold text-[#0F2937]">No homes match your current filters</h4>
          <p class="text-[11px] text-slate-500">Try expanding your search radius or resetting filters.</p>
          <button (click)="resetFilters()" type="button" class="px-4 py-2 bg-[#0F2937] text-white text-xs font-bold rounded-xl cursor-pointer">
            Reset Filters
          </button>
        </div>

        <!-- Mobile TWO-COLUMN Compact Homes Grid -->
        <div *ngIf="!isLoading && !isError && properties.length > 0" class="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3">
          <app-property-card
            *ngFor="let prop of properties"
            [property]="prop"
            [isSaved]="savedPropertyIds.has(prop.id)"
            (cardSelect)="openPropertyDetails($event)"
            (toggleSave)="onToggleSave($event)"
          ></app-property-card>
        </div>

        <!-- Mobile Bottom Sheet Filters Modal -->
        <div *ngIf="showMobileFiltersDrawer" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div class="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-slate-200">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-xs font-extrabold text-[#0F2937] uppercase tracking-wider flex items-center gap-1.5">
                <span>Filter Search Results</span>
                <span *ngIf="activeFilterCount > 0" class="px-2 py-0.5 bg-emerald-100 text-[#2D7A5E] text-[10px] font-black rounded-full">
                  {{ activeFilterCount }} Active
                </span>
              </h3>
              <div class="flex items-center space-x-2">
                <button (click)="resetFilters()" type="button" class="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Reset</button>
                <button (click)="showMobileFiltersDrawer = false" type="button" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
              </div>
            </div>

            <!-- State & Search Radius -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label class="font-bold text-slate-700 block mb-1">State</label>
                <select [(ngModel)]="selectedState" (change)="onStateChange()" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option value="">All States</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">Search Radius</label>
                <select [(ngModel)]="searchRadiusKm" (change)="onFilterChange()" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option [value]="15">15 km</option>
                  <option [value]="25">25 km</option>
                  <option [value]="35">35 km</option>
                  <option [value]="50">50 km</option>
                </select>
              </div>
            </div>

            <!-- District / City -->
            <div class="text-xs space-y-1">
              <label class="font-bold text-slate-700 block">District / Hub</label>
              <select [(ngModel)]="selectedDistrict" (change)="onDistrictChange()" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                <option value="">All Districts</option>
                <optgroup *ngFor="let group of districtGroups" [label]="group.stateName">
                  <option *ngFor="let dist of group.districts" [value]="dist.name">
                    {{ dist.name }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Rent Presets -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Monthly Rent (₹)</label>
              <div class="grid grid-cols-2 gap-2">
                <input type="number" [(ngModel)]="minRent" (change)="onFilterChange()" placeholder="Min ₹" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                <input type="number" [(ngModel)]="maxRent" (change)="onFilterChange()" placeholder="Max ₹" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>

            <!-- BHK Pills -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 block">Bedrooms (BHK)</label>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  *ngFor="let bhk of [1, 2, 3, 4]"
                  (click)="toggleBhk(bhk)"
                  type="button"
                  [class]="selectedBhkList.has(bhk) ? 'bg-[#0F2937] text-white font-extrabold' : 'bg-slate-100 text-slate-700'"
                  class="py-1.5 text-xs rounded-xl text-center cursor-pointer"
                >
                  {{ bhk }}{{ bhk === 4 ? '+' : '' }} BHK
                </button>
              </div>
            </div>

            <!-- Property Type & Furnishing -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Property Type</label>
                <select [(ngModel)]="selectedPropertyType" (change)="onFilterChange()" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option value="">All Types</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="INDEPENDENT_HOUSE">House</option>
                  <option value="VILLA">Villa</option>
                  <option value="PG_HOSTEL">PG / Hostel</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">Furnishing</label>
                <select [(ngModel)]="selectedFurnishing" (change)="onFilterChange()" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                  <option value="">Any</option>
                  <option value="FULLY_FURNISHED">Furnished</option>
                  <option value="SEMI_FURNISHED">Semi-Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>
            </div>

            <!-- Bottom Sheet Apply Button -->
            <button
              (click)="showMobileFiltersDrawer = false"
              type="button"
              class="w-full py-3 bg-[#0F2937] hover:bg-[#164E63] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer mt-2"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP LAYOUT (>= 768px) UNCHANGED -->
      <div class="hidden md:block space-y-5">
        <!-- Hero Header & Geographic Search Hub -->
        <div class="relative bg-gradient-to-r from-[#0F2937] via-[#164E63] to-[#0F2937] rounded-3xl p-5 sm:p-7 text-white shadow-lg overflow-visible space-y-4">
          <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="max-w-2xl space-y-1 relative z-10">
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Find homes across <span class="text-[#FACC15]">Telangana & AP</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-300">
              Search across Hyderabad, Warangal, Mahabubnagar, Nalgonda, Karimnagar, Khammam, Nizamabad, Vijayawada, Guntur & Tirupati.
            </p>
          </div>

          <!-- Top Search Bar Pill -->
          <div class="bg-white rounded-2xl p-3 relative z-30 text-slate-800 shadow-xl border border-white/20">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
              
              <!-- 1. Google Places Autocomplete Input -->
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
                  <svg class="w-4 h-4 text-[#2D7A5E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
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
                  <button
                    *ngFor="let pred of predictions"
                    (click)="selectPrediction(pred)"
                    type="button"
                    class="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start space-x-2.5 border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.3-4.3"/></svg>
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
                  <option value="">All Districts</option>
                  <optgroup *ngFor="let group of districtGroups" [label]="group.stateName">
                    <option *ngFor="let dist of group.districts" [value]="dist.name">
                      {{ dist.name }}
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
                  <svg *ngIf="!isLocating" class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  <span *ngIf="isLocating" class="inline-block animate-spin">⏳</span>
                </button>
                <button
                  (click)="onFilterChange()"
                  type="button"
                  class="p-2 sm:px-3 bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] font-black text-xs rounded-xl shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                  title="Search Database"
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

            <span *ngIf="searchRadiusKm" class="text-slate-400 text-[11px]">
              • Within {{ searchRadiusKm }} km
            </span>
          </div>

          <div class="flex items-center space-x-2">
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

            <select
              [(ngModel)]="selectedSort"
              (change)="onFilterChange()"
              class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="rent_asc">Rent: Low to High</option>
              <option value="rent_desc">Rent: High to Low</option>
            </select>
          </div>
        </div>

        <!-- MAIN 3-ZONE LAYOUT (Desktop: Left Filters | Center Results | Right Map) -->
        <div class="grid grid-cols-12 gap-6 items-start">
          
          <!-- LEFT COLUMN: Desktop Persistent Filter Sidebar -->
          <div class="col-span-3">
            <div class="bg-white p-5 rounded-3xl border border-[#E8E6DF] shadow-xs space-y-5">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="text-xs font-black text-[#0F2937] uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-[#2D7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
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
            </div>
          </div>

          <!-- CENTER RESULTS COLUMN -->
          <div class="col-span-5 space-y-4">
            <app-loading-state *ngIf="isLoading" message="Searching property database..."></app-loading-state>

            <div *ngIf="isError && !isLoading" class="bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3">
              <p class="text-rose-600 font-bold text-sm">{{ errorMessage }}</p>
              <button (click)="loadProperties()" type="button" class="px-4 py-2 bg-[#0F2937] text-white rounded-xl text-xs font-bold cursor-pointer">
                Retry Search
              </button>
            </div>

            <div *ngIf="!isLoading && !isError && properties.length === 0" class="bg-white p-8 rounded-3xl border border-[#E8E6DF] shadow-xs text-center space-y-4">
              <div class="text-3xl">🏡</div>
              <h3 class="text-base font-extrabold text-[#0F2937]">No homes available in this area yet</h3>
              <p class="text-xs text-slate-500">Try expanding your search radius or resetting filters.</p>
              <button (click)="resetFilters()" type="button" class="px-4 py-2 bg-[#0F2937] text-white text-xs font-bold rounded-xl cursor-pointer">
                Reset Filters
              </button>
            </div>

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

          <!-- RIGHT COLUMN: Desktop Google Map -->
          <div class="col-span-4 sticky top-20 h-[calc(100vh-120px)]">
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
  isMobileMapExpanded: boolean = false;
  selectedProperty: Property | null = null;
  hoveredProperty: Property | null = null;
  isLocating: boolean = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedState) count++;
    if (this.selectedDistrict) count++;
    if (this.selectedPropertyType) count++;
    if (this.selectedBhkList.size > 0) count += this.selectedBhkList.size;
    if (this.minRent || this.maxRent) count++;
    if (this.selectedFurnishing) count++;
    if (this.selectedAvailability) count++;
    if (this.selectedAmenities.size > 0) count += this.selectedAmenities.size;
    return count;
  }

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

  onMapPropertySelect(prop: Property): void {
    this.selectedProperty = prop;
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
