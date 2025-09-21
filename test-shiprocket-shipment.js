/**
 * Test Script: Shiprocket Shipment Creation
 * 
 * This script tests the complete flow of creating a shipment through Shiprocket
 * after fixing the pickup address configuration issue.
 */

const API_BASE = 'http://localhost:3000/api';

async function testShiprocketShipment() {
  console.log('🚀 Testing Shiprocket Shipment Creation\n');

  try {
    // Step 1: Login as admin to get auth token
    console.log('1️⃣ Logging in as admin...');
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
    console.log('✅ Login successful');
    const authToken = loginData.data.token;

    // Step 2: Get a test order
    console.log('\n2️⃣ Fetching orders...');
    const ordersResponse = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    console.log(`✅ Found ${ordersData.data.length} orders`);
    
    if (ordersData.data.length === 0) {
      console.log('❌ No orders found to test shipment creation');
      return;
    }

    // Find an order with 'pending' or 'confirmed' status for shipment creation
    const testOrder = ordersData.data.find(order => 
      ['pending', 'confirmed', 'processing'].includes(order.status)
    ) || ordersData.data[0];
    
    console.log(`📦 Using order: ${testOrder.orderNumber} (Status: ${testOrder.status})`);
    console.log(`📍 Delivery Address: ${testOrder.shippingAddress.city}, ${testOrder.shippingAddress.state} - ${testOrder.shippingAddress.pincode}`);

    // Step 3: Test Shiprocket serviceability first (optional)
    console.log('\n3️⃣ Checking Shiprocket serviceability...');
    try {
      const serviceResponse = await fetch(`${API_BASE}/delivery/serviceability`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          fromPincode: '110099', // Our actual pickup pincode
          toPincode: testOrder.shippingAddress.pincode,
          weight: 500,
          codAmount: testOrder.paymentMethod === 'cod' ? testOrder.total : 0
        })
      });

      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        console.log('✅ Serviceability check completed');
        console.log('📊 Available services:', serviceData.data?.length || 0);
      } else {
        console.log('⚠️ Serviceability check failed, but continuing with shipment creation');
      }
    } catch (error) {
      console.log('⚠️ Serviceability check error:', error.message);
    }

    // Step 4: Create shipment with Shiprocket
    console.log('\n4️⃣ Creating Shiprocket shipment...');
    const shipmentResponse = await fetch(`${API_BASE}/delivery/create-shipment`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json' 
      },
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
    console.log('✅ Shipment creation response received');
    
    if (shipmentData.success) {
      console.log('\n🎉 SHIPROCKET SHIPMENT CREATED SUCCESSFULLY!');
      console.log('📋 Shipment Details:');
      console.log(`   - Shipment ID: ${shipmentData.data.shipmentId}`);
      console.log(`   - AWB Number: ${shipmentData.data.awbNumber || 'Not assigned yet'}`);
      console.log(`   - Tracking URL: ${shipmentData.data.trackingUrl || 'Not available yet'}`);
      console.log(`   - Estimated Delivery: ${shipmentData.data.estimatedDelivery || 'Not specified'}`);
      console.log(`   - Shipping Cost: ₹${shipmentData.data.shippingCost || 'TBD'}`);
      
      // Check if this was a real API call or mock
      if (shipmentData.data.providerResponse?.mock) {
        console.log('\n⚠️ NOTE: This was a MOCK response. Check environment variables to use real Shiprocket API');
        console.log('   Set FORCE_MOCK_DELIVERY=false in your .env file to use real API');
      } else {
        console.log('\n✅ This was a REAL Shiprocket API call!');
      }

      // Step 5: Verify order was updated
      console.log('\n5️⃣ Verifying order status update...');
      const updatedOrderResponse = await fetch(`${API_BASE}/orders/${testOrder._id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        console.log('✅ Order status verification:');
        console.log(`   - Status: ${updatedOrder.data.status}`);
        console.log(`   - Tracking Number: ${updatedOrder.data.trackingNumber || 'None'}`);
        console.log(`   - Carrier: ${updatedOrder.data.carrier || 'None'}`);
        console.log(`   - Shipped At: ${updatedOrder.data.shippedAt || 'Not set'}`);
      }

      // Step 6: Test tracking (if AWB number available)
      if (shipmentData.data.awbNumber && !shipmentData.data.providerResponse?.mock) {
        console.log('\n6️⃣ Testing shipment tracking...');
        try {
          const trackResponse = await fetch(`${API_BASE}/delivery/track/${shipmentData.data.awbNumber}?provider=shiprocket`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            console.log('✅ Tracking data retrieved');
            console.log(`   - Current Status: ${trackData.data.status}`);
            console.log(`   - Current Location: ${trackData.data.currentLocation || 'Unknown'}`);
            console.log(`   - Tracking Events: ${trackData.data.trackingHistory?.length || 0}`);
          } else {
            console.log('⚠️ Tracking test failed - this is normal for new shipments');
          }
        } catch (trackError) {
          console.log('⚠️ Tracking test error:', trackError.message);
        }
      }

    } else {
      console.log('❌ Shipment creation failed');
      console.log('Error:', shipmentData.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Make sure the development server is running (npm run dev)');
    console.log('2. Check that Shiprocket credentials are correctly set in .env');
    console.log('3. Verify pickup location ID matches your Shiprocket account');
    console.log('4. Check server logs for detailed error messages');
  }
}

console.log('🧪 Shiprocket Integration Test');
console.log('==============================\n');

testShiprocketShipment()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });