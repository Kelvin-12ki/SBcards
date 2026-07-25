import React from 'react';
import { cn } from '@/utils/helpers';
import type { OrganizationMembership, OrgRole } from '@/types/organization';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/utils/helpers';

export interface MemberListProps {
  members: OrganizationMembership[];
  onRemove?: (userId: string) => void;
  onRoleChange?: (userId: string, role: OrgRole) => void;
  isOrgAdmin?: boolean;
  className?: string;
}

const roleVariantMap: Record<OrgRole, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  super_admin: 'danger',
  org_admin: 'warning',
  event_organizer: 'primary',
  staff: 'primary',
  speaker: 'success',
  exhibitor: 'primary',
  sponsor: 'warning',
  attendee: 'default',
};

const roleLabels: Record<OrgRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin',
  event_organizer: 'Organizer',
  staff: 'Staff',
  speaker: 'Speaker',
  exhibitor: 'Exhibitor',
  sponsor: 'Sponsor',
  attendee: 'Attendee',
};

const MemberList: React.FC<MemberListProps> = ({
  members,
  onRemove,
  onRoleChange,
  isOrgAdmin = false,
  className,
}) => {
  if (members.length === 0) {
    return (
      <div className={cn('text-center py-12 text-text-secondary text-sm', className)}>
        No members found.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {members.map((member) => {
        const initials = member.user?.displayName
          ? member.user.displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : member.user?.email?.slice(0, 2).toUpperCase() || '??';

        return (
          <div
            key={member.id}
            className="card-magical rounded-2xl border border-border-subtle p-4 transition-all duration-200 hover:border-neon-purple/30"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {member.user?.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt={member.user.displayName || 'Member'}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-bold text-text-secondary">
                  {initials}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {member.user?.displayName || 'Unknown User'}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {member.user?.email}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Joined {formatDate(member.joinedAt)}
                </p>
              </div>

              {/* Role */}
              <div className="flex-shrink-0">
                {isOrgAdmin && onRoleChange ? (
                  <select
                    value={member.role}
                    onChange={(e) => onRoleChange(member.userId, e.target.value as OrgRole)}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-2 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    {(Object.keys(roleLabels) as OrgRole[]).map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge variant={roleVariantMap[member.role] || 'default'}>
                    {roleLabels[member.role] || member.role}
                  </Badge>
                )}
              </div>

              {/* Remove */}
              {isOrgAdmin && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(member.userId)}
                  className="flex-shrink-0 rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-danger/20 hover:text-danger"
                  aria-label={`Remove ${member.user?.displayName || 'member'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemberList;
