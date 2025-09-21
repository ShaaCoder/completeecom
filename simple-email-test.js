/**
 * Simple Email Test - Direct Nodemailer
 * 
 * Test if nodemailer can send emails with our configuration
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function testDirectEmail() {
  console.log('🐛 Testing direct nodemailer with order confirmation template...');

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

  console.log('✅ Transporter created');

  try {
    // Test connection first
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Load the HTML template
    const templatePath = path.join(__dirname, 'lib', 'email-templates', 'order-confirmation.html');
    console.log('📧 Loading template from:', templatePath);
    
    let htmlTemplate;
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      console.log('✅ Template loaded, length:', htmlTemplate.length);
    } catch (templateError) {
      console.error('❌ Failed to load template:', templateError.message);
      console.log('🔄 Using simple HTML instead...');
      htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4caf50;">🎉 Order Confirmation Test!</h1>
          <p>This is a test order confirmation email.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order Number:</strong> ORD-TEST-${Date.now()}</p>
            <p><strong>Customer:</strong> Test Customer</p>
            <p><strong>Total:</strong> ₹1,099</p>
          </div>
          <p>If you can see this email, the order confirmation system is working!</p>
        </div>
      `;
    }

    // Replace template variables with test data (simple replacement)
    const emailHtml = htmlTemplate
      .replace(/{{orderNumber}}/g, 'ORD-TEST-' + Date.now())
      .replace(/{{orderDate}}/g, new Date().toLocaleDateString())
      .replace(/{{customerName}}/g, 'Test Customer')
      .replace(/{{customerEmail}}/g, process.env.EMAIL_USER)
      .replace(/{{subtotal}}/g, '999.00')
      .replace(/{{shipping}}/g, '100.00')
      .replace(/{{total}}/g, '1099.00')
      .replace(/{{shippingAddress\.name}}/g, 'Test Customer')
      .replace(/{{shippingAddress\.address}}/g, '123 Test Street')
      .replace(/{{shippingAddress\.city}}/g, 'Test City')
      .replace(/{{shippingAddress\.state}}/g, 'Test State')
      .replace(/{{shippingAddress\.pincode}}/g, '123456')
      .replace(/{{shippingAddress\.phone}}/g, '9876543210');

    // Send the email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'E-commerce Store',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      },
      to: process.env.EMAIL_USER,
      subject: 'Order Confirmation - TEST-' + Date.now(),
      html: emailHtml,
      text: 'This is a test order confirmation email. Order number: ORD-TEST-' + Date.now(),
    };

    console.log('📧 Sending email to:', mailOptions.to);
    console.log('📧 From:', mailOptions.from);
    console.log('📧 Subject:', mailOptions.subject);

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your Gmail inbox:', process.env.EMAIL_USER);
    console.log('');
    console.log('🎉 If you received this email, the order confirmation system is working!');
    console.log('   The issue might be in the payment verification flow or API integration.');

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Authentication Error Solutions:');
      console.log('   1. Make sure you\'re using Gmail App Password, not regular password');
      console.log('   2. Check if 2-factor authentication is enabled');
      console.log('   3. Verify EMAIL_USER and EMAIL_PASSWORD in .env file');
    }
  }
}

// Run the test
testDirectEmail().catch(console.error);