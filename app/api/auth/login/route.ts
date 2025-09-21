/**
 * User Login API Route
 * 
 * POST /api/auth/login - Authenticate user and return JWT token
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  sanitizeUser,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { validateEmail, validatePassword , loginSchema} from '@/lib/validations';
import { LoginRequest, AuthResponse } from '@/types/user';

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting for login attempts
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`login_${clientIP}`, 10, 300000); // 10 attempts per 5 minutes
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many login attempts. Please try again later.',
        429,
        'Rate limit exceeded'
      );
    }

    // Parse & validate request body with Zod
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return createErrorResponse(
        'Validation failed',
        400,
        'Validation Error',
        { validation: parsed.error.errors.map(e => e.message) }
      );
    }

    const { email, password } = parsed.data; // both are now guaranteed strings

    // Find user by email (include password for comparison)
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true
    }).select('+password');

    if (!user) {
      return createErrorResponse(
        'Invalid email or password',
        401,
        'Authentication Failed'
      );
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse(
        'Invalid email or password',
        401,
        'Authentication Failed'
      );
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Prepare response (exclude password)
    const sanitizedUser = sanitizeUser(user);
    const authResponse: AuthResponse = {
      user: sanitizedUser,
      token,
    };

    return createSuccessResponse<AuthResponse>(
      authResponse,
      'Login successful'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/login');
  }
}
