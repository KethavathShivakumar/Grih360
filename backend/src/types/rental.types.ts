import { VerificationStatus } from './auth.types';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_PENDING'
  | 'SHORTLISTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type RentalStatus = 
  | 'DRAFT'
  | 'REVIEW'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'EXPIRED';

export type RentPaymentStatus = 
  | 'UPCOMING'
  | 'DUE'
  | 'PAID'
  | 'OVERDUE';

export interface IApplication {
  _id?: string;
  propertyId: string;
  tenantId: string;
  ownerId?: string;
  status: ApplicationStatus;
  submittedAt?: Date;
  moveInDate: Date;
  proposedRent: number;
  message?: string;
  applicationData?: {
    applicantName?: string;
    applicantEmail?: string;
    applicantPhone?: string;
    employmentStatus?: string;
    monthlyIncome?: number;
    occupantsCount?: number;
    notes?: string;
  };
  verificationStatusAtSubmission: VerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRental {
  _id?: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  applicationId: string;
  status: RentalStatus;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositPaid: number;
  rentStatus: RentPaymentStatus;
  agreementVersion: string;
  handoverChecklist?: {
    conditionRecordVerified: boolean;
    moveInReadinessCompleted: boolean;
    activatedAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
