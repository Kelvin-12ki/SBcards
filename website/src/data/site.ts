import type { CardData } from '../components/DigitalCard';

export const navLinks = [
{ label: 'Walkthrough', href: '#walkthrough' },
{ label: 'Features', href: '#features' },
{ label: 'Table Matching', href: '#tables' },
{ label: 'For organizers', href: '#organizers' },
{ label: 'Become an organizer', href: '#become-organizer' },
{ label: 'Pricing', href: '#pricing' },
{ label: 'FAQ', href: '#faq' }];


export const heroCard: CardData = {
  name: 'Barak Imani',
  role: 'Cyber Security Eng.',
  company: 'nexas',
  phone: '+254 11307113',
  email: 'barak.imani@nexas.app',
  website: 'nexas.app/amara',
  accent: 'cyan',
  seed: 71,
  isDefault: true
};

export const secondaryCards: CardData[] = [
{
  name: 'Barak Imani',
  role: 'Security Advisor',
  company: 'Ndoto Collective',
  phone: '+254 11307113',
  email: 'amara@ndotocollective.org',
  accent: 'gold',
  seed: 22
},
{
  name: 'Barak Imani',
  role: 'Speaker & Mentor',
  company: 'Women in STEM Africa',
  phone: '+254 11307113',
  email: 'speak@amaranjoroge.dev',
  accent: 'violet',
  seed: 148
}];


/**
 * Contexts the product is built for. Replaced the previous "trusted by" logo row,
 * which named real companies that are not customers.
 */
export const builtFor = [
'Conferences',
'Trade expos',
'Investor days',
'Meetups',
'Career fairs',
'Corporate offsites'];


/**
 * Capability highlights under the hero. These describe what the product does
 * rather than claiming usage metrics we cannot back up.
 */
export const heroStats = [
{ value: 'Multi-card', label: 'one account, many identities' },
{ value: 'QR + scan', label: 'connect without typing' },
{ value: 'AI seating', label: 'matched at the table, in person' }];


export interface TourScreen {
  id: string;
  tab: string;
  title: string;
  body: string;
}

export const tourScreens: TourScreen[] = [
{
  id: 'dashboard',
  tab: 'Dashboard',
  title: 'Every signal on one screen',
  body: 'Your default card, today’s scans, waiting requests, and the follow-ups about to go cold — ranked so the next move is obvious.'
},
{
  id: 'wallet',
  tab: 'Wallet',
  title: 'A searchable wallet, not a stack of paper',
  body: 'Every card you collect is indexed by name, company, title, and the event you met at. Search finds the person you half-remember.'
},
{
  id: 'ai',
  tab: 'AI Match',
  title: 'The matchmaker that reads the room',
  body: 'Relationship strength, mutual paths, and shared interests turn into concrete suggestions: who to message, and what to say.'
},
{
  id: 'scan',
  tab: 'Scan',
  title: 'Two seconds, one scan',
  body: 'Scan a QR code to send a connection request. Contact details, role, and company land in your wallet already tagged with the event.'
}];


export interface Feature {
  id: string;
  title: string;
  body: string;
  icon:
  'cards' |
  'qr' |
  'ai' |
  'org' |
  'wallet' |
  'chat' |
  'events' |
  'tables' |
  'exhibitors' |
  'heatmap' |
  'analytics' |
  'search' |
  'timeline' |
  'profile';
}

/**
 * The feature set, aligned to what actually exists in the backend modules and the
 * mobile app. The first entry is rendered as the large lead card.
 */
export const features: Feature[] = [
{
  id: 'multi',
  title: 'Multiple cards, one identity',
  body: 'Keep a work card, an advisory card, and a speaking card side by side. Set a default, switch in a tap, and share the right one for the room you are in.',
  icon: 'cards'
},
{
  id: 'qr',
  title: 'Share by QR, connect by scan',
  body: 'A crisp code for your card, and a scanner that turns someone else’s into a connection request.',
  icon: 'qr'
},
{
  id: 'wallet',
  title: 'A wallet you can search',
  body: 'Every card you collect, indexed by name, company, role, and the event where you met.',
  icon: 'wallet'
},
{
  id: 'events',
  title: 'Events and check-in',
  body: 'Join an event, check in at the door by QR, and browse the schedule of sessions from your phone.',
  icon: 'events'
},
{
  id: 'tables',
  title: 'AI table matching',
  body: 'Organizers seat checked-in attendees by skill, industry, and shared interests — then rotate the room so you meet new people each round.',
  icon: 'tables'
},
{
  id: 'ai',
  title: 'AI match and recommendations',
  body: 'Relationship strength, mutual paths, and shared interests become concrete suggestions about who to talk to next.',
  icon: 'ai'
},
{
  id: 'exhibitors',
  title: 'Exhibitor directory',
  body: 'Browse stands and sponsors, open an exhibitor’s profile, and connect without queueing for a paper card.',
  icon: 'exhibitors'
},
{
  id: 'heatmap',
  title: 'Venue heatmap',
  body: 'See where the room is actually dense, so you spend the coffee break where the people are.',
  icon: 'heatmap'
},
{
  id: 'insights',
  title: 'Insights and analytics',
  body: 'Scans, connections, and follow-up windows tracked over time — for you, and for organizers across a whole event.',
  icon: 'analytics'
},
{
  id: 'org',
  title: 'Organization spaces',
  body: 'Roll out branded cards across a team and keep titles accurate as people move.',
  icon: 'org'
},
{
  id: 'chat',
  title: 'Messaging built in',
  body: 'Reply where you met. No hunting for an email thread.',
  icon: 'chat'
},
{
  id: 'public',
  title: 'Public card pages',
  body: 'Your QR opens a web profile anyone can view and save — no app required on their side.',
  icon: 'profile'
}];


