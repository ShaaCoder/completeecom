/**
 * Stripe Webhook Handler
 * 
 * POST /api/payments/webhook - Handle Stripe webhook events
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Email sending function (using the working approach)
async function sendOrderConfirmationEmail(order: any) {
  try {
    console.log('📧 Webhook: Sending order confirmation email for:', order.orderNumber);
    
    // Get customer details
    const customer = await User.findById(order.userId).select('name email');
    
    if (!customer || !customer.email) {
      console.log('⚠️  Webhook: No customer email found for order:', order.orderNumber);
      return false;
    }
    
    if (order.confirmationEmailSent) {
      console.log('⚠️  Webhook: Email already sent for order:', order.orderNumber);
      return false;
    }
    
    // Use the simplified email approach that we know works
    const nodemailer = require('nodemailer');
    const fs = require('fs');
    const path = require('path');
    
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
    
    // Load and process template
    const templatePath = path.join(process.cwd(), 'lib', 'email-templates', 'order-confirmation.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    
    // Simple template replacement
    htmlTemplate = htmlTemplate
      .replace(/{{orderNumber}}/g, order.orderNumber)
      .replace(/{{orderDate}}/g, new Date(order.createdAt).toLocaleDateString())
      .replace(/{{customerName}}/g, customer.name)
      .replace(/{{customerEmail}}/g, customer.email)
      .replace(/{{subtotal}}/g, order.subtotal.toFixed(2))
      .replace(/{{shipping}}/g, order.shipping.toFixed(2))
      .replace(/{{total}}/g, order.total.toFixed(2))
      .replace(/{{shippingAddress\.name}}/g, order.shippingAddress.name)
      .replace(/{{shippingAddress\.address}}/g, order.shippingAddress.address)
      .replace(/{{shippingAddress\.city}}/g, order.shippingAddress.city)
      .replace(/{{shippingAddress\.state}}/g, order.shippingAddress.state)
      .replace(/{{shippingAddress\.pincode}}/g, order.shippingAddress.pincode)
      .replace(/{{shippingAddress\.phone}}/g, order.shippingAddress.phone)
      .replace(/{{trackingUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order._id}`)
      .replace(/{{companyName}}/g, process.env.EMAIL_FROM_NAME || 'Your E-commerce Store')
      .replace(/{{companyAddress}}/g, 'Your Store Address')
      .replace(/{{supportUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support`)
      .replace(/{{returnUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/returns`)
      .replace(/{{unsubscribeUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe`);
    
    // Handle items
    const itemsHtml = order.items.map((item: any) => `
      <div class="order-item">
        <img src="${item.image}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          ${item.variant ? `<div class="item-variant">${item.variant}</div>` : ''}
          <div class="item-quantity">Quantity: ${item.quantity}</div>
        </div>
        <div class="item-price">₹${item.price.toFixed(2)}</div>
      </div>
    `).join('');
    
    htmlTemplate = htmlTemplate.replace(/{{#each items}}[\s\S]*?{{\/each}}/g, itemsHtml);
    htmlTemplate = htmlTemplate.replace(/{{#if discount}}[\s\S]*?{{\/if}}/g, order.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-₹${order.discount.toFixed(2)}</span></div>` : '');
    
    // Send email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: customer.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: htmlTemplate,
      text: `Your order ${order.orderNumber} has been confirmed. Total: ₹${order.total.toFixed(2)}`,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Update order to mark email as sent
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        confirmationEmailSent: true,
        confirmationEmailSentAt: new Date()
      }
    });
    
    console.log('✅ Webhook: Confirmation email sent successfully for order:', order.orderNumber);
    console.log('📨 Webhook: Message ID:', result.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Webhook: Failed to send confirmation email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return new Response('Webhook signature missing', { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        // Find and update order
        const order = await Order.findOne({ stripeSessionId: session.id });
        if (order) {
          order.paymentStatus = 'completed';
          order.status = 'confirmed';
          order.paymentIntentId = session.payment_intent as string;
          order.paymentAt = new Date();
          order.confirmedAt = new Date();
          await order.save();

          // Update product stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }
            );
          }

          console.log(`Order ${order.orderNumber} confirmed and stock updated`);
          
          // Send order confirmation email
          await sendOrderConfirmationEmail(order);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);

        // Find and update order
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order) {
          order.paymentStatus = 'completed';
          order.status = 'confirmed';
          order.paymentAt = new Date();
          order.confirmedAt = new Date();
          await order.save();

          // Update product stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }
            );
          }

          console.log(`Order ${order.orderNumber} confirmed via payment intent`);
          
          // Send order confirmation email
          await sendOrderConfirmationEmail(order);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment intent failed:', paymentIntent.id);

        // Find and update order
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order) {
          order.paymentStatus = 'failed';
          order.status = 'cancelled';
          await order.save();
          console.log(`Order ${order.orderNumber} payment failed`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}
