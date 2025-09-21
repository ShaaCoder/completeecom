/**
 * Shiprocket Integration Test Tool
 * 
 * This script tests and diagnoses Shiprocket integration issues
 * Usage: node test-shiprocket-integration.js
 */

const http = require('http');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const TEST_ORDER_ID = '68ca80a308820cc22116cb5c'; // Your order ID from the screenshot

console.log('🚀 Shiprocket Integration Diagnosis Tool');
console.log('=========================================\n');

// Check environment configuration
function checkEnvironmentConfig() {
  console.log('1. 🔍 Checking Environment Configuration...\n');

  const requiredEnvs = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SHIPROCKET_EMAIL',
    'SHIPROCKET_PASSWORD',
    'SHIPROCKET_BASE_URL',
    'SHIPROCKET_PICKUP_LOCATION_ID'
  ];

  const optionalEnvs = [
    'FORCE_MOCK_DELIVERY',
    'DELHIVERY_API_KEY',
    'BLUEDART_API_KEY'
  ];

  console.log('📋 Required Environment Variables:');
  requiredEnvs.forEach(env => {
    const value = process.env[env];
    const status = value && value !== '' ? '✅' : '❌';
    const display = env.includes('PASSWORD') || env.includes('SECRET') || env.includes('KEY') 
      ? (value ? `${value.substring(0, 3)}***` : 'Not Set')
      : (value || 'Not Set');
    
    console.log(`   ${status} ${env}: ${display}`);
  });

  console.log('\n📋 Optional Environment Variables:');
  optionalEnvs.forEach(env => {
    const value = process.env[env];
    const status = value && value !== '' ? '✅' : '⚪';
    console.log(`   ${status} ${env}: ${value || 'Not Set'}`);
  });

  // Check force mock mode
  const forceMock = process.env.FORCE_MOCK_DELIVERY === 'true';
  console.log(`\n🧪 Mock Mode: ${forceMock ? '✅ Enabled (Good for testing)' : '❌ Disabled (Using real APIs)'}`);

  return {
    hasRequiredEnvs: requiredEnvs.every(env => process.env[env] && process.env[env] !== ''),
    mockModeEnabled: forceMock
  };
}

