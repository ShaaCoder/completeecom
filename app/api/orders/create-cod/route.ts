/**
 * Create COD Order API
 * 
 * POST /api/orders/create-cod - Create a Cash on Delivery order
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import connectDB from '@/lib/mongodb';
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

// Email sending function for COD orders (similar to webhook but for COD)
async function sendCODOrderConfirmationEmail(order: any) {
  try {
    console.log('📧 COD: Sending order confirmation email for:', order.orderNumber);
    
    // Get customer details
    const customer = await User.findById(order.userId).select('name email');
    
    if (!customer || !customer.email) {
      console.log('⚠️  COD: No customer email found for order:', order.orderNumber);
      return false;
    }
    
    if (order.confirmationEmailSent) {
      console.log('⚠️  COD: Email already sent for order:', order.orderNumber);
      return false;
    }
    
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
    
    // Add COD-specific content
    htmlTemplate = htmlTemplate.replace(/Pay with Stripe/g, 'Cash on Delivery');
    htmlTemplate = htmlTemplate.replace(/payment.*processed/gi, 'payment will be collected on delivery');
    
    // Send email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: customer.email,
      subject: `Order Confirmation - ${order.orderNumber} (Cash on Delivery)`,
      html: htmlTemplate,
      text: `Your COD order ${order.orderNumber} has been confirmed. Total: ₹${order.total.toFixed(2)} (to be paid on delivery)`,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Update order to mark email as sent
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        confirmationEmailSent: true,
        confirmationEmailSentAt: new Date()
      }
    });
    
    console.log('✅ COD: Confirmation email sent successfully for order:', order.orderNumber);
    console.log('📨 COD: Message ID:', result.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ COD: Failed to send confirmation email:', error);
    return false;
  }
}

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
    const rateLimitResult = rateLimit(`cod_order_${clientIP}`, 5, 60000); // More restrictive for COD
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        'Too many requests',
        429,
        'Rate limit exceeded'
      );
    }

    const body = await request.json();
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
    const invalidProducts = [];
    const validItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.warn(`Product not found during COD checkout: ${item.productId}`);
        invalidProducts.push({
          productId: item.productId,
          name: item.name || 'Unknown Product',
          reason: 'Product no longer exists'
        });
        continue;
      }

      if (!product.isActive) {
        console.warn(`Inactive product in COD checkout: ${item.productId}`);
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
      subtotal += product.price * item.quantity;
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

    // Add shipping cost (COD might have additional charges)
    const shipping = subtotal > 999 ? 0 : 99;
    const codCharge = 49; // Additional COD handling charge
    const total = subtotal + shipping + codCharge;

    // Create order in database
    const order = new Order({
      userId: user._id,
      orderNumber: `COD${Date.now()}`,
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
      status: 'confirmed', // COD orders are confirmed immediately
      paymentStatus: 'pending', // Payment will be collected on delivery
      shippingAddress,
      paymentMethod: 'cod',
      couponCode,
      confirmedAt: new Date(),
    });

    await order.save();

    // Update product stock immediately for COD orders
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    console.log(`COD Order ${order.orderNumber} created and stock updated`);
    
    // Send order confirmation email
    await sendCODOrderConfirmationEmail(order);

    return createSuccessResponse({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: total,
      paymentMethod: 'cod',
      status: 'confirmed',
      message: 'Your Cash on Delivery order has been confirmed! Please have the exact amount ready for delivery.',
      codCharge,
      estimatedDelivery: '3-5 business days'
    }, 'COD order created successfully');

  } catch (error) {
    return handleApiError(error, 'POST /api/orders/create-cod');
  }
}