import React, { useMemo } from 'react';
import { cn } from '@/utils/helpers';
import type { Session } from '@/types/session';
import SessionCard from '@/components/events/SessionCard';

export interface ScheduleTimelineProps {
  sessions: Session[];
  onCheckin?: (sessionId: string) => void;
  checkedInSessions?: string[];
  isOrganizer?: boolean;
  onEdit?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
}

function isSessionCurrent(session: Session): boolean {
  const now = new Date();
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  return now >= start && now <= end;
}

function getDateLabel(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  sessions,
  onCheckin,
  checkedInSessions = [],
  isOrganizer = false,
  onEdit,
  onDelete,
}) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    for (const s of sorted) {
      const dateKey = getDateLabel(s.startTime);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(s);
    }
    return Array.from(map.entries());
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-2xl gradient-magical p-4 text-white animate-glow-pulse">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-gradient-magical">No sessions scheduled yet</h3>
        <p className="mt-2 max-w-sm text-base text-text-secondary">
          Sessions will appear here once they are added to the event schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([dateLabel, dateSessions]) => (
        <div key={dateLabel}>
          <h3 className="mb-4 font-display text-base font-bold text-gradient-magical">
            {dateLabel}
          </h3>
          <div className="relative space-y-4 pl-6 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-gradient-to-b before:from-neon-cyan/40 before:to-neon-purple/40">
            {dateSessions.map((session) => {
              const isCurrent = isSessionCurrent(session);
              const checkedIn = checkedInSessions.includes(session.id);

              return (
                <div key={session.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute -left-6 mt-5 h-[10px] w-[10px] rounded-full border-2',
                      isCurrent
                        ? 'border-neon-cyan bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.6)]'
                        : 'border-surface-2 bg-surface-1',
                    )}
                  />

                  {isCurrent && (
                    <div className="mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neon-cyan/15 px-2.5 py-0.5 text-[11px] font-semibold text-neon-cyan">
                        <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                        Currently Happening
                      </span>
                    </div>
                  )}

                  <SessionCard
                    session={session}
                    onCheckin={() => onCheckin?.(session.id)}
                    onEdit={onEdit ? () => onEdit(session) : undefined}
                    onDelete={onDelete ? () => onDelete(session.id) : undefined}
                    isCheckedIn={checkedIn}
                    isOrganizer={isOrganizer}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleTimeline;
