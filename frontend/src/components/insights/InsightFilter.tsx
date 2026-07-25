import React from 'react';
import { cn } from '@/utils/helpers';
import { Heart, UserPlus, Clock, Users, Sparkles, Lightbulb } from 'lucide-react';

export interface InsightFilterProps {
  activeType?: string;
  onSelect: (type?: string) => void;
  className?: string;
}

interface FilterOption {
  type?: string;
  label: string;
  icon: React.ReactNode;
}

const filterOptions: FilterOption[] = [
  { type: undefined, label: 'All', icon: null },
  { type: 'relationship_strength', label: 'Relationships', icon: <Heart className="h-3.5 w-3.5" /> },
  { type: 'networking_suggestion', label: 'Suggestions', icon: <UserPlus className="h-3.5 w-3.5" /> },
  { type: 'follow_up_reminder', label: 'Follow-ups', icon: <Clock className="h-3.5 w-3.5" /> },
  { type: 'common_connection', label: 'Common', icon: <Users className="h-3.5 w-3.5" /> },
  { type: 'mutual_interest', label: 'Interests', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { type: 'profile_tip', label: 'Tips', icon: <Lightbulb className="h-3.5 w-3.5" /> },
];

const InsightFilter: React.FC<InsightFilterProps> = ({ activeType, onSelect, className }) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filterOptions.map((option) => {
        const isActive = activeType === option.type;
        return (
          <button
            key={option.label}
            onClick={() => onSelect(option.type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
              isActive
                ? 'bg-gold/15 text-gold border border-gold/30 shadow-sm shadow-gold/10'
                : 'bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-3 hover:text-text-primary',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default InsightFilter;
