import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DistrictInfo,
  StateInfo,
  STATES_CONFIG,
  TELANGANA_DISTRICTS,
  ANDHRA_PRADESH_DISTRICTS,
  GeographyConfigService,
} from '../config/geography.config';
import { environment } from '../../../environments/environment';

declare const google: any;

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: LocationCoordinates | null;
  error?: string;
  isDenied?: boolean;
}

export interface StructuredLocation {
  placeId?: string;
  displayName: string;
  locality?: string;
  sublocality?: string;
  neighborhood?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  coordinates?: LocationCoordinates;
  viewport?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface UserLocationState {
  permissionGranted: boolean;
  coordinates?: LocationCoordinates;
  manualFallbackCity: string;
  isLocating?: boolean;
  locatingMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private apiUrl = `${environment.apiUrl}/locations`;
  private static readonly SESSION_LOCATION_KEY = 'grih360_session_location';
  private sessionCachedCoords: LocationCoordinates | null = null;

  // 1. User Location: GPS location where device is currently situated
  private userLocationSubject = new BehaviorSubject<UserLocationState>({
    permissionGranted: false,
    manualFallbackCity: '',
    isLocating: false,
    locatingMessage: '',
  });
  public userLocation$: Observable<UserLocationState> = this.userLocationSubject.asObservable();

  // 2. Search Location: Active geographic target where user wants to find homes
  private searchLocationSubject = new BehaviorSubject<StructuredLocation>({
    displayName: 'All Telangana & Andhra Pradesh',
    state: undefined,
    district: undefined,
    city: undefined,
  });
  public searchLocation$: Observable<StructuredLocation> = this.searchLocationSubject.asObservable();

  // Google Places Autocomplete Session
  private autocompleteService: any = null;
  private geocoder: any = null;
  private sessionToken: any = null;

  constructor(private http: HttpClient) {
    this.restoreSessionCachedLocation();
    this.initGoogleServices();
  }

  private restoreSessionCachedLocation(): void {
    try {
      const stored = sessionStorage.getItem(LocationService.SESSION_LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          this.sessionCachedCoords = parsed;
          this.userLocationSubject.next({
            ...this.userLocationSubject.value,
            permissionGranted: true,
            coordinates: parsed,
          });
        }
      }
    } catch (_) {}
  }

  public getLastKnownLocation(): LocationCoordinates | null {
    return this.sessionCachedCoords;
  }

  private cacheSessionLocation(coords: LocationCoordinates): void {
    this.sessionCachedCoords = coords;
    try {
      sessionStorage.setItem(LocationService.SESSION_LOCATION_KEY, JSON.stringify(coords));
    } catch (_) {}
  }

