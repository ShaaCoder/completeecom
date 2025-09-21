/**
 * Payment Creation API
 * POST /api/payments/create
 */

import { NextRequest } from 'next/server';
import { paymentGateway } from '@/lib/payment';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  return withAuth(async (request, currentUser) => {
    try {
      const body = await request.json();
      
      const {
        amount,
        currency = 'INR',
        orderId,
        provider = 'razorpay',
        description,
        metadata = {},
      } = body;

      if (!amount || !orderId) {
        return createErrorResponse(
          'Amount and orderId are required',
          400,
          'Validation Error'
        );
      }

      const paymentRequest = {
        amount: parseFloat(amount),
        currency,
        orderId,
        customerId: currentUser._id.toString(),
        customerEmail: currentUser.email,
        customerPhone: currentUser.phone || '',
        description,
        metadata,
      };

      const result = await paymentGateway.createPayment(paymentRequest, provider);

      if (result.success) {
        return createSuccessResponse(result, 'Payment created successfully');
      } else {
        return createErrorResponse(
          result.error || 'Payment creation failed',
          400,
          'Payment Error'
        );
      }
    } catch (error) {
      return handleApiError(error, 'POST /api/payments/create');
    }
  })(request);
}