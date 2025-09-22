/**
 * Stripe Session API
 * 
 * GET /api/payments/session - Get order details from Stripe session
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import Order from '@/models/Order';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return createErrorResponse(
        'Session ID is required',
        400,
        'Missing session_id parameter'
      );
    }

    console.log('🔍 Getting order details for session:', sessionId);

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return createErrorResponse(
        'Session not found',
        404,
        'Invalid session ID'
      );
    }

    // Find order by session ID
    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();
    
    if (!order) {
      return createErrorResponse(
        'Order not found',
        404,
        'Order not found for this session'
      );
    }

    console.log('✅ Found order:', order.orderNumber);

    return createSuccessResponse({
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
      amount: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
    }, 'Order details retrieved successfully');

  } catch (error) {
    console.error('❌ Session API error:', error);
    return handleApiError(error, 'GET /api/payments/session');
  }
}