  private initGoogleServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      if (google.maps.places && !this.autocompleteService) {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.newSessionToken();
      }
      if (!this.geocoder) {
        this.geocoder = new google.maps.Geocoder();
      }
    } else {
      // Retry in 500ms if script is deferred
      setTimeout(() => this.initGoogleServices(), 500);
    }
  }

  private newSessionToken(): void {
    if (typeof google !== 'undefined' && google.maps?.places?.AutocompleteSessionToken) {
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    }
  }

  /**
   * Request device location permission with Capacitor Geolocation (18s timeout, session cached)
   * Shows 'Getting your location...' and gracefully falls back to manual area search.
   */
  public async requestDeviceLocation(): Promise<LocationResult> {
    this.userLocationSubject.next({
      ...this.userLocationSubject.value,
      isLocating: true,
      locatingMessage: 'Getting your location...',
    });

    try {
      // 1. Check & request Capacitor Geolocation permissions
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          this.userLocationSubject.next({
            permissionGranted: false,
            manualFallbackCity: '',
            isLocating: false,
            locatingMessage: '',
          });
          return {
            coordinates: this.sessionCachedCoords,
            error: 'Location permission was denied. You can search by area or city manually.',
            isDenied: true,
          };
        }
      }

      // 2. Try with 18 second timeout (high resilience for real device GPS lock)
      let position;
      try {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 18000,
          maximumAge: 60000,
        });
      } catch (highAccErr) {
        // Fallback to low accuracy / cellular tower location
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 120000,
        });
      }

      const coords: LocationCoordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      this.cacheSessionLocation(coords);

      this.userLocationSubject.next({
        permissionGranted: true,
        coordinates: coords,
        manualFallbackCity: '',
        isLocating: false,
        locatingMessage: '',
      });

      return { coordinates: coords };
    } catch (err: any) {
      console.warn('[LocationService] Capacitor Geolocation timed out or unavailable, trying web fallback:', err);
      return new Promise<LocationResult>((resolve) => {
        if (!navigator.geolocation) {
          this.userLocationSubject.next({
            ...this.userLocationSubject.value,
            isLocating: false,
            locatingMessage: '',
          });
          resolve({
            coordinates: this.sessionCachedCoords,
            error: 'Geolocation is not available on this device. Please select your area manually.',
          });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords: LocationCoordinates = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            this.cacheSessionLocation(coords);
            this.userLocationSubject.next({
              permissionGranted: true,
              coordinates: coords,
              manualFallbackCity: '',
              isLocating: false,
              locatingMessage: '',
            });
            resolve({ coordinates: coords });
          },
          (error) => {
            let errorMsg = 'Location request timed out. You can search by area manually.';
            if (error.code === error.PERMISSION_DENIED) {
              errorMsg = 'Location permission was denied. Please allow location access or search by area manually.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMsg = 'Current location is unavailable. You can search by area manually.';
            }
            this.userLocationSubject.next({
              permissionGranted: false,
              manualFallbackCity: '',
              isLocating: false,
              locatingMessage: '',
            });
            // If we have a session cached location, provide it gracefully
            resolve({
              coordinates: this.sessionCachedCoords,
              error: errorMsg,
              isDenied: error.code === error.PERMISSION_DENIED,
            });
          },
          { enableHighAccuracy: false, timeout: 18000, maximumAge: 60000 }
        );
      });
    }
  }

  public setUserLocationFallback(city: string): void {
    this.userLocationSubject.next({
      permissionGranted: false,
      manualFallbackCity: city,
      isLocating: false,
    });
  }

  public setSearchLocation(searchLoc: StructuredLocation): void {
    this.searchLocationSubject.next(searchLoc);
  }

  public getCurrentSearchLocation(): StructuredLocation {
    return this.searchLocationSubject.value;
  }

  /**
   * Real Google Places Autocomplete Predictions (Session-Based)
   * Restricted to India and prioritized for South India (Telangana & AP)
   */
  public getPlacePredictions(query: string): Observable<PlacePrediction[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return of([]);
    }

    if (!this.autocompleteService) {
      this.initGoogleServices();
    }

    if (!this.autocompleteService || typeof google === 'undefined') {
      // Graceful fallback to supported districts match if Google Maps offline
      return of(this.getFallbackPredictions(cleanQuery));
    }

    return new Observable<PlacePrediction[]>((observer) => {
      const request: any = {
        input: cleanQuery,
        sessionToken: this.sessionToken,
        componentRestrictions: { country: 'in' },
        types: ['geocode', 'establishment'],
      };

      this.autocompleteService.getPlacePredictions(
        request,
        (predictions: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const mapped: PlacePrediction[] = predictions.map((p) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
            }));
            observer.next(mapped);
            observer.complete();
          } else {
            // If zero results from Places, try supported districts & localities
            const fallback = this.getFallbackPredictions(cleanQuery);
            observer.next(fallback);
            observer.complete();
          }
        }
      );
    });
  }

  /**
   * Geocode Place ID into Structured Address Components (No manual string parsing)
   * Extracts country, state, district, city, locality, sublocality, lat, lng, viewport
   */
  public getStructuredPlaceDetails(placeId: string, fallbackDescription?: string): Observable<StructuredLocation> {
    return new Observable<StructuredLocation>((observer) => {
      if (!this.geocoder) {
        this.initGoogleServices();
      }

      if (!this.geocoder || typeof google === 'undefined') {
        const fallback = this.resolveFallbackLocation(fallbackDescription || placeId);
        observer.next(fallback);
        observer.complete();
        return;
      }

      this.geocoder.geocode({ placeId }, (results: any[], status: any) => {
        // Reset session token after a place selection per Google Places billing best practice
        this.newSessionToken();

        if (status === 'OK' && results && results[0]) {
          const item = results[0];
          const structured = this.extractAddressComponents(item, placeId);
          observer.next(structured);
          observer.complete();
        } else {
          console.warn('[LocationService] Geocoder failed for placeId:', placeId, status);
          const fallback = this.resolveFallbackLocation(fallbackDescription || placeId);
          observer.next(fallback);
          observer.complete();
        }
      });
    });
  }

  /**
   * Structured extraction from Google address_components
   */
  private extractAddressComponents(geocodeResult: any, placeId: string): StructuredLocation {
    const components: any[] = geocodeResult.address_components || [];
    let country: string | undefined;
    let state: string | undefined;
    let district: string | undefined;
    let city: string | undefined;
    let locality: string | undefined;
    let sublocality: string | undefined;
    let neighborhood: string | undefined;
    let pincode: string | undefined;

    for (const comp of components) {
      const types: string[] = comp.types || [];
      if (types.includes('country')) {
        country = comp.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = comp.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        // Administrative area level 2 in India is the canonical District!
        district = comp.long_name.replace(/\s+district$/i, '');
      } else if (types.includes('locality')) {
        city = comp.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        sublocality = comp.long_name;
      } else if (types.includes('neighborhood')) {
        neighborhood = comp.long_name;
      } else if (types.includes('postal_code')) {
        pincode = comp.long_name;
      }
    }

    locality = sublocality || neighborhood || city;
    if (!city && district) {
      city = district;
    }

    const loc = geocodeResult.geometry?.location;
    const coordinates: LocationCoordinates | undefined = loc
      ? {
          lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
          lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
        }
      : undefined;

    const vp = geocodeResult.geometry?.viewport;
    const viewport = vp
      ? {
          north: vp.getNorthEast().lat(),
          east: vp.getNorthEast().lng(),
          south: vp.getSouthWest().lat(),
          west: vp.getSouthWest().lng(),
        }
      : undefined;

    return {
      placeId,
      displayName: geocodeResult.formatted_address || [locality, district, state].filter(Boolean).join(', '),
      locality,
      sublocality,
      neighborhood,
      city,
      district,
      state,
      country,
      pincode,
      coordinates,
      viewport,
    };
  }

  /**
   * supported districts & States helper
   */
  public getStates(): StateInfo[] {
    return STATES_CONFIG;
  }

  public getDistrictsByState(stateCode?: string): DistrictInfo[] {
    return GeographyConfigService.getDistrictsByState(stateCode);
  }

  public findDistrict(name: string): DistrictInfo | undefined {
    return GeographyConfigService.findDistrict(name);
  }

  /**
   * Fallback predictions from canonical geography config
   */
  private getFallbackPredictions(query: string): PlacePrediction[] {
    const q = query.toLowerCase();
    const allDistricts = [...TELANGANA_DISTRICTS, ...ANDHRA_PRADESH_DISTRICTS];
    const results: PlacePrediction[] = [];

    for (const dist of allDistricts) {
      if (dist.name.toLowerCase().includes(q) || dist.headquarters.toLowerCase().includes(q)) {
        results.push({
          placeId: `canon_${dist.code}`,
          description: `${dist.name}, ${dist.stateName}, India`,
          mainText: dist.name,
          secondaryText: `${dist.stateName}, India`,
        });
      }
      for (const loc of dist.popularLocalities) {
        if (loc.toLowerCase().includes(q)) {
          results.push({
            placeId: `canon_loc_${dist.code}_${loc.replace(/\s+/g, '_')}`,
            description: `${loc}, ${dist.name}, ${dist.stateName}`,
            mainText: loc,
            secondaryText: `${dist.name}, ${dist.stateName}`,
          });
        }
      }
    }

    return results.slice(0, 8);
  }

  private resolveFallbackLocation(input: string): StructuredLocation {
    const clean = input.replace(/^canon_(loc_)?/, '');
    const district = GeographyConfigService.findDistrict(clean);
    if (district) {
      return {
        displayName: `${district.name}, ${district.stateName}`,
        district: district.name,
        city: district.headquarters || district.name,
        state: district.stateName,
        country: 'India',
        coordinates: district.center,
      };
    }
    return {
      displayName: input,
      city: input,
      state: 'Telangana',
      country: 'India',
      coordinates: { lat: 17.385, lng: 78.4867 },
    };
  }
}
