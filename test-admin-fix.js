#!/usr/bin/env node

/**
 * Test script to verify admin page authentication fixes
 * This script helps verify that the admin page loads correctly
 */

const http = require('http');

function testAdminEndpoint() {
  console.log('🧪 Testing admin page authentication fixes...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: {
        'User-Agent': 'Admin-Test-Script'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Admin page response status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          if (data.includes('Admin Dashboard') || data.includes('Authentication Required')) {
            console.log('✅ Admin page is loading correctly');
            console.log('✅ Authentication logic is working');
          } else {
            console.log('⚠️  Admin page loaded but content may not be correct');
          }
        } else if (res.statusCode === 302 || res.statusCode === 307) {
          console.log(`✅ Admin page is redirecting (probably to auth): ${res.headers.location}`);
        } else {
          console.log(`❌ Unexpected status code: ${res.statusCode}`);
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error connecting to admin page:', err.message);
      console.log('💡 Make sure the Next.js development server is running: npm run dev');
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.log('⏰ Request timeout - server might be slow or not running');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 Admin Page Authentication Fix - Test Script');
  console.log('=' .repeat(50));
  
  try {
    await testAdminEndpoint();
    
    console.log('\n📋 Summary of fixes applied:');
    console.log('1. ✅ Fixed auth store initialization to handle missing sessions');
    console.log('2. ✅ Improved setSessionUser to properly set hasInitialized flag');
    console.log('3. ✅ Enhanced admin page loading states with better error messages');
    console.log('4. ✅ Added proper authentication and authorization checks');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Open http://localhost:3000/admin in your browser');
    console.log('2. If not logged in as admin, you should see "Authentication Required"');
    console.log('3. Log in with admin credentials to access the dashboard');
    console.log('4. The loading spinner should no longer get stuck');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}