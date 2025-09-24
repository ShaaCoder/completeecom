'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signIn, signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { UserResponse } from '@/types/user';
import { logAuthEvent, logAuthError, logSessionEvent } from '@/lib/auth-debug';

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
  resetAuthState: () => void;
}


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasInitialized: false,

      login: async (email: string, password: string) => {
        logAuthEvent('user-login', { email, method: 'credentials' });
        set({ isLoading: true });
        try {
          const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
          if (res?.error) {
            logAuthError(res.error, 'credentials-signin');
            throw new Error(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
          }
          
          // Wait a moment for NextAuth session to be established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to fetch profile to populate store
          logAuthEvent('api-call', { endpoint: '/auth/profile', method: 'GET' });
          try {
            const response = await apiClient.getProfile();
            if (response.success && response.data?.user) {
              logAuthEvent('auth-success', { 
                userId: response.data.user.id, 
                email: response.data.user.email 
              }, response.data.user);
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                hasInitialized: true,
              });
            } else {
              // Profile fetch failed, but login was successful
              // Set basic authenticated state and let session handling take over
              logAuthEvent('api-call', { endpoint: '/auth/profile', success: false, error: 'No user data, using session fallback' });
              set({
                user: null,
                isAuthenticated: true,
                isLoading: false,
                hasInitialized: true,
              });
            }
          } catch (profileError) {
            // Profile fetch failed, but login was successful
            // Set basic authenticated state
            logAuthEvent('api-call', { endpoint: '/auth/profile', success: false, error: 'Profile fetch failed, using session fallback' });
            set({
              user: null,
              isAuthenticated: true,
              isLoading: false,
              hasInitialized: true,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          logAuthError(error instanceof Error ? error : new Error(String(error)), 'login-flow');
          throw error instanceof Error ? error : new Error('Login failed');
        }
      },


      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.register(userData);
          if (response.success && response.data?.user) {
            // Add a small delay to ensure user is properly saved in database
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Immediately sign in using credentials
            const res = await signIn('credentials', {
              redirect: false,
              email: userData.email,
              password: userData.password,
            });
            if (res?.error) {
              console.error('SignIn after registration failed:', res.error);
              // Do NOT mark authenticated if NextAuth sign-in failed
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                hasInitialized: true,
              });
            } else {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                hasInitialized: true,
              });
            }
          } else {
            throw new Error(response.error || response.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false, hasInitialized: true });
          if (error instanceof Error) {
            throw error;
          } else if (typeof error === 'string') {
            throw new Error(error);
          } else {
            throw new Error('Registration failed');
          }
        }
      },

      logout: async () => {
        const currentUser = get().user;
        logAuthEvent('user-logout', { userId: currentUser?.id }, currentUser);
        set({ isLoading: true });
        try {
          await signOut({ redirect: false });
          await apiClient.logout();
        } catch (error) {
          logAuthError(error instanceof Error ? error : new Error('Logout failed'), 'logout-flow');
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
          logAuthEvent('auth-success', { action: 'logout-complete' });
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
        logAuthEvent('persistence', { 
          action: 'setSessionUser',
          hasSession: !!session, 
          sessionUser: session?.user?.email 
        });
        
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
          logSessionEvent('found', { source: 'setSessionUser', userEmail: user.email }, user);
          set({ user, isAuthenticated: true, isLoading: false, hasInitialized: true });
        } else {
          // Properly handle no session case
          logSessionEvent('lost', { source: 'setSessionUser', reason: 'no session data' });
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

      resetAuthState: () => {
        logAuthEvent('persistence', { action: 'resetAuthState', reason: 'recovery' });
        set({ 
          hasInitialized: false, 
          isLoading: false, 
          user: null, 
          isAuthenticated: false 
        });
      },


    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Prevent hydration issues
      skipHydration: false,
      // Use merge strategy to handle partial state restoration
      merge: (
        persistedState: unknown,
        currentState: AuthStore
      ): AuthStore => {
        const safe = (persistedState ?? {}) as Partial<AuthStore>
        return {
          ...currentState,
          ...safe,
          // Always start with loading state during hydration
          isLoading: false,
          hasInitialized: false,
        }
      },
    }
  )
);