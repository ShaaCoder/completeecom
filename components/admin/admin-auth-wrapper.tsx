'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User } from 'lucide-react';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AdminAuthWrapper({ children, requireAdmin = false }: AdminAuthWrapperProps) {
  const { isAuthenticated, user, isLoading, hasInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !hasInitialized) {
      checkAuth();
    }
  }, [mounted, hasInitialized, checkAuth]);

  // During SSR and before hydration, show loading
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Still loading authentication state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                You need to be logged in to access this page.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/auth')} 
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button 
                  onClick={() => router.push('/')} 
                  variant="outline" 
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check admin role if required
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle>Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                You need admin privileges to access this page.
              </p>
              <Alert className="text-left">
                <AlertDescription>
                  <strong>Current user:</strong> {user.name} ({user.email})<br />
                  <strong>Role:</strong> {user.role}
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/profile')} 
                  className="w-full"
                >
                  Go to Profile
                </Button>
                <Button 
                  onClick={() => router.push('/')} 
                  variant="outline" 
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success - render children
  return (
    <>
      {/* Optional: Show current user info */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>
            Logged in as: <strong>{user.name}</strong> ({user.role})
          </span>
          <span className="text-xs">
            {user.email}
          </span>
        </div>
      </div>
      {children}
    </>
  );
}

export default AdminAuthWrapper;