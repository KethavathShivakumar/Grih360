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

export interface PropertyLocation {
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
  url: string;
  isMain: boolean;
  order: number;
  caption?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  rentAmount: number; // Pure numeric stored value
  depositAmount: number; // Pure numeric stored value
  formattedRent?: string;
  formattedDeposit?: string;
  bhk: number;
  bathrooms: number;
  areaSqFt: number;
  furnishing: FurnishingType;
  propertyLocation: PropertyLocation;
  images: PropertyImage[];
  amenities: string[];
  availabilityStatus: AvailabilityStatus;
  availableFrom?: string;
  isListed?: boolean;
}

export interface PropertyFilter {
  city?: string;
  locality?: string;
  searchLocation?: string;
  minRent?: number;
  maxRent?: number;
  bhk?: number;
  propertyType?: PropertyType;
  furnishing?: FurnishingType;
  sort?: string;
  [key: string]: any;
}

