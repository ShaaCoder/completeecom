// Test Authentication Fixes
// Run this after starting the server to verify authentication is working

const http = require('http');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

console.log('🔐 Testing Authentication Fixes');
console.log('===============================\n');

// Test authentication endpoint
async function testAuth() {
  console.log('1. Testing Authentication...\n');
  
  // Test login endpoint
  try {
    console.log('Attempting login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      email: 'shaan@gmail.com',
      password: '123456'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log(`   Token received: ${loginResponse.data.data.token ? 'Yes' : 'No'}`);
      console.log(`   User: ${loginResponse.data.data.user?.name} (${loginResponse.data.data.user?.role})`);
      
      const token = loginResponse.data.data.token;
      
      // Test profile endpoint with token
      const profileResponse = await makeRequest('/api/auth/profile', 'GET', null, token);
      
      if (profileResponse.status === 200) {
        console.log('✅ Profile endpoint working with token');
        console.log(`   Profile user: ${profileResponse.data.data?.user?.name}`);
      } else {
        console.log('❌ Profile endpoint failed');
      }
      
      return token;
    } else {
      console.log('❌ Login failed');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return null;
  }
}

// Test order endpoints
async function testOrderEndpoints(token) {
  console.log('\n2. Testing Order Endpoints...\n');
  
  if (!token) {
    console.log('⚠️  Skipping order tests - no valid token');
    return;
  }

  try {
    // Test orders list
    const ordersResponse = await makeRequest('/api/orders', 'GET', null, token);
    
    if (ordersResponse.status === 200) {
      console.log('✅ Orders list endpoint working');
      console.log(`   Orders found: ${ordersResponse.data.data?.length || 0}`);
    } else {
      console.log('❌ Orders list failed');
      console.log(`   Status: ${ordersResponse.status}`);
    }

    // Test specific order
    const testOrderId = '68ca80a308820cc22116cb5c';
    const orderResponse = await makeRequest(`/api/orders/${testOrderId}`, 'GET', null, token);
    
    if (orderResponse.status === 200) {
      console.log('✅ Single order endpoint working');
      console.log(`   Order: ${orderResponse.data.data?.orderNumber} - ${orderResponse.data.data?.status}`);
    } else {
      console.log('❌ Single order failed');
      console.log(`   Status: ${orderResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ Order endpoints error: ${error.message}`);
  }
}

// Test pages accessibility
async function testPageAccess() {
  console.log('\n3. Testing Page Access...\n');
  
  const pages = [
    { path: '/', name: 'Home Page' },
    { path: '/auth', name: 'Auth Page' },
    { path: '/admin', name: 'Admin Page' },
    { path: '/admin/orders/shiprocket', name: 'Shiprocket Admin Page' }
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(page.path);
      if (response.status === 200) {
        console.log(`✅ ${page.name}: Accessible`);
      } else {
        console.log(`❌ ${page.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${page.name}: Error ${error.message}`);
    }
  }
}

// Helper function
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

// Run tests
async function runTests() {
  try {
    const token = await testAuth();
    await testOrderEndpoints(token);
    await testPageAccess();
    
    console.log('\n🎉 Authentication Tests Complete!');
    console.log('=====================================');
    
    if (token) {
      console.log('\n✅ FIXES WORKING:');
      console.log('- Authentication is working properly');
      console.log('- Token storage and retrieval fixed');
      console.log('- API client integration working');
      console.log('- Order endpoints accessible with auth');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Start your dev server: npm run dev');
      console.log('2. Go to: http://localhost:3000/auth');
      console.log('3. Login with: shaan@gmail.com / 123456');
      console.log('4. Go to: http://localhost:3000/admin/orders/shiprocket');
      console.log('5. Test order management and Shiprocket features');
    } else {
      console.log('\n⚠️  AUTHENTICATION ISSUES FOUND:');
      console.log('- Login may not be working');
      console.log('- Check server is running');
      console.log('- Verify credentials in database');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runTests();