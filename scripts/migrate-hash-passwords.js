/**
 * One-time migration: hash any plaintext passwords stored in users collection
 *
 * Usage (PowerShell):
 *   node -r dotenv/config scripts/migrate-hash-passwords.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error('Missing MONGODB_URI or MONGODB_DB_NAME. Ensure your .env is loaded.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const bcryptRegex = new RegExp(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);

  const cursor = db.collection('users').find({
    password: { $exists: true, $ne: null },
  });

  let checked = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const user = await cursor.next();
    checked++;

    const pwd = user.password;
    if (typeof pwd !== 'string' || !bcryptRegex.test(pwd)) {
      // Plaintext or invalid format -> hash it
      if (typeof pwd === 'string' && pwd.length > 0) {
        const hash = await bcrypt.hash(pwd, 12);
        await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hash, updatedAt: new Date() } });
        updated++;
        console.log(`Hashed password for ${user.email || user._id}`);
      } else {
        console.log(`Skipped ${user.email || user._id} (no password)`);
      }
    }
  }

  console.log(`\nDone. Checked: ${checked}, Updated: ${updated}`);
  await client.close();
}

run().catch((e) => {
  console.error('Migration error:', e?.message || e);
  process.exit(1);
});
