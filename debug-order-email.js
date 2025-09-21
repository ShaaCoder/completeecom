/**
 * Debug Order Email Script
 * 
 * Direct test of the email service without API layers
 */

// Load environment variables
require('dotenv').config({ path: '.env' });

// Import the email service directly
const emailService = require('./lib/email-service.ts').default;

async function testOrderEmail() {
  console.log('🐛 Debug: Starting direct email service test...');

  // Mock order data
  const mockOrderData = {
    orderId: 'debug-test-order',
    orderNumber: 'ORD-DEBUG-' + Date.now(),
    orderDate: new Date().toISOString(),
    customerEmail: process.env.EMAIL_USER, // Send to yourself
    customerName: 'Test Customer',
    items: [
      {
        name: 'Debug Test Product',
        image: 'https://via.placeholder.com/150',
        price: 999,
        quantity: 1,
        variant: 'Test Variant',
      },
    ],
    subtotal: 999,
    shipping: 100,
    discount: 0,
    total: 1099,
    shippingAddress: {
      name: 'Test Customer',
      address: '123 Debug Street',
      city: 'Debug City',
      state: 'Debug State',
      pincode: '123456',
      phone: '9876543210',
    },
  };

  console.log('🐛 Debug: Mock order data:', mockOrderData);

  try {
    console.log('🐛 Debug: Calling emailService.sendOrderConfirmation...');
    const result = await emailService.sendOrderConfirmation(mockOrderData);
    console.log('🐛 Debug: Email service result:', result);

    if (result) {
      console.log('✅ SUCCESS: Email sent successfully!');
      console.log('📧 Check your Gmail inbox:', process.env.EMAIL_USER);
    } else {
      console.log('❌ FAILED: Email was not sent');
    }
  } catch (error) {
    console.error('🐛 Debug: Error occurred:', error);
    console.error('🐛 Debug: Error stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting debug email test...');
testOrderEmail().catch(console.error);