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
  /** 'user' is the legacy pre-roles value and behaves as 'attendee'. */
  role?: 'user' | 'attendee' | 'organizer' | 'admin';
  status?: 'active' | 'suspended' | 'banned';
  organizerRequest?: OrganizerRequest | null;
  createdAt?: string;
}

export interface OrganizerRequest {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  company?: string;
  jobTitle?: string;
  reason?: string;
  requestedAt?: string;
  reviewedAt?: string;
}

/** Can this user create and run events? */
export function canOrganize(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'organizer' || user?.role === 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
