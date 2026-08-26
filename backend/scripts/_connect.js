// Shared bootstrap for the one-off maintenance scripts in this folder.
// Usage from backend/:  node scripts/<name>.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function withDb(fn) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Export it or put it in backend/.env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  console.log(`Connected to ${uri.replace(/\/\/[^@]*@/, '//***@')}`);

  try {
    await fn(client.db());
  } finally {
    await client.close();
  }
}

module.exports = { withDb };
