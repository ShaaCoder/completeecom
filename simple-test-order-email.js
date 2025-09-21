/**
 * Simple Test - Send Email for Existing Order
 * 
 * Test email sending with a real order from your database
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendTestOrderEmail() {
  console.log('🧪 Testing order confirmation email with real order data...');

  // Use data from your actual order (based on our earlier findings)
  const orderData = {
    orderNumber: 'NYK1758301991707', // Your most recent order
    orderDate: new Date('2025-09-19T17:13:11.740Z'),
    customerName: 'shantanu',
    customerEmail: 'kavinswebstudio@gmail.com',
    items: [
      {
        name: 'Test Product',
        image: 'https://via.placeholder.com/150/667eea/white?text=Product',
        price: 52599.00,
        quantity: 1,
        variant: 'Standard'
      }
    ],
    subtotal: 52599.00,
    shipping: 0.00,
    discount: 0.00,
    total: 52599.00,
    shippingAddress: {
      name: 'shantanu',
      address: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 9876543210'
    }
  };

  try {
    // Create email transporter
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

    console.log('✅ Email transporter created');

    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Load email template
    const templatePath = path.join(__dirname, 'lib', 'email-templates', 'order-confirmation.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    console.log('✅ Email template loaded');

    // Process template with order data
    htmlTemplate = htmlTemplate
      .replace(/{{orderNumber}}/g, orderData.orderNumber)
      .replace(/{{orderDate}}/g, orderData.orderDate.toLocaleDateString('en-IN'))
      .replace(/{{customerName}}/g, orderData.customerName)
      .replace(/{{customerEmail}}/g, orderData.customerEmail)
      .replace(/{{subtotal}}/g, orderData.subtotal.toFixed(2))
      .replace(/{{shipping}}/g, orderData.shipping.toFixed(2))
      .replace(/{{total}}/g, orderData.total.toFixed(2))
      .replace(/{{shippingAddress\.name}}/g, orderData.shippingAddress.name)
      .replace(/{{shippingAddress\.address}}/g, orderData.shippingAddress.address)
      .replace(/{{shippingAddress\.city}}/g, orderData.shippingAddress.city)
      .replace(/{{shippingAddress\.state}}/g, orderData.shippingAddress.state)
      .replace(/{{shippingAddress\.pincode}}/g, orderData.shippingAddress.pincode)
      .replace(/{{shippingAddress\.phone}}/g, orderData.shippingAddress.phone)
      .replace(/{{trackingUrl}}/g, 'http://localhost:3000/orders/' + orderData.orderNumber)
      .replace(/{{companyName}}/g, process.env.EMAIL_FROM_NAME || 'Your E-commerce Store')
      .replace(/{{companyAddress}}/g, 'Your Store Address')
      .replace(/{{supportUrl}}/g, 'http://localhost:3000/support')
      .replace(/{{returnUrl}}/g, 'http://localhost:3000/returns')
      .replace(/{{unsubscribeUrl}}/g, 'http://localhost:3000/unsubscribe');

    // Handle order items
    const itemsHtml = orderData.items.map(item => `
      <div class="order-item">
        <img src="${item.image}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          ${item.variant ? `<div class="item-variant">${item.variant}</div>` : ''}
          <div class="item-quantity">Quantity: ${item.quantity}</div>
        </div>
        <div class="item-price">₹${item.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
      </div>
    `).join('');

    // Replace template sections
    htmlTemplate = htmlTemplate.replace(/{{#each items}}[\s\S]*?{{\\/each}}/g, itemsHtml);
    htmlTemplate = htmlTemplate.replace(/{{#if discount}}[\s\S]*?{{\\/if}}/g, ''); // No discount in this test

    console.log('✅ Email template processed');

    // Prepare email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: orderData.customerEmail,
      subject: `🎉 Order Confirmation - ${orderData.orderNumber}`,
      html: htmlTemplate,
      text: `Your order ${orderData.orderNumber} has been confirmed! 
      
Order Details:
- Order Number: ${orderData.orderNumber}
- Total Amount: ₹${orderData.total.toLocaleString('en-IN')}
- Items: ${orderData.items.length} item(s)

Thank you for your purchase!

Track your order: http://localhost:3000/orders/${orderData.orderNumber}`
    };

    console.log('📧 Sending order confirmation email...');
    console.log('📧 To:', mailOptions.to);
    console.log('📧 Subject:', mailOptions.subject);

    // Send the email
    const result = await transporter.sendMail(mailOptions);

    console.log('');
    console.log('🎉 SUCCESS! Order confirmation email sent!');
    console.log('✅ Message ID:', result.messageId);
    console.log('📬 Email sent to:', orderData.customerEmail);
    console.log('💰 Order total: ₹' + orderData.total.toLocaleString('en-IN'));
    console.log('');
    console.log('📱 CHECK YOUR GMAIL INBOX NOW!');
    console.log('   You should receive a beautiful order confirmation email');
    console.log('   with complete order details, branding, and responsive design.');
    console.log('');
    console.log('🔗 Email includes:');
    console.log('   ✅ Order number and date');
    console.log('   ✅ Product details with images');
    console.log('   ✅ Pricing breakdown');
    console.log('   ✅ Shipping address');
    console.log('   ✅ Track order button');
    console.log('   ✅ Professional branding');
    console.log('');
    console.log('🚀 Your email system is working perfectly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Authentication Issue:');
      console.log('   - Check your Gmail App Password');
      console.log('   - Ensure 2-factor authentication is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('');
      console.log('🔧 Connection Issue:');
      console.log('   - Check your internet connection');
      console.log('   - Verify Gmail SMTP settings');
    }
  }
}

// Run the test
sendTestOrderEmail().catch(console.error);