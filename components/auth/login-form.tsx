'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, user } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 1) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      const role = useAuthStore.getState().user?.role;
      const destination = (role === 'admin') ? '/admin' : '/profile';
      router.replace(destination);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('CredentialsSignin') || error.message.includes('Invalid')) {
          setErrors({ email: 'Invalid email or password' });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/profile'
      });
      
      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        if (result.error === 'OAuthAccountNotLinked') {
          toast.error('This email is already registered. Please sign in with your password.');
        } else if (result.error === 'AccessDenied') {
          toast.error('Access denied. Please try again.');
        } else {
          toast.error('Google sign-in failed. Please try again.');
        }
      } else if (result?.ok || result?.url) {
        // Success! Wait for the session and user data to be synced
        toast.success('Google sign-in successful!');
        
        // Wait for the session to be established and user data synced
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const currentUser = useAuthStore.getState().user;
          if (currentUser && currentUser.email) {
            const destination = currentUser.role === 'admin' ? '/admin' : '/profile';
            router.push(destination);
            return;
          }
          attempts++;
        }
        
        // Fallback if user data isn't synced yet
        router.push('/profile');
      } else {
        toast.error('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-rose-600 hover:bg-rose-700"
        disabled={submitting}
      >
        {submitting ? 'Signing in...' : 'Sign In'}
      </Button>
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">OR</span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
        disabled={submitting}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {submitting ? 'Signing in...' : 'Continue with Google'}
      </Button>
    </form>
  );
}