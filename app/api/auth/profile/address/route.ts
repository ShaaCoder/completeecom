import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { withAuth, createSuccessResponse, createErrorResponse, handleApiError, sanitizeUser, rateLimit, getClientIP } from '@/lib/api-helpers';
import { addressSchema } from '@/lib/validations';

export const POST = withAuth(async (request: NextRequest, currentUser) => {
  try {
    await connectDB();

    const clientIP = getClientIP(request);
    const rl = rateLimit(`addr_create_${clientIP}`, 20, 60_000);
    if (!rl.allowed) {
      return createErrorResponse('Too many requests', 429, 'Rate limit exceeded');
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.errors.forEach((e) => {
        const key = e.path.join('.') || 'address';
        if (!errors[key]) errors[key] = [];
        errors[key].push(e.message);
      });
      return createErrorResponse('Validation failed', 400, 'Validation Error', errors);
    }

    await currentUser.addAddress(parsed.data);

    // Return updated user
    const sanitized = sanitizeUser(currentUser);
    return createSuccessResponse<{ user: any }>({ user: sanitized }, 'Address added successfully');
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/profile/address');
  }
});


