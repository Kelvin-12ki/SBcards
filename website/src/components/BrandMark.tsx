import React from 'react';
import { cn } from '../utils/cn';

export function BrandMark({ className, compact = false }: {className?: string;compact?: boolean;}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="3" fill="#0A0A0D" />
          <rect x="6" y="9.5" width="6" height="1.6" rx="0.8" fill="#00E5FF" />
          <rect x="6" y="12.6" width="9" height="1.6" rx="0.8" fill="#00E5FF" opacity="0.55" />
          <circle cx="17" cy="11" r="1.6" fill="#EAB308" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight text-strong">NEXAS</span>
        {!compact && <span className="block text-[10px] font-medium text-fog-500">Smart networking</span>}
      </span>
    </span>);

}