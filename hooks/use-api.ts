/**
 * Enhanced API Hook with NextAuth Integration
 * 
 * Handles API calls with both traditional JWT and NextAuth session tokens
 */

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';
import { useEffect } from 'react';

export function useApi() {
  const { data: session } = useSession();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Set session token in API client if available
    if (session?.accessToken) {
      apiClient.setSessionToken(session.accessToken);
    }
  }, [session]);

  const createCheckoutSession = async (data: {
    items: Array<{
      productId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }>;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    total: number;
  }) => {
    // For NextAuth sessions, we might need to handle this differently
    if (session && !session.accessToken) {
      // If we have a NextAuth session but no access token, 
      // we can create a custom request with session info
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          sessionInfo: {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Checkout session creation failed');
      }

      return await response.json();
    }

    // Use regular API client for JWT authenticated users
    return apiClient.createCheckoutSession(data);
  };

  return {
    createCheckoutSession,
    isAuthenticated: isAuthenticated || !!session,
    user: session?.user || user,
  };
}