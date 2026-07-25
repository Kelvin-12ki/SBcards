import React from 'react';
import { cn } from '@/utils/helpers';
import type { Match } from '@/types/match';
import MatchCard from './MatchCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export interface MatchListProps {
  matches: Match[];
  loading?: boolean;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  loading = false,
  onViewProfile,
  className,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        }
        title="No matches yet"
        description="Matches will appear here once the event organizer runs the matching algorithm."
      />
    );
  }

  const sorted = [...matches].sort((a, b) => b.overlapScore - a.overlapScore);

  return (
    <div className={cn('space-y-3', className)}>
      {sorted.map((match) => (
        <MatchCard key={match.id} match={match} onViewProfile={onViewProfile} />
      ))}
    </div>
  );
};

export default MatchList;
