export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  // Rich profile fields
  title?: string;
  industry?: string;
  company?: string;
  jobRole?: string;
  seniority?: 'entry' | 'mid' | 'senior' | 'executive';
  lookingFor?: string[];
  offering?: string[];
  skills?: string[];
  interests?: string[];
  bio?: string;
  whatsapp?: string;
  portfolioUrl?: string;
  socialLinks?: { label: string; url: string }[];
  location?: string;
  timezone?: string;
  profileComplete?: boolean;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
