import type { MatchFactor, MatchResult } from './match';

/**
 * `GET /events/:id/recommendations` returns the same `MatchResultDto[]` as
 * `GET /events/:id/matches`, just sliced to `limit`. Keep the domain name.
 */
export type Recommendation = MatchResult;

export type RecommendationFactor = MatchFactor;

/**
 * `GET /events/:id/recommendations/why/:targetUserId` envelope.
 * The API returns `{ match, userProfile, targetProfile, detailedExplanation,
 * detailedStarters }` — not a flat object.
 */
export interface WhyRecommendation {
  match: MatchResult;
  userProfile: MatchUserProfile;
  targetProfile: MatchUserProfile;
  detailedExplanation: string[];
  detailedStarters: string[];
}

/** Flat profile projection returned by the why-endpoint. */
export interface MatchUserProfile {
  id: string;
  displayName?: string;
  email?: string;
  company?: string;
  jobRole?: string;
  industry?: string;
  seniority?: string;
  location?: string;
  avatarUrl?: string;
  skills?: string[];
  interests?: string[];
  lookingFor?: string[];
  offering?: string[];
  bio?: string;
}
