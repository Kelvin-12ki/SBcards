export interface Skill {
  id?: string;
  name: string;
  category?: string;
}

export interface Interest {
  id?: string;
  name: string;
}

export interface Card {
  id: string;
  userId: string;
  fullName: string;
  headline?: string;
  company?: string;
  role?: string;
  bio?: string;
  email: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  theme?: string;
  avatarUrl?: string;
  isDefault: boolean;
  skills: Skill[];
  interests: Interest[];
  createdAt: string;
  updatedAt: string;
}
