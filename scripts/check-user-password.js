/**
 * Check a user's stored password hash against a plaintext input
 *
 * Usage (PowerShell):
 *   $env:EMAIL = "user@example.com"
 *   $env:PASSWORD = "Pass@1234"
 *   node -r dotenv/config scripts/check-user-password.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!uri || !dbName) {
      console.error('Missing MONGODB_URI or MONGODB_DB_NAME. Ensure your .env is loaded.');
      process.exit(1);
    }
    if (!email || !password) {
      console.error('Set EMAIL and PASSWORD environment variables before running.');
      process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    const user = await db.collection('users').findOne({ email: String(email).toLowerCase() });
    if (!user) {
      console.log('User not found');
      await client.close();
      process.exit(0);
    }

    console.log('User found:', { email: user.email, isActive: user.isActive, hasPassword: !!user.password });

    if (!user.password) {
      console.log('User has no password (likely OAuth-only).');
      await client.close();
      process.exit(0);
    }

    const ok = await bcrypt.compare(password, user.password);
    console.log('Password match:', ok);

    await client.close();
  } catch (e) {
    console.error('Error:', e?.message || e);
    process.exit(1);
  }
})();