/** The physical-matching story, told as a sequence. */
export const tableMatchingSteps = [
{
  title: 'Organizer lays out the room',
  body: 'Table count, seats per table, and how many rotation rounds the session runs.'
},
{
  title: 'Attendees check in at the door',
  body: 'A QR scan at check-in is the gate. Only people actually in the room get seated.'
},
{
  title: 'Seats are assigned for diversity',
  body: 'Assignment balances skills, industry, and seniority across each table, then boosts shared interests.'
},
{
  title: 'The room rotates',
  body: 'Each new round penalises pairs who have already met, so the next table is a fresh set of faces.'
}];


export const steps = [
{
  number: '01',
  title: 'Build your card',
  body: 'Name, role, contact details, links, skills. Pick an accent and a generated geometric mark — no photo shoot required.'
},
{
  number: '02',
  title: 'Share it anywhere',
  body: 'Show your QR code or send a link. Scan someone else’s to send a connection request they can accept.'
},
{
  number: '03',
  title: 'Let the follow-ups find you',
  body: 'NEXAS tags each connection with the event you met at, flags the ones going quiet, and suggests the opener.'
}];


export interface Plan {
  id: string;
  name: string;
  monthly: number;
  annual: number;
  tagline: string;
  featured: boolean;
  cta: string;
  includes: string[];
}

/**
 * NOTE: prices are placeholders pending a real pricing decision. Feature lists
 * below are accurate to what the product does.
 */
export const plans: Plan[] = [
{
  id: 'free',
  name: 'Personal',
  monthly: 0,
  annual: 0,
  tagline: 'One card, unlimited scans. Enough for most conferences.',
  featured: false,
  cta: 'Start free',
  includes: [
  '1 digital card',
  'QR sharing & scanning',
  'Wallet with search',
  'Public card page',
  'Event check-in']

},
{
  id: 'pro',
  name: 'Pro',
  monthly: 9,
  annual: 7,
  tagline: 'For people who network for a living.',
  featured: true,
  cta: 'Start free trial',
  includes: [
  'Unlimited cards & accents',
  'AI Match and recommendations',
  'Insights and follow-up windows',
  'Exhibitor directory & venue heatmap',
  'Table matching at events',
  'Messaging']

},
{
  id: 'org',
  name: 'Organization',
  monthly: 24,
  annual: 19,
  tagline: 'Run events and roll out branded cards across a team.',
  featured: false,
  cta: 'Talk to sales',
  includes: [
  'Everything in Pro',
  'Web organizer portal',
  'Table layouts, seating & rotation',
  'Check-in desk and attendee list',
  'Event analytics',
  'Org-wide branded templates']

}];


export const faqs = [
{
  q: 'Does the person I share with need the app?',
  a: 'No. Your QR code opens a web card page anyone can view and save to their phone contacts. They only need NEXAS if they want a wallet of their own.'
},
{
  q: 'What is AI table matching?',
  a: 'At an event, organizers set up tables and attendees check in by QR. NEXAS then seats checked-in attendees to balance skills, industry, and seniority across each table while favouring shared interests — and each rotation round avoids re-seating people who have already met.'
},
{
  q: 'Who runs the organizer tools?',
  a: 'Organizers work on the web portal — table setup, the check-in desk, the attendee list, and seating live there. The mobile app is for attendees: check in, see my table, connect.'
},
{
  q: 'What does the AI actually use?',
  a: 'Only what is already in your account and the event: the cards you collected, when you last spoke, mutual connections, and the skills and interests listed on profiles. It does not scrape outside sources.'
},
{
  q: 'Can I keep work and personal networking apart?',
  a: 'That is what multiple cards are for. Each card has its own contact details and its own share link, so a speaking enquiry never lands in your work inbox.'
},
{
  q: 'Which platforms is the app on?',
  a: 'The mobile app ships on Android today, with iOS in progress. The organizer portal and public card pages run in any browser.'
}];


/* ---------------------------------------------------------------- walkthrough */

/**
 * Sample cast for the product walkthrough. Swap these for real accounts once the
 * site is wired to the app; the scenes read every value from here.
 */
export const walkthroughYou = {
  name: 'Barak Imani',
  email: 'barak.imani@nexas.app',
  password: 'nexas2026',
  headline: 'Securing fintech infrastructure',
  company: 'nexas',
  role: 'Cyber Security Eng.',
  phone: '+254 11307113',
  seed: 71
};

export const walkthroughThem = {
  name: 'Tunde Adeyemi',
  role: 'Head of Platform',
  company: 'Paysure',
  phone: '+234 803 220 118',
  email: 'tunde@paysure.io',
  seed: 12
};
