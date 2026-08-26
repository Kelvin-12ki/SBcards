// One-off: remove inline base64 data-URL avatars from `cards`.
// These bloat documents and blow past Mongo's 16MB doc limit; real uploads go
// to Firebase Storage. Previously ran on every API boot.
const { withDb } = require('./_connect');

withDb(async (db) => {
  const result = await db
    .collection('cards')
    .updateMany(
      { avatarUrl: { $regex: '^data:image', $options: 'i' } },
      { $unset: { avatarUrl: '' } },
    );
  console.log(`Cleaned ${result.modifiedCount} card(s) with base64 avatarUrl.`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
