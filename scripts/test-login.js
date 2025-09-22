/**
 * Test Login Functionality
 * 
 * This script creates a test user and verifies login works correctly
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME;

async function testLoginSetup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Create a test user
    const testUser = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('TestPassword123', 12),
      phone: '9876543210',
      role: 'customer',
      isActive: true,
      isEmailVerified: true,
      oauthProvider: null,
      addresses: [],
      lastLoginAt: null,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Delete existing test user if any
    await usersCollection.deleteMany({ email: testUser.email });
    
    // Insert new test user
    const result = await usersCollection.insertOne(testUser);
    console.log(`Created test user with ID: ${result.insertedId}`);
    console.log('Test user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: TestPassword123');
    
    // Verify user was created correctly
    const createdUser = await usersCollection.findOne({ email: testUser.email });
    console.log('User created successfully:', {
      id: createdUser._id,
      name: createdUser.name,
      username: createdUser.username,
      email: createdUser.email,
      hasPassword: !!createdUser.password,
      role: createdUser.role,
      isActive: createdUser.isActive
    });
    
  } catch (error) {
    console.error('Error during test setup:', error);
  } finally {
    await client.close();
  }
}

testLoginSetup();