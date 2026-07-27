export interface Skill {
  id?: string;
  name: string;
  category?: string;
}

export interface Interest {
  id?: string;
  name: string;
}

export interface WalletCard {
  card: Card;
  sender: {
    id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    bio?: string;
    industry?: string;
    jobRole?: string;
  };
}

export interface PublicCard {
  card: Card;
  owner: {
    id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    bio?: string;
  };
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
