'use client';

import { useEffect, useRef, useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useAuthStore } from '@/hooks/use-auth';

function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setSessionUser, hasInitialized, isLoading } = useAuthStore();
  const initAttemptRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Timeout protection - if auth takes too long, force show content
    const timeout = setTimeout(() => {
      console.log('Auth timeout reached, forcing content display');
      setForceShow(true);
      if (!initAttemptRef.current) {
        initAttemptRef.current = true;
        setSessionUser(null); // Force initialization with no session
      }
    }, 5000); // Reduced to 5 seconds
    
    return () => clearTimeout(timeout);
  }, [setSessionUser]);

  useEffect(() => {
    if (!isHydrated || initAttemptRef.current) return;
    
    // Wait for NextAuth to finish loading
    if (status === 'loading') return;
    
    // Mark as attempted and sync session
    initAttemptRef.current = true;
    
    console.log('🔄 Syncing session:', { hasSession: !!session, status, hasInitialized });
    
    if (session) {
      // User is authenticated with NextAuth
      console.log('✅ Setting authenticated session user:', session.user?.email);
      setSessionUser(session);
    } else {
      // No session, mark unauthenticated in store
      console.log('❌ No session found, marking as unauthenticated');
      setSessionUser(null);
    }
  }, [session, status, isHydrated, setSessionUser]);

  // Show loading state while checking authentication
  if ((!isHydrated || status === 'loading' || !hasInitialized) && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          <div className="text-sm text-gray-600">
            {!isHydrated ? 'Initializing app...' : status === 'loading' ? 'Checking authentication...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  );
}
