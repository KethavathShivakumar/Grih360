import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface SearchLocation {
  city: string;
  locality?: string;
  state?: string;
  pincode?: string;
}

export interface UserLocation {
  permissionGranted: boolean;
  coordinates?: LocationCoordinates;
  manualFallbackCity: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  // Separate location concepts per Nivas360 requirement #17
  private userLocationSubject = new BehaviorSubject<UserLocation>({
    permissionGranted: false,
    manualFallbackCity: 'Hyderabad',
  });
  public userLocation$: Observable<UserLocation> = this.userLocationSubject.asObservable();

  private searchLocationSubject = new BehaviorSubject<SearchLocation>({
    city: 'Hyderabad',
  });
  public searchLocation$: Observable<SearchLocation> = this.searchLocationSubject.asObservable();

  constructor() {}

  /**
   * Request device location permission with graceful manual fallback
   */
  public requestDeviceLocation(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        this.setUserLocationFallback('Hyderabad');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.userLocationSubject.next({
            permissionGranted: true,
            coordinates: coords,
            manualFallbackCity: 'Hyderabad',
          });
          resolve(coords);
        },
        (error) => {
          console.warn('[LocationService] Geolocation permission denied or failed:', error.message);
          this.setUserLocationFallback('Hyderabad');
          resolve(null);
        }
      );
    });
  }

  public setUserLocationFallback(city: string): void {
    this.userLocationSubject.next({
      permissionGranted: false,
      manualFallbackCity: city,
    });
  }

  public setSearchLocation(searchLoc: SearchLocation): void {
    this.searchLocationSubject.next(searchLoc);
  }

  public getCurrentPosition(): Observable<LocationCoordinates | null> {
    return new Observable((observer) => {
      this.requestDeviceLocation().then((coords) => {
        observer.next(coords);
        observer.complete();
      });
    });
  }
}
