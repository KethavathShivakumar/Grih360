import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/property.model';
import { MoneyService } from '../../../core/services/money.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      (click)="onCardClick()"
      class="card group cursor-pointer overflow-hidden flex flex-col justify-between h-full hover:shadow-sm transition-all"
      style="padding: 0;"
    >
      <!-- Property Image -->
      <div class="relative w-full aspect-[4/3] bg-n-100 overflow-hidden">
        <img
          [src]="mainImageUrl"
          [alt]="property.title"
          width="400"
          height="300"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />

        <!-- Rent pill — top left -->
        <div class="absolute top-2 left-2 bg-navy text-n-0 text-xs font-semibold px-2.5 py-1 rounded-full">
          {{ formattedRent }}
        </div>

        <!-- Save button — top right -->
        <button
          (click)="onSaveClick($event)"
          type="button"
          [title]="isSaved ? 'Remove from Saved' : 'Save'"
          class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-n-0 border border-n-200 text-n-500 hover:text-err-text hover:border-err-border transition-colors cursor-pointer"
          [class.bg-err-bg]="isSaved"
          [class.text-err-text]="isSaved"
          [class.border-err-border]="isSaved"
        >
          <svg class="w-4 h-4" [attr.fill]="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>

        <!-- Image count — bottom left -->
        <div class="absolute bottom-2 left-2 bg-n-900/60 text-n-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
          <span>{{ imageCount }}</span>
        </div>

        <!-- Availability badge — bottom right -->
        <div
          [class]="availabilityBadgeClass"
          class="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
        >
          {{ formattedAvailability }}
        </div>
      </div>

      <!-- Card body -->
      <div class="p-3 space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <!-- Property type chip -->
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-semibold text-brand bg-brand-subtle px-2 py-0.5 rounded border border-brand-border">
              {{ formattedPropertyType }}
            </span>
          </div>

          <h3 class="text-sm font-semibold text-n-900 group-hover:text-brand transition-colors truncate">
            {{ property.title }}
          </h3>

          <p class="text-xs text-n-500 flex items-center mt-1">
            <svg class="w-3.5 h-3.5 text-brand mr-1 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="truncate">
              {{ property.propertyLocation?.locality || property.propertyLocation?.sublocality || property.propertyLocation?.address }},
              {{ property.propertyLocation?.city }}
            </span>
          </p>
        </div>

        <!-- Specs row -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs bg-n-50 p-2 rounded-lg border border-n-200">
          <div class="flex flex-col items-center">
            <span class="text-xs text-n-400 uppercase tracking-wide" style="font-size: 10px;">Beds</span>
            <span class="font-semibold text-n-900">{{ property.bhk }} BHK</span>
          </div>
          <div class="flex flex-col items-center border-x border-n-200">
            <span class="text-xs text-n-400 uppercase tracking-wide" style="font-size: 10px;">Baths</span>
            <span class="font-semibold text-n-900">{{ property.bathrooms }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-xs text-n-400 uppercase tracking-wide" style="font-size: 10px;">sqft</span>
            <span class="font-semibold text-n-900">{{ property.areaSqFt }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-n-200 flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-n-500 bg-n-100 border border-n-200 px-2 py-0.5 rounded">
              {{ formattedFurnishing }}
            </span>
            <span class="text-xs text-warn-text bg-warn-bg border border-warn-border px-2 py-0.5 rounded">
              Dep: {{ formattedDeposit }}
            </span>
          </div>

          <button
            (click)="onCardClick()"
            type="button"
            class="w-8 h-8 rounded-full bg-navy hover:bg-navy-hover text-n-0 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title="View Details"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PropertyCardComponent {
  @Input() property!: Property;
  @Input() isSaved: boolean = false;
  @Output() cardSelect = new EventEmitter<Property>();
  @Output() toggleSave = new EventEmitter<Property>();

  constructor(private moneyService: MoneyService) {}

  get mainImageUrl(): string {
    const main = this.property?.images?.find((i) => i.isMain);
    return main?.url || this.property?.images?.[0]?.url || '';
  }

  get imageCount(): number {
    return this.property?.images?.length || 0;
  }

  get formattedRent(): string {
    return this.property.formattedRent || this.moneyService.formatINR(this.property.rentAmount) + '/mo';
  }

  get formattedDeposit(): string {
    return this.property.formattedDeposit || this.moneyService.formatINR(this.property.depositAmount);
  }

  get formattedPropertyType(): string {
    const type = this.property.propertyType || 'APARTMENT';
    switch (type) {
      case 'INDEPENDENT_HOUSE': return 'Independent House';
      case 'APARTMENT':         return 'Apartment';
      case 'VILLA':             return 'Villa';
      case 'PG_HOSTEL':         return 'PG / Hostel';
      case 'COMMERCIAL':        return 'Commercial';
      default:                  return type;
    }
  }

  get formattedFurnishing(): string {
    switch (this.property.furnishing) {
      case 'FULLY_FURNISHED':  return 'Furnished';
      case 'SEMI_FURNISHED':   return 'Semi-Furnished';
      case 'UNFURNISHED':      return 'Unfurnished';
      default:                 return this.property.furnishing || 'Unfurnished';
    }
  }

  get formattedAvailability(): string {
    switch (this.property.availabilityStatus) {
      case 'VACANT':             return 'Available';
      case 'RENTED':             return 'Rented';
      case 'UNDER_MAINTENANCE':  return 'Maintenance';
      case 'RESERVED':           return 'Reserved';
      default:                   return 'Available';
    }
  }

  get availabilityBadgeClass(): string {
    switch (this.property.availabilityStatus) {
      case 'VACANT':    return 'bg-ok-text text-n-0';
      case 'RENTED':    return 'bg-n-700 text-n-0';
      case 'RESERVED':  return 'bg-warn-text text-n-0';
      default:          return 'bg-info-text text-n-0';
    }
  }

  onCardClick(): void {
    this.cardSelect.emit(this.property);
  }

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleSave.emit(this.property);
  }
}
