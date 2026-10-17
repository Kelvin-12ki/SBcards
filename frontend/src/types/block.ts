export interface BlockedUserRow {
  id: string;
  userId: string;
  reason: string | null;
  createdAt: string | null;
  user: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    status?: string;
  } | null;
}

export interface BlockStatus {
  blockedByMe: boolean;
  blockedMe: boolean;
}
