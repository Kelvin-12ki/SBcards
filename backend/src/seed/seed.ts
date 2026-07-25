/**
 * Seed Script for SBCards Platform
 * Creates 50 test accounts with full data including users, cards, events,
 * participations, matches, organizations, memberships, and connections.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/seed/seed.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import mongoose, { Model, Schema } from 'mongoose';

// ──────────────────────────────────────────────────────────────
// 1. Define Schemas (mirroring NestJS entity decorators)
// ──────────────────────────────────────────────────────────────

// --- User Schema ---
const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    title: { type: String },
    industry: { type: String },
    company: { type: String },
    jobRole: { type: String },
    seniority: { type: String, enum: ['entry', 'mid', 'senior', 'executive'] },
    lookingFor: { type: [String] },
    offering: { type: [String] },
    skills: { type: [String] },
    interests: { type: [String] },
    bio: { type: String },
    whatsapp: { type: String },
    portfolioUrl: { type: String },
    socialLinks: { type: [{ label: String, url: String }] },
    location: { type: String },
    timezone: { type: String },
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- Card Schema ---
const CardSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    isDefault: { type: Boolean, default: false },
    fullName: { type: String, required: true },
    headline: { type: String },
    company: { type: String },
    role: { type: String },
    bio: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    linkedinUrl: { type: String },
    twitterUrl: { type: String },
    theme: { type: String, default: 'classic' },
    avatarUrl: { type: String },
    skills: { type: [{ name: String, category: String }] },
    interests: { type: [{ name: String }] },
  },
  { timestamps: true }
);

// --- Event Schema ---
const EventSchema = new Schema(
  {
    creatorId: { type: String, required: true },
    organizationId: { type: String, index: true },
    name: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, default: 'upcoming' },
    maxAttendees: { type: Number },
    tableCount: { type: Number, default: 5 },
    tableCapacity: { type: Number, default: 6 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- EventParticipation Schema ---
const EventParticipationSchema = new Schema(
  {
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    cardId: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);
EventParticipationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// --- Match Schema ---
const MatchSchema = new Schema(
  {
    eventId: { type: String, required: true, index: true },
    userAId: { type: String, required: true },
    userBId: { type: String, required: true },
    cardAId: { type: String, required: true },
    cardBId: { type: String, required: true },
    overlapScore: { type: Number, default: 0 },
    sharedKeywords: { type: [String], default: [] },
    factors: {
      type: Object,
      default: {
        industryScore: 0,
        skillsScore: 0,
        interestsScore: 0,
        complementarityScore: 0,
        seniorityScore: 0,
        locationScore: 0,
      },
    },
    explanation: { type: [String], default: [] },
    conversationStarters: { type: [String], default: [] },
  },
  { timestamps: true }
);
MatchSchema.index({ eventId: 1, userAId: 1, userBId: 1 }, { unique: true });

// --- Organization Schema ---
const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    logoUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    website: { type: String },
    ownerId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// --- OrganizationMembership Schema ---
const OrganizationMembershipSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    invitedBy: { type: String },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);
OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

// --- Connection Schema ---
const ConnectionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    connectedUserId: { type: String, required: true, index: true },
    connectedCardId: { type: String },
    eventId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'archived'],
      default: 'accepted',
    },
    notes: { type: String },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['qr_scan', 'manual', 'event_match', 'import'],
      default: 'qr_scan',
    },
    metAt: { type: Date },
    followUpDate: { type: Date },
    followUpNote: { type: String },
  },
  { timestamps: true }
);
ConnectionSchema.index({ userId: 1, connectedUserId: 1 }, { unique: true });

// ──────────────────────────────────────────────────────────────
// 2. Register Models
// ──────────────────────────────────────────────────────────────

const UserModel = mongoose.model('User', UserSchema);
const CardModel = mongoose.model('Card', CardSchema);
const EventModel = mongoose.model('Event', EventSchema);
const EventParticipationModel = mongoose.model('EventParticipation', EventParticipationSchema);
const MatchModel = mongoose.model('Match', MatchSchema);
const OrganizationModel = mongoose.model('Organization', OrganizationSchema);
const OrganizationMembershipModel = mongoose.model('OrganizationMembership', OrganizationMembershipSchema);
const ConnectionModel = mongoose.model('Connection', ConnectionSchema);

// ──────────────────────────────────────────────────────────────
// 3. Seed Data Definitions
// ──────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'AI/ML', 'Cybersecurity',
  'SaaS', 'CleanTech', 'E-commerce', 'Gaming', 'Media',
];

const ROLES = [
  'CTO', 'Product Manager', 'Software Engineer', 'Designer', 'Marketing Lead',
  'CEO', 'Founder', 'VP Engineering', 'Data Scientist', 'DevOps Engineer',
];

const SENIORITIES: Array<'entry' | 'mid' | 'senior' | 'executive'> = [
  'entry', 'mid', 'senior', 'executive',
];

const LOCATIONS = [
  'San Francisco', 'New York', 'London', 'Nairobi', 'Berlin',
  'Toronto', 'Singapore', 'Sydney', 'Lagos', 'Dubai',
];

const TIMEZONES: Record<string, string> = {
  'San Francisco': 'America/Los_Angeles',
  'New York': 'America/New_York',
  'London': 'Europe/London',
  'Nairobi': 'Africa/Nairobi',
  'Berlin': 'Europe/Berlin',
  'Toronto': 'America/Toronto',
  'Singapore': 'Asia/Singapore',
  'Sydney': 'Australia/Sydney',
  'Lagos': 'Africa/Lagos',
  'Dubai': 'Asia/Dubai',
};

const SKILLS_POOL = [
  'React', 'Python', 'Node.js', 'TypeScript', 'AWS',
  'Machine Learning', 'UI/UX Design', 'Product Strategy', 'Growth Marketing',
  'Blockchain', 'DevOps', 'Security', 'Data Analysis', 'Leadership', 'Sales',
];

const SKILL_CATEGORIES: Record<string, string> = {
  React: 'Frontend',
  Python: 'Backend',
  'Node.js': 'Backend',
  TypeScript: 'Frontend',
  AWS: 'Infrastructure',
  'Machine Learning': 'Data & AI',
  'UI/UX Design': 'Design',
  'Product Strategy': 'Product',
  'Growth Marketing': 'Marketing',
  Blockchain: 'Emerging Tech',
  DevOps: 'Infrastructure',
  Security: 'Infrastructure',
  'Data Analysis': 'Data & AI',
  Leadership: 'Business',
  Sales: 'Business',
};

const INTERESTS_POOL = [
  'AI', 'Startups', 'Sustainability', 'FinTech', 'Open Source',
  'Cloud Computing', 'Mobile Development', 'Web3', 'HealthTech', 'Education',
];

const LOOKING_FOR_POOL = [
  'investors', 'partners', 'clients', 'talent',
  'mentors', 'co-founders', 'advisors', 'suppliers',
];

const OFFERING_POOL = [
  'consulting', 'funding', 'mentorship', 'hiring',
  'partnerships', 'speaking', 'workshops',
];

// 50 unique company names
const COMPANY_NAMES = [
  'NexusPay', 'MedCore AI', 'EduSpark', 'DeepMind AI', 'ShieldNet',
  'CloudForge', 'GreenVolt', 'ShopWave', 'PixelPlay', 'StreamVault',
  'FinFlow', 'BioSync', 'Learnly', 'DataCortex', 'CyberShield',
  'SaaSGrid', 'EcoCharge', 'MarketPulse', 'GameStorm', 'MediaPulse',
  'QuickLedger', 'VitalTech', 'SkillBridge', 'NeuralNet', 'FirewallX',
  'AppStack', 'Solaris Tech', 'TrendCart', 'ArcadeLabs', 'PodcastHub',
  'CryptoBank', 'GenoMed', 'ClassCloud', 'TensorLabs', 'AuthGuard',
  'PlatformPro', 'WindWorks', 'B2B Commerce', 'VRPlay', 'ContentFly',
  'WealthWise', 'TheraTech', 'QuizLab', 'RoboMind', 'EncryptCo',
  'DashStack', 'FarmTech', 'DealFlow', 'BuildQuest', 'NewsWire',
];

// 50 names: 25 male + 25 female, diverse backgrounds
const USER_NAMES: Array<{ first: string; last: string; gender: 'male' | 'female' }> = [
  // African
  { first: 'Kwame', last: 'Osei', gender: 'male' },
  { first: 'Oluwaseun', last: 'Adebayo', gender: 'male' },
  { first: 'Chidi', last: 'Okonkwo', gender: 'male' },
  { first: 'Thabo', last: 'Mokoena', gender: 'male' },
  { first: 'Musa', last: 'Diallo', gender: 'male' },
  { first: 'Amara', last: 'Eze', gender: 'female' },
  { first: 'Zuri', last: 'Kimani', gender: 'female' },
  { first: 'Nneka', last: 'Okafor', gender: 'female' },
  { first: 'Ayanda', last: 'Nkosi', gender: 'female' },
  { first: 'Fatima', last: 'El-Sayed', gender: 'female' },
  // European
  { first: 'Lukas', last: 'Weber', gender: 'male' },
  { first: 'Matteo', last: 'Ricci', gender: 'male' },
  { first: 'Hugo', last: 'Lefevre', gender: 'male' },
  { first: 'Felix', last: 'Andersson', gender: 'male' },
  { first: 'Oliver', last: 'Smith', gender: 'male' },
  { first: 'Sofia', last: 'Johansson', gender: 'female' },
  { first: 'Elena', last: 'Petrova', gender: 'female' },
  { first: 'Clara', last: 'Müller', gender: 'female' },
  { first: 'Ingrid', last: 'Larsen', gender: 'female' },
  { first: 'Greta', last: 'Voss', gender: 'female' },
  // Asian
  { first: 'Hiroshi', last: 'Tanaka', gender: 'male' },
  { first: 'Wei', last: 'Chen', gender: 'male' },
  { first: 'Raj', last: 'Patel', gender: 'male' },
  { first: 'Kenji', last: 'Nakamura', gender: 'male' },
  { first: 'Ming', last: 'Zhang', gender: 'male' },
  { first: 'Yuki', last: 'Sato', gender: 'female' },
  { first: 'Mei', last: 'Wang', gender: 'female' },
  { first: 'Priya', last: 'Sharma', gender: 'female' },
  { first: 'Hana', last: 'Kim', gender: 'female' },
  { first: 'Ling', last: 'Tan', gender: 'female' },
  // American
  { first: 'James', last: 'Mitchell', gender: 'male' },
  { first: 'Michael', last: 'Rodriguez', gender: 'male' },
  { first: 'David', last: 'Thompson', gender: 'male' },
  { first: 'Alex', last: 'Turner', gender: 'male' },
  { first: 'Kevin', last: 'Brown', gender: 'male' },
  { first: 'Sarah', last: 'Johnson', gender: 'female' },
  { first: 'Emily', last: 'Davis', gender: 'female' },
  { first: 'Jessica', last: 'Williams', gender: 'female' },
  { first: 'Rachel', last: 'Garcia', gender: 'female' },
  { first: 'Lauren', last: 'Martinez', gender: 'female' },
  // Middle Eastern
  { first: 'Amir', last: 'Hosseini', gender: 'male' },
  { first: 'Omar', last: 'Al-Rashid', gender: 'male' },
  { first: 'Hassan', last: 'Siddiqui', gender: 'male' },
  { first: 'Zayn', last: 'Khalil', gender: 'male' },
  { first: 'Karim', last: 'Nasr', gender: 'male' },
  { first: 'Layla', last: 'Abdullah', gender: 'female' },
  { first: 'Nadia', last: 'Farouk', gender: 'female' },
  { first: 'Leila', last: 'Amini', gender: 'female' },
  { first: 'Yasmin', last: 'Chaudhry', gender: 'female' },
  { first: 'Rania', last: 'Bensalem', gender: 'female' },
];

// ──────────────────────────────────────────────────────────────
// 4. Helper Functions
// ──────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickRandomNWeighted<T>(arr: T[], min: number, max: number, weights?: number[]): T[] {
  // Simple weighted: if weights provided, higher weight = more likely to be included
  const count = min + Math.floor(Math.random() * (max - min + 1));
  let pool = [...arr];
  if (weights) {
    pool = pool.flatMap((item, idx) => {
      const w = weights[idx] || 1;
      return Array(Math.ceil(w * 3)).fill(item);
    });
  }
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return Array.from(new Set(shuffled)).slice(0, count);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generatePhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const mid = Math.floor(Math.random() * 900) + 100;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${area}) ${mid}-${last}`;
}

// ──────────────────────────────────────────────────────────────
// 5. Matching Algorithm
// ──────────────────────────────────────────────────────────────

interface UserData {
  _id: string;
  displayName?: string;
  industry?: string;
  skills?: string[];
  interests?: string[];
  lookingFor?: string[];
  offering?: string[];
  seniority?: string;
  location?: string;
}

interface CardData {
  _id: string;
  userId: string;
}

function computeMatch(userA: UserData, userB: UserData, cardA: CardData, cardB: CardData, eventId: string) {
  const ua = userA;
  const ub = userB;

  // 1. Industry Score (0 or 1)
  const industryScore = ua.industry && ub.industry && ua.industry === ub.industry ? 1 : 0;

  // 2. Skills Score (Jaccard-like overlap)
  const skillsA = ua.skills || [];
  const skillsB = ub.skills || [];
  const skillsIntersection = skillsA.filter((s) => skillsB.includes(s));
  const skillsUnion = Array.from(new Set([...skillsA, ...skillsB]));
  const skillsScore = skillsUnion.length > 0 ? skillsIntersection.length / skillsUnion.length : 0;

  // 3. Interests Score
  const interestsA = ua.interests || [];
  const interestsB = ub.interests || [];
  const interestsIntersection = interestsA.filter((i) => interestsB.includes(i));
  const interestsUnion = Array.from(new Set([...interestsA, ...interestsB]));
  const interestsScore = interestsUnion.length > 0 ? interestsIntersection.length / interestsUnion.length : 0;

  // 4. Complementarity Score: userA offering matches userB lookingFor and vice versa
  const offeringA = ua.offering || [];
  const lookingA = ua.lookingFor || [];
  const offeringB = ub.offering || [];
  const lookingB = ub.lookingFor || [];
  const complementA = offeringA.filter((o) => lookingB.includes(o)).length;
  const complementB = offeringB.filter((o) => lookingA.includes(o)).length;
  const maxComplement = Math.max(offeringA.length + offeringB.length, 1);
  const complementarityScore = (complementA + complementB) / maxComplement;

  // 5. Seniority Score
  const seniorityLevels: Record<string, number> = { entry: 0, mid: 1, senior: 2, executive: 3 };
  const sa = ua.seniority ? seniorityLevels[ua.seniority] ?? -1 : -1;
  const sb = ub.seniority ? seniorityLevels[ub.seniority] ?? -1 : -1;
  let seniorityScore = 0;
  if (sa >= 0 && sb >= 0) {
    const diff = Math.abs(sa - sb);
    if (diff === 0) seniorityScore = 0.5;
    else if (diff === 1) seniorityScore = 0.25;
    // else 0
  }

  // 6. Location Score
  const locationScore = ua.location && ub.location && ua.location === ub.location ? 1 : 0;

  // Weighted overlap score
  const weights = {
    industry: 0.2,
    skills: 0.2,
    interests: 0.15,
    complementarity: 0.15,
    seniority: 0.15,
    location: 0.15,
  };

  const overlapScore =
    weights.industry * industryScore +
    weights.skills * skillsScore +
    weights.interests * interestsScore +
    weights.complementarity * complementarityScore +
    weights.seniority * seniorityScore +
    weights.location * locationScore;

  // Shared keywords
  const sharedKeywords: string[] = [
    ...skillsIntersection,
    ...interestsIntersection,
  ];

  // Explanations
  const explanation: string[] = [];
  if (industryScore > 0) {
    explanation.push(`Both work in ${ua.industry}`);
  }
  if (skillsIntersection.length > 0) {
    explanation.push(`Share ${skillsIntersection.length} skill(s): ${skillsIntersection.join(', ')}`);
  }
  if (interestsIntersection.length > 0) {
    explanation.push(`Share ${interestsIntersection.length} interest(s): ${interestsIntersection.join(', ')}`);
  }
  if (complementA > 0) {
    explanation.push(`${ua.displayName || 'User A'} offers ${offeringA.filter((o) => lookingB.includes(o)).join(', ')} that ${ub.displayName || 'User B'} is looking for`);
  }
  if (complementB > 0) {
    explanation.push(`${ub.displayName || 'User B'} offers ${offeringB.filter((o) => lookingA.includes(o)).join(', ')} that ${ua.displayName || 'User A'} is looking for`);
  }
  if (seniorityScore > 0) {
    const levelLabel = seniorityScore >= 0.5 ? 'same seniority level' : 'adjacent seniority levels';
    explanation.push(`Both at ${levelLabel}`);
  }
  if (locationScore > 0) {
    explanation.push(`Both based in ${ua.location}`);
  }

  // Conversation starters
  const conversationStarters: string[] = [];
  if (industryScore > 0) {
    conversationStarters.push(`What trends are you seeing in ${ua.industry} right now?`);
  }
  if (skillsIntersection.length > 0) {
    conversationStarters.push(`I see you work with ${skillsIntersection[0]} — what's your favorite project you've built with it?`);
  }
  if (interestsIntersection.length > 0) {
    conversationStarters.push(`You're interested in ${interestsIntersection[0]} too — what drew you to it?`);
  }
  if (complementA > 0 || complementB > 0) {
    conversationStarters.push('It seems we could help each other out — want to chat about potential collaboration?');
  }
  if (locationScore > 0) {
    conversationStarters.push(`Being in ${ua.location} as well, any local meetups you'd recommend?`);
  }
  // Generic fallback if no starters
  if (conversationStarters.length === 0) {
    conversationStarters.push("What brings you to this event?");
    conversationStarters.push("What's the most exciting project you're working on?");
  }

  return {
    eventId,
    userAId: ua._id,
    userBId: ub._id,
    cardAId: cardA._id,
    cardBId: cardB._id,
    overlapScore: Math.round(overlapScore * 10000) / 10000,
    sharedKeywords,
    factors: {
      industryScore,
      skillsScore: Math.round(skillsScore * 10000) / 10000,
      interestsScore: Math.round(interestsScore * 10000) / 10000,
      complementarityScore: Math.round(complementarityScore * 10000) / 10000,
      seniorityScore,
      locationScore,
    },
    explanation,
    conversationStarters,
  };
}

// ──────────────────────────────────────────────────────────────
// 6. Main Seed Function
// ──────────────────────────────────────────────────────────────

async function seed() {
  const startTime = Date.now();
  console.log('🌱 SBCards Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/sbcards'}`);
  console.log('');

  // Connect
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sbcards';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
  console.log('');

  // Drop existing collections (idempotent)
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  const ourCollections = [
    'users', 'cards', 'events', 'eventparticipations', 'matches',
    'organizations', 'organizationmemberships', 'connections',
  ];

  for (const name of ourCollections) {
    if (collectionNames.includes(name)) {
      await db.dropCollection(name);
      console.log(`  🗑️  Dropped collection: ${name}`);
    }
  }
  console.log('✅ All collections cleared');
  console.log('');

  // ── Generate 50 Users ──────────────────────────────────────────
  console.log('📦 Creating 50 users...');

  const users: Array<{
    _id: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    title: string;
    industry: string;
    company: string;
    jobRole: string;
    seniority: string;
    lookingFor: string[];
    offering: string[];
    skills: string[];
    interests: string[];
    bio: string;
    whatsapp: string;
    portfolioUrl: string;
    socialLinks: { label: string; url: string }[];
    location: string;
    timezone: string;
    profileComplete: boolean;
  }> = [];

  // Distribute seniorities: ~12 entry, ~15 mid, ~15 senior, ~8 executive
  const seniorityDistribution: string[] = [
    ...Array(12).fill('entry'),
    ...Array(15).fill('mid'),
    ...Array(15).fill('senior'),
    ...Array(8).fill('executive'),
  ];

  // Shuffle distribution
  for (let i = seniorityDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seniorityDistribution[i], seniorityDistribution[j]] = [seniorityDistribution[j], seniorityDistribution[i]];
  }

  for (let i = 0; i < 50; i++) {
    const nameInfo = USER_NAMES[i];
    const displayName = `${nameInfo.first} ${nameInfo.last}`;
    const email = `${nameInfo.first.toLowerCase()}.${nameInfo.last.toLowerCase()}@test.com`;
    const firebaseUid = `seed_uid_${String(i + 1).padStart(3, '0')}`;

    // Assign industry based on index to ensure good distribution (5 per industry)
    const industry = INDUSTRIES[i % 10];

    // Assign role with some distribution
    const roleIdx = Math.floor(i / 5) % 10;
    const jobRole = ROLES[roleIdx];

    const company = COMPANY_NAMES[i];

    // Weighted skills: bias towards industry-relevant skills
    const industrySkillMap: Record<string, string[]> = {
      'FinTech': ['Blockchain', 'TypeScript', 'React', 'Node.js', 'Security'],
      'HealthTech': ['Python', 'Machine Learning', 'Security', 'Data Analysis', 'AWS'],
      'EdTech': ['React', 'Node.js', 'TypeScript', 'UI/UX Design', 'Product Strategy'],
      'AI/ML': ['Python', 'Machine Learning', 'Data Analysis', 'AWS', 'TypeScript'],
      'Cybersecurity': ['Security', 'DevOps', 'Python', 'AWS', 'Node.js'],
      'SaaS': ['React', 'TypeScript', 'Node.js', 'Product Strategy', 'Sales'],
      'CleanTech': ['Data Analysis', 'Machine Learning', 'Python', 'AWS', 'DevOps'],
      'E-commerce': ['React', 'Node.js', 'TypeScript', 'Growth Marketing', 'UI/UX Design'],
      'Gaming': ['React', 'Node.js', 'UI/UX Design', 'TypeScript', 'DevOps'],
      'Media': ['React', 'Node.js', 'TypeScript', 'Growth Marketing', 'UI/UX Design'],
    };

    const preferredSkills = industrySkillMap[industry] || [];
    const otherSkills = SKILLS_POOL.filter((s) => !preferredSkills.includes(s));
    const numPreferred = Math.min(3, preferredSkills.length);
    const countFromPreferred = 1 + Math.floor(Math.random() * numPreferred);
    const selectedPreferred = pickRandomN(preferredSkills, countFromPreferred, countFromPreferred);
    const selectedOther = pickRandomN(otherSkills, 0, 3 - selectedPreferred.length);
    const skills = [...selectedPreferred, ...selectedOther].slice(0, 5);

    // Weighted interests towards industry
    const industryInterestsMap: Record<string, string[]> = {
      'FinTech': ['FinTech', 'AI', 'Startups', 'Web3'],
      'HealthTech': ['HealthTech', 'AI', 'Sustainability', 'Startups'],
      'EdTech': ['Education', 'AI', 'Open Source', 'Startups'],
      'AI/ML': ['AI', 'Cloud Computing', 'Open Source', 'Startups'],
      'Cybersecurity': ['Cloud Computing', 'AI', 'Open Source', 'Startups'],
      'SaaS': ['Cloud Computing', 'Startups', 'AI', 'Mobile Development'],
      'CleanTech': ['Sustainability', 'AI', 'Startups', 'Cloud Computing'],
      'E-commerce': ['Mobile Development', 'AI', 'Startups', 'Cloud Computing'],
      'Gaming': ['Mobile Development', 'AI', 'Web3', 'Startups'],
      'Media': ['AI', 'Startups', 'Mobile Development', 'Open Source'],
    };
    const preferredInterests = industryInterestsMap[industry] || [];
    const otherInterests = INTERESTS_POOL.filter((i) => !preferredInterests.includes(i));
    const countPI = 1 + Math.floor(Math.random() * Math.min(2, preferredInterests.length));
    const selectedPI = pickRandomN(preferredInterests, countPI, countPI);
    const selectedOI = pickRandomN(otherInterests, 0, 4 - selectedPI.length);
    const interests = [...selectedPI, ...selectedOI].slice(0, 4);

    // lookingFor: 1-3 items
    const lookingFor = pickRandomN(LOOKING_FOR_POOL, 1, 3);

    // offering: 1-3 items
    const offering = pickRandomN(OFFERING_POOL, 1, 3);

    // Seniority
    const seniority = i < seniorityDistribution.length ? seniorityDistribution[i] : 'mid';

    // Location: cycle through locations
    const location = LOCATIONS[i % 10];
    const timezone = TIMEZONES[location];

    // Generate bio
    const bioTemplates = [
      `Passionate ${jobRole} specializing in ${skills.slice(0, 2).join(' and ')}. Building the future of ${industry.toLowerCase()} at ${company}.`,
      `${jobRole} at ${company} with expertise in ${skills.slice(0, 3).join(', ')}. Love connecting with fellow innovators in ${industry.toLowerCase()}.`,
      `Experienced ${jobRole} focused on leveraging ${skills[0]} and ${skills[1] || skills[0]} to drive impact in ${industry.toLowerCase()}. Open to ${lookingFor.slice(0, 2).join(' and ')}.`,
      `${seniority.charAt(0).toUpperCase() + seniority.slice(1)}-level ${jobRole} at ${company}. Building and scaling solutions in ${industry.toLowerCase()}. Let's connect!`,
      `${jobRole} by day, tech enthusiast by night. Working on cutting-edge ${industry.toLowerCase()} solutions at ${company}. Skilled in ${skills.slice(0, 2).join(', ')}.`,
    ];
    const bio = bioTemplates[i % bioTemplates.length];

    const whatsapp = `+${Math.floor(Math.random() * 100) + 1}${Math.floor(Math.random() * 10000000000)}`.slice(0, 16);

    // Social links
    const socialLinks = [
      { label: 'LinkedIn', url: `https://linkedin.com/in/${slugify(displayName)}` },
      { label: 'Twitter', url: `https://twitter.com/${slugify(displayName)}` },
    ];
    if (i % 3 === 0) {
      socialLinks.push({ label: 'GitHub', url: `https://github.com/${slugify(displayName)}` });
    }

    const userObjId = new mongoose.Types.ObjectId();
    const user = {
      _id: userObjId.toString(),
      firebaseUid,
      email,
      displayName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUid}`,
      title: `${jobRole} at ${company}`,
      industry,
      company,
      jobRole,
      seniority,
      lookingFor,
      offering,
      skills,
      interests,
      bio,
      whatsapp,
      portfolioUrl: `https://${slugify(displayName)}.dev`,
      socialLinks,
      location,
      timezone,
      profileComplete: true,
    };

    users.push(user);
  }

  const createdUsers = await UserModel.insertMany(users);
  console.log(`  ✅ ${createdUsers.length} users created`);
  console.log('');

  // ── Create 1 Organization ───────────────────────────────────────
  console.log('🏢 Creating organization...');

  const org = await OrganizationModel.create({
    name: 'TechConnect Global',
    slug: 'techconnect-global',
    description: 'A global community connecting tech professionals across industries for networking, mentorship, and collaboration. We host summits, mixers, and workshops worldwide.',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=techconnect',
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    website: 'https://techconnect.global',
    ownerId: createdUsers[0]._id.toString(),
    isActive: true,
  });
  console.log(`  ✅ Organization created: ${org.name}`);
  console.log('');

  // ── Create OrganizationMemberships (all users are members) ──────
  console.log('👥 Creating organization memberships...');

  const memberships = createdUsers.map((u, idx) => ({
    organizationId: org._id.toString(),
    userId: u._id.toString(),
    role: idx === 0 ? 'org_admin' : idx < 5 ? 'event_organizer' : idx < 10 ? 'staff' : 'attendee',
    isActive: true,
    invitedBy: createdUsers[0]._id.toString(),
    joinedAt: new Date(),
  }));
  await OrganizationMembershipModel.insertMany(memberships);
  console.log(`  ✅ ${memberships.length} memberships created`);
  console.log('');

  // ── Create 50 Cards (one per user) ─────────────────────────────
  console.log('💳 Creating cards...');

  const cards = createdUsers.map((u) => ({
    userId: u._id.toString(),
    isDefault: true,
    fullName: u.displayName,
    headline: `${u.jobRole} @ ${u.company}`,
    company: u.company,
    role: u.jobRole,
    bio: u.bio,
    email: u.email,
    phone: generatePhone(),
    website: u.portfolioUrl,
    linkedinUrl: `https://linkedin.com/in/${slugify(u.displayName)}`,
    twitterUrl: `https://twitter.com/${slugify(u.displayName)}`,
    theme: ['classic', 'modern', 'minimal', 'bold', 'elegant'][Math.floor(Math.random() * 5)],
    avatarUrl: u.avatarUrl,
    skills: (u.skills || []).map((s) => ({
      name: s,
      category: SKILL_CATEGORIES[s] || 'General',
    })),
    interests: (u.interests || []).map((i) => ({ name: i })),
  }));

  const createdCards = await CardModel.insertMany(cards);
  console.log(`  ✅ ${createdCards.length} cards created`);

  // Build a map: userId -> card
  const cardMap = new Map<string, typeof createdCards[0]>();
  for (const card of createdCards) {
    cardMap.set(card.userId, card);
  }
  console.log('');

  // ── Create 2 Events ────────────────────────────────────────────
  console.log('📅 Creating events...');

  const events = await EventModel.insertMany([
    {
      creatorId: createdUsers[0]._id.toString(),
      organizationId: org._id.toString(),
      name: 'AI & FinTech Summit 2026',
      description: 'A premier gathering of AI and FinTech innovators exploring the future of financial technology. Keynotes, panel discussions, and networking sessions focused on AI-driven solutions in banking, payments, and wealth management.',
      location: 'San Francisco',
      startDate: new Date('2026-09-15T09:00:00Z'),
      endDate: new Date('2026-09-17T18:00:00Z'),
      status: 'upcoming',
      maxAttendees: 200,
      tableCount: 8,
      tableCapacity: 6,
      isActive: false,
    },
    {
      creatorId: createdUsers[0]._id.toString(),
      organizationId: org._id.toString(),
      name: 'Global Startup Networking Mixer',
      description: 'An exciting virtual and in-person networking mixer bringing together startup founders, investors, and tech enthusiasts from around the globe. Speed networking, demos, and collaboration opportunities.',
      location: 'London',
      startDate: new Date('2026-07-20T14:00:00Z'),
      endDate: new Date('2026-07-20T20:00:00Z'),
      status: 'active',
      maxAttendees: 150,
      tableCount: 5,
      tableCapacity: 6,
      isActive: true,
    },
  ]);
  console.log(`  ✅ ${events.length} events created`);
  console.log('');

  // ── Create EventParticipations (50 per event = 100 total) ──────
  console.log('🎫 Creating event participations...');

  const participations: Array<{
    eventId: string;
    userId: string;
    cardId: string;
    isVisible: boolean;
    joinedAt: Date;
  }> = [];

  for (const event of events) {
    for (const user of createdUsers) {
      const card = cardMap.get(user._id.toString());
      if (!card) {
        console.warn(`  ⚠️  No card found for user ${user.displayName}, skipping participation`);
        continue;
      }
      participations.push({
        eventId: event._id.toString(),
        userId: user._id.toString(),
        cardId: card._id.toString(),
        isVisible: true,
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      });
    }
  }
  await EventParticipationModel.insertMany(participations);
  console.log(`  ✅ ${participations.length} participations created`);
  console.log('');

  // ── Compute Matches for each event ─────────────────────────────
  console.log('🔗 Computing matches...');

  // Build user data map for matching
  const userDataMap = new Map<string, UserData>();
  for (const u of createdUsers) {
    userDataMap.set(u._id.toString(), {
      _id: u._id.toString(),
      displayName: u.displayName,
      industry: u.industry,
      skills: u.skills,
      interests: u.interests,
      lookingFor: u.lookingFor,
      offering: u.offering,
      seniority: u.seniority,
      location: u.location,
    });
  }

  let totalMatches = 0;

  for (const event of events) {
    const eventId = event._id.toString();
    const eventParticipations = participations.filter((p) => p.eventId === eventId);
    const matches: any[] = [];

    for (let i = 0; i < eventParticipations.length; i++) {
      for (let j = i + 1; j < eventParticipations.length; j++) {
        const pA = eventParticipations[i];
        const pB = eventParticipations[j];
        const userA = userDataMap.get(pA.userId);
        const userB = userDataMap.get(pB.userId);
        const cardA = cardMap.get(pA.userId);
        const cardB = cardMap.get(pB.userId);

        if (!userA || !userB || !cardA || !cardB) continue;

        const cardDataA: CardData = { _id: cardA._id.toString(), userId: cardA.userId };
        const cardDataB: CardData = { _id: cardB._id.toString(), userId: cardB.userId };
        const match = computeMatch(userA, userB, cardDataA, cardDataB, eventId);

        if (match.overlapScore > 0.15) {
          matches.push(match);
        }
      }
    }

    if (matches.length > 0) {
      // Insert in batches of 500 to avoid large operations
      for (let i = 0; i < matches.length; i += 500) {
        const batch = matches.slice(i, i + 500);
        await MatchModel.insertMany(batch);
      }
    }
    totalMatches += matches.length;
    console.log(`  📊 Event "${event.name}": ${matches.length} matches found (score > 0.15)`);
  }
  console.log(`  ✅ ${totalMatches} total matches created`);
  console.log('');

  // ── Create 25 Connections (bi-directional = 50 docs) ───────────
  console.log('🤝 Creating connections...');

  // Randomly pair 25 unique user pairs
  const userIds = createdUsers.map((u) => u._id.toString());
  const usedPairs = new Set<string>();
  const connectionPairs: Array<{ a: string; b: string }> = [];

  while (connectionPairs.length < 25) {
    const idxA = Math.floor(Math.random() * userIds.length);
    let idxB = Math.floor(Math.random() * userIds.length);
    if (idxA === idxB) {
      idxB = (idxA + 1) % userIds.length;
    }
    const a = userIds[idxA];
    const b = userIds[idxB];
    const key = [a, b].sort().join(':');
    if (!usedPairs.has(key)) {
      usedPairs.add(key);
      connectionPairs.push({ a, b });
    }
  }

  const connections: Array<{
    userId: string;
    connectedUserId: string;
    connectedCardId: string;
    eventId: string;
    status: string;
    notes: string;
    tags: string[];
    isFavorite: boolean;
    source: string;
    metAt: Date;
    followUpDate?: Date;
    followUpNote?: string;
  }> = [];

  for (const pair of connectionPairs) {
    const cardA = cardMap.get(pair.a);
    const cardB = cardMap.get(pair.b);
    if (!cardA || !cardB) continue;

    // Pick a random event for the connection context
    const randomEventIdx = Math.floor(Math.random() * events.length);
    const eventId = events[randomEventIdx]._id.toString();

    // Connection A -> B
    connections.push({
      userId: pair.a,
      connectedUserId: pair.b,
      connectedCardId: cardB._id.toString(),
      eventId,
      status: 'accepted',
      notes: `Connected at ${events[randomEventIdx].name}`,
      tags: pickRandomN(['networking', 'potential_partner', 'same_industry', 'mentor', 'collaborator'], 1, 2),
      isFavorite: Math.random() > 0.7,
      source: 'event_match',
      metAt: randomEventIdx === 0
        ? new Date('2026-09-15T12:00:00Z')
        : new Date('2026-07-20T15:00:00Z'),
      followUpDate: Math.random() > 0.5
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : undefined,
      followUpNote: Math.random() > 0.5 ? 'Great conversation about potential collaboration' : undefined,
    });

    // Connection B -> A (bidirectional)
    connections.push({
      userId: pair.b,
      connectedUserId: pair.a,
      connectedCardId: cardA._id.toString(),
      eventId,
      status: 'accepted',
      notes: `Connected at ${events[randomEventIdx].name}`,
      tags: pickRandomN(['networking', 'potential_partner', 'same_industry', 'mentor', 'collaborator'], 1, 2),
      isFavorite: Math.random() > 0.7,
      source: 'event_match',
      metAt: randomEventIdx === 0
        ? new Date('2026-09-15T12:00:00Z')
        : new Date('2026-07-20T15:00:00Z'),
      followUpDate: Math.random() > 0.5
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : undefined,
      followUpNote: Math.random() > 0.5 ? 'Looking forward to exploring synergies' : undefined,
    });
  }

  await ConnectionModel.insertMany(connections);
  console.log(`  ✅ ${connections.length} connections created (25 bidirectional pairs)`);
  console.log('');

  // ── Summary ────────────────────────────────────────────────────
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete!');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');
  console.log('📊 Summary:');
  console.log(`  Users:                 ${createdUsers.length}`);
  console.log(`  Cards:                 ${createdCards.length}`);
  console.log(`  Organization:          1 (TechConnect Global)`);
  console.log(`  Organization Members:  ${memberships.length}`);
  console.log(`  Events:                ${events.length}`);
  console.log(`  Participations:        ${participations.length}`);
  console.log(`  Matches:               ${totalMatches}`);
  console.log(`  Connections:           ${connections.length}`);

  // Close connection
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
