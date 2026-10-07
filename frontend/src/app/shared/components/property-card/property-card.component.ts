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
      class="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col justify-between h-full"
    >
      <!-- Property Image Header -->
      <div class="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          [src]="mainImageUrl"
          [alt]="property.title"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        <!-- Rent Tag Pill (Top Left) -->
        <div class="absolute top-2.5 left-2.5 bg-[#0F2937] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>{{ formattedRent }}</span>
        </div>

        <!-- Action Overlay (Top Right: Save / Heart) -->
        <div class="absolute top-2.5 right-2.5 flex items-center gap-2">
          <button
            (click)="onSaveClick($event)"
            type="button"
            [title]="isSaved ? 'Remove from Saved' : 'Save Property'"
            [class]="isSaved ? 'bg-rose-500 text-white' : 'bg-white/90 hover:bg-white text-slate-700'"
            class="p-1.5 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <svg class="w-4 h-4" [attr.fill]="isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        <!-- Image Count Badge (Bottom Left) -->
        <div class="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
          <span>{{ imageCount }}</span>
        </div>

        <!-- Availability Status Badge (Bottom Right) -->
        <div
          [class]="availabilityBadgeClass"
          class="absolute bottom-2.5 right-2.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wide backdrop-blur-md"
        >
          {{ formattedAvailability }}
        </div>
      </div>

      <!-- Property Details Body -->
      <div class="p-3 sm:p-4 space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <!-- Property Type Badge -->
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[9px] font-black uppercase tracking-wider text-[#2D7A5E] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {{ formattedPropertyType }}
            </span>
          </div>

          <h3 class="text-xs sm:text-sm font-extrabold text-[#0F2937] group-hover:text-[#2D7A5E] transition-colors truncate">
            {{ property.title }}
          </h3>

          <p class="text-xs text-slate-500 flex items-center mt-1 font-medium">
            <svg class="w-3.5 h-3.5 text-[#2D7A5E] mr-1 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <span class="truncate">
              {{ property.propertyLocation?.locality || property.propertyLocation?.sublocality || property.propertyLocation?.address }},
              {{ property.propertyLocation?.city }}
              {{ property.propertyLocation?.district ? '(' + property.propertyLocation.district + ')' : '' }}
            </span>
          </p>
        </div>

        <!-- Spec Pills Grid: BHK, Bathrooms, Area -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
          <div class="flex flex-col items-center justify-center">
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bedrooms</span>
            <span class="font-extrabold text-slate-800">{{ property.bhk }} BHK</span>
          </div>
          <div class="flex flex-col items-center justify-center border-x border-slate-200/60">
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Baths</span>
            <span class="font-extrabold text-slate-800">{{ property.bathrooms }}</span>
          </div>
          <div class="flex flex-col items-center justify-center">
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Super Area</span>
            <span class="font-extrabold text-slate-800">{{ property.areaSqFt }} sqft</span>
          </div>
        </div>

        <!-- Footer Action & Tags -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {{ formattedFurnishing }}
            </span>
            <span class="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Dep: {{ formattedDeposit }}
            </span>
          </div>

          <button
            (click)="onCardClick()"
            type="button"
            class="w-8 h-8 rounded-full bg-[#0F2937] hover:bg-[#164E63] text-white flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110 shadow-xs shrink-0 cursor-pointer"
            title="View Property Details"
          >
            →
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
    return main?.url || this.property?.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
  }

  get imageCount(): number {
    return this.property?.images?.length || 1;
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
      case 'INDEPENDENT_HOUSE':
        return 'Independent House';
      case 'APARTMENT':
        return 'Apartment';
      case 'VILLA':
        return 'Villa';
      case 'PG_HOSTEL':
        return 'PG / Hostel';
      case 'COMMERCIAL':
        return 'Commercial';
      default:
        return type;
    }
  }

  get formattedFurnishing(): string {
    const furn = this.property.furnishing;
    switch (furn) {
      case 'FULLY_FURNISHED':
        return 'Furnished';
      case 'SEMI_FURNISHED':
        return 'Semi-Furnished';
      case 'UNFURNISHED':
        return 'Unfurnished';
      default:
        return furn || 'Unfurnished';
    }
  }

  get formattedAvailability(): string {
    const status = this.property.availabilityStatus;
    switch (status) {
      case 'VACANT':
        return 'Ready to Move';
      case 'RENTED':
        return 'Rented';
      case 'UNDER_MAINTENANCE':
        return 'Maintenance';
      case 'RESERVED':
        return 'Reserved';
      default:
        return 'Available';
    }
  }

  get availabilityBadgeClass(): string {
    const status = this.property.availabilityStatus;
    if (status === 'VACANT') {
      return 'bg-emerald-600 text-white';
    } else if (status === 'RENTED') {
      return 'bg-slate-700 text-white';
    } else if (status === 'RESERVED') {
      return 'bg-amber-600 text-white';
    }
    return 'bg-blue-600 text-white';
  }

  onCardClick(): void {
    this.cardSelect.emit(this.property);
  }

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleSave.emit(this.property);
  }
}
