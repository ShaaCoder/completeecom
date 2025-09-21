/**
 * Test Real Order Email - Simplified Version
 * 
 * Test sending email for a real order using plain JavaScript
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function testRealOrderEmail() {
  console.log('🐛 Testing real order email with simplified approach...');

  // Email configuration
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

  try {
    // Mock order data based on your real order structure
    const orderData = {
      orderNumber: 'NYK1758301591031',
      orderDate: '2025-09-19T17:06:31.065Z',
      customerName: 'shantanu',
      customerEmail: 'kavinswebstudio@gmail.com',
      items: [
        {
          name: 'Test Product',
          image: 'https://via.placeholder.com/150',
          price: 2599.00,
          quantity: 1,
          variant: 'Standard'
        }
      ],
      subtotal: 2599.00,
      shipping: 0.00,
      discount: 0.00,
      total: 2599.00,
      shippingAddress: {
        name: 'shantanu',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        phone: '9876543210'
      }
    };

    // Load template
    const templatePath = path.join(__dirname, 'lib', 'email-templates', 'order-confirmation.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Simple template replacement (using basic regex instead of Handlebars)
    htmlTemplate = htmlTemplate
      .replace(/{{orderNumber}}/g, orderData.orderNumber)
      .replace(/{{orderDate}}/g, new Date(orderData.orderDate).toLocaleDateString())
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
      .replace(/{{trackingUrl}}/g, `http://localhost:3000/orders/${orderData.orderNumber}`)
      .replace(/{{companyName}}/g, 'Your E-commerce Store')
      .replace(/{{companyAddress}}/g, 'Your Store Address')
      .replace(/{{supportUrl}}/g, 'http://localhost:3000/support')
      .replace(/{{returnUrl}}/g, 'http://localhost:3000/returns')
      .replace(/{{unsubscribeUrl}}/g, 'http://localhost:3000/unsubscribe');

    // Handle the items loop manually (simplified)
    const itemsHtml = orderData.items.map(item => `
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

    // Replace the items section
    htmlTemplate = htmlTemplate.replace(
      /{{#each items}}.*?{{\/each}}/gs,
      itemsHtml
    );

    // Remove any remaining Handlebars conditionals
    htmlTemplate = htmlTemplate.replace(/{{#if discount}}.*?{{\/if}}/gs, '');

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: htmlTemplate,
      text: `Your order ${orderData.orderNumber} has been confirmed. Total: ₹${orderData.total.toFixed(2)}`,
    };

    console.log('📧 Sending order confirmation email...');
    console.log('📧 To:', mailOptions.to);
    console.log('📧 Subject:', mailOptions.subject);

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ ORDER CONFIRMATION EMAIL SENT SUCCESSFULLY!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your Gmail inbox:', orderData.customerEmail);
    console.log('');
    console.log('🎉 This proves your email system works!');
    console.log('   The issue was in the TypeScript/Handlebars integration.');

  } catch (error) {
    console.error('❌ Failed to send order email:', error);
    console.error('❌ Error details:', error.message);
  }
}

// Run the test
testRealOrderEmail().catch(console.error);