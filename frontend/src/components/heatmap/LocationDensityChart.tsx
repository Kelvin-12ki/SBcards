import React from 'react';
import { cn } from '@/utils/helpers';
import type { LocationDensity } from '@/types/heatmap';

export interface LocationDensityChartProps {
  locations: LocationDensity[];
  className?: string;
}

const LocationDensityChart: React.FC<LocationDensityChartProps> = ({ locations, className }) => {
  if (!locations || locations.length === 0) {
    return (
      <div className={cn('rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical', className)}>
        <h3 className="font-display text-sm font-bold text-text-primary mb-2">Location Density</h3>
        <p className="text-xs text-text-secondary">No location data available.</p>
      </div>
    );
  }

  const maxDensity = Math.max(...locations.map((l) => l.density), 1);

  return (
    <div className={cn('rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical', className)}>
      <h3 className="font-display text-sm font-bold text-text-primary mb-3">Location Density</h3>

      <div className="space-y-3">
        {locations.map((loc) => {
          const widthPercent = (loc.density / maxDensity) * 100;

          return (
            <div key={loc.location} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary truncate mr-2">{loc.location}</span>
                <span className="font-bold text-text-secondary">{loc.density}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan/60 to-neon-purple/60 transition-all duration-500"
                  style={{ width: `${Math.max(widthPercent, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LocationDensityChart;
