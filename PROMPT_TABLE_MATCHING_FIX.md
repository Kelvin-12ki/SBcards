# NEXAS Table Matching & Event System — Complete Fix

## Context

This is a full-stack networking platform (NEXAS) with:
- **Flutter mobile app** at `C:\Users\LIVEWAVE\sbcards_mobile`
- **React web app** at `C:\Users\LIVEWAVE\SBcards\frontend`
- **NestJS backend** at `C:\Users\LIVEWAVE\SBcards\backend`

The backend table/matching/rotation logic is solid but the mobile and web UIs are broken, incomplete, or confusing. This prompt fixes everything end-to-end.

## Architecture

The system works like this:
1. Organizer creates an event (web only)
2. Attendees join the event (mobile or web)
3. Attendees create a digital business card (mobile)
4. Attendees check in at the event (mobile QR scan or web)
5. Organizer sets up tables (web — table count, seats per table, rotation interval)
6. Organizer clicks "Assign Tables" → backend runs AI matching algorithm → seats everyone at tables
7. Attendees see their table assignment with tablemates, overlap scores, conversation starters
8. Organizer clicks "Rotate Tables" → backend advances round → everyone gets new tablemates (avoiding people they've already sat with)
9. Repeat step 8 as needed

## Endpoints (already exist, DO NOT create new ones)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/events/:eventId/tables` | PATCH | organizer | Setup table layout |
| `/events/:eventId/tables` | GET | any | Get all tables with attendees |
| `/events/:eventId/check-in` | POST | self | Check in |
| `/events/:eventId/check-in/:userId` | DELETE | self/organizer | Check out |
| `/events/:eventId/check-ins` | GET | organizer | List check-ins |
| `/events/:eventId/table-attendees` | GET | organizer | Checked-in attendees |
| `/events/:eventId/assign-tables` | POST | organizer | Run matching + seat everyone |
| `/events/:eventId/rotate` | POST | organizer | Advance to next rotation round |
| `/events/:eventId/my-assignment` | GET | self | Current user's table + tablemates + match data |
| `/events/:eventId/my-table` | GET | self | Simple table view (legacy) |
| `/events/:eventId/match` | POST | **organizer only** (FIX THIS) | Generate AI matches |
| `/events/:eventId/matches` | GET | any | Get user's matches |
| `/events/:eventId/join` | POST | self | Join event |
| `/events/:eventId/leave` | DELETE | self | Leave event |
| `/events/:eventId/participants` | GET | any | List participants |
| `/events/:eventId` | GET | any | Get event details |

## PART 1: BACKEND FIXES

### 1A. Add organizer auth to POST /events/:eventId/match

File: `C:\Users\LIVEWAVE\SBcards\backend\src\modules\matching\matching.controller.ts`

The `runMatching` endpoint currently has NO authorization check. Add organizer-only enforcement:

```typescript
// Add the same assertOrganizer check used in tables.controller.ts
// Import and use: @UseGuards(JwtAuthGuard, OrganizerGuard)
// OR manually check: if (req.user.role !== 'organizer' && req.user.role !== 'admin') throw new ForbiddenException()
```

### 1B. Clean up orphaned assignments on setupTables

File: `C:\Users\LIVEWAVE\SBcards\backend\src\modules\tables\tables.service.ts`

In the `setupTables` method, after deleting and recreating Table documents, also clear ALL table assignments for this event:

```typescript
// After creating new tables, add:
await this.assignmentModel.deleteMany({ eventId }).exec();
```

### 1C. Fix N+1 query in runMatching (optional but good)

File: `C:\Users\LIVEWAVE\SBcards\backend\src\modules\matching\matching.service.ts`

In the nested loop where users and cards are fetched per-pair, batch-fetch them before the loop:

```typescript
// Before the double loop, fetch all users and cards in bulk:
const allUserIds = participants.map(p => p.userId);
const allCardIds = participants.map(p => p.cardId);
const [allUsers, allCards] = await Promise.all([
  this.usersModel.find({ _id: { $in: allUserIds } }).exec(),
  this.cardModel.find({ _id: { $in: allCardIds } }).exec(),
]);
const userMap = new Map(allUsers.map(u => [u._id.toString(), u]));
const cardMap = new Map(allCards.map(c => [c._id.toString(), c]));

// Then in the loop, use the maps instead of individual queries:
const userA = userMap.get(partA.userId);
const userB = userMap.get(partB.userId);
const cardA = cardMap.get(partA.cardId);
const cardB = cardMap.get(partB.cardId);
```

### 1D. Add event participation status endpoint

Add a new endpoint that returns the current user's participation + check-in status for an event. This lets the mobile app know which buttons to show.

File: `C:\Users\LIVEWAVE\SBcards\backend\src\modules\events\events.controller.ts`

```typescript
@Get(':id/my-status')
@UseGuards(JwtAuthGuard)
async getMyEventStatus(@Param('id') eventId: string, @CurrentUser() user: JwtUser) {
  // Returns: { joined: boolean, checkedIn: boolean, hasCard: boolean, assignment: {...} | null }
}
```

File: `C:\Users\LIVEWAVE\SBcards\backend\src\modules\events\events.service.ts`

```typescript
async getMyEventStatus(eventId: string, userId: string) {
  const participation = await this.participationModel.findOne({ eventId, userId });
  const checkIn = await this.checkInModel.findOne({ eventId, userId });
  const card = await this.cardModel.findOne({ userId });
  const assignment = await this.assignmentModel.findOne({ eventId, userId, rotationRound: /* current round */ });
  const event = await this.eventModel.findById(eventId);
  
  return {
    joined: !!participation,
    checkedIn: !!checkIn,
    hasCard: !!card,
    currentRound: event?.currentRotationRound || 0,
    assignment: assignment ? {
      tableNumber: assignment.tableNumber,
      seatNumber: assignment.seatNumber,
      label: /* join with table */,
    } : null,
  };
}
```

Add to API endpoints in mobile: `static String eventMyStatus(String eventId) => '/events/$eventId/my-status';`

---

## PART 2: MOBILE FIXES (Flutter)

### 2A. Add `eventMyStatus` endpoint

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\core\networking\api_endpoints.dart`

Add:
```dart
static String eventMyStatus(String eventId) => '/events/$eventId/my-status';
```

### 2B. Add `rotate` endpoint to TableMatchingService

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\events\presentation\providers\table_matching_provider.dart`

Add to the service class:
```dart
Future<List<TableInfo>> rotate(String eventId) async {
  final response = await _apiClient.post(ApiEndpoints.eventRotate(eventId));
  // Parse and return
}
```

Also add `eventRotate` to api_endpoints.dart:
```dart
static String eventRotate(String eventId) => '/events/$eventId/rotate';
```

### 2C. Add `eventMyStatus` provider

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\events\presentation\providers\table_matching_provider.dart`

Add:
```dart
final eventMyStatusProvider = FutureProvider.autoDispose.family<EventMyStatus?, String>((ref, eventId) async {
  final api = ref.read(apiClientProvider);
  try {
    final response = await api.get(ApiEndpoints.eventMyStatus(eventId));
    return EventMyStatus.fromJson(response.data);
  } catch (_) {
    return null;
  }
});

class EventMyStatus {
  final bool joined;
  final bool checkedIn;
  final bool hasCard;
  final int currentRound;
  // ... fromJson
}
```

### 2D. Rewrite Event Detail Screen — STATE-AWARE BUTTONS

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\events\presentation\screens\event_detail_screen.dart`

**The key change:** Instead of always showing "Join" + "Leave" + "Check In" + "My Table" + "AI Match" all at once, show buttons based on state:

```
State: NOT JOINED
  → Show: [Join Event] button (gold, prominent)
  → Hide: Leave, Check In, My Table, AI Match

State: JOINED, NOT CHECKED IN
  → Show: [Check In] (gold, prominent), [Leave] (secondary), [View Matches] (secondary)
  → Hide: Join, My Table

State: JOINED + CHECKED IN, NO TABLE ASSIGNED YET
  → Show: [My Table] (shows "Not assigned yet" screen), [View Matches], [Leave]
  → Hide: Join, Check In
  → Add: "Checked In ✓" badge, "Round X" badge if assignment exists

State: JOINED + CHECKED IN + TABLE ASSIGNED
  → Show: [My Table] (primary), [View Matches], [Leave]
  → Hide: Join, Check In
  → Add: "Checked In ✓" badge, "Round X" badge, mini table preview showing table name + seat + # tablemates
```

Implementation:
1. Fetch event on init (keep existing)
2. Fetch `eventMyStatus` using the new endpoint
3. Conditionally render buttons based on `status.joined`, `status.checkedIn`, `status.assignment`
4. After Join → re-fetch status → buttons update
5. After Check In → re-fetch status → buttons update
6. After Rotate (web) → on next visit, status shows new round

The `isOrganizer` check should use `event['creatorId'] == currentUser.id || currentUser.role == 'organizer' || currentUser.role == 'admin'`

For organizers, show a gold-bordered info card: "Manage this event on the web portal →" with a "Open Portal" button that launches `https://sbcards.vercel.app/admin` in browser.

### 2E. Fix Status Badge

In `event_detail_screen.dart`, the status badge is hardcoded to cyan. Fix it to use the same color mapping as the events list:

```dart
Color _getStatusColor(String status) {
  switch (status) {
    case 'upcoming': return AppColors.neonCyan;
    case 'active': case 'live': return AppColors.success;
    case 'completed': return AppColors.textTertiary;
    case 'cancelled': return AppColors.danger;
    default: return AppColors.gold;
  }
}
```

### 2F. Add Leave Confirmation Dialog

Before calling `DELETE /events/:id/leave`, show:
```dart
showDialog(
  context: context,
  builder: (ctx) => AlertDialog(
    title: Text('Leave Event?'),
    content: Text('You will be removed from this event and lose your table assignment.'),
    actions: [
      TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel')),
      TextButton(onPressed: () { Navigator.pop(ctx); _leaveEvent(); }, child: Text('Leave', style: TextStyle(color: AppColors.danger))),
    ],
  ),
);
```

### 2G. Fix My Table Screen — ADD ROTATION ROUND + ACTIONS

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\events\presentation\screens\my_table_screen.dart`

Changes:
1. Show **rotation round** prominently at the top: "Round 2" in a badge
2. Add **Connect** button on each tablemate card (same as AI Match screen)
3. Add **View Profile** button on each tablemate card
4. Add **Message** button on each tablemate card (if already connected)
5. Add **pull-to-refresh** (already exists via AppBar refresh icon, but make it pull-to-refresh too)

For the Connect button on tablemates:
```dart
// Same logic as AI Match screen
Future<void> _connectWith(String userId) async {
  final api = ref.read(apiClientProvider);
  await api.post('/connections', data: {'connectedUserId': userId, 'source': 'table_match'});
  // Show success SnackBar
}
```

### 2H. Fix AI Match Screen — ORGANIZER-ONLY GENERATE

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\ai_match\presentation\screens\ai_match_screen.dart`

The "Generate Matches" button should only be visible to organizers:

```dart
// Check if current user is organizer
final user = ref.watch(currentUserProvider);
final isOrganizer = user?.role == 'organizer' || user?.role == 'admin';

// Only show "Generate Matches" button for organizers
if (isGenerator && isOrganizer)
  // Show the button
```

Also add a loading state on the Connect button to prevent double-taps:
```dart
bool _isConnecting = false;

Future<void> _connectWith(String userId) async {
  if (_isConnecting) return;
  setState(() => _isConnecting = true);
  try {
    // ... API call
  } finally {
    if (mounted) setState(() => _isConnecting = false);
  }
}
```

### 2I. Fix Check-In Screen — BETTER FLOW

File: `C:\Users\LIVEWAVE\sbcards_mobile\lib\features\events\presentation\screens\check_in_screen.dart`

Changes:
1. After successful check-in (checkedIn stage), add a **"Back to Event"** button alongside "View my table"
2. Auto-navigate back to event detail after 3 seconds (with user able to tap buttons before then)
3. The "I've already created one" button — change text to "Refresh" and just re-run `_checkIn()` with better loading state

### 2J. Add "My Table" mini-preview on Event Detail

When the user is checked in AND has an assignment, show a compact preview card directly on the Event Detail screen (above the action buttons):

```
┌──────────────────────────────────────────┐
│ 🪑 TABLE 1 — Innovation Hub              │
│ Seat 3 • Round 2 • 2 tablemates          │
│ Sarah Chen (92% match) • James Mwangi    │
│                                            │
│ [View Full Table →]                       │
└──────────────────────────────────────────┘
```

This gives users instant visibility without having to navigate to the My Table screen.

### 2K. Pull the tablemate Connect/Message buttons to use the same pattern as Connections screen

For consistency, tablemate action buttons should match the pattern used in the Connections list:
- If already connected: show "Message" button
- If not connected: show "Connect" button
- Always show "View Profile" button

---

## PART 3: WEB FIXES (React)

### 3A. Clean up duplicate API functions

File: `C:\Users\LIVEWAVE\SBcards\frontend\src\api\matching.ts`

Remove the duplicate `getEventTables`, `assignTables`, and `getMyTable` functions. Use only the ones from `api/tables.ts`. Update imports in `EventActivePage.tsx` and `MatchesPage.tsx` to use `api/tables.ts` instead.

### 3B. Fix EventActivePage to not duplicate organizer tools

File: `C:\Users\LIVEWAVE\SBcards\frontend\src\pages\events\EventActivePage.tsx`

This page should be the ATTENDEE dashboard, not a second organizer portal. Remove:
- The "Run Matching" button (organizer-only, belongs on EventOrganizerPage)
- The "Assign Tables" button (organizer-only)

Keep:
- Event info display
- Check-in status
- "Your Table" view using `getMyAssignment` (NOT `getMyTable`)
- "Your Matches" view

### 3C. Fix EventOrganizerPage to be the SINGLE organizer control center

File: `C:\Users\LIVEWAVE\SBcards\frontend\src\pages\events\EventOrganizerPage.tsx`

This should be the ONLY place organizers manage tables. Ensure it has:

**Section 1: Event Overview**
- Event name, date, location
- Current rotation round: "Round 2" badge
- Total participants / checked in / seated counts

**Section 2: Live Check-In Counter**
- Big number: "7 / 50 checked in"
- Progress bar
- List of checked-in attendees (name, time, avatar)
- "Check In Attendee" manual button (for organizer checking in someone by hand)

**Section 3: Table Grid**
- Visual grid of table boxes
- Each box shows: Table label, "3/6 seated"
- Each box is expandable to show seated attendees
- Color coding: green = has attendees, gray = empty

**Section 4: Action Buttons (clearly ordered)**
1. **[Setup Tables]** → Opens modal to configure table count, seats, rotation interval
2. **[Assign Tables]** → Disabled until checked-in attendees exist. Shows confirmation: "This will seat X attendees across Y tables. Continue?"
3. **[Rotate Tables]** → Disabled until at least 1 round has been completed. Shows: "This will advance to Round X+1 and reassign everyone."

**Section 5: Attendee Management**
- Full list of all participants
- Check-in status per person (✓ checked in / ○ not checked in)
- Table assignment per person (Table 1, Seat 3)
- "Check In" / "Check Out" buttons per person

### 3D. Fix the SetupTablesModal validation

File: `C:\Users\LIVEWAVE\SBcards\frontend\src\components\events\SetupTablesModal.tsx`

Change `rotation >= 0` to `rotation >= 1 || rotation === undefined` to match the backend validation.

### 3E. Add rotation round indicator everywhere

On both EventOrganizerPage and EventActivePage, show the current rotation round prominently:
- "Round 1" / "Round 2" / etc.
- When the organizer rotates, show a toast: "Advanced to Round 3 — everyone has new tablemates"

---

## PART 4: MOBILE — COMPLETE BUTTON STATE MACHINE

Here's the exact state machine for the Event Detail screen buttons:

```
eventMyStatus API response:
{
  joined: boolean,
  checkedIn: boolean,
  hasCard: boolean,
  currentRound: number,
  assignment: { tableNumber, seatNumber, label } | null
}

IF !joined:
  PRIMARY BUTTON: "Join Event" (gold gradient)
  HIDDEN: Everything else

IF joined && !checkedIn:
  PRIMARY BUTTON: "Check In" (gold gradient, QR scanner icon)
  SECONDARY: "Leave" (outline, red text)
  SECONDARY: "View Matches" (outline, brain icon)
  BADGE: "Joined ✓" (green chip)

IF joined && checkedIn && !assignment:
  PRIMARY BUTTON: "My Table" (gold gradient, shows "Not assigned yet")
  SECONDARY: "Leave" (outline, red text)
  SECONDARY: "View Matches" (outline, brain icon)
  BADGES: "Checked In ✓" (green chip) + "Round {currentRound}" (cyan chip)

IF joined && checkedIn && assignment:
  MINI TABLE CARD: (see 2J above — shows table name, seat, round, tablemates)
  PRIMARY BUTTON: "My Table" (gold gradient)
  SECONDARY: "Leave" (outline, red text)
  SECONDARY: "View Matches" (outline, brain icon)
  BADGES: "Checked In ✓" + "Round {currentRound}" + "Table {assignment.tableNumber}"

IF isOrganizer:
  ORGANIZER CARD: "Manage this event on the web portal" with "Open Portal" button
```

After ANY action (Join, Leave, Check In), immediately re-fetch `eventMyStatus` to update the button state.

---

## PART 5: COMPLETE DATA FLOW

```
Mobile: Event Detail loads
  → GET /events/:id (event data)
  → GET /events/:id/my-status (user's status)
  → GET /events/:id/participants (attendee list)
  → Render buttons based on status

Mobile: User taps "Join Event"
  → POST /events/:id/join
  → Re-fetch /events/:id/my-status
  → Buttons update to show "Check In"

Mobile: User taps "Check In"
  → Navigate to /events/:id/check-in
  → POST /events/:id/check-in
  → Show success → "View My Table" / "Back to Event"
  → On return, re-fetch /events/:id/my-status
  → Buttons update to show "My Table"

Web: Organizer clicks "Assign Tables"
  → POST /events/:eventId/assign-tables
  → Backend runs matching + seats everyone
  → Returns table assignments

Mobile: User opens "My Table"
  → GET /events/:eventId/my-assignment
  → Shows table name, seat, round, tablemates with scores + conversation starters

Web: Organizer clicks "Rotate Tables"
  → POST /events/:eventId/rotate
  → Backend advances round + re-seats everyone
  → Frontend shows toast

Mobile: User re-opens event detail or My Table
  → GET /events/:eventId/my-status → new round number
  → GET /events/:eventId/my-assignment → new tablemates
```

---

## IMPLEMENTATION ORDER

Do these in this exact order:

1. **Backend: Add organizer auth to POST /match** (5 min)
2. **Backend: Clean up orphaned assignments in setupTables** (5 min)
3. **Backend: Add GET /events/:id/my-status endpoint** (20 min)
4. **Backend: Fix N+1 in runMatching** (15 min)
5. **Mobile: Add new API endpoints** (5 min)
6. **Mobile: Add eventMyStatus model + provider** (15 min)
7. **Mobile: Rewrite Event Detail Screen with state machine** (45 min)
8. **Mobile: Fix My Table Screen (round badge, Connect/Profile/Message buttons)** (30 min)
9. **Mobile: Fix AI Match Screen (organizer-only generate, connect loading)** (15 min)
10. **Mobile: Fix Check-In Screen (back button, better flow)** (10 min)
11. **Mobile: Add table mini-preview on Event Detail** (15 min)
12. **Web: Remove duplicate API functions from matching.ts** (10 min)
13. **Web: Fix EventActivePage (remove organizer controls)** (15 min)
14. **Web: Polish EventOrganizerPage (clear sections, confirmation dialogs)** (30 min)
15. **Test the full flow end-to-end** (15 min)

---

## CRITICAL NOTES

- **Brand color is gold (#D4A853)** — use for primary buttons and accents
- **Dark theme** — backgrounds are #0A0A0B (bg), #141416 (surface1), #1C1C1F (surface2)
- **Use existing components**: SBButton, SBCard, SBChip, SBLoading, SBErrorWidget, SBAvatar
- **Flutter**: Use Riverpod for state management, GoRouter for navigation
- **React**: Use React Router for navigation, existing API client
- **Backend**: NestJS with Mongoose. Auth uses JWT + Firebase. Organizer check uses `event.creatorId == user.id` or `user.role == 'organizer' || 'admin'`
- **Do NOT break existing functionality** — only add/improve
- **Do NOT change API response shapes** — only add the new `/my-status` endpoint
- **Test by**: (1) build APK and install on device, (2) open web at sbcards.vercel.app, (3) run the full flow: join event → check in → organizer assigns tables → attendee sees table → organizer rotates → attendee sees new table
