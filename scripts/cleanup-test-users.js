/**
 * Cleanup Test Users Script
 * 
 * This script helps clean up test users to allow for fresh registration testing
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME;

async function cleanupTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Delete test users
    const testEmails = [
      'kalki6569@gmail.com',
      'test@example.com',
      'user@test.com'
    ];
    
    for (const email of testEmails) {
      const result = await usersCollection.deleteMany({ email: email });
      console.log(`Deleted ${result.deletedCount} user(s) with email: ${email}`);
    }
    
    // Also clean up accounts and sessions collections for NextAuth
    const accountsCollection = db.collection('accounts');
    const sessionsCollection = db.collection('sessions');
    
    const accountsResult = await accountsCollection.deleteMany({});
    console.log(`Deleted ${accountsResult.deletedCount} account(s)`);
    
    const sessionsResult = await sessionsCollection.deleteMany({});
    console.log(`Deleted ${sessionsResult.deletedCount} session(s)`);
    
    console.log('Cleanup completed successfully');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

cleanupTestUsers();