export type PropertyType = 
  | 'APARTMENT'
  | 'INDEPENDENT_HOUSE'
  | 'VILLA'
  | 'PG_HOSTEL'
  | 'COMMERCIAL';

export type FurnishingType = 
  | 'UNFURNISHED'
  | 'SEMI_FURNISHED'
  | 'FULLY_FURNISHED';

export type AvailabilityStatus = 
  | 'VACANT'
  | 'RENTED'
  | 'UNDER_MAINTENANCE'
  | 'RESERVED';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
  locality?: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyImage {
  id?: string;
  url: string;
  isMain: boolean;
  order: number;
  caption?: string;
}

export interface IProperty {
  _id?: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  rentAmount: number; // Stored as numeric value in DB
  depositAmount: number; // Stored as numeric value in DB
  bhk: number;
  bathrooms: number;
  areaSqFt: number;
  furnishing: FurnishingType;
  propertyLocation: LocationData;
  images: PropertyImage[];
  amenities: string[];
  availabilityStatus: AvailabilityStatus;
  availableFrom: Date;
  isListed: boolean;
  viewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
