'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth'; // adjust path

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    if (formData.phone && formData.phone.trim() !== '' && !/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number starting with 6-9';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    try {
      // Filter out empty phone number
      const registrationData = {
        ...formData,
        phone: formData.phone?.trim() || undefined
      };
      
      await register(registrationData);
      toast.success('Registration successful!');
      router.replace('/profile');
    } catch (err: any) {
      // Handle specific error cases
      if (err.message.includes('already exists')) {
        if (err.message.includes('email')) {
          setErrors({ email: 'User with this email already exists' });
        } else if (err.message.includes('username')) {
          setErrors({ username: 'User with this username already exists' });
        }
      } else if (err.message.includes('validation')) {
        toast.error('Please check your input and try again');
      } else {
        toast.error(err.message || 'Registration failed');
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md"
    >
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          aria-invalid={!!errors.username}
        />
        {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
      </div>

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

      <div>
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="9876543210"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-md"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
