export interface SearchResult {
  type: 'user' | 'card' | 'event' | 'session' | 'exhibitor' | 'organization';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  score: number;
  url: string; // deep link to the entity
}

export interface SearchResponse {
  query: string;
  results: {
    users: SearchResult[];
    cards: SearchResult[];
    events: SearchResult[];
    sessions: SearchResult[];
    exhibitors: SearchResult[];
    organizations: SearchResult[];
  };
  totalCount: number;
}

export interface SearchFilters {
  industry?: string;
  skills?: string;
  company?: string;
  seniority?: string;
  date?: string;
  location?: string;
  tags?: string;
}
