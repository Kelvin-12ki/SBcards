import React from 'react';
import { cn } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import { initialsOf } from './CheckInCounter';
import type { EventTable } from '@/types/table';

export interface TableGridProps {
  tables: EventTable[];
  /** Seats configured per table, used to render empty seats. */
  seatsPerTable?: number;
  className?: string;
}

const TableGrid: React.FC<TableGridProps> = ({
  tables,
  seatsPerTable,
  className,
}) => {
  if (tables.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z"
            />
          </svg>
        }
        title="No tables yet"
        description="Use Setup Tables to define the layout, then Assign Tables to seat everyone."
      />
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {tables.map((table) => {
        const seated = table.attendees.length;
        const capacity = seatsPerTable ?? seated;
        const emptySeats = Math.max(0, capacity - seated);

        return (
          <div
            key={table.tableId}
            className="card-magical rounded-2xl p-4 transition hover-glow-magical"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-base font-bold text-gradient-magical">
                {table.label || `Table ${table.tableNumber}`}
              </h4>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-text-secondary">
                {seated}
                {capacity > 0 ? `/${capacity}` : ''}
              </span>
            </div>

            <ul className="space-y-2">
              {table.attendees.map((a, idx) => (
                <li key={a.userId} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-[10px] font-semibold text-white">
                    {initialsOf(a.userName)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    {a.userName}
                  </span>
                  <span className="flex-shrink-0 text-xs text-text-secondary">
                    seat {idx + 1}
                  </span>
                </li>
              ))}

              {Array.from({ length: emptySeats }).map((_, i) => (
                <li
                  key={`empty-${i}`}
                  className="flex items-center gap-2.5 opacity-40"
                >
                  <span className="h-7 w-7 flex-shrink-0 rounded-full border border-dashed border-border-subtle" />
                  <span className="text-sm italic text-text-secondary">
                    empty
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default TableGrid;
