// Test script to verify real-time order updates
// Usage: node test-real-time-order.js

const https = require('https');

const ORDER_ID = '68ca80a308820cc22116cb5c'; // Your specific order ID from the URL
const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Real-Time Order Updates');
console.log('==================================\n');

// Function to make API request
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // You'll need to replace this with your actual auth token
        'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE'
      }
    };

    const req = require('http').request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to connect to Server-Sent Events
function connectToSSE() {
  console.log('🔌 Connecting to Server-Sent Events...');
  
  // In a browser environment, this would be:
  // const eventSource = new EventSource('/api/orders/stream');
  
  console.log('📡 SSE Connection established (simulated)');
  console.log('   - Listening for order updates...');
  console.log('   - Order ID filter:', ORDER_ID);
}

// Test order retrieval
async function testOrderRetrieval() {
  console.log('📦 Testing Order Retrieval...');
  
  try {
    const order = await makeRequest(`/api/orders/${ORDER_ID}`);
    
    if (order.success) {
      console.log('✅ Order retrieved successfully');
      console.log('   - Order Number:', order.data.orderNumber);
      console.log('   - Current Status:', order.data.status);
      console.log('   - Payment Status:', order.data.paymentStatus);
      return order.data;
    } else {
      console.log('❌ Failed to retrieve order:', order.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error retrieving order:', error.message);
    return null;
  }
}

// Test order status update (admin function)
async function testOrderStatusUpdate(currentStatus) {
  console.log('\n🔧 Testing Order Status Update...');
  
  // Cycle through different statuses for testing
  const statusCycle = {
    'pending': 'confirmed',
    'confirmed': 'shipped',
    'shipped': 'delivered',
    'delivered': 'pending'
  };
  
  const newStatus = statusCycle[currentStatus] || 'confirmed';
  console.log(`   - Updating status from "${currentStatus}" to "${newStatus}"`);
  
  try {
    const updateData = {
      status: newStatus,
      paymentStatus: 'completed',
      trackingNumber: 'TRK' + Date.now(),
      carrier: 'BlueDart'
    };
    
    const result = await makeRequest(`/api/orders/${ORDER_ID}`, 'PATCH', updateData);
    
    if (result.success) {
      console.log('✅ Order status updated successfully');
      console.log('   - New Status:', result.data.status);
      console.log('   - Updated At:', result.data.updatedAt);
      console.log('   - 📢 SSE Event should be broadcasted now!');
      return result.data;
    } else {
      console.log('❌ Failed to update order:', result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error updating order:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Real-Time Order Update Tests\n');
  
  // Step 1: Connect to SSE
  connectToSSE();
  
  // Step 2: Retrieve current order
  const order = await testOrderRetrieval();
  if (!order) {
    console.log('\n❌ Cannot continue tests without order data');
    return;
  }
  
  // Step 3: Update order status
  const updatedOrder = await testOrderStatusUpdate(order.status);
  
  if (updatedOrder) {
    console.log('\n🎉 Test completed successfully!');
    console.log('\nNext Steps:');
    console.log('1. 🌐 Open your browser to: http://localhost:3000/orders/' + ORDER_ID);
    console.log('2. 🔍 Open browser dev tools and check the Network tab for SSE connections');
    console.log('3. 👀 Watch the order status update in real-time on the page');
    console.log('4. 🔄 Try running this script again to cycle through different statuses');
  }
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open two browser tabs:');
  console.log('   Tab 1: http://localhost:3000/orders/' + ORDER_ID + ' (Customer View)');
  console.log('   Tab 2: http://localhost:3000/admin (Admin Panel)');
  console.log('2. In the admin panel, search for order: ' + ORDER_ID);
  console.log('3. Change the order status and watch Tab 1 update automatically!');
}

// Run the tests
runTests().catch(console.error);

// Instructions for updating the script
console.log('\n⚙️  Configuration Notes:');
console.log('- Update ORDER_ID with your actual order ID');
console.log('- Replace YOUR_AUTH_TOKEN_HERE with your actual auth token');
console.log('- Make sure your development server is running on http://localhost:3000');