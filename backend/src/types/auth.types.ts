export type UserRole = 'TENANT' | 'OWNER' | 'PROFESSIONAL' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type VerificationStatus = 
  | 'NOT_STARTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface IUser {
  _id?: string;
  email: string;
  phone: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  identityVerificationStatus: VerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<IUser, 'passwordHash'>;
  tokens: AuthTokens;
}
