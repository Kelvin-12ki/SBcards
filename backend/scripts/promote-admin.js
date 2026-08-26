// Grant the `admin` role to one named user.
//
//   node scripts/promote-admin.js someone@example.com
//
// Replaces the old auto-seed in main.ts, which silently promoted whichever
// account happened to be oldest — on a fresh production database that is
// whoever signs up first.
const { withDb } = require('./_connect');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/promote-admin.js <email>');
  process.exit(1);
}

withDb(async (db) => {
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    console.error(`No user with email ${email}. They must sign up first.`);
    process.exitCode = 1;
    return;
  }

  if (user.role === 'admin') {
    console.log(`${email} is already an admin.`);
    return;
  }

  await db
    .collection('users')
    .updateOne({ _id: user._id }, { $set: { role: 'admin' } });
  console.log(`Promoted ${email} to admin.`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
