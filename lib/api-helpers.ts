/**
 * API Helper Functions
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ApiResponse, PaginationInfo, ApiError } from '@/types/api';
import { IUserDocument } from '@/types/user';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

/**
 * Create standardized API success response
 */
export function createSuccessResponse<T>(
  data: T,
  message = 'Success',
  pagination?: PaginationInfo
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return NextResponse.json(response);
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(
  message: string,
  statusCode = 400,
  error?: string,
  errors?: Record<string, string[]>
): NextResponse<ApiError> {
  const response: ApiError = {
    success: false,
    message,
    error: error || message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle API errors with proper logging and response
 */
export function handleApiError(error: any, context = 'API'): NextResponse<ApiError> {
  console.error(`${context} Error:`, error);

  // MongoDB validation errors
  if (error.name === 'ValidationError') {
    const errors: Record<string, string[]> = {};
    Object.keys(error.errors).forEach(key => {
      errors[key] = [error.errors[key].message];
    });
    
    return createErrorResponse(
      'Validation failed',
      400,
      'Validation Error',
      errors
    );
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return createErrorResponse(
      `${field} already exists`,
      409,
      'Duplicate Key Error'
    );
  }

  // MongoDB cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return createErrorResponse(
      'Invalid ID format',
      400,
      'Cast Error'
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return createErrorResponse(
      'Invalid token',
      401,
      'Authentication Error'
    );
  }

  if (error.name === 'TokenExpiredError') {
    return createErrorResponse(
      'Token expired',
      401,
      'Authentication Error'
    );
  }

  // Default server error
  return createErrorResponse(
    'Internal server error',
    500,
    error.message || 'Unknown error'
  );
}

/**
 * Extract and validate pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  limit: number;
  skip: number;
} {
  const { searchParams } = new URL(request.url);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = parseInt(searchParams.get('limit') || '24', 10);
  // Allow higher limits for admin dashboard, but cap at 500 to prevent abuse
  const limit = Math.min(500, Math.max(1, requestedLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination info object
 */
export function createPaginationInfo(
  currentPage: number,
  limit: number,
  totalItems: number
): PaginationInfo {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : undefined,
    prevPage: hasPrevPage ? currentPage - 1 : undefined,
  };
}

/**
 * Extract sort parameters from request
 */
export function getSortParams(
  request: NextRequest,
  allowedFields: string[] = ['createdAt'],
  defaultSort = 'createdAt',
  defaultOrder = 'desc'
): { [key: string]: 1 | -1 } {
  const { searchParams } = new URL(request.url);
  
  const sortBy = searchParams.get('sortBy') || defaultSort;
  const sortOrder = searchParams.get('sortOrder') || defaultOrder;

  // Validate sort field
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : defaultSort;
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : defaultOrder;

  return {
    [validSortBy]: validSortOrder === 'asc' ? 1 : -1
  };
}

/**
 * Extract search parameters from request
 */
export function getSearchParams(request: NextRequest): {
  search?: string;
  filters: Record<string, any>;
} {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  
  const filters: Record<string, any> = {};
  
  // Extract common filter parameters
  searchParams.forEach((value, key) => {
    if (!['page', 'limit', 'sortBy', 'sortOrder', 'search', 'sort'].includes(key)) {
      filters[key] = value;
    }
  });

  return { search, filters };
}

/**
 * Authenticate user from JWT token or NextAuth session
 */
export async function authenticateUser(request: NextRequest): Promise<{
  user: IUserDocument | null;
  error: string | null;
}> {
  try {
    await connectDB();

    // Try NextAuth session first
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/nextauth');
      
      const session = await getServerSession(authOptions);
      
      if (session && session.user) {
        console.log('🔑 NextAuth session found for:', session.user.email);
        // Prefer id if present, else fall back to email
        const query: any = (session.user as any).id
          ? { _id: (session.user as any).id }
          : { email: session.user.email };
        const user = await User.findOne(query).select('-password');
        if (user && user.isActive) {
          return { user, error: null };
        }
        console.warn('⚠️ NextAuth session user not found or inactive:', session.user.email);
        return { user: null, error: 'User not found or inactive' };
      }
    } catch (nextAuthError) {
      console.log('⚠️ NextAuth session check failed:', nextAuthError);
    }

    // Try JWT token authentication as fallback
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : request.cookies.get('token')?.value;

      if (token) {
        console.log('🔑 JWT token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          console.log('✅ JWT token valid for:', user.email);
          return { user, error: null };
        }
        console.warn('⚠️ JWT token user not found or inactive:', decoded.userId);
        return { user: null, error: 'User not found or inactive' };
      }
    } catch (jwtError) {
      console.log('⚠️ JWT token verification failed:', jwtError);
    }

    console.log('❌ No valid authentication found');
    return { user: null, error: 'Authentication required' };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error: 'Authentication error' };
  }
}

/**
 * Middleware wrapper for authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: IUserDocument) => Promise<NextResponse>,
  requiredRoles: string[] = []
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, error } = await authenticateUser(request);

    if (error || !user) {
      return createErrorResponse(
        error || 'Authentication required',
        401,
        'Authentication Error'
      );
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return createErrorResponse(
        'Insufficient permissions',
        403,
        'Authorization Error'
      );
    }

    return handler(request, user);
  };
}

/**
 * Sanitize user data for public response
 */
export function sanitizeUser(user: any): any {
  const sanitized = user.toObject ? user.toObject() : user;
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.passwordResetToken;
  delete sanitized.passwordResetExpires;
  delete sanitized.emailVerificationToken;
  delete sanitized.emailVerificationExpires;
  
  if (sanitized._id) {
    sanitized.id = sanitized._id.toString();
    delete sanitized._id;
  }
  delete sanitized.__v;
  
  return sanitized;
}

/**
 * Build MongoDB query from filters
 */
export function buildQuery(filters: Record<string, any>, searchFields: string[] = []): any {
  const query: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    switch (key) {
      case 'search':
        if (searchFields.length > 0) {
          query.$or = searchFields.map(field => ({
            [field]: { $regex: value, $options: 'i' }
          }));
        }
        break;
      
      case 'dateFrom':
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$gte = new Date(value);
        break;
      
      case 'dateTo':
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$lte = new Date(value);
        break;
      
      case 'tags':
        if (Array.isArray(value)) {
          query.tags = { $in: value };
        } else {
          query.tags = value;
        }
        break;
      
      case 'minPrice':
        const minPrice = parseFloat(value);
        if (!isNaN(minPrice)) {
          if (!query.price) query.price = {};
          query.price.$gte = minPrice;
        }
        break;
      
      case 'maxPrice':
        const maxPrice = parseFloat(value);
        if (!isNaN(maxPrice)) {
          if (!query.price) query.price = {};
          query.price.$lte = maxPrice;
        }
        break;
      
      default:
        // Handle boolean strings
        if (value === 'true') {
          query[key] = true;
        } else if (value === 'false') {
          query[key] = false;
        } else {
          query[key] = value;
        }
    }
  });

  return query;
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map();

export function rateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  // In development, disable rate limiting to avoid noisy warnings and unblock local testing
  if (process.env.NODE_ENV !== 'production') {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetTime: Date.now() + windowMs
    };
  }
  const now = Date.now();

  // Clean old entries
 rateLimitMap.forEach((data, key) => {
  if (data.resetTime < now) {
    rateLimitMap.delete(key);
  }
});


  const current = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs
  };

  if (current.resetTime < now) {
    // Reset window
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  current.count++;
  rateLimitMap.set(identifier, current);

  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime
  };
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}