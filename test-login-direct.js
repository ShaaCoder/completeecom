#!/usr/bin/env node

/**
 * Test script to directly test NextAuth credentials login
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function testDirectLogin() {
  console.log('🧪 Testing direct login credentials...\n');
  
  try {
    // Connect to MongoDB directly
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
    await client.connect();
    
    const db = client.db(process.env.MONGODB_DB_NAME || 'completeecommerce');
    const usersCollection = db.collection('users');
    
    // Find the admin user
    const user = await usersCollection.findOne({ 
      email: 'shaan@gmail.com',
      isActive: true
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('Available users:');
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      return;
    }
    
    console.log('✅ User found in database:');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - IsActive: ${user.isActive}`);
    console.log(`  - HasPassword: ${user.password ? 'Yes' : 'No'}`);
    console.log(`  - Username: ${user.username}`);
    
    // Test password comparison
    if (user.password) {
      console.log('\n🔒 Testing password...');
      
      // You need to replace 'testpassword' with the actual password you used during registration
      const testPassword = 'Admin@123'; // Replace this with your actual password
      
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`Password test result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (!isValid) {
          console.log('💡 Try different passwords or check if the password was hashed correctly');
          console.log('💡 The user might have been created without proper password hashing');
        }
      } catch (error) {
        console.log('❌ Error comparing password:', error.message);
      }
    } else {
      console.log('⚠️  User has no password (probably OAuth user)');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test the NextAuth API directly
async function testNextAuthAPI() {
  console.log('\n🌐 Testing NextAuth API...');
  
  const testCredentials = {
    email: 'shaan@gmail.com',
    password: 'Admin@123' // Replace with actual password
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testCredentials.email,
        password: testCredentials.password,
        redirect: 'false',
        json: 'true'
      })
    });
    
    const result = await response.text();
    console.log('NextAuth API Response:', response.status);
    console.log('Response body:', result);
    
  } catch (error) {
    console.log('❌ NextAuth API test failed:', error.message);
  }
}

async function main() {
  console.log('🔧 NextAuth Credentials Login Test');
  console.log('=' .repeat(50));
  
  await testDirectLogin();
  await testNextAuthAPI();
  
  console.log('\n📋 Troubleshooting steps:');
  console.log('1. Verify the user exists with correct email');
  console.log('2. Check if password is properly hashed in database');  
  console.log('3. Test password comparison with bcrypt');
  console.log('4. Verify NextAuth configuration');
  console.log('5. Check browser network tab for actual login attempts');
}

if (require.main === module) {
  main();
}