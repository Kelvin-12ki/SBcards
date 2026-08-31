/**
 * NEXAS Test Data Seed Script
 * 
 * Run: node seed-test-data.js <MONGODB_URI>
 * Example: node seed-test-data.js "mongodb+srv://user:pass@cluster.mongodb.net/sbcards"
 * 
 * Creates:
 * - 5 realistic event profiles
 * - 10 fake users with professional profiles
 * - Tables + table assignments for the events
 * - Event participations
 * - Promotes your account to organizer role
 */

const { MongoClient, ObjectId } = require('mongodb');

// Direct connection string (bypasses SRV DNS resolution issues on Windows)
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

// ── Fake Users ──
const fakeUsers = [
  {
    firebaseUid: 'fake_user_001',
    email: 'sarah.chen@techcorp.com',
    displayName: 'Sarah Chen',
    title: 'Senior Software Engineer',
    company: 'TechCorp Africa',
    jobRole: 'Full-Stack Developer',
    industry: 'Technology',
    seniority: 'senior',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
    interests: ['AI/ML', 'Clean Energy', 'Startup Ecosystem'],
    bio: 'Passionate about building scalable solutions for African markets. 8+ years in fintech.',
    location: 'Nairobi, Kenya',
    lookingFor: ['Co-founders', 'Investors', 'Mentors'],
    offering: ['Technical Leadership', 'Architecture Review', 'Mentorship'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_002',
    email: 'james.mwangi@innovate.co.ke',
    displayName: 'James Mwangi',
    title: 'CEO & Founder',
    company: 'Innovate Kenya',
    jobRole: 'Chief Executive Officer',
    industry: 'Startup / Entrepreneurship',
    seniority: 'executive',
    skills: ['Business Strategy', 'Fundraising', 'Product Management', 'Team Building'],
    interests: ['EdTech', 'HealthTech', 'Social Impact'],
    bio: 'Building the next generation of African startups. YC W24 alumni.',
    location: 'Lagos, Nigeria',
    lookingFor: ['Investors', 'Technical Cofounders', 'Partners'],
    offering: ['Business Strategy', 'Funding Guidance', 'Market Entry'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_003',
    email: 'amina.hassan@dataflow.io',
    displayName: 'Amina Hassan',
    title: 'Data Science Lead',
    company: 'DataFlow Analytics',
    jobRole: 'Lead Data Scientist',
    industry: 'Data & Analytics',
    seniority: 'mid',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'R'],
    interests: ['Climate Tech', 'Agriculture Tech', 'Open Source'],
    bio: 'Turning data into actionable insights for African agriculture. PhD in Computer Science.',
    location: 'Kampala, Uganda',
    lookingFor: ['Research Partners', 'Speaking Opportunities', 'Collaborators'],
    offering: ['Data Strategy', 'ML Model Development', 'Research Insights'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_004',
    email: 'david.okafor@designhub.ng',
    displayName: 'David Okafor',
    title: 'UX Design Director',
    company: 'DesignHub West Africa',
    jobRole: 'Director of Design',
    industry: 'Design / Creative',
    seniority: 'senior',
    skills: ['UI/UX Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping'],
    interests: ['Mobile-First Design', 'Accessibility', 'Design Tokens'],
    bio: 'Designing beautiful, accessible digital experiences. 12 years crafting products that matter.',
    location: 'Accra, Ghana',
    lookingFor: ['Clients', 'Design Talent', 'Agency Partners'],
    offering: ['Design Consultation', 'Team Building', 'Brand Strategy'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_005',
    email: 'grace.nakato@greentech.ug',
    displayName: 'Grace Nakato',
    title: 'CTO & Co-Founder',
    company: 'GreenTech Solutions',
    jobRole: 'Chief Technology Officer',
    industry: 'Clean Energy / Sustainability',
    seniority: 'executive',
    skills: ['IoT', 'Embedded Systems', 'Solar Energy', 'Hardware Design'],
    interests: ['Renewable Energy', 'Climate Action', 'Women in STEM'],
    bio: 'Engineering clean energy solutions for off-grid communities across East Africa.',
    location: 'Dar es Salaam, Tanzania',
    lookingFor: ['Impact Investors', 'NGO Partners', 'Policy Makers'],
    offering: ['Clean Tech Innovation', 'IoT Solutions', 'Impact Assessment'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_006',
    email: 'emmanuel.adjei@fintech.gh',
    displayName: 'Emmanuel Adjei',
    title: 'Blockchain Developer',
    company: 'FinTech Ghana',
    jobRole: 'Lead Blockchain Engineer',
    industry: 'Fintech / Blockchain',
    seniority: 'mid',
    skills: ['Solidity', 'Rust', 'Smart Contracts', 'DeFi', 'Web3'],
    interests: ['Digital Payments', 'Financial Inclusion', 'Decentralized Identity'],
    bio: 'Building decentralized financial infrastructure for the unbanked.',
    location: 'Kumasi, Ghana',
    lookingFor: ['Technical Collaborators', 'Investors', 'Protocol Partners'],
    offering: ['Smart Contract Audits', 'DeFi Architecture', 'Token Economics'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_007',
    email: 'faith.kamau@edtech.co.ke',
    displayName: 'Faith Kamau',
    title: 'Product Manager',
    company: 'EduTech Kenya',
    jobRole: 'Senior Product Manager',
    industry: 'EdTech / Education',
    seniority: 'mid',
    skills: ['Product Strategy', 'Agile', 'User Analytics', 'Go-to-Market'],
    interests: ['Digital Literacy', 'STEM Education', 'Youth Empowerment'],
    bio: 'Making quality education accessible through technology. Former teacher turned PM.',
    location: 'Mombasa, Kenya',
    lookingFor: ['School Partners', 'Content Creators', 'Grant Writers'],
    offering: ['Product Strategy', 'User Research', 'EdTech Consulting'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_008',
    email: 'brian.tumwine@healthtech.ug',
    displayName: 'Brian Tumwine',
    title: 'Mobile Health Lead',
    company: 'HealthTech Uganda',
    jobRole: 'Engineering Manager',
    industry: 'HealthTech',
    seniority: 'senior',
    skills: ['Flutter', 'Kotlin', 'Health APIs', 'HIPAA Compliance', 'FHIR'],
    interests: ['Telemedicine', 'Health Data', 'Rural Healthcare'],
    bio: 'Building mobile health solutions that reach underserved communities.',
    location: 'Entebbe, Uganda',
    lookingFor: ['Hospital Partners', 'Health NGOs', 'Mobile Devs'],
    offering: ['Health App Development', 'Telemedicine Solutions', 'FHIR Integration'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_009',
    email: 'nadia.ali@cybersec.sa',
    displayName: 'Nadia Ali',
    title: 'Cybersecurity Analyst',
    company: 'CyberSec Africa',
    jobRole: 'Senior Security Consultant',
    industry: 'Cybersecurity',
    seniority: 'senior',
    skills: ['Penetration Testing', 'SOC Operations', 'SIEM', 'Compliance', 'Zero Trust'],
    interests: ['African Cyber Policy', 'Threat Intelligence', 'Security Awareness'],
    bio: 'Protecting African digital infrastructure. Certified CEH, OSCP, CISSP.',
    location: 'Johannesburg, South Africa',
    lookingFor: ['Enterprise Clients', 'Government Projects', 'Security Teams'],
    offering: ['Security Audits', 'Penetration Testing', 'Compliance Consulting'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
  {
    firebaseUid: 'fake_user_010',
    email: 'samuel.adeyemi@agritech.ng',
    displayName: 'Samuel Adeyemi',
    title: 'Agriculture Tech Engineer',
    company: 'AgriTech Nigeria',
    jobRole: 'Founding Engineer',
    industry: 'AgriTech',
    seniority: 'mid',
    skills: ['Drone Technology', 'Remote Sensing', 'Python', 'GIS', 'IoT Sensors'],
    interests: ['Precision Agriculture', 'Food Security', 'Rural Development'],
    bio: 'Using drones and AI to transform smallholder farming in West Africa.',
    location: 'Ibadan, Nigeria',
    lookingFor: ['Farm Cooperatives', 'Impact Investors', 'AgriTech Researchers'],
    offering: ['Drone Surveying', 'Crop Analytics', 'Farm Management Systems'],
    role: 'attendee',
    status: 'active',
    profileComplete: true,
  },
];

// ── Events ──
const now = new Date();
const events = [
  {
    name: 'Women in STEM Summit 2026',
    description: 'A celebration of women leading innovation in Science, Technology, Engineering, and Mathematics across Africa. Featuring keynotes, workshops, and our signature AI-powered networking sessions.',
    location: 'Nairobi Convention Centre, Nairobi, Kenya',
    startDate: new Date('2026-09-15T09:00:00Z'),
    endDate: new Date('2026-09-15T18:00:00Z'),
    status: 'upcoming',
    maxAttendees: 200,
    tableCount: 12,
    tableCapacity: 6,
    isActive: false,
    tableConfig: { enabled: true, seatsPerTable: 6, rotationIntervalMinutes: 20 },
    tables: [
      { number: 1, seatCount: 6, label: 'Innovation Hub' },
      { number: 2, seatCount: 6, label: 'Tech Pioneers' },
      { number: 3, seatCount: 6, label: 'Startup Corner' },
      { number: 4, seatCount: 6, label: 'Data Den' },
      { number: 5, seatCount: 6, label: 'Green Tech' },
      { number: 6, seatCount: 6, label: 'Fintech Zone' },
      { number: 7, seatCount: 6, label: 'Design Lab' },
      { number: 8, seatCount: 6, label: 'Health Hub' },
      { number: 9, seatCount: 6, label: 'EduTech Table' },
      { number: 10, seatCount: 6, label: 'Cybersecurity' },
      { number: 11, seatCount: 6, label: 'AgriTech' },
      { number: 12, seatCount: 6, label: 'BlockChain' },
    ],
    currentRotationRound: 0,
  },
  {
    name: 'Africa Tech Connect: Nairobi',
    description: 'Monthly networking mixer bringing together developers, designers, and founders from across East Africa. Casual conversations, real connections.',
    location: 'The Hub Karen, Nairobi, Kenya',
    startDate: new Date('2026-09-22T17:00:00Z'),
    endDate: new Date('2026-09-22T21:00:00Z'),
    status: 'upcoming',
    maxAttendees: 80,
    tableCount: 8,
    tableCapacity: 6,
    isActive: false,
    tableConfig: { enabled: true, seatsPerTable: 6 },
    tables: [
      { number: 1, seatCount: 6, label: 'Founders' },
      { number: 2, seatCount: 6, label: 'Developers' },
      { number: 3, seatCount: 6, label: 'Designers' },
      { number: 4, seatCount: 6, label: 'Investors' },
      { number: 5, seatCount: 6, label: 'Marketers' },
      { number: 6, seatCount: 6, label: 'HR & People' },
      { number: 7, seatCount: 6, label: 'Legal & Finance' },
      { number: 8, seatCount: 6, label: 'Open Table' },
    ],
    currentRotationRound: 0,
  },
  {
    name: 'FinTech Africa Conference',
    description: 'The premier fintech conference in East Africa. Exploring digital payments, blockchain, DeFi, and financial inclusion across the continent.',
    location: 'Kenyatta International Convention Centre, Nairobi',
    startDate: new Date('2026-10-10T08:00:00Z'),
    endDate: new Date('2026-10-11T17:00:00Z'),
    status: 'upcoming',
    maxAttendees: 500,
    tableCount: 20,
    tableCapacity: 8,
    isActive: false,
    tableConfig: { enabled: true, seatsPerTable: 8, rotationIntervalMinutes: 25 },
    tables: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      seatCount: 8,
      label: ['Digital Payments', 'Blockchain', 'InsurTech', 'Lending', 'WealthTech', 'RegTech', 'Payments', 'Neobanks', 'DeFi', 'CeFi', 'Crypto', 'Stablecoins', 'Cross-Border', 'Microfinance', 'Banking', 'Insurance', 'Capital Markets', 'Embedded Finance', 'Open Banking', 'CBDC'][i],
    })),
    currentRotationRound: 0,
  },
  {
    name: 'Clean Energy Innovation Forum',
    description: 'Connecting clean energy entrepreneurs with investors and policymakers. Solar, wind, hydro, and emerging technologies for sustainable development.',
    location: 'Uganda Manufacturers Association, Kampala',
    startDate: new Date('2026-10-25T09:00:00Z'),
    endDate: new Date('2026-10-25T16:00:00Z'),
    status: 'upcoming',
    maxAttendees: 120,
    tableCount: 10,
    tableCapacity: 6,
    isActive: false,
    tableConfig: { enabled: true, seatsPerTable: 6 },
    tables: [
      { number: 1, seatCount: 6, label: 'Solar Energy' },
      { number: 2, seatCount: 6, label: 'Wind Power' },
      { number: 3, seatCount: 6, label: 'Hydro Electric' },
      { number: 4, seatCount: 6, label: 'Battery Storage' },
      { number: 5, seatCount: 6, label: 'Smart Grid' },
      { number: 6, seatCount: 6, label: 'EV Charging' },
      { number: 7, seatCount: 6, label: 'Carbon Markets' },
      { number: 8, seatCount: 6, label: 'Policy & Regulation' },
      { number: 9, seatCount: 6, label: 'Impact Investing' },
      { number: 10, seatCount: 6, label: 'Community Energy' },
    ],
    currentRotationRound: 0,
  },
  {
    name: 'AgriTech Demo Day',
    description: 'Startups showcase precision agriculture, drone tech, and farm management solutions. Meet the founders transforming African agriculture.',
    location: 'iHub Nairobi, Nairobi, Kenya',
    startDate: new Date('2026-11-08T10:00:00Z'),
    endDate: new Date('2026-11-08T15:00:00Z'),
    status: 'upcoming',
    maxAttendees: 60,
    tableCount: 6,
    tableCapacity: 6,
    isActive: false,
    tableConfig: { enabled: true, seatsPerTable: 6, rotationIntervalMinutes: 15 },
    tables: [
      { number: 1, seatCount: 6, label: 'Precision Farming' },
      { number: 2, seatCount: 6, label: 'Drone Solutions' },
      { number: 3, seatCount: 6, label: 'Farm IoT' },
      { number: 4, seatCount: 6, label: 'Supply Chain' },
      { number: 5, seatCount: 6, label: 'Market Access' },
      { number: 6, seatCount: 6, label: 'Impact Investors' },
    ],
    currentRotationRound: 0,
  },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // ── 0. Clean up and fix indexes ──
    console.log('🧹 Cleaning previous test data...');
    const fakeUserIds = await db.collection('users')
      .find({ firebaseUid: /^fake_user/ })
      .toArray()
      .then(users => users.map(u => u._id.toString()));
    
    if (fakeUserIds.length > 0) {
      await db.collection('tableassignments').deleteMany({ userId: { $in: fakeUserIds } });
      await db.collection('eventcheckins').deleteMany({ userId: { $in: fakeUserIds } });
      await db.collection('eventparticipations').deleteMany({ userId: { $in: fakeUserIds } });
    }
    
    // Drop the problematic partial unique index on participationId if it exists
    try {
      await db.collection('tableassignments').dropIndex('participationId_1');
      console.log('  ✓ Dropped participationId unique index');
    } catch (e) {
      // Index doesn't exist or already dropped
    }
    console.log(`  ✓ Cleaned ${fakeUserIds.length} fake users' data`);
    
    // ── 1. Create fake users ──
    console.log('\n📝 Creating fake users...');
    const userIds = [];
    for (const userData of fakeUsers) {
      const result = await db.collection('users').findOneAndUpdate(
        { firebaseUid: userData.firebaseUid },
        { $set: userData },
        { upsert: true, returnDocument: 'after' }
      );
      const userId = result._id.toString();
      userIds.push(userId);
      console.log(`  ✓ ${userData.displayName} (${userId})`);
    }
    
    // ── 2. Create cards for each fake user ──
    console.log('\n🃏 Creating business cards...');
    const cardIds = [];
    for (let i = 0; i < userIds.length; i++) {
      const user = fakeUsers[i];
      const userId = userIds[i];
      const cardData = {
        userId,
        title: `${user.title} | ${user.company}`,
        name: user.displayName,
        email: user.email,
        company: user.company,
        jobRole: user.jobRole,
        industry: user.industry,
        skills: user.skills,
        bio: user.bio,
        location: user.location,
        template: ['modern', 'minimal', 'bold', 'creative', 'elegant'][i % 5],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('cards').findOneAndUpdate(
        { userId, isDefault: true },
        { $set: cardData },
        { upsert: true, returnDocument: 'after' }
      );
      cardIds.push(result._id.toString());
      console.log(`  ✓ Card for ${user.displayName}`);
    }
    
    // ── 3. Create events ──
    console.log('\n🎉 Creating events...');
    const eventIds = [];
    // Find the organizer's userId (kelvin's account)
    const organizer = await db.collection('users').findOne({ email: 'kiagokelvin2@gmail.com' });
    const creatorId = organizer ? organizer._id.toString() : userIds[0];
    
    // Promote user to organizer
    if (organizer) {
      await db.collection('users').updateOne(
        { _id: organizer._id },
        { $set: { role: 'organizer' } }
      );
      console.log(`  ✓ Promoted ${organizer.displayName || organizer.email} to organizer`);
    }
    
    for (const eventData of events) {
      const fullData = { ...eventData, creatorId };
      const result = await db.collection('events').findOneAndUpdate(
        { name: eventData.name },
        { $set: fullData },
        { upsert: true, returnDocument: 'after' }
      );
      const eventId = result._id.toString();
      eventIds.push(eventId);
      console.log(`  ✓ ${eventData.name} (${eventId})`);
    }
    
    // ── 4. Create table records for each event ──
    console.log('\n🪑 Creating tables...');
    for (let e = 0; e < eventIds.length; e++) {
      const eventId = eventIds[e];
      const event = events[e];
      for (const table of event.tables) {
        await db.collection('tables').findOneAndUpdate(
          { eventId, tableNumber: table.number },
          {
            $set: {
              eventId,
              tableNumber: table.number,
              label: table.label,
              capacity: table.seatCount,
              currentCount: 0,
            },
          },
          { upsert: true }
        );
      }
      console.log(`  ✓ ${event.tables.length} tables for "${event.name}"`);
    }
    
    // ── 5. Create event participations + table assignments for first event ──
    console.log('\n👥 Creating participations & table assignments...');
    const firstEventId = eventIds[0];
    
    // Assign 6 users to the first event (Women in STEM Summit)
    const participatingUsers = userIds.slice(0, 6);
    for (let i = 0; i < participatingUsers.length; i++) {
      const userId = participatingUsers[i];
      const cardId = cardIds[i];
      
      // Create participation
      await db.collection('eventparticipations').findOneAndUpdate(
        { eventId: firstEventId, userId },
        {
          $set: {
            eventId: firstEventId,
            userId,
            cardId,
            isVisible: true,
            joinedAt: new Date(),
          },
        },
        { upsert: true }
      );
      
      // Create check-in
      await db.collection('eventcheckins').findOneAndUpdate(
        { eventId: firstEventId, userId },
        {
          $set: {
            eventId: firstEventId,
            userId,
            checkedInAt: new Date(),
            method: 'qr',
          },
        },
        { upsert: true }
      );
      
      // Create table assignment
      const tableNumber = (i % 6) + 1; // Spread across tables 1-6
      const seatNumber = Math.floor(i / 6) + 1;
      const tableDoc = await db.collection('tables').findOne({ eventId: firstEventId, tableNumber });
      
      if (tableDoc) {
        // Delete existing assignment for this user in this round first
        await db.collection('tableassignments').deleteMany({
          eventId: firstEventId, userId, rotationRound: 1
        });
        await db.collection('tableassignments').insertOne({
          eventId: firstEventId,
          tableId: tableDoc._id.toString(),
          tableNumber,
          seatNumber: (i % 6) + 1,
          userId,
          participationId: new ObjectId().toString(), // unique value to avoid index conflict
          rotationRound: 1,
          assignedAt: new Date(),
        });
      }
      
      console.log(`  ✓ ${fakeUsers[i].displayName} → Table ${tableNumber}, Seat ${(i % 6) + 1}`);
    }
    
    // ── 6. Create some connections between users ──
    console.log('\n🤝 Creating connections...');
    const connections = [
      [0, 1], [0, 2], [1, 3], [2, 4], [3, 5],
      [0, 4], [1, 5], [2, 3], [4, 5], [0, 5],
    ];
    for (const [a, b] of connections) {
      // Only insert if the pair doesn't already exist in either direction
      const exists = await db.collection('connections').findOne({
        $or: [
          { userId: userIds[a], connectedUserId: userIds[b] },
          { userId: userIds[b], connectedUserId: userIds[a] },
        ],
      });
      if (!exists) {
        await db.collection('connections').insertOne({
          userId: userIds[a],
          connectedUserId: userIds[b],
          status: 'accepted',
          source: 'event_match',
          tags: [],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
    console.log(`  ✓ ${connections.length} connections created`);
    
    // ── 7. Create some messages ──
    console.log('\n💬 Creating conversations & messages...');
    const conversationPairs = [[0, 1], [0, 2], [2, 4]];
    for (const [a, b] of conversationPairs) {
      // Check if conversation already exists
      let conv = await db.collection('conversations').findOne({
        participants: { $all: [userIds[a], userIds[b]], $size: 2 },
      });
      
      if (!conv) {
        const convResult = await db.collection('conversations').insertOne({
          participants: [userIds[a], userIds[b]],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        conv = { _id: convResult.insertedId };
      }
      
      const convId = conv._id.toString();
      const sampleMessages = [
        { senderId: userIds[a], text: `Hey ${fakeUsers[b].displayName}! Great to connect on NEXAS.` },
        { senderId: userIds[b], text: `Thanks ${fakeUsers[a].displayName}! Love what you're doing at ${fakeUsers[a].company}.` },
        { senderId: userIds[a], text: 'We should definitely collaborate. Are you attending the Women in STEM Summit?' },
        { senderId: userIds[b], text: 'Absolutely! I heard the AI networking sessions are incredible. See you there!' },
      ];
      
      for (let m = 0; m < sampleMessages.length; m++) {
        await db.collection('messages').insertOne({
          conversationId: convId,
          senderId: sampleMessages[m].senderId,
          text: sampleMessages[m].text,
          type: 'text',
          read: true,
          createdAt: new Date(Date.now() - (sampleMessages.length - m) * 600000),
        });
      }
      console.log(`  ✓ Conversation with ${sampleMessages.length} messages`);
    }
    
    console.log('\n🎉 Seed complete!');
    console.log(`   - ${fakeUsers.length} users`);
    console.log(`   - ${cardIds.length} cards`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${connections.length} connections`);
    console.log(`   - 3 conversations with messages`);
    console.log(`   - Table assignments for "${events[0].name}"`);
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
