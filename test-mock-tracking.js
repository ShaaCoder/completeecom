// Simple test script to check if mock tracking API works
const fetch = require('node-fetch');

async function testMockTracking() {
  try {
    console.log('Testing mock tracking API...');
    
    // Test with mock tracking number
    const response = await fetch('http://localhost:3000/api/orders/track/MOCK1734568909123ABCD');
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Mock tracking API works!');
    } else {
      console.log('❌ Mock tracking API failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error testing mock tracking:', error.message);
  }
}

testMockTracking();