export interface Activity {
  id: string;
  userId: string;
  action: string;
  metadata: Record<string, any>;
  public: boolean;
  createdAt: string;
  // Enriched
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}
