/**
 * Raw `Match` document as stored in Mongo. Only `POST /events/:id/match`
 * (runMatching) returns this shape.
 */
export interface Match {
  id: string;
  eventId: string;
  userAId: string;
  userBId: string;
  cardAId: string;
  cardBId: string;
  overlapScore: number;
  sharedKeywords: string[];
  factors: MatchFactorScores;
  explanation: string[];
  conversationStarters: string[];
  createdAt: string;
}

/** Multi-factor breakdown, 0-1 each. Object (not array) on the wire. */
export interface MatchFactorScores {
  skillComplementarityScore: number;
  industryRelevanceScore: number;
  interestOverlapScore: number;
  networkingGoalScore: number;
  connectionStatusScore: number;
}

export type MatchFactorKey = keyof MatchFactorScores;

export interface MatchedUserProfile {
  displayName?: string;
  company?: string;
  jobRole?: string;
  industry?: string;
  avatarUrl?: string;
  skills?: string[];
  interests?: string[];
}

export interface MatchResultTableAssignment {
  tableId: string;
  tableNumber: number;
  label?: string;
}

/**
 * `MatchResultDto` — returned by `GET /events/:id/matches` and
 * `GET /events/:id/recommendations`.
 */
export interface MatchResult {
  matchId: string;
  userId: string;
  userName: string;
  cardId: string;
  overlapScore: number;
  sharedKeywords: string[];
  factors?: MatchFactorScores;
  explanation?: string[];
  conversationStarters?: string[];
  matchedUserProfile?: MatchedUserProfile;
  tableAssignment?: MatchResultTableAssignment;
}

/** One row of the factor breakdown after normalisation for display. */
export interface MatchFactor {
  key: MatchFactorKey;
  label: string;
  score: number;
}
