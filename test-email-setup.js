/**
 * Email Setup Test Script
 * 
 * This script tests the email configuration without needing the full Next.js app
 * Run with: node test-email-setup.js
 */

// Load environment variables
require('dotenv').config({ path: '.env' });

const nodemailer = require('nodemailer');

// Email configuration (same as in lib/email-config.ts)
const emailConfig = {
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  defaults: {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Your Store Name',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
    },
  },
};

async function testEmailSetup() {
  console.log('🚀 Testing Email Configuration...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  let missingVars = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${varName === 'EMAIL_PASSWORD' ? '***hidden***' : process.env[varName]}`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('\nPlease set up your .env file with the required email configuration.');
    console.log('See EMAIL_SETUP_GUIDE.md for detailed instructions.');
    return;
  }

  console.log('\n2️⃣ Testing SMTP Connection:');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Test connection
    await transporter.verify();
    console.log('   ✅ SMTP Connection Successful!');

    // 3. Send test email
    console.log('\n3️⃣ Sending Test Email:');
    
    const testEmail = process.env.EMAIL_USER; // Send test email to yourself
    
    const testEmailResult = await transporter.sendMail({
      from: {
        name: emailConfig.defaults.from.name,
        address: emailConfig.defaults.from.address,
      },
      to: testEmail,
      subject: '✅ Email Configuration Test - Success!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4caf50; text-align: center;">🎉 Email Test Successful!</h1>
          
          <div style="background-color: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Your email configuration is working perfectly!</h3>
            <p style="color: #555;">
              Your e-commerce store is now ready to send beautiful order confirmation emails 
              to customers when they complete their purchases.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #333; margin-top: 0;">Configuration Details:</h4>
            <ul style="color: #666;">
              <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
              <li><strong>From:</strong> ${emailConfig.defaults.from.name} (${emailConfig.defaults.from.address})</li>
              <li><strong>Test sent at:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #e3f2fd; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">🚀 Next Steps:</h4>
            <ol style="color: #555;">
              <li>Start your Next.js development server: <code>npm run dev</code></li>
              <li>Place a test order to see automatic email sending in action</li>
              <li>Check your admin panel for email management features</li>
            </ol>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            This test email confirms your e-commerce store's email system is ready! 📧
          </p>
        </div>
      `,
      text: `
Email Configuration Test - SUCCESS!

Your email configuration is working perfectly! Your e-commerce store is now ready to send order confirmation emails.

Configuration Details:
- SMTP Host: smtp.gmail.com
- From: ${emailConfig.defaults.from.name} (${emailConfig.defaults.from.address})
- Test sent at: ${new Date().toISOString()}

Next Steps:
1. Start your Next.js development server: npm run dev
2. Place a test order to see automatic email sending in action
3. Check your admin panel for email management features

This test email confirms your e-commerce store's email system is ready!
      `
    });

    console.log(`   ✅ Test Email Sent Successfully!`);
    console.log(`   📧 Message ID: ${testEmailResult.messageId}`);
    console.log(`   📬 Sent to: ${testEmail}`);

    console.log('\n🎉 Email Setup Complete! Your e-commerce store is ready to send order confirmation emails.');
    console.log('\n📖 Next Steps:');
    console.log('   1. Start your Next.js app: npm run dev');
    console.log('   2. Place a test order to see automatic emails');
    console.log('   3. Check EMAIL_SETUP_GUIDE.md for advanced features');

  } catch (error) {
    console.log('\n❌ Email Setup Failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error - Common Solutions:');
      console.log('   1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('   2. Verify 2-factor authentication is enabled on your Gmail account');
      console.log('   3. Double-check your EMAIL_USER and EMAIL_PASSWORD in .env');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error - Check:');
      console.log('   1. Your internet connection');
      console.log('   2. Firewall settings (port 587 should be open)');
      console.log('   3. Gmail SMTP settings are correct');
    }
    
    console.log('\n📖 For detailed troubleshooting, see EMAIL_SETUP_GUIDE.md');
  }
}

// Run the test
testEmailSetup().catch(console.error);