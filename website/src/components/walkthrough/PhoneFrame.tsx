import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Hardware chrome for the walkthrough: a phone shell with a status bar and a
 * clipped content well. The walkthrough depicts the NEXAS mobile app, so the
 * device frame is a phone rather than the desktop chrome used by the product tour.
 */
export function PhoneFrame({
  children,
  className,
  screenLabel



}: {children: React.ReactNode;className?: string;screenLabel?: string;}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[300px] shrink-0 rounded-[2.5rem] border border-ink-500/90 bg-ink-850 p-2.5',
        'shadow-panel',
        className
      )}>

      {/* side buttons */}
      <span
        aria-hidden="true"
        className="absolute -left-[3px] top-[104px] h-14 w-[3px] rounded-l-full bg-ink-500" />

      <span
        aria-hidden="true"
        className="absolute -right-[3px] top-[132px] h-20 w-[3px] rounded-r-full bg-ink-500" />

      <div
        data-theme="dark"
        className="relative h-[600px] overflow-hidden rounded-[2rem] bg-ink-900">
        {/* status bar */}
        <div className="relative z-20 flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-fog-200">
          <span>9:41</span>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1.5 h-5 w-20 -translate-x-1/2 rounded-full bg-ink-950" />

          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3.5 rounded-[2px] border border-fog-300" />
            <span className="inline-block h-2 w-1 rounded-[1px] bg-fog-300" />
          </span>
        </div>

        {screenLabel &&
        <p className="sr-only" aria-live="polite">
            {screenLabel}
          </p>}


        <div className="relative h-[calc(600px-28px)]">{children}</div>

        {/* home indicator */}
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-fog-500/70" />

      </div>
    </div>);

}
