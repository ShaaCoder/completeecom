'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signIn, signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { UserResponse } from '@/types/user';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
}

interface AuthStore {
  user: UserResponse | null; // <-- updated
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: { name: string; phone?: string; username?: string }) => Promise<void>;
  addAddress: (address: { name: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault?: boolean }) => Promise<void>;
  checkAuth: () => Promise<void>;
  setSessionUser: (session: any) => void;
  checkSessionAuth: () => Promise<void>;
}


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasInitialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
          if (res?.error) {
            throw new Error(res.error);
          }
          // Fetch profile to populate store
          const response = await apiClient.getProfile();
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              hasInitialized: true,
            });
          } else {
            set({ isLoading: false });
            throw new Error('Failed to load profile after login');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Login failed:', error);
          throw new Error(error instanceof Error ? error.message : 'Login failed');
        }
      },


      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.register(userData);
          if (response.success && response.data?.user) {
            // Immediately sign in using credentials
            const res = await signIn('credentials', {
              redirect: false,
              email: userData.email,
              password: userData.password,
            });
            if (res?.error) {
              console.error('SignIn after registration failed:', res.error);
              throw new Error(res.error);
            }

            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              hasInitialized: true, // Ensure this is set
            });
          } else {
            throw new Error(JSON.stringify(response));
          }
        } catch (error) {
          set({ isLoading: false, hasInitialized: true }); // Set initialized even on error
          throw new Error(
            error instanceof Error ? error.message : JSON.stringify({ error: 'Registration failed' })
          );
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await signOut({ redirect: false });
          await apiClient.logout();
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          // Allow partial updates; only send provided fields
          const payload: { name?: string; phone?: string; username?: string } = {};
          if (typeof userData.name !== 'undefined') payload.name = userData.name;
          if (typeof userData.phone !== 'undefined') payload.phone = userData.phone;
          if (typeof userData.username !== 'undefined') payload.username = userData.username;

          const response = await apiClient.updateProfile(payload as any);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isLoading: false,
            });
          } else {
            throw new Error(response.error || 'Profile update failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw new Error(
            error instanceof Error ? error.message : 'An unexpected error occurred during profile update'
          );
        }
      },

      addAddress: async (address) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.addAddress(address);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isLoading: false,
            });
          } else {
            throw new Error(response.error || 'Failed to add address');
          }
        } catch (error) {
          set({ isLoading: false });
          throw new Error(
            error instanceof Error ? error.message : 'An unexpected error occurred while adding address'
          );
        }
      },

      checkAuth: async () => {
        const { hasInitialized } = get();
        if (hasInitialized) return;
        set({ isLoading: true, hasInitialized: true });
        try {
          const response = await apiClient.getProfile();
          if (response.success && response.data?.user) {
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          } else {
            // Handle case where profile fetch fails (no session, 401 error, etc.)
            console.log('Profile fetch failed, user not authenticated');
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          // Log the error for debugging but don't throw it
          console.log('Auth check failed:', error instanceof Error ? error.message : 'Unknown error');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setSessionUser: (session: any) => {
        if (session?.user) {
          const user: UserResponse = {
            id: (session.user as any).id,
            name: session.user.name || '',
            username: session.user.email?.split('@')[0] || '',
            email: session.user.email || '',
            phone: '',
            addresses: [],
            role: (session.user as any).role || 'customer',
            isActive: true,
            isEmailVerified: true,
            oauthProvider: 'next-auth',
            avatar: session.user.image,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ user, isAuthenticated: true, isLoading: false, hasInitialized: true });
        } else {
          // Properly handle no session case
          set({ user: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
        }
      },

      checkSessionAuth: async () => {
        const { hasInitialized } = get();
        if (hasInitialized) {
          return;
        }
        
        set({ isLoading: true, hasInitialized: true });
        
        // This will be called from a component that has access to useSession
        // The actual session check will be done in the AuthProvider component
        set({ isLoading: false });
      },


    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);