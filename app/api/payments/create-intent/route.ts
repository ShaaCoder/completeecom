/**
 * Create Payment Intent API
 * 
 * POST /api/payments/create-intent - Create a Stripe payment intent
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { createPaymentIntent } from '@/lib/stripe';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  return withAuth(async (req, _user) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`payment_intent_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      const body = await req.json();
      const { amount, orderId, items } = body;

      // Validate required fields
      if (!amount || amount <= 0) {
        return createErrorResponse(
          'Valid amount is required',
          400,
          'Validation Error'
        );
      }

      if (!orderId) {
        return createErrorResponse(
          'Order ID is required',
          400,
          'Validation Error'
        );
      }

      // Verify order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return createErrorResponse(
          'Order not found',
          404,
          'Not Found'
        );
      }

      // Create payment intent
      const paymentIntent = await createPaymentIntent(amount, {
        orderId: orderId,
        userId: order.userId.toString(),
        orderNumber: order.orderNumber,
      });

      // Update order with payment intent ID
      order.set('paymentIntentId', paymentIntent.id);
      await order.save();

      return createSuccessResponse({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'inr',
      }, 'Payment intent created successfully');

    } catch (error) {
      return handleApiError(error, 'POST /api/payments/create-intent');
    }
  }, ['customer', 'admin'])(request);
}
