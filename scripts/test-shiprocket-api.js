/**
 * Shiprocket API Test Utility
 * 
 * This script tests various Shiprocket API configurations to find what works
 */

require('dotenv').config();

const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
  baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
  pickupLocationId: process.env.SHIPROCKET_PICKUP_LOCATION_ID || '10304720'
};

/**
 * Get Shiprocket auth token
 */
async function getShiprocketToken() {
  try {
    console.log('🔐 Getting Shiprocket token...');
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SHIPROCKET_CONFIG.email,
        password: SHIPROCKET_CONFIG.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Token received successfully');
    return data.token;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Test different order creation formats
 */
async function testOrderCreation() {
  try {
    const token = await getShiprocketToken();
    
    // Test different phone formats
    const phoneFormats = [
      '7835996416',        // Your actual phone from pickup location
      '8810524651',        // Phone from order data
      '9876543210',        // Another common format
      '1234567890'         // Simple test number
    ];
    
    for (let i = 0; i < phoneFormats.length; i++) {
      const phoneFormat = phoneFormats[i];
      console.log(`\n📦 Test ${i + 1}: Phone format '${phoneFormat}'`);
      
      const testOrder = {
        order_id: `TEST_${Date.now()}_${i}`,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: SHIPROCKET_CONFIG.pickupLocationId.toString(),
        billing_customer_name: 'Test Customer',
        billing_last_name: '',
        billing_address: 'Test Address',
        billing_city: 'Delhi',
        billing_pincode: '110001',
        billing_state: 'Delhi',
        billing_country: 'India',
        billing_email: 'test@example.com',
        billing_phone: phoneFormat,
        shipping_is_billing: true,
        order_items: [
          {
            name: 'Test Item',
            sku: 'TEST123',
            units: 1,
            selling_price: 100
          }
        ],
        payment_method: 'COD',
        sub_total: 100,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5
      };

      const success = await testShiprocketOrder(token, testOrder, `Phone format: ${phoneFormat}`);
      if (success) {
        console.log(`\n🎉 SUCCESS! Working phone format found: '${phoneFormat}'`);
        console.log('✅ Use this exact phone format in your code');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test a specific order configuration
 */
async function testShiprocketOrder(token, orderData, testName) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log('📄 Order data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    console.log('📋 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok && (responseData.status === 1 || responseData.order_id)) {
      console.log('✅ SUCCESS! This format works!');
      return true;
    } else {
      console.log('❌ Failed with this format');
      return false;
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

/**
 * Test available pickup locations
 */
async function testPickupLocations() {
  try {
    const token = await getShiprocketToken();
    
    console.log('\n🏢 Fetching pickup locations...');
    const response = await fetch(`${SHIPROCKET_CONFIG.baseUrl}/settings/company/pickup`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const locations = data.data?.shipping_address || [];
      
      console.log('\n📍 Available pickup locations:');
      locations.forEach(location => {
        console.log(`   ID: ${location.id} | Name: ${location.pickup_location} | Status: ${location.status === 2 ? 'Active' : 'Inactive'} | City: ${location.city}`);
      });

      const activeLocations = locations.filter(loc => loc.status === 2);
      if (activeLocations.length > 0) {
        console.log(`\n✅ Found ${activeLocations.length} active pickup location(s)`);
        console.log('🎯 Using location ID:', activeLocations[0].id);
        return activeLocations[0].id;
      } else {
        console.log('⚠️ No active pickup locations found');
        return null;
      }
    } else {
      console.log('❌ Failed to fetch pickup locations');
      return null;
    }
  } catch (error) {
    console.log('❌ Error fetching pickup locations:', error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Shiprocket API Test Utility');
  console.log('===============================\n');

  if (!SHIPROCKET_CONFIG.email || !SHIPROCKET_CONFIG.password) {
    console.error('❌ Missing Shiprocket credentials');
    process.exit(1);
  }

  console.log('🔧 Configuration:');
  console.log(`   Email: ${SHIPROCKET_CONFIG.email}`);
  console.log(`   Base URL: ${SHIPROCKET_CONFIG.baseUrl}`);
  console.log(`   Pickup Location ID: ${SHIPROCKET_CONFIG.pickupLocationId}`);

  try {
    // First verify pickup locations
    const activePickupId = await testPickupLocations();
    
    if (activePickupId) {
      // Update config with active pickup location
      SHIPROCKET_CONFIG.pickupLocationId = activePickupId;
      console.log(`\n🔄 Updated pickup location ID to: ${activePickupId}`);
    }

    // Test order creation with various formats
    await testOrderCreation();

    console.log('\n✅ Testing completed!');
    console.log('\n💡 Tips:');
    console.log('1. If any format succeeded, use that exact structure in your code');
    console.log('2. Make sure to use the active pickup location ID');
    console.log('3. Some fields might be required by your specific Shiprocket account setup');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOrderCreation, getShiprocketToken };