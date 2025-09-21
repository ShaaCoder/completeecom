'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const error = searchParams.get('error');

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please contact support.',
          action: 'Contact Support'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in. Please contact support if you believe this is an error.',
          action: 'Try Again'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          description: 'The verification token has expired or has already been used.',
          action: 'Request New Link'
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          description: 'This email is already associated with another account. Please sign in with your original method.',
          action: 'Sign In'
        };
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Failed',
          description: 'Could not create your account. Please try again or contact support.',
          action: 'Try Again'
        };
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Creation Failed',
          description: 'Could not create account with email. Please try again.',
          action: 'Try Again'
        };
      case 'Callback':
        return {
          title: 'Authentication Callback Error',
          description: 'An error occurred during the authentication process. Please try again.',
          action: 'Try Again'
        };
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign In Error',
          description: 'There was an error signing in with your OAuth provider. Please try again.',
          action: 'Try Again'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          description: 'An error occurred during OAuth callback. Please try again.',
          action: 'Try Again'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You must be signed in to view this page.',
          action: 'Sign In'
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication. Please try again.',
          action: 'Try Again'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">BeautyMart</h2>
          <p className="mt-2 text-gray-600">Your beauty destination</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{errorDetails.title}</AlertTitle>
            <AlertDescription className="mt-2">
              {errorDetails.description}
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {errorDetails.action}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-500">
              Error code: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}