import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import type { HeatmapData } from '@/types/heatmap';

export interface HeatmapGridProps {
  data: HeatmapData[];
  metric?: 'connections' | 'messages' | 'checkins' | 'scans';
  className?: string;
}

type MetricKey = 'connections' | 'messages' | 'checkins' | 'scans';

interface MetricOption {
  key: MetricKey;
  label: string;
  color: string;
  bgColor: string;
}

const metrics: MetricOption[] = [
  { key: 'connections', label: 'Connections', color: 'bg-neon-cyan', bgColor: 'bg-neon-cyan/10' },
  { key: 'messages', label: 'Messages', color: 'bg-neon-purple', bgColor: 'bg-neon-purple/10' },
  { key: 'checkins', label: 'Check-ins', color: 'bg-success', bgColor: 'bg-success/10' },
  { key: 'scans', label: 'Scans', color: 'bg-gold', bgColor: 'bg-gold/10' },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ data, metric = 'connections', className }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>(metric);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; day: string; hour: string } | null>(null);

  const activeMetricConfig = metrics.find((m) => m.key === activeMetric)!;

  // Determine max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => {
      switch (activeMetric) {
        case 'connections':
          return d.connectionCount;
        case 'messages':
          return d.messageCount;
        case 'checkins':
          return d.checkinCount;
        case 'scans':
          return d.scanCount;
        default:
          return 0;
      }
    }),
    1,
  );

  // Build a lookup map: "day-hour" -> value
  const valueMap = new Map<string, number>();
  data.forEach((d) => {
    const key = `${d.day}-${d.hour}`;
    let val = 0;
    switch (activeMetric) {
      case 'connections':
        val = d.connectionCount;
        break;
      case 'messages':
        val = d.messageCount;
        break;
      case 'checkins':
        val = d.checkinCount;
        break;
      case 'scans':
        val = d.scanCount;
        break;
    }
    valueMap.set(key, val);
  });

  return (
    <div className={cn('rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical', className)}>
      {/* Metric selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
              activeMetric === m.key
                ? `${m.bgColor} ${m.color.replace('bg-', 'text-')} border border-current`
                : 'bg-surface-2 text-text-tertiary border border-border-subtle hover:bg-surface-3',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', m.color)} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '60px repeat(24, minmax(28px, 1fr))',
            gap: '2px',
            minWidth: '732px',
          }}
        >
          {/* Header row - hour labels */}
          <div className="flex items-end pb-1 text-[10px] text-text-tertiary font-medium">Day</div>
          {hourLabels.map((label) => (
            <div
              key={label}
              className="flex items-end justify-center pb-1 text-[10px] text-text-tertiary font-medium"
            >
              {label}
            </div>
          ))}

          {/* Data rows */}
          {dayNames.map((dayName, dayIndex) => (
            <React.Fragment key={dayName}>
              {/* Day label */}
              <div className="flex items-center pr-2 text-[10px] text-text-secondary font-semibold">
                {dayName}
              </div>

              {/* Cells */}
              {Array.from({ length: 24 }, (_, hour) => {
                const key = `${dayIndex}-${hour}`;
                const value = valueMap.get(key) ?? 0;
                const intensity = maxValue > 0 ? value / maxValue : 0;

                let bgColor = 'rgba(28,28,31,0.5)';
                if (value > 0) {
                  const colorMap: Record<MetricKey, string> = {
                    connections: '0, 245, 255',
                    messages: '191, 95, 255',
                    checkins: '52, 211, 153',
                    scans: '37, 99, 235',
                  };
                  const rgb = colorMap[activeMetric];
                  const alpha = Math.min(0.15 + intensity * 0.8, 0.95);
                  bgColor = `rgba(${rgb}, ${alpha.toFixed(2)})`;
                }

                return (
                  <div
                    key={key}
                    className="relative h-7 w-full cursor-pointer rounded-sm transition-all duration-150 hover:scale-110 hover:z-10"
                    style={{ backgroundColor: bgColor }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        value,
                        day: dayName,
                        hour: `${hour}:00`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-surface-3 border border-border-subtle px-2.5 py-1.5 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold text-text-primary">
            {tooltip.day} {tooltip.hour}
          </p>
          <p className="text-text-secondary">
            {activeMetricConfig.label}: <span className="font-bold text-neon-cyan">{tooltip.value}</span>
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-[10px] text-text-tertiary">
        <span>Low</span>
        <div className="flex h-3 w-20 overflow-hidden rounded-sm">
          <div className="flex-1" style={{ backgroundColor: 'rgba(28,28,31,0.5)' }} />
          {[0.2, 0.4, 0.6, 0.8, 1].map((level) => {
            const colorMap: Record<MetricKey, string> = {
              connections: '0, 245, 255',
              messages: '191, 95, 255',
              checkins: '52, 211, 153',
              scans: '37, 99, 235',
            };
            const rgb = colorMap[activeMetric];
            return (
              <div
                key={level}
                className="flex-1"
                style={{ backgroundColor: `rgba(${rgb}, ${level})` }}
              />
            );
          })}
        </div>
        <span>High</span>
      </div>
    </div>
  );
};

export default HeatmapGrid;
