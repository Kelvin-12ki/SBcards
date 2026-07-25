export interface RecommendationFactor {
  name: string;
  score: number;
  explanation: string;
}

export interface RecommendationUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  industry?: string;
  seniority?: string;
  skills?: string[];
  interests?: string[];
  location?: string;
}

export interface Recommendation {
  id: string;
  eventId: string;
  targetUserId: string;
  targetUser: RecommendationUser;
  matchScore: number;
  factors: RecommendationFactor[];
  explanations: string[];
  conversationStarters: string[];
  sharedKeywords?: string[];
}

export interface WhyRecommendation {
  id: string;
  eventId: string;
  targetUserId: string;
  targetUser: RecommendationUser;
  currentUser: RecommendationUser;
  matchScore: number;
  factors: RecommendationFactor[];
  explanations: string[];
  conversationStarters: string[];
  sharedKeywords?: string[];
}
