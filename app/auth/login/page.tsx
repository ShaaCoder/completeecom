'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuthStore } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      const destination = user?.role === 'admin' ? '/admin' : callbackUrl;
      router.replace(destination);
    }
  }, [isAuthenticated, mounted, router, user?.role, callbackUrl]);

  if (!mounted) {
    return null;
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in with your original method or contact support.';
      case 'OAuthSignin':
        return 'Error occurred during sign in. Please try again.';
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account. Please try again.';
      case 'EmailCreateAccount':
        return 'Could not create email account. Please try again.';
      case 'Callback':
        return 'Error in callback handler. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'Email already exists with different provider. Please sign in with your original method.';
      case 'EmailSignin':
        return 'Check your email for the sign in link.';
      case 'CredentialsSignin':
        return 'Invalid credentials. Please check your email and password.';
      case 'default':
        return 'An error occurred during authentication. Please try again.';
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">BeautyMart</h2>
          <p className="mt-2 text-gray-600">Your beauty destination</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}