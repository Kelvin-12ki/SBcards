/**
 * Business card OCR text parser.
 * Extracts structured contact data from raw OCR text.
 */

export interface ParsedCardData {
  fullName?: string;
  headline?: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

/** Email regex */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/** Phone regex (supports international, dashes, dots, spaces) */
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

/** Website URL regex */
const WEBSITE_RE = /https?:\/\/[^\s]+/i;

/** LinkedIn profile URL */
const LINKEDIN_RE = /linkedin\.com\/in\/[^\s]+/i;

/** Twitter/X profile URL */
const TWITTER_RE = /(?:twitter|x)\.com\/[^\s]+/i;

/**
 * ── OCR Error Correction ──
 * Fix common OCR misreads for phone numbers.
 */
function correctPhoneOCR(phone: string): string {
  return phone
    .replace(/O/g, '0')
    .replace(/o/g, '0')
    .replace(/l/g, '1')
    .replace(/I/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/[^+\d\s\-\.\(\)]/g, '');
}

/**
 * Fix common OCR misreads for email addresses.
 */
function correctEmailOCR(email: string): string {
  return email
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    // Fix l/1 confusion near @ — common OCR errors
    .replace(/l@/g, 'l@')
    .replace(/1@/g, 'l@')
    .replace(/@l/g, '@l')
    .replace(/@1/g, '@l');
}

/**
 * General OCR text cleanup.
 */
function correctOCRErrors(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Role keywords (lowercase) */
const ROLE_KEYWORDS = [
  'engineer', 'developer', 'designer', 'manager', 'director',
  'ceo', 'cto', 'founder', 'lead', 'consultant',
  'architect', 'analyst', 'coordinator', 'specialist',
  'president', 'vp', 'vice president', 'head of',
  'principal', 'partner', 'owner', 'co-founder',
  'software engineer', 'full stack', 'frontend', 'backend',
  'product manager', 'project manager', 'operations',
  'marketing', 'sales', 'support', 'administrator',
];

/** Company suffix indicators (including OCR-mangled variants) */
const COMPANY_SUFFIX_RE = /\b(inc|llc|ltd|corp|corporation|limited|llp|plc|gmbh|lnc|1nc|11c)\b/i;

/**
 * Score a line as a potential name.
 * Higher score = more likely to be a person's name.
 * Factors: titleCase word count, position penalty, word count penalty.
 * Returns a score (higher is better) or -1 if line should be excluded.
 */
function scoreAsName(line: string, lineIndex: number): number {
  const trimmed = line.trim();
  if (!trimmed) return -1;

  // Exclude URLs, emails, social links
  if (EMAIL_RE.test(trimmed)) return -1;
  if (WEBSITE_RE.test(trimmed)) return -1;
  if (LINKEDIN_RE.test(trimmed)) return -1;
  if (TWITTER_RE.test(trimmed)) return -1;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return -1;

  // Count title-case words (first letter uppercase, rest lowercase)
  const titleCaseWords = words.filter((w) => /^[A-Z][a-zÀ-ÖØ-öø-ÿ]/.test(w));
  const titleCaseCount = titleCaseWords.length;

  // If no title-case words, it's not a name
  if (titleCaseCount === 0) return -1;

  // Penalize if line contains role keywords
  const lower = trimmed.toLowerCase();
  if (ROLE_KEYWORDS.some((kw) => lower.includes(kw))) return -1;
  // Penalize if line looks like a company (has suffix or is all-caps)
  if (COMPANY_SUFFIX_RE.test(trimmed)) return -1;
  if (words.length >= 2 && words.every((w) => /^[A-Z]{2,}$/.test(w))) return -1;

  // Base score: titleCaseCount * 10
  let score = titleCaseCount * 10;

  // Position penalty: prefer earlier lines (index 0 = first line)
  // Subtract 2 * lineIndex so line 0 = 0 penalty, line 4 = -8 penalty
  score -= lineIndex * 2;

  // Word count penalty: 2-3 words is ideal, penalize 4+ or 5+
  if (words.length > 4) score -= 5;
  else if (words.length > 3) score -= 2;

  return score;
}

/**
 * Check if a line contains a role keyword.
 */
function containsRole(line: string): boolean {
  const lower = line.toLowerCase();
  return ROLE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Check if a line looks like a company name.
 */
function looksLikeCompany(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Must not be a URL or email
  if (EMAIL_RE.test(trimmed)) return false;
  if (WEBSITE_RE.test(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 5) return false;

  // First priority: contains company suffix (including OCR-mangled variants)
  if (COMPANY_SUFFIX_RE.test(trimmed)) return true;

  // Second priority: all-caps 2-5 word line (e.g., "ACME CORPORATION")
  if (words.length >= 2 && words.every((w) => /^[A-Z]{2,}$/.test(w))) {
    return true;
  }

  // Third priority: title-case 2-5 word line (e.g., "Acme Corporation")
  if (words.length >= 2 && words.every((w) => /^[A-Z][a-zÀ-ÖØ-öø-ÿ]/.test(w))) {
    return true;
  }

  return false;
}

/**
 * Ensure a URL has https:// prefix.
 */
function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Parse raw OCR text into structured card data.
 */
export function parseCardText(rawText: string): ParsedCardData {
  // Apply general OCR cleanup
  const cleaned = correctOCRErrors(rawText);

  let lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // ── Line rejoining ──
  // Merge adjacent lines if their combination forms a valid phone or email
  const rejoined: string[] = [];
  let skipNext = false;
  for (let i = 0; i < lines.length; i++) {
    if (skipNext) { skipNext = false; continue; }
    const current = lines[i];
    const next = lines[i + 1] ?? '';

    // Try joining with a space
    const joined = current + ' ' + next;
    if (PHONE_RE.test(joined) || EMAIL_RE.test(joined)) {
      rejoined.push(joined);
      skipNext = true;
    } else {
      rejoined.push(current);
    }
  }
  lines = rejoined;

  const result: ParsedCardData = {};
  const usedIndices = new Set<number>();

  // Track which lines we've already matched to avoid reusing them
  const remaining = () => lines.filter((_, i) => !usedIndices.has(i));
  const markUsed = (idx: number) => usedIndices.add(idx);

  // ── 1. Email ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(EMAIL_RE);
    if (match) {
      result.email = match[0];
      markUsed(i);
      break;
    }
  }

  // ── 2. Phone ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(PHONE_RE);
    if (match) {
      result.phone = match[0].trim();
      markUsed(i);
      break;
    }
  }

  // ── 3. Website (non-linkedin/twitter) ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(WEBSITE_RE);
    if (match) {
      const url = match[0];
      if (!LINKEDIN_RE.test(url) && !TWITTER_RE.test(url)) {
        result.website = ensureHttps(url);
        markUsed(i);
        break;
      }
    }
  }

  // ── 4. LinkedIn ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(LINKEDIN_RE);
    if (match) {
      result.linkedinUrl = ensureHttps(match[0]);
      markUsed(i);
      break;
    }
  }

