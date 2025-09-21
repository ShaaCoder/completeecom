/**
 * Create Checkout Session API
 * 
 * POST /api/payments/create-checkout - Create a Stripe checkout session
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { createCheckoutSession } from '@/lib/stripe';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`checkout_session_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      const body = await req.json();
      const { items, shippingAddress, couponCode } = body;

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return createErrorResponse(
          'Items are required',
          400,
          'Validation Error'
        );
      }

      if (!shippingAddress) {
        return createErrorResponse(
          'Shipping address is required',
          400,
          'Validation Error'
        );
      }

      // Calculate total amount
      let subtotal = 0;
      const lineItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return createErrorResponse(
            `Product not found: ${item.productId}`,
            404,
            'Not Found'
          );
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: product.name,
              description: product.description.substring(0, 100),
              images: [product.images[0]],
            },
            unit_amount: Math.round(product.price * 100), // Convert to paise
          },
          quantity: item.quantity,
        });
      }

      // Add shipping cost
      const shipping = 99; // Fixed shipping cost
      const total = subtotal + shipping;

      // Create order in database
      const order = new Order({
        userId: user._id,
        orderNumber: `NYK${Date.now()}`,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        })),
        subtotal,
        shipping,
        discount: 0,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress,
        paymentMethod: 'card',
        couponCode,
      });

      await order.save();

      // Create checkout session
      const session = await createCheckoutSession(
        lineItems,
        {
          orderId: order.id,
          userId: user._id.toString(),
          orderNumber: order.orderNumber,
        },
        user.email
      );

      // Update order with session ID
      order.stripeSessionId = session.id;
      await order.save();

      return createSuccessResponse({
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: total,
      }, 'Checkout session created successfully');

    } catch (error) {
      return handleApiError(error, 'POST /api/payments/create-checkout');
    }
  }, ['customer', 'admin'])(request);
}
