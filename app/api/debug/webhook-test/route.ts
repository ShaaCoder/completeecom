/**
 * Debug Webhook Test
 * 
 * POST /api/debug/webhook-test - Test webhook processing manually
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🐛 Debug: Starting webhook test...');
    
    // Get the most recent pending order
    const pendingOrder = await Order.findOne({ 
      paymentStatus: 'pending',
      status: 'pending' 
    }).sort({ createdAt: -1 });
    
    if (!pendingOrder) {
      return createErrorResponse('No pending orders found', 404, 'No pending orders');
    }
    
    console.log('🐛 Debug: Found pending order:', pendingOrder.orderNumber);
    console.log('🐛 Debug: Order details:', {
      id: pendingOrder._id,
      orderNumber: pendingOrder.orderNumber,
      paymentStatus: pendingOrder.paymentStatus,
      status: pendingOrder.status,
      stripeSessionId: pendingOrder.stripeSessionId,
      paymentIntentId: pendingOrder.paymentIntentId,
      total: pendingOrder.total,
      userId: pendingOrder.userId
    });
    
    // Simulate webhook processing
    console.log('🐛 Debug: Simulating webhook processing...');
    
    // Update order status (simulate successful payment)
    pendingOrder.paymentStatus = 'completed';
    pendingOrder.status = 'confirmed';
    pendingOrder.paymentAt = new Date();
    pendingOrder.confirmedAt = new Date();
    
    if (!pendingOrder.paymentIntentId) {
      pendingOrder.paymentIntentId = 'pi_test_' + Date.now();
    }
    
    await pendingOrder.save();
    
    console.log('✅ Debug: Order status updated successfully');
    
    // Update product stock
    console.log('🐛 Debug: Updating product stock...');
    for (const item of pendingOrder.items) {
      try {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
        console.log(`📦 Debug: Stock updated for product ${item.productId}, quantity: -${item.quantity}`);
      } catch (stockError) {
        console.log(`⚠️  Debug: Could not update stock for ${item.productId}:`, (stockError as any).message);
      }
    }
    
    // Send confirmation email
    console.log('📧 Debug: Attempting to send confirmation email...');
    
    try {
      // Get customer details
      const customer = await User.findById(pendingOrder.userId).select('name email');
      
      if (!customer || !customer.email) {
        console.log('⚠️  Debug: No customer email found');
        return createSuccessResponse({
          orderUpdated: true,
          emailSent: false,
          reason: 'No customer email found',
          order: {
            id: (pendingOrder._id as any).toString(),
            orderNumber: pendingOrder.orderNumber,
            status: pendingOrder.status,
            paymentStatus: pendingOrder.paymentStatus
          }
        }, 'Order updated but no email sent - no customer email');
      }
      
      console.log('👤 Debug: Customer found:', { name: customer.name, email: customer.email });
      
      // Use the simple email approach that we know works
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      
      // Simple confirmation email
      const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0;">Thank you for your purchase</p>
        </div>
        
        <div style="padding: 20px;">
            <h2 style="color: #333;">Order Details</h2>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>Order Number:</strong> ${pendingOrder.orderNumber}<br>
                <strong>Total Amount:</strong> ₹${pendingOrder.total.toLocaleString('en-IN')}<br>
                <strong>Order Date:</strong> ${new Date(pendingOrder.createdAt).toLocaleDateString('en-IN')}<br>
                <strong>Items:</strong> ${pendingOrder.items.length} item(s)
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/orders/${pendingOrder._id}" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                   Track Your Order
                </a>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px;">
                <h3 style="color: #1976d2; margin-top: 0;">What's Next?</h3>
                <ul style="color: #555;">
                    <li>We'll process your order within 1-2 business days</li>
                    <li>You'll receive shipping confirmation with tracking details</li>
                    <li>Estimated delivery: 3-5 business days</li>
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            ${process.env.EMAIL_FROM_NAME || 'Your E-commerce Store'}<br>
            This email was sent to ${customer.email}
        </div>
    </div>
</body>
</html>`;
      
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
        },
        to: customer.email,
        subject: `Order Confirmed - ${pendingOrder.orderNumber}`,
        html: htmlEmail,
        text: `Order Confirmed!\n\nOrder: ${pendingOrder.orderNumber}\nTotal: ₹${pendingOrder.total.toLocaleString('en-IN')}\n\nTrack: http://localhost:3000/orders/${pendingOrder._id}`
      };
      
      const emailResult = await transporter.sendMail(mailOptions);
      
      // Update order to mark email as sent
      pendingOrder.confirmationEmailSent = true;
      pendingOrder.confirmationEmailSentAt = new Date();
      await pendingOrder.save();
      
      console.log('✅ Debug: Confirmation email sent successfully!');
      console.log('📨 Debug: Message ID:', emailResult.messageId);
      
      return createSuccessResponse({
        orderUpdated: true,
        emailSent: true,
        messageId: emailResult.messageId,
        order: {
          id: (pendingOrder._id as any).toString(),
          orderNumber: pendingOrder.orderNumber,
          status: pendingOrder.status,
          paymentStatus: pendingOrder.paymentStatus,
          confirmationEmailSent: true,
          confirmationEmailSentAt: pendingOrder.confirmationEmailSentAt
        },
        customer: {
          email: customer.email,
          name: customer.name
        }
      }, 'Webhook simulation successful - Order confirmed and email sent!');
      
    } catch (emailError) {
      console.error('❌ Debug: Email error:', emailError);
      
      return createSuccessResponse({
        orderUpdated: true,
        emailSent: false,
        emailError: (emailError as any).message,
        order: {
          id: (pendingOrder._id as any).toString(),
          orderNumber: pendingOrder.orderNumber,
          status: pendingOrder.status,
          paymentStatus: pendingOrder.paymentStatus
        }
      }, 'Order updated but email failed');
    }
    
  } catch (error) {
    console.error('❌ Debug: Webhook test error:', error);
    return handleApiError(error, 'POST /api/debug/webhook-test');
  }
}