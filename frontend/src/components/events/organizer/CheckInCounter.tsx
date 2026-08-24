import React from 'react';
import { cn } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { CheckInRecord } from '@/types/table';

export interface CheckInCounterProps {
  checkIns: CheckInRecord[];
  /** Total expected attendees (event participants). */
  expected?: number;
  onCheckOut?: (userId: string) => void;
  className?: string;
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CheckInCounter: React.FC<CheckInCounterProps> = ({
  checkIns,
  expected,
  onCheckOut,
  className,
}) => {
  const count = checkIns.length;
  // Guard the divide: expected can be 0 or undefined before participants load.
  const pct = expected && expected > 0
    ? Math.min(100, Math.round((count / expected) * 100))
    : 0;

  return (
    <div className={cn('card-magical rounded-2xl p-5', className)}>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-bold text-gradient-magical">
          Check-in
        </h3>
        <div className="text-right">
          <span className="font-display text-2xl font-bold text-text-primary">
            {count}
          </span>
          <span className="text-sm text-text-secondary">
            {expected && expected > 0 ? ` / ${expected}` : ''} checked in
          </span>
        </div>
      </div>

      {expected && expected > 0 ? (
        <div
          className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${count} of ${expected} attendees checked in`}
        >
          <div
            className="h-full gradient-magical transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      {count === 0 ? (
        <p className="py-6 text-center text-sm text-text-secondary">
          Nobody has checked in yet. Arrivals appear here automatically.
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {checkIns.map((c) => (
            <li
              key={c.userId}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-2.5"
            >
              <Avatar
                src={c.avatarUrl}
                alt={c.userName}
                fallbackInitials={initialsOf(c.userName)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {c.userName}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatTime(c.checkedInAt)} · {c.method}
                </p>
              </div>
              {!c.hasCard && (
                <Badge variant="warning" className="flex-shrink-0">
                  No card
                </Badge>
              )}
              {onCheckOut && (
                <button
                  type="button"
                  onClick={() => onCheckOut(c.userId)}
                  className="flex-shrink-0 rounded-lg px-2 py-1 text-xs text-text-secondary transition hover:bg-surface-3 hover:text-danger"
                  aria-label={`Check out ${c.userName}`}
                >
                  Undo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CheckInCounter;
