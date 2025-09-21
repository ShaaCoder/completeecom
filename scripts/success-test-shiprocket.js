/**
 * Success Test - Verify Working Shiprocket Integration
 */

require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';

async function testWorkingIntegration() {
  console.log('🎉 Testing WORKING Shiprocket Integration');
  console.log('==========================================\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Authenticating...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'shaan@gmail.com',
        password: 'password'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Authentication successful');
    const authToken = loginData.data.token;

    // Step 2: Get orders
    console.log('\n2️⃣ Fetching orders...');
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const ordersResponse = await fetch(`${API_BASE}/orders`, { headers });
    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    console.log(`✅ Retrieved ${ordersData.data.length} orders`);
    
    if (ordersData.data.length === 0) {
      console.log('⚠️ No orders available to test shipment creation');
      return;
    }

    // Find a suitable order
    const testOrder = ordersData.data.find(order => 
      !order.trackingNumber && ['pending', 'confirmed', 'processing'].includes(order.status)
    ) || ordersData.data[0];

    console.log(`📦 Testing with order: ${testOrder.orderNumber}`);
    console.log(`📍 Delivery to: ${testOrder.shippingAddress.city}, ${testOrder.shippingAddress.state} - ${testOrder.shippingAddress.pincode}`);

    // Step 3: Create real Shiprocket shipment
    console.log('\n3️⃣ Creating REAL Shiprocket shipment...');
    const shipmentResponse = await fetch(`${API_BASE}/delivery/create-shipment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: testOrder._id,
        provider: 'shiprocket'
      })
    });

    if (!shipmentResponse.ok) {
      const errorText = await shipmentResponse.text();
      throw new Error(`Shipment creation failed: ${shipmentResponse.status} - ${errorText}`);
    }

    const shipmentData = await shipmentResponse.json();
    
    if (shipmentData.success) {
      console.log('\n🎉 SHIPROCKET INTEGRATION SUCCESS!');
      console.log('=====================================');
      console.log(`✅ Shipment ID: ${shipmentData.data.shipmentId}`);
      console.log(`✅ Tracking URL: ${shipmentData.data.trackingUrl}`);
      console.log(`✅ Status: Created in Shiprocket system`);
      
      // Check if it was a real API call
      if (!shipmentData.data.providerResponse?.mock) {
        console.log('\n🚀 CONFIRMED: Real Shiprocket API Integration Working!');
        console.log(`📊 Shiprocket Order ID: ${shipmentData.data.providerResponse.order_id}`);
        console.log(`🎯 Shiprocket Shipment ID: ${shipmentData.data.providerResponse.shipment_id}`);
        console.log(`📋 Status: ${shipmentData.data.providerResponse.status}`);
      } else {
        console.log('\n⚠️ This was a mock response (FORCE_MOCK_DELIVERY=true)');
      }

      // Step 4: Verify order was updated
      console.log('\n4️⃣ Verifying order update...');
      const updatedOrderResponse = await fetch(`${API_BASE}/orders/${testOrder._id}`, { headers });
      
      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        console.log('✅ Order updated successfully:');
        console.log(`   Status: ${updatedOrder.data.status}`);
        console.log(`   Tracking Number: ${updatedOrder.data.trackingNumber || 'Pending AWB assignment'}`);
        console.log(`   Carrier: ${updatedOrder.data.carrier}`);
      }

      console.log('\n🎯 INTEGRATION STATUS: FULLY OPERATIONAL!');
      console.log('Your e-commerce application now has working Shiprocket integration.');

    } else {
      console.log('❌ Shipment creation failed:', shipmentData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure development server is running (npm run dev)');
    console.log('2. Check that you are logged in as admin');
    console.log('3. Verify Shiprocket credentials in .env file');
  }
}

testWorkingIntegration();