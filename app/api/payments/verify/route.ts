/**
 * Verify Payment API
 * 
 * POST /api/payments/verify - Verify payment completion
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { retrievePaymentIntent } from '@/lib/stripe';
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

export async function POST(request: NextRequest) {
  return withAuth(async (req, _user) => {
    try {
      await connectDB();

      // Rate limiting
      const clientIP = getClientIP(req);
      const rateLimitResult = rateLimit(`payment_verify_${clientIP}`, 20, 60000);
      
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Too many requests',
          429,
          'Rate limit exceeded'
        );
      }

      const body = await req.json();
      const { paymentIntentId } = body;

      if (!paymentIntentId) {
        return createErrorResponse(
          'Payment intent ID is required',
          400,
          'Validation Error'
        );
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await retrievePaymentIntent(paymentIntentId);

      // Find the order
      const order = await Order.findOne({ paymentIntentId });
      if (!order) {
        return createErrorResponse(
          'Order not found',
          404,
          'Not Found'
        );
      }

      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        // Update order status
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.paymentAt = new Date();
        order.confirmedAt = new Date();
        await order.save();

        // Send order confirmation email
        try {
          console.log(`🚀 Starting email process for order ${order.orderNumber}`);
          
          // Get customer details
          const customer = await User.findById(order.userId).select('name email');
          console.log(`👤 Customer found:`, customer ? { name: customer.name, email: customer.email } : 'Not found');
          
          console.log(`📧 Email status check:`, {
            customerExists: !!customer,
            hasEmail: !!(customer && customer.email),
            alreadySent: !!order.confirmationEmailSent,
            willSendEmail: !!(customer && customer.email && !order.confirmationEmailSent)
          });
          
          if (customer && customer.email && !order.confirmationEmailSent) {
            console.log(`📬 Attempting to send confirmation email to ${customer.email}`);
            
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

            console.log(`📨 Email send result:`, emailSent);

            if (emailSent) {
              order.confirmationEmailSent = true;
              order.confirmationEmailSentAt = new Date();
              await order.save();
              console.log(`✅ Confirmation email sent successfully for order ${order.orderNumber}`);
            } else {
              console.error(`❌ Failed to send confirmation email for order ${order.orderNumber}`);
            }
          } else {
            if (!customer) {
              console.log(`⚠️  Customer not found for order ${order.orderNumber}`);
            } else if (!customer.email) {
              console.log(`⚠️  Customer has no email address for order ${order.orderNumber}`);
            } else if (order.confirmationEmailSent) {
              console.log(`⚠️  Email already sent for order ${order.orderNumber}`);
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending confirmation email:', emailError);
          console.error('Email error stack:', (emailError as any).stack);
          // Don't fail the payment verification if email fails
        }

        return createSuccessResponse({
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: 'completed',
          amount: paymentIntent.amount / 100, // Convert from paise
        }, 'Payment verified successfully');
      } else {
        return createSuccessResponse({
          success: false,
          status: paymentIntent.status,
          orderId: order.id,
          orderNumber: order.orderNumber,
        }, 'Payment not completed');
      }

    } catch (error) {
      return handleApiError(error, 'POST /api/payments/verify');
    }
  }, ['customer', 'admin'])(request);
}