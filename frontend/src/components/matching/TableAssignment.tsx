import React from 'react';
import { cn } from '@/utils/helpers';
import type { MyAssignment } from '@/types/table';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export interface TableAssignmentProps {
  /**
   * The viewer's own seat for the CURRENT rotation round, from
   * `/events/:id/my-assignment`.
   *
   * Previously fed by the legacy `/my-table`, which returns a whole-table
   * snapshot with no seat, no round and no per-pair match data — so a rotated
   * attendee had no way to tell a stale view from a live one.
   */
  assignment: MyAssignment | null;
  loading?: boolean;
  className?: string;
}

const TableAssignment: React.FC<TableAssignmentProps> = ({
  assignment,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <EmptyState
        icon={
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        }
        title="No table assigned"
        description="Tables have not been assigned yet. Check back after the organizer runs table assignments."
      />
    );
  }

  const { tableNumber, label, seatNumber, rotationRound, tablemates } = assignment;

  return (
    <div className={cn('card-magical rounded-2xl p-5 shimmer-magical', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-gradient-magical">
            {label || `Table ${tableNumber}`}
          </h3>
          <p className="text-sm text-text-secondary">Seat {seatNumber}</p>
        </div>
        <span className="flex-shrink-0 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold text-neon-cyan">
          Round {rotationRound}
        </span>
      </div>

      {tablemates.length === 0 ? (
        <p className="rounded-xl border border-border-subtle bg-surface-2 p-3 text-sm text-text-secondary">
          You&apos;re the first one here. Others will appear as they&apos;re seated.
        </p>
      ) : (
        <div className="space-y-3">
          {tablemates.map((mate) => {
            const initials = mate.userName
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const subtitle = [mate.jobRole, mate.company].filter(Boolean).join(' · ');
            const score = Math.round((mate.overlapScore ?? 0) * 100);

            return (
              <div
                key={mate.userId}
                className="rounded-xl border border-border-subtle bg-surface-2 p-3"
              >
                <div className="flex items-center gap-3">
                  {mate.avatarUrl ? (
                    <img
                      src={mate.avatarUrl}
                      alt=""
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-xs font-semibold text-white">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {mate.userName}
                    </p>
                    {subtitle && (
                      <p className="truncate text-xs text-text-secondary">{subtitle}</p>
                    )}
                  </div>
                  {score > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-neon-cyan/10 px-2.5 py-1 text-xs font-semibold text-neon-cyan">
                      {score}%
                    </span>
                  )}
                </div>

                {mate.sharedKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mate.sharedKeywords.slice(0, 6).map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] text-text-secondary"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                {mate.conversationStarters.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {mate.conversationStarters.slice(0, 2).map((s) => (
                      <li key={s} className="flex gap-2 text-xs text-text-secondary">
                        <span aria-hidden="true">💡</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableAssignment;
