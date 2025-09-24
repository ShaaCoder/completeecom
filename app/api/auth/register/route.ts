import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  validatePasswordStrength,
} from '@/lib/auth';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  sanitizeUser,
  rateLimit,
  getClientIP,
} from '@/lib/api-helpers';
import { CreateUserRequest, AuthResponse } from '@/types/user';
import { createUserSchema, formatZodError } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`register_${clientIP}`, 5, 300000);
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many registration attempts. Please try again later.',
        429,
        'Rate limit exceeded'
      );
    }

    // Parse and validate input
    const body = await request.json();
    console.log("Incoming body:", body);
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(
        'Validation failed',
        400,
        'Validation Error',
        formatZodError(result.error)
      );
    }

    const userData: any = result.data;

    // Password strength validation
    const pwdStrength = validatePasswordStrength(userData.password);
    if (!pwdStrength.isValid) {
      return createErrorResponse(
        'Password is too weak',
        400,
        'Validation Error',
        { password: ['Password must include letters, numbers, and symbols'] }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email.toLowerCase() },
        { username: userData.username.toLowerCase() },
      ],
    });

    if (existingUser) {
      const field =
        existingUser.email === userData.email.toLowerCase() ? 'email' : 'username';
      return createErrorResponse(
        `User with this ${field} already exists`,
        409,
        'User Already Exists',
        { [field]: [`User with this ${field} already exists`] } // 👈 now frontend can map
      );
    }

    // Create user (password will be hashed by model pre-save; make sure it's a string)
    const newUser = new User({
      ...userData,
      password: String(userData.password),
      email: userData.email.toLowerCase(),
      username: userData.username.toLowerCase(),
      role: userData.role === 'admin' ? 'admin' : 'customer',
      isActive: typeof userData.isActive === 'boolean' ? userData.isActive : true,
      isEmailVerified: typeof userData.isEmailVerified === 'boolean' ? userData.isEmailVerified : false,
      tokenVersion: 0,
    });
    
    console.log('Creating user with data:', {
      email: userData.email.toLowerCase(),
      username: userData.username.toLowerCase(),
      hasPassword: !!userData.password,
      phone: userData.phone || 'none'
    });

    await newUser.save();

    // Update last login
    newUser.lastLoginAt = new Date();
    await newUser.save();

    // Response
    const sanitizedUser = sanitizeUser(newUser);

    return createSuccessResponse<{ user: any }>(
      { user: sanitizedUser },
      'User registered successfully'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/register');
  }
}
