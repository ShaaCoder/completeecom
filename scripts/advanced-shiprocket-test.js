/**
 * Advanced Shiprocket Test - Try Different Approaches
 */

require('dotenv').config();

const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
  baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external'
};

async function getShiprocketToken() {
  const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: SHIPROCKET_CONFIG.email,
      password: SHIPROCKET_CONFIG.password,
    }),
  });
  const data = await response.json();
  return data.token;
}

async function testDifferentApproaches(token) {
  console.log('\n🧪 Testing Different Shiprocket API Approaches\n');

  const baseOrderData = {
    order_id: `ADV_TEST_${Date.now()}`,
    order_date: new Date().toISOString().split('T')[0],
    billing_customer_name: 'Test Customer',
    billing_last_name: '',
    billing_address: 'Test Address Delhi',
    billing_city: 'Delhi',
    billing_pincode: '110001',
    billing_state: 'Delhi',
    billing_country: 'India',
    billing_email: 'test@example.com',
    billing_phone: '7835996416',
    shipping_is_billing: true,
    order_items: [{
      name: 'Test Item',
      sku: 'TEST123',
      units: 1,
      selling_price: 100
    }],
    payment_method: 'COD',
    sub_total: 100,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5
  };

  // Approach 1: Without pickup_location (let Shiprocket auto-select)
  console.log('1️⃣ Testing without pickup_location (auto-select)');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_AUTO`}, 'Auto-select pickup');

  // Approach 2: With pickup_location as numeric ID
  console.log('\n2️⃣ Testing with pickup_location as number');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_NUM`, pickup_location: 10304720}, 'Numeric pickup ID');

  // Approach 3: With pickup_location as string ID
  console.log('\n3️⃣ Testing with pickup_location as string');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_STR`, pickup_location: "10304720"}, 'String pickup ID');

  // Approach 4: Try the inactive location
  console.log('\n4️⃣ Testing with inactive pickup location');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_INACTIVE`, pickup_location: "9924650"}, 'Inactive location');

  // Approach 5: Try different API endpoint
  console.log('\n5️⃣ Testing with /orders/create endpoint');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_CREATE`, pickup_location: "10304720"}, 'Create endpoint', '/orders/create');

  // Approach 6: Try forward endpoint
  console.log('\n6️⃣ Testing with /orders/create/forward endpoint');
  await testOrderCreation(token, {...baseOrderData, order_id: `${baseOrderData.order_id}_FORWARD`, pickup_location: "10304720"}, 'Forward endpoint', '/orders/create/forward');

  // Approach 7: Try with channel_id
  console.log('\n7️⃣ Testing with channel_id');
  await testOrderCreation(token, {
    ...baseOrderData, 
    order_id: `${baseOrderData.order_id}_CHANNEL`,
    pickup_location: "10304720",
    channel_id: "custom"
  }, 'With channel_id');

  // Approach 8: Try minimal required fields only
  console.log('\n8️⃣ Testing with minimal fields');
  const minimalData = {
    order_id: `${baseOrderData.order_id}_MINIMAL`,
    order_date: baseOrderData.order_date,
    pickup_location: "10304720",
    billing_customer_name: baseOrderData.billing_customer_name,
    billing_address: baseOrderData.billing_address,
    billing_city: baseOrderData.billing_city,
    billing_pincode: baseOrderData.billing_pincode,
    billing_state: baseOrderData.billing_state,
    billing_country: baseOrderData.billing_country,
    billing_phone: baseOrderData.billing_phone,
    shipping_is_billing: true,
    order_items: baseOrderData.order_items,
    payment_method: baseOrderData.payment_method,
    sub_total: baseOrderData.sub_total
  };
  await testOrderCreation(token, minimalData, 'Minimal fields');
}

async function testOrderCreation(token, orderData, testName, endpoint = '/orders/create/adhoc') {
  try {
    console.log(`🧪 ${testName}`);
    
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok && (responseData.status === 1 || responseData.order_id || responseData.shipment_id)) {
      console.log(`🎉 SUCCESS! ${testName} worked!`);
      console.log(`📋 Response:`, JSON.stringify(responseData, null, 2));
      return true;
    } else {
      console.log(`❌ Failed: ${responseData.message || 'Unknown error'}`);
      if (responseData.errors) {
        console.log(`🔍 Errors:`, JSON.stringify(responseData.errors, null, 2));
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Advanced Shiprocket API Testing');
  console.log('===================================');

  try {
    const token = await getShiprocketToken();
    console.log('✅ Authentication successful\n');
    
    await testDifferentApproaches(token);
    
    console.log('\n📊 Test Complete!');
    console.log('If any approach succeeded, we\'ll use that format in your code.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);