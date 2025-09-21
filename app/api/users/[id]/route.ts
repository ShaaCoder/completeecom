/**
 * User by ID API Routes
 * 
 * Handles operations for specific users:
 * GET /api/users/[id] - Get user by ID
 * PUT /api/users/[id] - Update user by ID
 * DELETE /api/users/[id] - Delete user by ID
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
import { userValidation, validateObjectId } from '@/lib/validations';
import { UserResponse, UpdateUserRequest } from '@/types/user';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * Retrieve a specific user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`user_get_${clientIP}`, 100, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate user ID
      const idValidation = validateObjectId(params.id, 'userId');
      if (idValidation) {
        return createErrorResponse(
          idValidation.message,
          400,
          'Validation Error'
        );
      }

      // Check permissions - users can only view their own profile unless admin/moderator
      const isAdmin = ['admin', 'moderator'].includes(currentUser.role);
      const isOwnProfile = currentUser._id.toString() === params.id;

      if (!isAdmin && !isOwnProfile) {
        return createErrorResponse(
          'Access denied',
          403,
          'Authorization Error'
        );
      }

      // Find user
      const user = await User.findById(params.id)
        .select('-password')
        .populate('postsCount')
        .populate('commentsCount');

      if (!user) {
        return createErrorResponse(
          'User not found',
          404,
          'Not Found'
        );
      }

      // Non-admins viewing other profiles get limited info
      let userData = sanitizeUser(user);
      if (!isAdmin && !isOwnProfile) {
        userData = {
          _id: userData._id,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
          bio: userData.bio,
          createdAt: userData.createdAt,
          postsCount: userData.postsCount,
          commentsCount: userData.commentsCount
        };
      }

      return createSuccessResponse<UserResponse>(
        userData,
        'User retrieved successfully'
      );

    } catch (error) {
      return handleApiError(error, `GET /api/users/${params.id}`);
    }
  })(request);
}

/**
 * PUT /api/users/[id]
 * Update a specific user by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`user_put_${clientIP}`, 20, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate user ID
      const idValidation = validateObjectId(params.id, 'userId');
      if (idValidation) {
        return createErrorResponse(
          idValidation.message,
          400,
          'Validation Error'
        );
      }

      // Check permissions
      const isAdmin = currentUser.role === 'admin';
      const isOwnProfile = currentUser._id.toString() === params.id;

      if (!isAdmin && !isOwnProfile) {
        return createErrorResponse(
          'Access denied',
          403,
          'Authorization Error'
        );
      }

      // Parse request body
      const body: UpdateUserRequest = await request.json();

      // Validate input
      const validation = userValidation.update(body);
      if (!validation.isValid) {
        const errors: Record<string, string[]> = {};
        validation.errors.forEach(error => {
          if (!errors[error.field]) {
            errors[error.field] = [];
          }
          errors[error.field].push(error.message);
        });

        return createErrorResponse(
          'Validation failed',
          400,
          'Validation Error',
          errors
        );
      }

      // Non-admins cannot change certain fields
      if (!isAdmin) {
        delete body.role;
        delete body.isActive;
      }

      // Check for duplicate username/email if being updated
      if (body.username || body.email) {
        const duplicateQuery: any = {
          _id: { $ne: params.id }
        };

        if (body.username && body.email) {
          duplicateQuery.$or = [
            { username: body.username },
            { email: body.email }
          ];
        } else if (body.username) {
          duplicateQuery.username = body.username;
        } else if (body.email) {
          duplicateQuery.email = body.email;
        }

        const existingUser = await User.findOne(duplicateQuery);
        if (existingUser) {
          const field = existingUser.username === body.username ? 'username' : 'email';
          return createErrorResponse(
            `User with this ${field} already exists`,
            409,
            'Duplicate User'
          );
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        params.id,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return createErrorResponse(
          'User not found',
          404,
          'Not Found'
        );
      }

      const sanitizedUser = sanitizeUser(updatedUser);

      return createSuccessResponse<UserResponse>(
        sanitizedUser,
        'User updated successfully'
      );

    } catch (error) {
      return handleApiError(error, `PUT /api/users/${params.id}`);
    }
  })(request);
}

/**
 * DELETE /api/users/[id]
 * Delete a specific user by ID (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return withAuth(async (request, currentUser) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(`user_delete_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate user ID
      const idValidation = validateObjectId(params.id, 'userId');
      if (idValidation) {
        return createErrorResponse(
          idValidation.message,
          400,
          'Validation Error'
        );
      }

      // Prevent self-deletion
      if (currentUser._id.toString() === params.id) {
        return createErrorResponse(
          'Cannot delete your own account',
          400,
          'Invalid Operation'
        );
      }

      // Find and delete user
      const deletedUser = await User.findByIdAndDelete(params.id);

      if (!deletedUser) {
        return createErrorResponse(
          'User not found',
          404,
          'Not Found'
        );
      }

      // TODO: Handle cascading deletes for posts and comments
      // This should be done in a transaction or background job

      return createSuccessResponse(
        { id: params.id },
        'User deleted successfully'
      );

    } catch (error) {
      return handleApiError(error, `DELETE /api/users/${params.id}`);
    }
  }, ['admin'])(request); // Only admins can delete users
}