/**
 * Debug Trigger Order Email API
 * 
 * POST /api/debug/trigger-order-email - Manually trigger email for a specific order
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import User from '@/models/User';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return createErrorResponse('Order ID is required', 400, 'Missing Order ID');
    }

    console.log('🐛 Debug: Triggering email for order:', orderId);

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse('Order not found', 404, 'Order Not Found');
    }

    // Get customer details
    const customer = await User.findById(order.userId).select('name email');
    if (!customer || !customer.email) {
      return createErrorResponse('Customer not found or no email', 404, 'Customer Error');
    }

    console.log('🐛 Debug: Order details:', {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerEmail: customer.email
    });

    // Send order confirmation email (regardless of payment status for debugging)
    const emailSent = await emailService.sendOrderConfirmation({
      orderId: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString(),
      customerEmail: customer.email,
      customerName: customer.name,
      items: order.items.map(item => ({
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      shippingAddress: order.shippingAddress,
    });

    if (emailSent) {
      // Update the order to mark email as sent
      order.confirmationEmailSent = true;
      order.confirmationEmailSentAt = new Date();
      await order.save();
    }

    return createSuccessResponse({
      emailSent,
      orderNumber: order.orderNumber,
      customerEmail: customer.email,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
    }, emailSent ? 'Email sent successfully' : 'Failed to send email');

  } catch (error) {
    console.error('🐛 Debug: Error in trigger-order-email:', error);
    return handleApiError(error, 'POST /api/debug/trigger-order-email');
  }
}