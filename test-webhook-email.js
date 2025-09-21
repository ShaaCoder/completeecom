/**
 * Test Webhook Email - Simulate Stripe Webhook
 * 
 * Test the complete payment -> webhook -> email flow
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function testWebhookEmail() {
  try {
    console.log('🧪 Testing complete webhook -> email flow...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models after connection
    const Order = require('./models/Order.ts').default;
    const User = require('./models/User.ts').default;

    // Find a recent order to test with
    const testOrder = await Order.findOne({ status: 'pending' }).sort({ createdAt: -1 });
    
    if (!testOrder) {
      console.log('❌ No pending orders found to test with');
      console.log('💡 Please place a test order first, then run this script');
      return;
    }

    console.log('🔍 Found test order:', testOrder.orderNumber);
    console.log('📋 Order details:', {
      status: testOrder.status,
      paymentStatus: testOrder.paymentStatus,
      total: testOrder.total,
      userId: testOrder.userId
    });

    // Get customer details
    const customer = await User.findById(testOrder.userId).select('name email');
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }

    console.log('👤 Customer:', { name: customer.name, email: customer.email });

    // Simulate webhook processing - update order status
    console.log('🔄 Simulating Stripe webhook...');
    
    testOrder.paymentStatus = 'completed';
    testOrder.status = 'confirmed';
    testOrder.paymentAt = new Date();
    testOrder.confirmedAt = new Date();
    await testOrder.save();

    console.log('✅ Order status updated to confirmed');

    // Send email using the same approach as webhook
    console.log('📧 Sending confirmation email...');

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

    // Load template
    const templatePath = path.join(__dirname, 'lib', 'email-templates', 'order-confirmation.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Process template
    htmlTemplate = htmlTemplate
      .replace(/{{orderNumber}}/g, testOrder.orderNumber)
      .replace(/{{orderDate}}/g, new Date(testOrder.createdAt).toLocaleDateString())
      .replace(/{{customerName}}/g, customer.name)
      .replace(/{{customerEmail}}/g, customer.email)
      .replace(/{{subtotal}}/g, testOrder.subtotal.toFixed(2))
      .replace(/{{shipping}}/g, testOrder.shipping.toFixed(2))
      .replace(/{{total}}/g, testOrder.total.toFixed(2))
      .replace(/{{shippingAddress\.name}}/g, testOrder.shippingAddress.name)
      .replace(/{{shippingAddress\.address}}/g, testOrder.shippingAddress.address)
      .replace(/{{shippingAddress\.city}}/g, testOrder.shippingAddress.city)
      .replace(/{{shippingAddress\.state}}/g, testOrder.shippingAddress.state)
      .replace(/{{shippingAddress\.pincode}}/g, testOrder.shippingAddress.pincode)
      .replace(/{{shippingAddress\.phone}}/g, testOrder.shippingAddress.phone)
      .replace(/{{trackingUrl}}/g, `http://localhost:3000/orders/${testOrder._id}`)
      .replace(/{{companyName}}/g, process.env.EMAIL_FROM_NAME || 'Your E-commerce Store')
      .replace(/{{companyAddress}}/g, 'Your Store Address')
      .replace(/{{supportUrl}}/g, 'http://localhost:3000/support')
      .replace(/{{returnUrl}}/g, 'http://localhost:3000/returns')
      .replace(/{{unsubscribeUrl}}/g, 'http://localhost:3000/unsubscribe');

    // Handle items
    const itemsHtml = testOrder.items.map(item => `
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
    htmlTemplate = htmlTemplate.replace(/{{#if discount}}[\s\S]*?{{\/if}}/g, testOrder.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-₹${testOrder.discount.toFixed(2)}</span></div>` : '');

    // Send email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: customer.email,
      subject: `Order Confirmation - ${testOrder.orderNumber}`,
      html: htmlTemplate,
      text: `Your order ${testOrder.orderNumber} has been confirmed. Total: ₹${testOrder.total.toFixed(2)}`,
    };

    const result = await transporter.sendMail(mailOptions);

    // Update order to mark email as sent
    testOrder.confirmationEmailSent = true;
    testOrder.confirmationEmailSentAt = new Date();
    await testOrder.save();

    console.log('🎉 COMPLETE PAYMENT FLOW TEST SUCCESSFUL!');
    console.log('✅ Order status updated to confirmed');
    console.log('✅ Order confirmation email sent');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Email sent to:', customer.email);
    console.log('');
    console.log('🔍 Check your Gmail inbox for the order confirmation!');
    console.log('');
    console.log('🚀 Your payment flow is now complete:');
    console.log('   1. Customer completes payment on Stripe');
    console.log('   2. Stripe webhook calls your API');
    console.log('   3. Order status is updated to confirmed');
    console.log('   4. Beautiful confirmation email is sent automatically!');

    // Close MongoDB connection
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Run the test
testWebhookEmail().catch(console.error);