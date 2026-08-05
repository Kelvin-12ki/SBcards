import React from 'react';
import { cn } from '@/utils/helpers';

interface LeadScoreBadgeProps {
  score: 'hot' | 'warm' | 'cold' | 'none' | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

const scoreConfig = {
  hot: { emoji: '🔥', label: 'Hot', classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
  warm: { emoji: '🌤️', label: 'Warm', classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  cold: { emoji: '❄️', label: 'Cold', classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  none: { emoji: '', label: '', classes: '' },
};

const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ score, size = 'sm', className }) => {
  if (!score || score === 'none') return null;
  const config = scoreConfig[score];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.classes,
        className,
      )}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
};

export default LeadScoreBadge;
