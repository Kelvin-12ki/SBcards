// One-off: drop the legacy `unique_participants` index from `conversations`.
// Previously ran on every API boot; kept here so it can be re-run deliberately.
const { withDb } = require('./_connect');

withDb(async (db) => {
  const exists = await db.listCollections({ name: 'conversations' }).toArray();
  if (exists.length === 0) {
    console.log('No `conversations` collection — nothing to do.');
    return;
  }

  const indexes = await db.collection('conversations').indexes();
  if (!indexes.some((i) => i.name === 'unique_participants')) {
    console.log('Index `unique_participants` not present — nothing to do.');
    return;
  }

  await db.collection('conversations').dropIndex('unique_participants');
  console.log('Dropped `unique_participants`.');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
