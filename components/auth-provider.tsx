'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useAuthStore } from '@/hooks/use-auth';
import { logAuthEvent, logSessionEvent, logAuthError } from '@/lib/auth-debug';

function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setSessionUser, hasInitialized, isLoading, user: storeUser } = useAuthStore();
  const initAttemptRef = useRef(false);
  const lastSessionRef = useRef<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);

  // Memoized session sync function
  const syncSession = useCallback(() => {
    if (!isHydrated || initAttemptRef.current) return;
    
    // Wait for NextAuth to finish loading
    if (status === 'loading') return;
    
    // Check if session actually changed
    const sessionChanged = lastSessionRef.current !== session;
    if (!sessionChanged && hasInitialized) return;
    
    // Mark as attempted and sync session
    initAttemptRef.current = true;
    lastSessionRef.current = session;
    
    logSessionEvent('sync', {
      hasSession: !!session,
      status,
      hasInitialized,
      sessionChanged,
      attempts: syncAttempts + 1,
      userEmail: session?.user?.email
    }, session?.user);
    
    setSyncAttempts(prev => prev + 1);
    
    if (session && session.user) {
      // User is authenticated with NextAuth
      logSessionEvent('found', { userEmail: session.user.email }, session.user);
      setSessionUser(session);
    } else {
      // No session, mark unauthenticated in store
      logSessionEvent('lost', { reason: 'no session or user' });
      setSessionUser(null);
    }
  }, [session, status, isHydrated, hasInitialized, setSessionUser, syncAttempts]);

  useEffect(() => {
    logAuthEvent('hydration', { started: true });
    setIsHydrated(true);
    
    // Timeout protection - if auth takes too long, force show content
    const timeout = setTimeout(() => {
      logAuthError('Auth timeout reached, forcing content display', 'hydration-timeout');
      setForceShow(true);
      if (!initAttemptRef.current) {
        initAttemptRef.current = true;
        setSessionUser(null); // Force initialization with no session
      }
    }, 8000); // Increased to 8 seconds for better UX
    
    return () => {
      clearTimeout(timeout);
      logAuthEvent('hydration', { completed: true });
    };
  }, [setSessionUser]);

  // Handle session changes
  useEffect(() => {
    syncSession();
  }, [syncSession]);

  // Handle browser tab focus to re-sync session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasInitialized) {
        // Reset init attempt to allow re-sync when tab becomes visible
        initAttemptRef.current = false;
        logAuthEvent('session-start', { reason: 'tab-focus-resync' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasInitialized]);

  // Show loading state while checking authentication
  if ((!isHydrated || status === 'loading' || !hasInitialized) && !forceShow) {
    const loadingMessage = !isHydrated 
      ? 'Initializing app...' 
      : status === 'loading' 
        ? 'Checking authentication...' 
        : 'Loading user data...';
        
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          <div className="text-sm text-gray-600">{loadingMessage}</div>
          {syncAttempts > 2 && (
            <div className="text-xs text-gray-500">Taking longer than usual...</div>
          )}
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
