/**
 * User Profile API Routes
 * 
 * GET /api/auth/profile - Get current user profile
 * PUT /api/auth/profile - Update current user profile
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
  sanitizeUser,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { userValidation } from '@/lib/validations';
import { UserResponse, UpdateUserRequest } from '@/types/user';

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`profile_get_${clientIP}`, 100, 60000);

      if (!rateLimitResult.allowed) {
        return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
      }

      const user = await User.findById(currentUser._id)
        .select('-password')
        // .populate('postsCount')
        // .populate('commentsCount');

      if (!user) {
        return createErrorResponse('User not found', 404, 'Not Found');
      }

      const sanitizedUser = sanitizeUser(user);

      return createSuccessResponse<{ user: UserResponse }>(
        { user: sanitizedUser },
        'Profile retrieved successfully'
      );
    } catch (error) {
      return handleApiError(error, 'GET /api/auth/profile');
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`profile_put_${clientIP}`, 20, 60000);

      if (!rateLimitResult.allowed) {
        return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
      }

      const body: UpdateUserRequest = await request.json();
      delete body.role;
      delete body.isActive;

      const validation = userValidation.update(body);
      if (!validation.isValid) {
        const errors: Record<string, string[]> = {};
        validation.errors.forEach(error => {
          if (!errors[error.field]) {
            errors[error.field] = [];
          }
          errors[error.field].push(error.message);
        });
        return createErrorResponse('Validation failed', 400, 'Validation Error', errors);
      }

      if (body.username || body.email) {
        const duplicateQuery: any = { _id: { $ne: currentUser._id } };

        if (body.username && body.email) {
          duplicateQuery.$or = [
            { username: body.username.toLowerCase() },
            { email: body.email.toLowerCase() }
          ];
        } else if (body.username) {
          duplicateQuery.username = body.username.toLowerCase();
        } else if (body.email) {
          duplicateQuery.email = body.email.toLowerCase();
        }

        const existingUser = await User.findOne(duplicateQuery);
        if (existingUser) {
          const field = existingUser.username === body.username?.toLowerCase() ? 'username' : 'email';
          return createErrorResponse(
            `User with this ${field} already exists`,
            409,
            'Duplicate User'
          );
        }
      }

      const updateData = { ...body };
      if (updateData.email) updateData.email = updateData.email.toLowerCase();
      if (updateData.username) updateData.username = updateData.username.toLowerCase();

      const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return createErrorResponse('User not found', 404, 'Not Found');
      }

      const sanitizedUser = sanitizeUser(updatedUser);

      return createSuccessResponse<{ user: UserResponse }>(
        { user: sanitizedUser },
        'Profile updated successfully'
      );
    } catch (error) {
      return handleApiError(error, 'PUT /api/auth/profile');
    }
  })(request);
}