  // ── 5. Twitter ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(TWITTER_RE);
    if (match) {
      result.twitterUrl = ensureHttps(match[0]);
      markUsed(i);
      break;
    }
  }

  // ── 6. Name — score-based detection (examine first 5 lines) ──
  {
    let bestName = '';
    let bestScore = -Infinity;
    let bestIndex = -1;
    const maxLines = Math.min(lines.length, 5);
    for (let i = 0; i < maxLines; i++) {
      if (usedIndices.has(i)) continue;
      const score = scoreAsName(lines[i], i);
      if (score > bestScore) {
        bestScore = score;
        bestName = lines[i].trim();
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) {
      result.fullName = bestName;
      markUsed(bestIndex);
    }
  }

  // ── 7. Role ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    // Avoid picking lines that look like a name (already scored) or company
    const isName = scoreAsName(lines[i], i) > 0;
    const isCompany = looksLikeCompany(lines[i]);
    if (containsRole(lines[i]) && !isName && !isCompany) {
      result.role = lines[i].trim();
      markUsed(i);
      break;
    }
  }

  // ── 8. Company ──
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    if (looksLikeCompany(lines[i])) {
      result.company = lines[i].trim();
      markUsed(i);
      break;
    }
  }

  // ── 9. Headline (first remaining line that's not too long) ──
  const finalRemaining = remaining();
  if (finalRemaining.length > 0 && !result.headline) {
    const candidate = finalRemaining[0].trim();
    if (candidate.length < 120) {
      result.headline = candidate;
    }
  }

  // ── Post-extraction OCR corrections ──
  if (result.phone) {
    result.phone = correctPhoneOCR(result.phone);
  }
  if (result.email) {
    result.email = correctEmailOCR(result.email);
  }
  // General cleanup on all string fields
  for (const key of Object.keys(result) as (keyof ParsedCardData)[]) {
    const val = result[key];
    if (typeof val === 'string') {
      result[key] = correctOCRErrors(val) as any;
    }
  }

  return result;
}
