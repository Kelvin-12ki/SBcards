import React from 'react';
import { cn } from '@/utils/helpers';
import type { PeakTime } from '@/types/heatmap';

export interface PeakTimesListProps {
  peaks: PeakTime[];
  className?: string;
}

const PeakTimesList: React.FC<PeakTimesListProps> = ({ peaks, className }) => {
  if (!peaks || peaks.length === 0) {
    return (
      <div className={cn('rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical', className)}>
        <h3 className="font-display text-sm font-bold text-text-primary mb-2">Peak Times</h3>
        <p className="text-xs text-text-secondary">No peak time data available.</p>
      </div>
    );
  }

  const maxCount = Math.max(...peaks.map((p) => p.totalCount), 1);

  return (
    <div className={cn('rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical', className)}>
      <h3 className="font-display text-sm font-bold text-text-primary mb-3">Peak Times</h3>

      <div className="space-y-2.5">
        {peaks.slice(0, 5).map((peak, index) => {
          const isTop = index === 0;
          const widthPercent = (peak.totalCount / maxCount) * 100;

          return (
            <div key={`${peak.day}-${peak.hour}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-gold-ink">
                      1
                    </span>
                  )}
                  <span className={cn('font-medium', isTop ? 'text-gold' : 'text-text-primary')}>
                    {peak.label}
                  </span>
                </div>
                <span className={cn('font-bold', isTop ? 'text-gold' : 'text-text-secondary')}>
                  {peak.totalCount}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isTop
                      ? 'bg-gradient-to-r from-gold to-gold-strong'
                      : 'bg-gradient-to-r from-neon-cyan/60 to-neon-cyan/30',
                  )}
                  style={{ width: `${Math.max(widthPercent, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeakTimesList;
