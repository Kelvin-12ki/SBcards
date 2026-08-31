/**
 * Seed AI Matches + Table Seating for Women in STEM Summit 2026
 *
 * Run: node seed-matches-and-tables.js
 * 
 * Creates:
 * - 6 AI matches for kelvin with test users
 * - Event participations + check-ins for kelvin + 6 users
 * - Table assignments (people sitting at tables, ready to rotate)
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://ac-atjx7wr-shard-00-00.u573f0n.mongodb.net:27017,ac-atjx7wr-shard-00-01.u573f0n.mongodb.net:27017,ac-atjx7wr-shard-00-02.u573f0n.mongodb.net:27017/sbcards?authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const MONGO_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  auth: {
    username: 'sbcards_admin',
    password: '0718248297@Kia',
  },
};

async function seed() {
  const client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // ── 1. Find kelvin's account ──
    const kelvin = await db.collection('users').findOne({ email: 'kiagokelvin2@gmail.com' });
    if (!kelvin) {
      console.error('ERROR: kelvin account not found!');
      process.exit(1);
    }
    const kelvinId = kelvin._id.toString();
    console.log(`Found kelvin: ${kelvin.displayName} (${kelvinId})`);

    // Get kelvin's card
    const kelvinCard = await db.collection('cards').findOne({ userId: kelvinId });
    if (!kelvinCard) {
      console.error('ERROR: kelvin has no card!');
      process.exit(1);
    }
    const kelvinCardId = kelvinCard._id.toString();

    // ── 2. Find Women in STEM event ──
    const event = await db.collection('events').findOne({ name: 'Women in STEM Summit 2026' });
    if (!event) {
      console.error('ERROR: Women in STEM Summit 2026 not found!');
      process.exit(1);
    }
    const eventId = event._id.toString();
    console.log(`Found event: ${event.name} (${eventId})`);

    // ── 3. Get all fake users and their cards ──
    const fakeUsers = await db.collection('users')
      .find({ firebaseUid: /^fake_user/ })
      .toArray();

    console.log(`\nFound ${fakeUsers.length} fake users`);

    // Get cards for fake users
    const fakeUserIds = fakeUsers.map(u => u._id.toString());
    const fakeCards = await db.collection('cards')
      .find({ userId: { $in: fakeUserIds } })
      .toArray();

    const cardMap = {};
    for (const card of fakeCards) {
      cardMap[card.userId] = card._id.toString();
    }

    // ── 4. Clear old matches for this event ──
    console.log('\n🧹 Clearing old matches for this event...');
    await db.collection('matches').deleteMany({ eventId });
    console.log('  ✓ Cleared old matches');

    // ── 5. Create 6 AI matches (kelvin matched with 6 users) ──
    console.log('\n🎯 Creating 6 AI matches for kelvin...');

    const matchConfigs = [
      {
        user: fakeUsers[0], // Sarah Chen
        score: 0.92,
        sharedKeywords: ['React', 'TypeScript', 'AI/ML', 'Startup Ecosystem'],
        explanation: [
          'Both work in technology and have strong backend skills',
          'Shared interest in AI/ML and clean energy',
          'Complementary skills: she offers technical leadership, you offer security expertise',
        ],
        conversationStarters: [
          'What stack does TechCorp Africa use for their fintech products?',
          'Have you explored AI-powered security tools?',
          'How do you approach scalable architecture for African markets?',
        ],
      },
      {
        user: fakeUsers[1], // James Mwangi
        score: 0.85,
        sharedKeywords: ['Community Building', 'Social Impact', 'Kenya'],
        explanation: [
          'Both passionate about technology for social good in Kenya',
          'Strong networking goal alignment — he seeks security experts',
          'Shared interest in clean energy and mentorship',
        ],
        conversationStarters: [
          'How has Code4Africa adapted to the changing dev ecosystem?',
          'What security challenges do you see in civic tech?',
          'Would you be interested in mentoring aspiring developers?',
        ],
      },
      {
        user: fakeUsers[2], // Amina Hassan
        score: 0.88,
        sharedKeywords: ['Financial Inclusion', 'AI/ML', 'Mobile Development'],
        explanation: [
          'Strong overlap in financial technology interests',
          'Both have experience with mobile-first solutions',
          'She seeks cybersecurity mentors — perfect match for your expertise',
        ],
        conversationStarters: [
          'How does PesaPal handle mobile money security?',
          'What are the biggest fraud challenges in African fintech?',
          'Have you considered implementing AI-based fraud detection?',
        ],
      },
      {
        user: fakeUsers[3], // David Okafor
        score: 0.79,
        sharedKeywords: ['Python', 'Fintech', 'Nigeria', 'Architecture'],
        explanation: [
          'Both have deep fintech experience across different markets',
          'Complementary: he focuses on payments, you focus on security',
          'Shared interest in building scalable systems',
        ],
        conversationStarters: [
          'How does Paystack handle cross-border payment security?',
          'What lessons did you learn scaling from Lagos to global?',
          'What security frameworks do you recommend for fintech startups?',
        ],
      },
      {
        user: fakeUsers[4], // Grace Nakato
        score: 0.83,
        sharedKeywords: ['Clean Energy', 'IoT', 'Innovation'],
        explanation: [
          'Both passionate about technology innovation in East Africa',
          'Strong complementarity: her energy tech needs your security skills',
          'Shared interest in clean energy and sustainable tech',
        ],
        conversationStarters: [
          'How do you secure IoT devices in solar microgrids?',
          'What cybersecurity risks do you see in energy tech?',
          'Could security protocols improve energy distribution efficiency?',
        ],
      },
      {
        user: fakeUsers[5], // Emmanuel Adjei
        score: 0.76,
        sharedKeywords: ['Fintech', 'Mobile Development', 'West Africa'],
        explanation: [
          'Both have experience in African fintech markets',
          'He seeks technical mentors — your experience is highly relevant',
          'Complementary industries: telecom security meets fintech',
        ],
        conversationStarters: [
          'How do telecom and fintech security requirements differ?',
          'What mobile security frameworks work best for African markets?',
          'Would you be open to advising on security architecture?',
        ],
      },
    ];

    const matchIds = [];
    for (let i = 0; i < 6; i++) {
      const config = matchConfigs[i];
      const userId = fakeUsers[i]._id.toString();
      const cardId = cardMap[userId] || new ObjectId().toString();

      // Sort IDs lexicographically (required by the unique index)
      const [userAId, userBId] = [kelvinId, userId].sort();
      const [cardAId, cardBId] = userAId === kelvinId
        ? [kelvinCardId, cardId]
        : [cardId, kelvinCardId];

      const matchData = {
        eventId,
        userAId,
        userBId,
        cardAId,
        cardBId,
        overlapScore: config.score,
        sharedKeywords: config.sharedKeywords,
        factors: {
          skillComplementarityScore: Math.round((config.score + 0.05) * 100) / 100,
          industryRelevanceScore: Math.round((config.score - 0.05) * 100) / 100,
          interestOverlapScore: Math.round((config.score - 0.02) * 100) / 100,
          networkingGoalScore: Math.round((config.score + 0.03) * 100) / 100,
          connectionStatusScore: 1.0,
        },
        explanation: config.explanation,
        conversationStarters: config.conversationStarters,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('matches').insertOne(matchData);
      matchIds.push(result.insertedId);
      console.log(`  ✓ Match: kelvin ↔ ${config.user.displayName} (score: ${config.score})`);
    }

    // ── 6. Create event participations + check-ins for kelvin + 6 users ──
    console.log('\n👥 Creating participations & check-ins...');

    const allParticipants = [
      { userId: kelvinId, cardId: kelvinCardId, name: 'kelvin Kiago' },
      ...fakeUsers.slice(0, 6).map((u, i) => ({
        userId: u._id.toString(),
        cardId: cardMap[u._id.toString()] || new ObjectId().toString(),
        name: u.displayName,
      })),
    ];

    for (const p of allParticipants) {
      // Participation
      await db.collection('eventparticipations').findOneAndUpdate(
        { eventId, userId: p.userId },
        {
          $set: {
            eventId,
            userId: p.userId,
            cardId: p.cardId,
            isVisible: true,
            joinedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Check-in
      await db.collection('eventcheckins').findOneAndUpdate(
        { eventId, userId: p.userId },
        {
          $set: {
            eventId,
            userId: p.userId,
            checkedInAt: new Date(),
            method: 'qr',
          },
        },
        { upsert: true }
      );

      console.log(`  ✓ ${p.name} — participation + check-in`);
    }

    // ── 7. Create table assignments (seat people at tables for round 1) ──
    console.log('\n🪑 Creating table assignments (round 1)...');

    // Get table documents for this event
    const tables = await db.collection('tables')
      .find({ eventId })
      .sort({ tableNumber: 1 })
      .toArray();

    if (tables.length === 0) {
      console.error('ERROR: No tables found for this event!');
      process.exit(1);
    }

    console.log(`  Found ${tables.length} tables`);

    // Clear old assignments for round 1
    await db.collection('tableassignments').deleteMany({ eventId, rotationRound: 1 });
    console.log('  ✓ Cleared old round 1 assignments');

    // Seat all 7 participants (kelvin + 6 users) across tables
    // kelvin on Table 1, then spread users across Tables 1-4
    const seatingPlan = [
      { participantIdx: 0, tableIdx: 0, seat: 1 },  // kelvin → Table 1, Seat 1
      { participantIdx: 1, tableIdx: 0, seat: 2 },  // Sarah → Table 1, Seat 2
      { participantIdx: 2, tableIdx: 0, seat: 3 },  // James → Table 1, Seat 3
      { participantIdx: 3, tableIdx: 1, seat: 1 },  // Amina → Table 2, Seat 1
      { participantIdx: 4, tableIdx: 1, seat: 2 },  // David → Table 2, Seat 2
      { participantIdx: 5, tableIdx: 2, seat: 1 },  // Grace → Table 3, Seat 1
      { participantIdx: 6, tableIdx: 2, seat: 2 },  // Emmanuel → Table 3, Seat 2
    ];

    for (const assignment of seatingPlan) {
      const participant = allParticipants[assignment.participantIdx];
      const table = tables[assignment.tableIdx];

      await db.collection('tableassignments').insertOne({
        eventId,
        tableId: table._id.toString(),
        tableNumber: table.tableNumber,
        seatNumber: assignment.seat,
        userId: participant.userId,
        rotationRound: 1,
        assignedAt: new Date(),
      });

      // Update table currentCount
      await db.collection('tables').updateOne(
        { _id: table._id },
        { $set: { currentCount: assignment.seat } }
      );

      console.log(`  ✓ ${participant.name} → Table ${table.tableNumber} (${table.label}), Seat ${assignment.seat}`);
    }

    // ── 8. Also create round 0 assignments (so rotation has something to compare) ──
    console.log('\n🪑 Creating initial round 0 assignments...');

    await db.collection('tableassignments').deleteMany({ eventId, rotationRound: 0 });

    // Round 0: different seating arrangement
    const seatingRound0 = [
      { participantIdx: 0, tableIdx: 0, seat: 1 },  // kelvin → Table 1, Seat 1
      { participantIdx: 1, tableIdx: 1, seat: 1 },  // Sarah → Table 2, Seat 1
      { participantIdx: 2, tableIdx: 2, seat: 1 },  // James → Table 3, Seat 1
      { participantIdx: 3, tableIdx: 3, seat: 1 },  // Amina → Table 4, Seat 1
      { participantIdx: 4, tableIdx: 0, seat: 2 },  // David → Table 1, Seat 2
      { participantIdx: 5, tableIdx: 1, seat: 2 },  // Grace → Table 2, Seat 2
      { participantIdx: 6, tableIdx: 3, seat: 2 },  // Emmanuel → Table 4, Seat 2
    ];

    for (const assignment of seatingRound0) {
      const participant = allParticipants[assignment.participantIdx];
      const table = tables[assignment.tableIdx];

      await db.collection('tableassignments').insertOne({
        eventId,
        tableId: table._id.toString(),
        tableNumber: table.tableNumber,
        seatNumber: assignment.seat,
        userId: participant.userId,
        rotationRound: 0,
        assignedAt: new Date(Date.now() - 1800000), // 30 min ago
      });

      console.log(`  ✓ [Round 0] ${participant.name} → Table ${table.tableNumber} (${table.label}), Seat ${assignment.seat}`);
    }

    // Update event to round 1
    await db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { $set: { currentRotationRound: 1 } }
    );
    console.log(`\n  ✓ Event set to rotation round 1`);

    console.log('\n🎉 Seed complete!');
    console.log(`   - 6 AI matches for kelvin`);
    console.log(`   - ${allParticipants.length} participants checked in`);
    console.log(`   - Table assignments for round 0 and round 1`);
    console.log(`   - Ready to rotate!`);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
