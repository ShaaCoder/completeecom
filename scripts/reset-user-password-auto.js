/**
 * Auto-reset a user's password to a secure random value without exposing it in command logs.
 *
 * Usage (PowerShell):
 *   $env:EMAIL = "user@example.com"
 *   node -r dotenv/config scripts/reset-user-password-auto.js
 *
 * Output:
 *   Writes the new password to scripts/temp-password-<sanitized-email>.txt
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateStrongPassword() {
  // Ensure it contains upper, lower, digit, and symbol and is URL-safe to avoid quoting issues
  const core = crypto.randomBytes(12).toString('base64url');
  const required = 'Aa1!';
  return required + core;
}

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    const email = (process.env.EMAIL || '').toLowerCase();

    if (!uri || !dbName) throw new Error('Missing MONGODB_URI or MONGODB_DB_NAME');
    if (!email) throw new Error('Set EMAIL environment variable');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    const newPassword = generateStrongPassword();
    const hash = await bcrypt.hash(newPassword, 12);

    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hash, isActive: true, updatedAt: new Date() } }
    );

    const safeName = email.replace(/[^a-z0-9]/gi, '_');
    const outFile = path.join(__dirname, `temp-password-${safeName}.txt`);
    fs.writeFileSync(outFile, newPassword, { encoding: 'utf8', flag: 'w' });

    console.log(JSON.stringify({ ok: true, matched: result.matchedCount, modified: result.modifiedCount, outFile }));

    await client.close();
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e?.message || String(e) }));
    process.exit(1);
  }
})();
