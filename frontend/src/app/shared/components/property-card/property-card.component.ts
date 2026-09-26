import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/property.model';
import { MoneyService } from '../../../core/services/money.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (click)="onCardClick()" class="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col justify-between h-full">
      <!-- Property Image Header -->
      <div class="relative w-full h-52 bg-slate-100 overflow-hidden">
        <img
          [src]="mainImageUrl"
          [alt]="property.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <!-- Rent Tag Pill (Top Left) -->
        <div class="absolute top-3 left-3 bg-white/95 text-[#0F2937] text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1">
          <span>{{ formattedRent }}</span>
        </div>

        <!-- Action Overlay (Top Right: Save & Status) -->
        <div class="absolute top-3 right-3 flex items-center gap-2">
          <button
            (click)="onSaveClick($event)"
            type="button"
            [title]="isSaved ? 'Unsave Property' : 'Save Property'"
            [class]="isSaved ? 'bg-rose-500 text-white' : 'bg-white/90 hover:bg-white text-slate-700'"
            class="p-2 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <svg class="w-4 h-4" [attr.fill]="isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        <!-- Image Count Badge (Bottom Left) -->
        <div class="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1">
          <span>📷 {{ imageCount }} photos</span>
        </div>

        <!-- Availability Badge (Bottom Right) -->
        <div class="absolute bottom-3 right-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
          {{ property.availabilityStatus }}
        </div>
      </div>

      <!-- Property Details Body -->
      <div class="p-5 space-y-3.5 flex-grow flex flex-col justify-between">
        <div>
          <h3 class="text-base font-extrabold text-[#0F2937] group-hover:text-[#2D7A5E] transition-colors line-clamp-1">
            {{ property.title }}
          </h3>

          <p class="text-xs text-slate-500 flex items-center mt-1 font-medium">
            <svg class="w-3.5 h-3.5 text-[#2D7A5E] mr-1 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <span class="truncate">{{ property.propertyLocation.locality || property.propertyLocation.address }}, {{ property.propertyLocation.city }}</span>
          </p>
        </div>

        <!-- Spec Pills Grid (Image 3 Style) -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div class="property-spec-pill flex flex-col items-center justify-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">BHK</span>
            <span class="font-extrabold text-slate-800">{{ property.bhk }} BHK</span>
          </div>
          <div class="property-spec-pill flex flex-col items-center justify-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Baths</span>
            <span class="font-extrabold text-slate-800">{{ property.bathrooms }}</span>
          </div>
          <div class="property-spec-pill flex flex-col items-center justify-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Area</span>
            <span class="font-extrabold text-slate-800">{{ property.areaSqFt }} sqft</span>
          </div>
        </div>

        <!-- Footer Action & Tags -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {{ property.furnishing }}
            </span>
            <span class="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Dep: {{ formattedDeposit }}
            </span>
          </div>
          <button
            (click)="onCardClick()"
            type="button"
            class="w-9 h-9 rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-[#0F2937] flex items-center justify-center font-black transition-transform group-hover:scale-110 shadow-xs"
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
    return this.property?.images?.length || 4;
  }

  get formattedRent(): string {
    return this.property.formattedRent || this.moneyService.formatINR(this.property.rentAmount) + '/mo';
  }

  get formattedDeposit(): string {
    return this.property.formattedDeposit || this.moneyService.formatINR(this.property.depositAmount);
  }

  onCardClick(): void {
    this.cardSelect.emit(this.property);
  }

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleSave.emit(this.property);
  }
}
