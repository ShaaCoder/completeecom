/**
 * Create Checkout Session API for NextAuth Users
 * 
 * POST /api/payments/create-checkout-session - Create a Stripe checkout session for NextAuth users
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import connectDB from '@/lib/mongodb';
import { createCheckoutSession } from '@/lib/stripe';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return createErrorResponse(
        'Authentication required',
        401,
        'Unauthorized'
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`checkout_session_${clientIP}`, 10, 60000);
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    const body = await request.json();
    const { items, shippingAddress, couponCode, sessionInfo } = body;

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

    // Get user from database using session info
    const user = await User.findOne({ 
      email: session.user.email 
    }).select('-password');

    if (!user) {
      return createErrorResponse(
        'User not found',
        404,
        'Not Found'
      );
    }

    // Calculate total amount and validate products
    let subtotal = 0;
    const lineItems = [];
    const invalidProducts = [];
    const validItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.warn(`Product not found during checkout: ${item.productId}`);
        invalidProducts.push({
          productId: item.productId,
          name: item.name || 'Unknown Product',
          reason: 'Product no longer exists'
        });
        continue;
      }

      if (!product.isActive) {
        console.warn(`Inactive product in checkout: ${item.productId}`);
        invalidProducts.push({
          productId: item.productId,
          name: product.name,
          reason: 'Product is no longer available'
        });
        continue;
      }

      if (product.stock < item.quantity) {
        console.warn(`Insufficient stock for product: ${item.productId}`);
        invalidProducts.push({
          productId: item.productId,
          name: product.name,
          reason: `Only ${product.stock} items available, but ${item.quantity} requested`
        });
        continue;
      }

      validItems.push(item);
    }

    // If there are invalid products, return an error with details
    if (invalidProducts.length > 0) {
      const errorDetails: Record<string, string[]> = {};
      invalidProducts.forEach((product, index) => {
        errorDetails[`product_${index}`] = [`${product.name}: ${product.reason}`];
      });
      
      return createErrorResponse(
        `Some products in your cart are no longer available: ${invalidProducts.map(p => p.name).join(', ')}. Please update your cart and try again.`,
        400,
        'Cart Validation Failed',
        errorDetails
      );
    }

    // If no valid items remain, return an error
    if (validItems.length === 0) {
      return createErrorResponse(
        'No valid products found in cart. Please add products and try again.',
        400,
        'Empty Cart'
      );
    }

    // Process valid items
    for (const item of validItems) {
      const product = await Product.findById(item.productId); // We know this exists from validation above
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
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
    const shipping = subtotal > 999 ? 0 : 99;
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
    const checkoutSession = await createCheckoutSession(
      lineItems,
      {
        orderId: order.id,
        userId: user._id.toString(),
        orderNumber: order.orderNumber,
      },
      user.email
    );

    // Update order with session ID
    order.stripeSessionId = checkoutSession.id;
    await order.save();

    return createSuccessResponse({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: total,
    }, 'Checkout session created successfully');

  } catch (error) {
    return handleApiError(error, 'POST /api/payments/create-checkout-session');
  }
}