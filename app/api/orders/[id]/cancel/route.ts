/**
 * Cancel Order API Route
 * 
 * PUT /api/orders/[id]/cancel - Cancel an order
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
  rateLimit,
  getClientIP
} from '@/lib/api-helpers';
import { validateObjectId } from '@/lib/validations';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/orders/[id]/cancel
 * Cancel a specific order by ID
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
      const rateLimitResult = rateLimit(`order_cancel_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Validate order ID
      const idValidation = validateObjectId(params.id);
      if (!idValidation.isValid) {
        return createErrorResponse(
          idValidation.message || 'Invalid order ID',
          400,
          'Validation Error'
        );
      }

      // Find order
      const order = await Order.findById(params.id);

      if (!order) {
        return createErrorResponse(
          'Order not found',
          404,
          'Not Found'
        );
      }

      // Check permissions
      if (currentUser.role !== 'admin' && order.userId !== currentUser._id.toString()) {
        return createErrorResponse(
          'Access denied',
          403,
          'Authorization Error'
        );
      }

      // Check if order can be cancelled
      if (!['pending', 'confirmed'].includes(order.status)) {
        return createErrorResponse(
          'Order cannot be cancelled at this stage',
          400,
          'Invalid Operation'
        );
      }

      // Parse request body for cancellation reason
      const body = await request.json();
      const { reason } = body;

      // Update order status
      order.status = 'cancelled';
      await order.save();

      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }

      return createSuccessResponse(
        { id: params.id, status: 'cancelled' },
        'Order cancelled successfully'
      );

    } catch (error) {
      return handleApiError(error, `PUT /api/orders/${params.id}/cancel`);
    }
  })(request);
}