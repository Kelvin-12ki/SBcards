import React from 'react';
import { MoonStarIcon, SunIcon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../utils/cn';

/**
 * Sliding sun/moon switch. The knob and both icons animate on transform and
 * opacity only, so the swap stays smooth even mid-scroll.
 */
export function ThemeToggle({ className }: {className?: string;}) {
  const { theme, toggle } = useTheme();
  const light = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={light}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
      className={cn(
        'group relative grid h-9 w-[62px] shrink-0 grid-cols-2 items-center rounded-full border border-ink-500 bg-ink-800 px-1',
        'transition-colors duration-300 hover:border-accent/50',
        className
      )}>

      {/* travelling knob */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1 h-7 w-7 rounded-full bg-accent shadow-glow',
          'transition-transform duration-500 ease-smooth',
          light ? 'translate-x-[26px]' : 'translate-x-0'
        )}
        style={{ left: 4 }} />


      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 grid place-items-center transition-all duration-300',
          light ? 'scale-90 text-fog-400' : 'scale-100 text-onaccent'
        )}>

        <MoonStarIcon className="h-3.5 w-3.5" />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 grid place-items-center transition-all duration-300',
          light ? 'scale-100 text-onaccent' : 'scale-90 text-fog-400'
        )}>

        <SunIcon className="h-3.5 w-3.5" />
      </span>
    </button>);

}
