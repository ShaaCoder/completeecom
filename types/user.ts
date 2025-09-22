/**
 * User Type Definitions
 */

import { Document, Types } from 'mongoose';

export interface IAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser {
  name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  addresses: IAddress[];
  lastLoginAt?: Date;
  refreshToken?: string;
  tokenVersion?: number; // Added for refresh token invalidation
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  oauthProvider?: 'google' | 'next-auth' | null;
  oauthId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  addAddress(address: Omit<IAddress, 'id'>): Promise<void>;
  updateAddress(addressId: string, updates: Partial<IAddress>): Promise<void>;
  removeAddress(addressId: string): Promise<void>;
  toJSON(): Partial<IUser>;
}

// ... rest of the interfaces remain unchanged
// User creation request
export interface CreateUserRequest {
  name: string;
  username: string; // Added to match schema
  email: string;
  password: string;
  phone?: string;
}

// User update request
export interface UpdateUserRequest {
  name?: string;
  username?: string; // Added to match schema
  email?: string;
  phone?: string;
  role?: 'customer' | 'admin';
  isActive?: boolean;
}

// User login request
export interface LoginRequest {
  email: string;
  password: string;
}

// User response - matches your existing User interface
export interface UserResponse {
  id: string;
  name: string;
  username: string; // Added to match schema
  email: string;
  phone?: string;
  image?: string; // Added for NextAuth compatibility
  addresses: IAddress[]; // Updated to use IAddress
  role: 'customer' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  oauthProvider?: 'google' | 'next-auth' | null; // Updated to allow next-auth
  oauthId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication response
export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken?: string;
}