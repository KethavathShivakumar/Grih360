export type UserRole = 'TENANT' | 'OWNER' | 'PROFESSIONAL' | 'ADMIN';

export type VerificationStatus = 
  | 'NOT_STARTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  name?: string;
  role: UserRole;
  status: string;
  profileImage?: string; // Note: No auto-generated profile image per section 18
  identityVerificationStatus: VerificationStatus;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
