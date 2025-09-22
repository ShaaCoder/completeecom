/**
 * Send Order Email API
 * 
 * POST /api/orders/[id]/send-email - Manually send order confirmation email
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  rateLimit,
  getClientIP,
  withAuth
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import User from '@/models/User';
import emailService from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, currentUser) => {
    try {
      await connectDB();

      const { id } = params;

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`send_order_email_${clientIP}`, 10, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      // Get request body
      const body = await req.json();
      const { emailType = 'confirmation', force = false } = body;

      // Find the order
      const order = await Order.findById(id);
      if (!order) {
        return createErrorResponse(
          'Order not found',
          404,
          'Not Found'
        );
      }

      // Check permissions (admin or order owner)
      if (currentUser.role !== 'admin' && order.userId !== currentUser._id.toString()) {
        return createErrorResponse(
          'Insufficient permissions',
          403,
          'Authorization Error'
        );
      }

      // Get customer details
      const customer = await User.findById(order.userId).select('name email');
      
      if (!customer || !customer.email) {
        return createErrorResponse(
          'Customer not found or email not available',
          404,
          'Customer Error'
        );
      }

      let emailSent = false;
      let message = '';

      switch (emailType) {
        case 'confirmation':
          // Check if confirmation email was already sent (unless force is true)
          if (order.confirmationEmailSent && !force) {
            return createErrorResponse(
              'Confirmation email already sent. Use force=true to resend.',
              400,
              'Email Already Sent'
            );
          }

          emailSent = await emailService.sendOrderConfirmation({
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
            order.confirmationEmailSent = true;
            order.confirmationEmailSentAt = new Date();
            await order.save();
            message = 'Order confirmation email sent successfully';
          }
          break;

        case 'shipped':
          // Check if shipping email was already sent (unless force is true)
          if (order.shippingEmailSent && !force) {
            return createErrorResponse(
              'Shipping email already sent. Use force=true to resend.',
              400,
              'Email Already Sent'
            );
          }

          if (!order.trackingNumber || !order.carrier) {
            return createErrorResponse(
              'Order must have tracking number and carrier to send shipping email',
              400,
              'Missing Tracking Information'
            );
          }

          emailSent = await emailService.sendOrderShipped({
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
            trackingNumber: order.trackingNumber,
            carrier: order.carrier,
          });

          if (emailSent) {
            order.shippingEmailSent = true;
            order.shippingEmailSentAt = new Date();
            await order.save();
            message = 'Order shipping email sent successfully';
          }
          break;

        default:
          return createErrorResponse(
            'Invalid email type. Supported types: confirmation, shipped',
            400,
            'Invalid Email Type'
          );
      }

      if (emailSent) {
        return createSuccessResponse({
          orderId: (order._id as any).toString(),
          orderNumber: order.orderNumber,
          emailType,
          customerEmail: customer.email,
          sentAt: new Date().toISOString(),
        }, message);
      } else {
        return createErrorResponse(
          'Failed to send email',
          500,
          'Email Service Error'
        );
      }

    } catch (error) {
      return handleApiError(error, 'POST /api/orders/[id]/send-email');
    }
  }, ['customer', 'admin'])(request);
}