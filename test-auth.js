const fs = require('fs');

// Test authentication status
async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Check if we can read from localStorage (simulate browser environment)
    const token = 'simulated_token_for_admin_user';
    
    console.log('🔐 Simulated token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ No token found - user needs to log in');
      return;
    }
    
    // Test API call with token
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Auth API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User authenticated:', data.data?.user?.role);
    } else {
      const error = await response.text();
      console.log('❌ Auth failed:', error);
    }
    
  } catch (error) {
    console.error('Error testing auth:', error.message);
  }
}

// Test CSV upload authentication
async function testCSVAuth() {
  try {
    console.log('\n🔍 Testing CSV upload authentication...');
    
    const token = 'simulated_admin_token';
    
    const response = await fetch('http://localhost:3000/api/products/bulk-upload', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 CSV template API response status:', response.status);
    
    if (response.ok) {
      console.log('✅ CSV template download accessible');
    } else {
      const error = await response.text();
      console.log('❌ CSV auth failed:', error);
    }
    
  } catch (error) {
    console.error('Error testing CSV auth:', error.message);
  }
}

console.log('🚀 Starting authentication tests...');
console.log('Note: This requires the development server to be running.');
console.log('Run: npm run dev\n');

testAuth();
setTimeout(testCSVAuth, 1000);