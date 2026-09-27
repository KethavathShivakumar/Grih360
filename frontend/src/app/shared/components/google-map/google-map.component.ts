import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../../shared/models/property.model';

declare const google: any;

@Component({
  selector: 'app-google-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full rounded-2xl overflow-hidden border border-[#E8E6DF] shadow-xs bg-slate-100 min-h-[350px]">
      <!-- Map Container Element -->
      <div #mapContainer class="w-full h-full min-h-[350px]"></div>

      <!-- Floating Controls: GPS My Location -->
      <div class="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          (click)="locateUser()"
          type="button"
          class="p-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          title="Center on My Location"
        >
          <span>📍</span>
          <span class="hidden sm:inline">Near Me</span>
        </button>

        <button
          (click)="fitAllMarkers()"
          *ngIf="properties && properties.length > 0"
          type="button"
          class="p-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          title="Fit All Properties in View"
        >
          <span>🗺️</span>
          <span class="hidden sm:inline">View All</span>
        </button>
      </div>

      <!-- Floating Selected Property Preview Card -->
      <div
        *ngIf="activeProperty"
        class="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-10 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-200 transition-all animate-fade-in"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center space-x-3">
            <div class="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
              <img
                [src]="getPropertyImage(activeProperty)"
                [alt]="activeProperty.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <span class="text-[10px] font-extrabold text-[#2D7A5E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {{ activeProperty.bhk }} BHK • {{ activeProperty.propertyType }}
              </span>
              <h4 class="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                {{ activeProperty.title }}
              </h4>
              <p class="text-[11px] font-extrabold text-[#0F2937]">
                {{ activeProperty.formattedRent || '₹' + activeProperty.rentAmount + '/mo' }}
              </p>
            </div>
          </div>
          <button (click)="activeProperty = null" class="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]">
            📍 {{ activeProperty.propertyLocation?.locality || activeProperty.propertyLocation?.city }}
          </span>
          <button
            (click)="selectProperty(activeProperty)"
            type="button"
            class="px-2.5 py-1 bg-[#0F2937] hover:bg-[#164E63] text-white text-[10px] font-bold rounded-lg shadow-2xs cursor-pointer"
          >
            View Details →
          </button>
        </div>
      </div>

      <!-- Fallback Loading Notice -->
      <div *ngIf="isMapLoading" class="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center space-y-2 z-0">
        <div class="w-6 h-6 border-2 border-[#2D7A5E] border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-bold text-slate-600">Loading Google Map...</span>
      </div>
    </div>
  `,
})
export class GoogleMapComponent implements OnInit, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  @Input() properties: Property[] = [];
  @Input() selectedProperty: Property | null = null;
  @Input() centerCity: string = 'Hyderabad';
  @Input() centerCoords: { lat: number; lng: number } | null = null;
  @Input() viewport: { north: number; south: number; east: number; west: number } | null = null;

  @Output() propertyClick = new EventEmitter<Property>();
  @Output() markerHover = new EventEmitter<Property | null>();

  map: any = null;
  markers: any[] = [];
  userMarker: any = null;
  activeProperty: Property | null = null;
  isMapLoading: boolean = true;

  // Known Coordinates for Telangana & Andhra Pradesh Districts & Major Cities
  private cityCoords: Record<string, { lat: number; lng: number }> = {
    hyderabad: { lat: 17.385, lng: 78.4867 },
    gachibowli: { lat: 17.4401, lng: 78.3489 },
    madhapur: { lat: 17.4474, lng: 78.3762 },
    kondapur: { lat: 17.4622, lng: 78.3568 },
    'banjara hills': { lat: 17.4156, lng: 78.4357 },
    warangal: { lat: 17.9689, lng: 79.5941 },
    hanamkonda: { lat: 18.0076, lng: 79.575 },
    subedari: { lat: 17.9942, lng: 79.5638 },
    nakkalagutta: { lat: 18.0076, lng: 79.575 },
    kazipet: { lat: 17.9818, lng: 79.5222 },
    'hunter road': { lat: 17.9622, lng: 79.5885 },
    mahabubnagar: { lat: 16.7488, lng: 77.9942 },
    'christian pally': { lat: 16.742, lng: 78.0012 },
    'raichur road': { lat: 16.735, lng: 77.985 },
    nalgonda: { lat: 17.0575, lng: 79.2684 },
    'clock tower center': { lat: 17.054, lng: 79.267 },
    ramagiri: { lat: 17.062, lng: 79.273 },
    karimnagar: { lat: 18.4386, lng: 79.1288 },
    'collectorate road': { lat: 18.441, lng: 79.132 },
    mukarrampura: { lat: 18.435, lng: 79.124 },
    khammam: { lat: 17.2473, lng: 80.1514 },
    'wyra road': { lat: 17.251, lng: 80.155 },
    'rotary nagar': { lat: 17.243, lng: 80.147 },
    nizamabad: { lat: 18.6725, lng: 78.0941 },
    khaleelwadi: { lat: 18.675, lng: 78.098 },
    'subhash nagar': { lat: 18.669, lng: 78.091 },
    vijayawada: { lat: 16.5062, lng: 80.648 },
    'benz circle': { lat: 16.5012, lng: 80.6436 },
    'mg road': { lat: 16.5085, lng: 80.651 },
    guntur: { lat: 16.3067, lng: 80.4365 },
    lakshmipuram: { lat: 16.312, lng: 80.441 },
    brodipet: { lat: 16.303, lng: 80.435 },
    visakhapatnam: { lat: 17.6868, lng: 83.2185 },
    'beach road': { lat: 17.7164, lng: 83.3189 },
    'mvp colony': { lat: 17.7412, lng: 83.3341 },
    tirupati: { lat: 13.6288, lng: 79.4192 },
    'air bypass road': { lat: 13.632, lng: 79.421 },
    'mr palli': { lat: 13.621, lng: 79.412 },
    kurnool: { lat: 15.8281, lng: 78.0373 },
    nellore: { lat: 14.4426, lng: 79.9865 },
    anantapur: { lat: 14.6819, lng: 77.6006 },
    kakinada: { lat: 16.9891, lng: 82.2475 },
    rajahmundry: { lat: 17.0005, lng: 81.804 },
  };

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['viewport'] && this.viewport) {
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(this.viewport.south, this.viewport.west),
        new google.maps.LatLng(this.viewport.north, this.viewport.east)
      );
      this.map.fitBounds(bounds);
    } else if (changes['centerCoords'] && this.centerCoords) {
      this.map.panTo(this.centerCoords);
      this.map.setZoom(13);
    } else if (changes['centerCity'] && changes['centerCity'].currentValue) {
      this.panToCity(this.centerCity);
    }

    if (changes['properties']) {
      this.updatePropertyMarkers();
    }
    if (changes['selectedProperty'] && this.selectedProperty) {
      this.highlightProperty(this.selectedProperty);
    }
  }

  private initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      // Retry in 500ms if script is still downloading
      setTimeout(() => this.initMap(), 500);
      return;
    }

    const defaultCenter = this.getCityCoordinates(this.centerCity);

    this.ngZone.runOutsideAngular(() => {
      this.map = new google.maps.Map(this.mapContainerRef.nativeElement, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      this.ngZone.run(() => {
        this.isMapLoading = false;
        this.updatePropertyMarkers();
      });
    });
  }

  private updatePropertyMarkers(): void {
    if (!this.map || typeof google === 'undefined') return;

    // Clear old markers
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];

    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;

    this.properties.forEach((prop) => {
      const coords = prop.propertyLocation?.coordinates;
      let lat = coords?.lat;
      let lng = coords?.lng;

      // Fallback coordinates based on locality or city
      if (!lat || !lng) {
        const fallback = this.getCityCoordinates(prop.propertyLocation?.locality || prop.propertyLocation?.city || 'Hyderabad');
        lat = fallback.lat + (Math.random() - 0.5) * 0.04;
        lng = fallback.lng + (Math.random() - 0.5) * 0.04;
      }

      const position = { lat, lng };
      bounds.extend(position);
      hasCoords = true;

      // Price Tag Custom Marker Badge
      const priceText = prop.formattedRent || ('₹' + Math.round(prop.rentAmount / 1000) + 'k');
      
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title: `${prop.title} - ${priceText}`,
        label: {
          text: priceText,
          color: '#0F2937',
          fontWeight: 'bold',
          fontSize: '11px',
          className: 'map-price-label',
        },
        icon: {
          path: 'M -20,-12 H 20 A 4,4 0 0 1 24,-8 V 8 A 4,4 0 0 1 20,12 H 4 L 0,18 L -4,12 H -20 A 4,4 0 0 1 -24,8 V -8 A 4,4 0 0 1 -20,-12 Z',
          fillColor: '#FFFFFF',
          fillOpacity: 0.95,
          strokeColor: '#2D7A5E',
          strokeWeight: 2,
          scale: 1,
          labelOrigin: new google.maps.Point(0, 0),
        },
      });

      marker.addListener('click', () => {
        this.ngZone.run(() => {
          this.activeProperty = prop;
          this.propertyClick.emit(prop);
        });
      });

      this.markers.push(marker);
    });

    if (hasCoords && this.markers.length > 1) {
      this.map.fitBounds(bounds, 50);
    }
  }

  public fitAllMarkers(): void {
    if (!this.map || this.markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach((m) => bounds.extend(m.getPosition()));
    this.map.fitBounds(bounds, 50);
  }

  public panToCity(cityName: string): void {
    if (!this.map) return;
    const coords = this.getCityCoordinates(cityName);
    this.map.panTo(coords);
    this.map.setZoom(13);
  }

  public locateUser(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (this.userMarker) {
          this.userMarker.setMap(null);
        }

        this.userMarker = new google.maps.Marker({
          position: userPos,
          map: this.map,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5,
          },
        });

        this.map.panTo(userPos);
        this.map.setZoom(14);
      },
      (error) => {
        console.warn('Geolocation denied or unavailable:', error.message);
        // Graceful fallback to default Telangana center without breaking
        this.panToCity('Hyderabad');
      }
    );
  }

  public highlightProperty(prop: Property): void {
    this.activeProperty = prop;
    const coords = prop.propertyLocation?.coordinates;
    if (coords?.lat && coords?.lng && this.map) {
      this.map.panTo({ lat: coords.lat, lng: coords.lng });
      this.map.setZoom(15);
    }
  }

  public selectProperty(prop: Property): void {
    this.propertyClick.emit(prop);
  }

  public getPropertyImage(prop: Property): string {
    const main = prop.images?.find((i) => i.isMain);
    return main?.url || prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';
  }

  private getCityCoordinates(name: string): { lat: number; lng: number } {
    const key = name.toLowerCase().trim();
    for (const cityKey in this.cityCoords) {
      if (key.includes(cityKey)) {
        return this.cityCoords[cityKey];
      }
    }
    return this.cityCoords['hyderabad'];
  }
}
