import React from 'react';
import { cn } from '@/utils/helpers';
import type { TableAssignment as TableAssignmentType } from '@/types/match';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export interface TableAssignmentProps {
  tableAssignment: TableAssignmentType | null;
  loading?: boolean;
  className?: string;
}

const TableAssignment: React.FC<TableAssignmentProps> = ({
  tableAssignment,
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

  if (!tableAssignment) {
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

  const { tableNumber, label, capacity, currentCount, attendees } = tableAssignment;

  return (
    <div className={cn('card-magical rounded-2xl p-5 shimmer-magical', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-gradient-magical">Table {tableNumber}</h3>
          {label && <p className="text-sm text-text-secondary">{label}</p>}
        </div>
        <div className="text-right text-sm text-text-secondary">
          <span className="text-text-primary font-medium">{currentCount}</span> / {capacity} seats
        </div>
      </div>

      <div className="space-y-3">
        {attendees.map((attendee) => {
          const initials = attendee.userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={attendee.userId}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{attendee.userName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableAssignment;
