export type ServiceCategoryCode = 
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'PAINTING'
  | 'CLEANING'
  | 'AC_APPLIANCE'
  | 'WATER_FILTER'
  | 'GENERAL_MAINTENANCE';

export type ServiceRequestStatus = 
  | 'REQUESTED'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProfessionalVerificationStatus = 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED';

export interface IServiceCategory {
  _id?: string;
  name: string;
  code: ServiceCategoryCode;
  description: string;
  icon?: string;
  isActive: boolean;
}

export interface IProfessionalService {
  _id?: string;
  professionalId: string;
  categoryId: string;
  serviceName: string;
  basePrice: number;
  description: string;
  isBrandService: boolean;
  brandName?: string;
}

export interface IProfessionalProfile {
  _id?: string;
  userId: string;
  businessName: string;
  categories: ServiceCategoryCode[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isActive: boolean;
  verificationStatus: ProfessionalVerificationStatus;
  serviceAreas: string[];
  serviceRadiusKm?: number;
  profileImage?: string;
  bio?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IServiceLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface IServiceRequestCancellation {
  cancelledBy: string;
  cancelledAt: Date;
  reason: string;
}

export interface IServiceRequestCompletion {
  completedAt: Date;
  notes?: string;
}

export interface IServiceRequest {
  _id?: string;
  requesterId: string; // Tenant or Owner
  propertyId?: string;
  rentalId?: string;
  categoryId: string;
  categoryCode: ServiceCategoryCode;
  professionalId?: string;
  status: ServiceRequestStatus;
  description: string;
  scheduledDate: Date;
  preferredTimeWindow?: string;
  serviceLocation: IServiceLocation;
  images?: string[];
  estimatedCost?: number;
  customerCareContact: string; // Hotline: 6300063704
  cancellation?: IServiceRequestCancellation;
  completion?: IServiceRequestCompletion;
  createdAt?: Date;
  updatedAt?: Date;
}

