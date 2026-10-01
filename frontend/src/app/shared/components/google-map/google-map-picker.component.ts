import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

declare const google: any;

export interface SelectedLocationData {
  lat: number;
  lng: number;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

@Component({
  selector: 'app-google-map-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span class="font-bold text-slate-700 flex items-center gap-1">
          <span>🗺️</span> Click map or drag pin to select exact coordinates:
        </span>
        <button
          (click)="useCurrentLocation()"
          type="button"
          class="self-start sm:self-auto px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2D7A5E] font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>📍</span>
          <span>Use Current Location</span>
        </button>
      </div>

      <!-- Map Container -->
      <div class="relative w-full h-72 rounded-2xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
        <div #mapContainer class="w-full h-full"></div>

        <!-- Coordinates Badge -->
        <div class="absolute bottom-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
          <span>Coordinates: {{ currentLat.toFixed(5) }}, {{ currentLng.toFixed(5) }}</span>
        </div>
      </div>
    </div>
  `,
})
export class GoogleMapPickerComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  @Input() initialLat: number = 17.9689; // Default Warangal / Telangana
  @Input() initialLng: number = 79.5941;
  @Input() initialCity: string = 'Warangal';

  @Output() locationSelected = new EventEmitter<SelectedLocationData>();

  map: any = null;
  marker: any = null;
  geocoder: any = null;

  currentLat: number = 17.9689;
  currentLng: number = 79.5941;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.currentLat = this.initialLat;
    this.currentLng = this.initialLng;
    this.initMap();
  }

  private initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const position = { lat: this.currentLat, lng: this.currentLng };

      this.map = new google.maps.Map(this.mapContainerRef.nativeElement, {
        center: position,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      this.marker = new google.maps.Marker({
        position,
        map: this.map,
        draggable: true,
        title: 'Drag to exact property position',
        animation: google.maps.Animation.DROP,
      });

      this.geocoder = new google.maps.Geocoder();

      // Marker drag event
      this.marker.addListener('dragend', () => {
        const pos = this.marker.getPosition();
        this.updatePosition(pos.lat(), pos.lng());
      });

      // Map click event
      this.map.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.marker.setPosition({ lat, lng });
        this.updatePosition(lat, lng);
      });
    });
  }

  public setCoordinates(lat: number, lng: number): void {
    this.currentLat = lat;
    this.currentLng = lng;
    if (this.map && this.marker) {
      const pos = { lat, lng };
      this.marker.setPosition(pos);
      this.map.panTo(pos);
    }
  }

  private updatePosition(lat: number, lng: number): void {
    this.ngZone.run(() => {
      this.currentLat = lat;
      this.currentLng = lng;

      // Reverse geocode to populate locality, city, pincode
      if (this.geocoder) {
        this.geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            const parsed = this.parseGeocodeResult(results[0]);
            this.locationSelected.emit({
              lat,
              lng,
              ...parsed,
            });
          } else {
            this.locationSelected.emit({ lat, lng });
          }
        });
      } else {
        this.locationSelected.emit({ lat, lng });
      }
    });
  }

  public useCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.setCoordinates(lat, lng);
        this.updatePosition(lat, lng);
      },
      (error) => {
        console.warn('Geolocation failed or permission denied:', error.message);
      }
    );
  }

  private parseGeocodeResult(result: any): Partial<SelectedLocationData> {
    const data: Partial<SelectedLocationData> = {
      address: result.formatted_address,
    };

    result.address_components.forEach((c: any) => {
      const types = c.types;
      if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        data.locality = c.long_name;
      }
      if (types.includes('locality')) {
        data.city = c.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        data.state = c.long_name;
      }
      if (types.includes('postal_code')) {
        data.pincode = c.long_name;
      }
    });

    return data;
  }
}
