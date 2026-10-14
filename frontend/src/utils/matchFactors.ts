import type { MatchFactor, MatchFactorKey, MatchFactorScores } from '@/types/match';

export interface MatchFactorMeta {
  key: MatchFactorKey;
  label: string;
  color: string;
  bg: string;
  keywords: string[];
}

/**
 * Single source of truth for match-factor presentation. Previously this map
 * was duplicated (and diverged) across EnhancedMatchCard, MatchDetailPage and
 * MatchExplanation.
 */
export const MATCH_FACTORS: readonly MatchFactorMeta[] = [
  {
    key: 'skillComplementarityScore',
    label: 'Skills Match',
    color: 'bg-neon-cyan',
    bg: 'bg-neon-cyan/20',
    keywords: ['skill', 'expertise', 'technical', 'complement', 'looking for'],
  },
  {
    key: 'industryRelevanceScore',
    label: 'Industry',
    color: 'bg-gold',
    bg: 'bg-gold/20',
    keywords: ['industry', 'sector', 'field', 'cross-industry'],
  },
  {
    key: 'interestOverlapScore',
    label: 'Interests',
    color: 'bg-neon-pink',
    bg: 'bg-neon-pink/20',
    keywords: ['interest', 'passion', 'hobby', 'enjoy'],
  },
  {
    key: 'networkingGoalScore',
    label: 'Goals',
    color: 'bg-neon-purple',
    bg: 'bg-neon-purple/20',
    keywords: ['goal', 'offer', 'mentorship', 'partnership'],
  },
  {
    key: 'connectionStatusScore',
    label: 'New Connection',
    color: 'bg-success',
    bg: 'bg-success/20',
    keywords: ['connection', 'new', 'opportunity'],
  },
] as const;

const META_BY_KEY = new Map<string, MatchFactorMeta>(
  MATCH_FACTORS.map((m) => [m.key, m]),
);

export const getFactorMeta = (key: string): MatchFactorMeta | undefined =>
  META_BY_KEY.get(key);

export const factorColor = (key: string): string =>
  META_BY_KEY.get(key)?.color ?? 'bg-neon-cyan';

export const factorBg = (key: string): string =>
  META_BY_KEY.get(key)?.bg ?? 'bg-surface-3';

export const factorLabel = (key: string): string =>
  META_BY_KEY.get(key)?.label ?? key;

/**
 * Normalise the wire format (a flat object of five scores) into the ordered
 * row list the factor charts expect.
 */
export const factorList = (scores?: MatchFactorScores): MatchFactor[] => {
  if (!scores) return [];
  return MATCH_FACTORS.map((meta) => ({
    key: meta.key,
    label: meta.label,
    score: Number(scores[meta.key] ?? 0),
  })).filter((f) => Number.isFinite(f.score));
};

/**
 * Which factor does this explanation sentence most likely belong to?
 * The API returns explanations as a flat string[] with no attribution, so the
 * association has to be inferred. Returns '' when nothing matches.
 */
export const factorKeyForExplanation = (explanation: string): string => {
  const lower = explanation.toLowerCase();
  for (const meta of MATCH_FACTORS) {
    if (meta.keywords.some((kw) => lower.includes(kw))) return meta.key;
  }
  return '';
};

/** 0-1 score -> rounded percentage, clamped to 0-100. */
export const scorePercent = (score: number): number => {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100)));
};

/** Shared score-to-colour thresholds (used by the ring and the bar). */
export const scoreTone = (score: number): 'high' | 'mid' | 'low' => {
  const pct = scorePercent(score);
  if (pct >= 80) return 'high';
  if (pct >= 60) return 'mid';
  return 'low';
};
