# Maintenance scripts

One-off operations that used to run on every API boot. They are deliberate now:
booting should not mutate data.

Run from `backend/` with `MONGODB_URI` set (read from `.env` if present):

| Script | Purpose |
|---|---|
| `node scripts/promote-admin.js <email>` | Grant the `admin` role to a named user |
| `node scripts/drop-stale-conversation-index.js` | Drop the legacy `unique_participants` index |
| `node scripts/strip-base64-avatars.js` | Remove inline base64 avatars from `cards` |

To point one at production, prefix with the Render `MONGODB_URI`:

```sh
MONGODB_URI="mongodb+srv://..." node scripts/promote-admin.js you@example.com
```
