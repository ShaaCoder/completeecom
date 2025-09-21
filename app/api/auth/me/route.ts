// /app/api/user/me/route.ts
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, createSuccessResponse, createErrorResponse, handleApiError, sanitizeUser } from '@/lib/api-helpers';
import { userValidation } from '@/lib/validations';

export const GET = withAuth(async (_request, currentUser) => {
  try {
    await connectDB();

    const sanitized = sanitizeUser(currentUser);

    return createSuccessResponse(sanitized, 'User fetched successfully');
  } catch (error) {
    return handleApiError(error, 'GET /api/user/me');
  }
});

export const PUT = withAuth(async (request: NextRequest, currentUser) => {
  try {
    await connectDB();

    const body = await request.json();
    // Validate update input (only name and phone for now)
    const validation = userValidation.updateProfile(body);
    if (!validation.isValid) {
      const errors: Record<string, string[]> = {};
      validation.errors.forEach((error) => {
        if (!errors[error.field]) errors[error.field] = [];
        errors[error.field].push(error.message);
      });

      return createErrorResponse('Validation failed', 400, 'Validation Error', errors);
    }

    // Update fields
    if (body.name) currentUser.name = body.name;
    if (body.phone) currentUser.phone = body.phone;

    await currentUser.save();

    const sanitized = sanitizeUser(currentUser);

    return createSuccessResponse(sanitized, 'Profile updated successfully');
  } catch (error) {
    return handleApiError(error, 'PUT /api/user/me');
  }
});
