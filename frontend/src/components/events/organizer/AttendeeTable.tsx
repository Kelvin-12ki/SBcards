import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/helpers';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { initialsOf } from './CheckInCounter';
import type { TableAttendee } from '@/types/table';

type SortKey = 'userName' | 'company' | 'industry' | 'seniority' | 'hasCard';
type SortDir = 'asc' | 'desc';

export interface AttendeeTableProps {
  attendees: TableAttendee[];
  className?: string;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'userName', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'seniority', label: 'Seniority' },
  { key: 'hasCard', label: 'Card' },
];

const AttendeeTable: React.FC<AttendeeTableProps> = ({
  attendees,
  className,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('userName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    const copy = [...attendees];
    copy.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === 'hasCard') {
        av = a.hasCard ? 1 : 0;
        bv = b.hasCard ? 1 : 0;
      } else {
        av = (a[sortKey] ?? '').toString().toLowerCase();
        bv = (b[sortKey] ?? '').toString().toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [attendees, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (attendees.length === 0) {
    return (
      <EmptyState
        title="No checked-in attendees"
        description="Attendees appear here once they check in at the door."
      />
    );
  }

  return (
    <div
      className={cn(
        'card-magical overflow-hidden rounded-2xl',
        className,
      )}
    >
      {/* Wide table scrolls inside its own container, never the page. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-secondary transition hover:text-text-primary"
                    aria-sort={
                      sortKey === col.key
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    {col.label}
                    <span className="text-[10px]">
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr
                key={a.userId}
                className="border-b border-border-subtle/50 last:border-0 hover:bg-surface-2/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={a.avatarUrl}
                      alt={a.userName}
                      fallbackInitials={initialsOf(a.userName)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {a.userName}
                      </p>
                      {a.jobRole && (
                        <p className="truncate text-xs text-text-secondary">
                          {a.jobRole}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {a.company || '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {a.industry || '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {a.seniority || '—'}
                </td>
                <td className="px-4 py-3">
                  {a.hasCard ? (
                    <Badge variant="success">Card</Badge>
                  ) : (
                    <Badge variant="warning">No card</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-secondary"
                      >
                        {s}
                      </span>
                    ))}
                    {a.skills.length > 3 && (
                      <span className="text-xs text-text-secondary">
                        +{a.skills.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendeeTable;