// Make API request helper
function makeRequest(path, method = 'GET', data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test server connectivity
async function testServerConnectivity() {
  console.log('\n2. 🌐 Testing Server Connectivity...\n');

  try {
    const response = await makeRequest('/api/health');
    if (response.status === 200) {
      console.log('✅ Server is running and accessible');
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      return true;
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to server: ${error.message}`);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   1. Make sure your development server is running: npm run dev');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify the server started without errors');
    return false;
  }
}

// Test delivery API endpoints
async function testDeliveryEndpoints() {
  console.log('\n3. 📦 Testing Delivery API Endpoints...\n');

  // Test serviceability endpoint
  console.log('Testing Serviceability Check...');
  try {
    const serviceabilityData = {
      fromPincode: '400001',
      toPincode: '110001',
      weight: 500,
      codAmount: 0
    };

    const response = await makeRequest('/api/delivery/serviceability', 'POST', serviceabilityData);
    
    if (response.status === 200) {
      console.log('✅ Serviceability check working');
      console.log(`   Available providers: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach(provider => {
          console.log(`   - ${provider.provider}: ${provider.serviceable ? '✅ Available' : '❌ Not Available'}`);
        });
      }
    } else {
      console.log(`❌ Serviceability check failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Serviceability check error: ${error.message}`);
  }

  // Test tracking endpoint
  console.log('\nTesting Tracking API...');
  try {
    const trackingResponse = await makeRequest('/api/delivery/track/MOCK1734568909123ABCD?provider=shiprocket');
    
    if (trackingResponse.status === 200) {
      console.log('✅ Tracking API working');
      console.log(`   Status: ${trackingResponse.data.data?.status}`);
    } else {
      console.log(`❌ Tracking API failed: ${trackingResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Tracking API error: ${error.message}`);
  }
}

// Test order retrieval
async function testOrderRetrieval() {
  console.log('\n4. 📋 Testing Order Retrieval...\n');

  try {
    // First test without auth to see what happens
    const response = await makeRequest(`/api/orders/${TEST_ORDER_ID}`);
    
    if (response.status === 200) {
      console.log('✅ Order retrieved successfully (no auth required)');
      console.log(`   Order Number: ${response.data.data?.orderNumber}`);
      console.log(`   Status: ${response.data.data?.status}`);
      console.log(`   Tracking Number: ${response.data.data?.trackingNumber || 'None'}`);
      return response.data.data;
    } else if (response.status === 401) {
      console.log('⚠️  Order retrieval requires authentication');
      console.log('   This is normal for production security');
      return null;
    } else {
      console.log(`❌ Order retrieval failed: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Order retrieval error: ${error.message}`);
    return null;
  }
}

// Test shipment creation
async function testShipmentCreation(order) {
  console.log('\n5. 🚢 Testing Shipment Creation...\n');

  if (!order) {
    console.log('⚠️  Skipping shipment creation test - no order data available');
    return;
  }

  try {
    const shipmentData = {
      orderId: TEST_ORDER_ID,
      provider: 'shiprocket'
    };

    console.log(`Creating shipment for order: ${order.orderNumber}`);
    const response = await makeRequest('/api/delivery/create-shipment', 'POST', shipmentData);
    
    if (response.status === 200) {
      console.log('✅ Shipment creation successful!');
      console.log(`   Shipment ID: ${response.data.data?.shipmentId}`);
      console.log(`   AWB Number: ${response.data.data?.awbNumber}`);
      console.log(`   Tracking URL: ${response.data.data?.trackingUrl}`);
      return response.data.data;
    } else if (response.status === 401) {
      console.log('⚠️  Shipment creation requires admin authentication');
      console.log('   This is normal security - only admins can create shipments');
    } else {
      console.log(`❌ Shipment creation failed: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ Shipment creation error: ${error.message}`);
  }
}

// Test direct Shiprocket API connectivity
async function testDirectShiprocketAPI() {
  console.log('\n6. 🔗 Testing Direct Shiprocket API Connectivity...\n');

  const shiprocketEmail = process.env.SHIPROCKET_EMAIL;
  const shiprocketPassword = process.env.SHIPROCKET_PASSWORD;

  if (!shiprocketEmail || !shiprocketPassword || shiprocketEmail.includes('example.com')) {
    console.log('⚠️  Skipping direct Shiprocket test - credentials not configured');
    console.log('   This is expected in mock mode');
    return;
  }

  try {
    console.log(`Testing Shiprocket authentication with email: ${shiprocketEmail}`);
    
    // Test authentication
    const authData = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: shiprocketEmail,
        password: shiprocketPassword
      })
    };

    // Note: This would require a proper HTTP client for external API calls
    console.log('⚠️  Direct external API testing requires proper HTTP client');
    console.log('   This test will be performed through your application endpoints instead');
    
  } catch (error) {
    console.log(`❌ Direct Shiprocket test error: ${error.message}`);
  }
}

// Generate recommendations
function generateRecommendations(results) {
  console.log('\n7. 💡 Recommendations & Next Steps...\n');

  const { envConfig, serverRunning } = results;

  if (!serverRunning) {
    console.log('🔴 CRITICAL: Start your development server first');
    console.log('   Run: npm run dev');
    return;
  }

  if (!envConfig.hasRequiredEnvs) {
    console.log('🟡 CONFIGURATION: Missing required environment variables');
    console.log('   1. Update .env.local with your actual Shiprocket credentials');
    console.log('   2. Or keep FORCE_MOCK_DELIVERY=true for testing');
  }

  if (envConfig.mockModeEnabled) {
    console.log('🟢 TESTING MODE: Mock delivery enabled');
    console.log('   ✅ Perfect for development and testing');
    console.log('   ✅ No real API calls will be made');
    console.log('   ✅ Realistic test data will be generated');
  } else {
    console.log('🟠 PRODUCTION MODE: Real Shiprocket API enabled');
    console.log('   ⚠️  Make sure your Shiprocket credentials are correct');
    console.log('   ⚠️  Ensure pickup locations are configured in Shiprocket dashboard');
  }

  console.log('\n📋 Manual Testing Steps:');
  console.log('1. 🌐 Open: http://localhost:3000/admin');
  console.log(`2. 🔍 Find order: ${TEST_ORDER_ID} or NYK1758101745739`);
  console.log('3. 📦 Update order status to "Shipped"');
  console.log('4. 🚚 Add tracking number and carrier');
  console.log('5. 👀 Check customer view for real-time updates');

  console.log('\n🔧 Integration Testing URLs:');
  console.log(`- Order Details: http://localhost:3000/orders/${TEST_ORDER_ID}`);
  console.log('- Admin Panel: http://localhost:3000/admin');
  console.log('- Demo Interface: http://localhost:3000/demo/real-time-tracking');
  console.log('- API Health: http://localhost:3000/api/health');

  console.log('\n🏆 Expected Behavior:');
  console.log('- ✅ Order status updates in real-time');
  console.log('- ✅ Tracking information appears when added');
  console.log('- ✅ Server-sent events work for live updates');
  console.log('- ✅ Mock tracking data generated if no real API');
}

// Main test function
async function runDiagnosis() {
  console.log('Starting comprehensive Shiprocket integration diagnosis...\n');

  const envConfig = checkEnvironmentConfig();
  const serverRunning = await testServerConnectivity();
  
  if (serverRunning) {
    await testDeliveryEndpoints();
    const order = await testOrderRetrieval();
    await testShipmentCreation(order);
    await testDirectShiprocketAPI();
  }

  generateRecommendations({ envConfig, serverRunning });

  console.log('\n🎉 Diagnosis completed!');
  console.log('=====================================');
}

// Run the diagnosis
runDiagnosis().catch(console.error);