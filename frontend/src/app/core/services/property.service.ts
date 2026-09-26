import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Property, PropertyFilter } from '../../shared/models/property.model';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  constructor(private apiService: ApiService) {}

  public searchProperties(filter?: PropertyFilter): Observable<{ success: boolean; data: any }> {
    return this.apiService.get<{ success: boolean; data: any }>('/properties', filter);
  }

  public getPropertyById(id: string): Observable<{ success: boolean; data: Property }> {
    return this.apiService.get<{ success: boolean; data: Property }>(`/properties/${id}`);
  }

  public createProperty(propertyData: Partial<Property>): Observable<{ success: boolean; data: Property }> {
    return this.apiService.post<{ success: boolean; data: Property }>('/properties', propertyData);
  }

  public saveProperty(id: string): Observable<{ success: boolean; data: any }> {
    return this.apiService.post<{ success: boolean; data: any }>(`/properties/${id}/save`, {});
  }

  public unsaveProperty(id: string): Observable<{ success: boolean; data: any }> {
    return this.apiService.delete<{ success: boolean; data: any }>(`/properties/${id}/save`);
  }

  public getSavedProperties(): Observable<{ success: boolean; data: Property[] }> {
    return this.apiService.get<{ success: boolean; data: Property[] }>('/properties/my/saved');
  }

  public getOwnerProperties(): Observable<{ success: boolean; data: Property[] }> {
    return this.apiService.get<{ success: boolean; data: Property[] }>('/properties/my/listings');
  }

  public updateProperty(id: string, propertyData: Partial<Property>): Observable<{ success: boolean; data: Property }> {
    return this.apiService.patch<{ success: boolean; data: Property }>(`/properties/${id}`, propertyData);
  }

  public deleteProperty(id: string): Observable<{ success: boolean; data: any }> {
    return this.apiService.delete<{ success: boolean; data: any }>(`/properties/${id}`);
  }

  public addPropertyImages(id: string, images: Array<{ url: string; caption?: string }>): Observable<{ success: boolean; data: Property }> {
    return this.apiService.post<{ success: boolean; data: Property }>(`/properties/${id}/images`, { images });
  }

  public setMainImage(id: string, imageIndex: number): Observable<{ success: boolean; data: Property }> {
    return this.apiService.patch<{ success: boolean; data: Property }>(`/properties/${id}/images/main/${imageIndex}`, {});
  }

  public deletePropertyImage(id: string, imageIndex: number): Observable<{ success: boolean; data: Property }> {
    return this.apiService.delete<{ success: boolean; data: Property }>(`/properties/${id}/images/${imageIndex}`);
  }

  public reorderPropertyImages(id: string, images: any[]): Observable<{ success: boolean; data: Property }> {
    return this.apiService.patch<{ success: boolean; data: Property }>(`/properties/${id}/images/reorder`, { images });
  }
}
