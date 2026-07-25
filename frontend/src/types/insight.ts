export interface Insight {
  id: string;
  userId: string;
  type: 'relationship_strength' | 'networking_suggestion' | 'follow_up_reminder' | 'common_connection' | 'mutual_interest' | 'profile_tip';
  title: string;
  description?: string;
  data: Record<string, any>;
  dismissed: boolean;
  createdAt: string;
}
