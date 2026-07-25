export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrgRole =
  | 'super_admin'
  | 'org_admin'
  | 'event_organizer'
  | 'staff'
  | 'speaker'
  | 'exhibitor'
  | 'sponsor'
  | 'attendee';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  isActive: boolean;
  invitedBy?: string;
  joinedAt: string;
  user?: {
    id: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
  };
}
