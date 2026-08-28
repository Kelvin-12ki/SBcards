import React from 'react';
import { builtFor } from '../../data/site';
import { Marquee } from '../motion/effects';

export function LogoStrip() {
  return (
    <section aria-label="Where NEXAS is used" className="border-y border-ink-600/70 bg-ink-850">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-x-10 gap-y-4 px-5 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fog-500">
          Built for
        </p>
        <Marquee className="min-w-0 flex-1">
          {builtFor.map((name) =>
          <span
            key={name}
            className="whitespace-nowrap text-sm font-bold tracking-tight text-fog-400 transition-colors duration-300 hover:text-accent">
              {name}
            </span>
          )}
        </Marquee>
      </div>
    </section>);

}