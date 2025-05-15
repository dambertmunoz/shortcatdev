export type UserRole = 'buyer' | 'supplier' | 'administrator';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  role: UserRole;
  companyId?: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  phoneNumber?: string;
}

export interface TwoFactorSetupData {
  userId: string;
  phoneNumber: string;
}

export interface TwoFactorVerifyData {
  userId: string;
  verificationCode: string;
}
