/**
 * Reset a user's password in MongoDB using bcryptjs
 *
 * Usage (PowerShell):
 *   $env:EMAIL = "user@example.com"
 *   $env:NEW_PASSWORD = "Pass@1234"
 *   node -r dotenv/config scripts/reset-user-password.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    const email = process.env.EMAIL;
    const newPassword = process.env.NEW_PASSWORD;

    if (!uri || !dbName) {
      console.error('Missing MONGODB_URI or MONGODB_DB_NAME. Ensure your .env is loaded.');
      process.exit(1);
    }
    if (!email || !newPassword) {
      console.error('Set EMAIL and NEW_PASSWORD environment variables before running.');
      process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    const hash = await bcrypt.hash(newPassword, 12);
    const result = await db.collection('users').updateOne(
      { email: String(email).toLowerCase() },
      { $set: { password: hash, isActive: true, updatedAt: new Date() } }
    );

    console.log('matched', result.matchedCount, 'modified', result.modifiedCount);

    await client.close();
  } catch (e) {
    console.error('Error:', e?.message || e);
    process.exit(1);
  }
})();