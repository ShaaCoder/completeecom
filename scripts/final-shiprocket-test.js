/**
 * Final Shiprocket Test - Try Both Pickup Locations
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

async function testWithPickupLocation(token, pickupLocationId, locationName) {
  console.log(`\n🧪 Testing with pickup location: ${locationName} (ID: ${pickupLocationId})`);
  
  const orderData = {
    order_id: `TEST_FINAL_${Date.now()}_${pickupLocationId}`,
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: pickupLocationId,
    billing_customer_name: 'Test Customer',
    billing_last_name: '',
    billing_address: 'Test Address',
    billing_city: 'Delhi',
    billing_pincode: '110001',
    billing_state: 'Delhi',
    billing_country: 'India',
    billing_email: 'test@example.com',
    billing_phone: '7835996416', // Using the phone from your pickup location
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

  try {
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(responseData, null, 2));

    if (response.ok && (responseData.status === 1 || responseData.order_id || responseData.shipment_id)) {
      console.log(`🎉 SUCCESS! Pickup location ${locationName} (${pickupLocationId}) works!`);
      return { success: true, pickupLocationId, locationName, response: responseData };
    } else {
      console.log(`❌ Failed with pickup location ${locationName} (${pickupLocationId})`);
      return { success: false, pickupLocationId, locationName, error: responseData };
    }
  } catch (error) {
    console.log(`❌ Error with pickup location ${locationName}:`, error.message);
    return { success: false, pickupLocationId, locationName, error: error.message };
  }
}

async function main() {
  console.log('🎯 Final Shiprocket Pickup Location Test');
  console.log('=======================================\n');

  try {
    const token = await getShiprocketToken();
    console.log('✅ Authentication successful');

    // Test both pickup locations
    const locations = [
      { id: '10304720', name: 'Home-1 (Active)' },
      { id: '9924650', name: 'Home (Inactive)' }
    ];

    const results = [];
    
    for (const location of locations) {
      const result = await testWithPickupLocation(token, location.id, location.name);
      results.push(result);
      
      if (result.success) {
        console.log('\n✅ WORKING CONFIGURATION FOUND!');
        console.log(`🎯 Use pickup location ID: "${result.pickupLocationId}"`);
        console.log(`📛 Location name: ${result.locationName}`);
        break;
      }
    }

    // Summary
    console.log('\n📈 Test Summary:');
    results.forEach(result => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`   ${status}: ${result.locationName} (ID: ${result.pickupLocationId})`);
    });

    const successfulResult = results.find(r => r.success);
    if (successfulResult) {
      console.log('\n🔧 Update your code with:');
      console.log(`   SHIPROCKET_PICKUP_LOCATION_ID="${successfulResult.pickupLocationId}"`);
      console.log('   Phone format: 10-digit number (e.g., "7835996416")');
      console.log('   pickup_location: string (not number)');
    } else {
      console.log('\n🤔 No pickup locations worked. This might indicate:');
      console.log('1. Account setup incomplete in Shiprocket dashboard');
      console.log('2. API permissions not granted');
      console.log('3. Pickup locations need verification by Shiprocket');
      console.log('4. Account might need to be activated for order creation');
      console.log('\n💡 Recommendation: Contact Shiprocket support with your account email');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);