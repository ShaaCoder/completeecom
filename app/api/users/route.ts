/**
 * Users API Routes
 * 
 * GET /api/users - List users with pagination and filtering
 * POST /api/users - Create new user
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  getPaginationParams,
  createPaginationInfo,
  getSortParams,
  getSearchParams,
  buildQuery,
  withAuth,
  sanitizeUser,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { userValidation } from '@/lib/validations';
import { UserResponse, CreateUserRequest } from '@/types/user';

/**
 * GET /api/users
 * Retrieve users with pagination, filtering, and search
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`users_get_${clientIP}`, 60, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Extract pagination parameters
    const { page, limit, skip } = getPaginationParams(request);

    // Extract sort parameters
    const sortParams = getSortParams(
      request,
      ['createdAt', 'updatedAt', 'name', 'email'],
      'createdAt',
      'desc'
    );

    // Extract search and filter parameters
    const { search, filters } = getSearchParams(request);

    // Build query
    const query = buildQuery(
      { ...filters, search },
      ['name', 'email']
    );

    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortParams)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Create pagination info
    const pagination = createPaginationInfo(page, limit, totalCount);

    // Sanitize user data
    const sanitizedUsers = users.map(user => sanitizeUser(user));

    return createSuccessResponse<UserResponse[]>(
      sanitizedUsers,
      `Retrieved ${users.length} users`,
      pagination
    );

  } catch (error) {
    return handleApiError(error, 'GET /api/users');
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`users_post_${clientIP}`, 10, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    // Parse request body
    const body: CreateUserRequest = await request.json();

    // Validate input
    const validation = userValidation.create(body);
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

    // Check if user already exists
    const existingUser = await User.findOne({
      email: body.email.toLowerCase()
    });

    if (existingUser) {
      return createErrorResponse(
        'User with this email already exists',
        409,
        'Duplicate User'
      );
    }

    // Create new user
    const newUser = new User({
      ...body,
      email: body.email.toLowerCase(),
    });

    await newUser.save();

    // Return sanitized user data
    const sanitizedUser = sanitizeUser(newUser);

    return createSuccessResponse<UserResponse>(
      sanitizedUser,
      'User created successfully'
    );

  } catch (error) {
    return handleApiError(error, 'POST /api/users');
  }
}