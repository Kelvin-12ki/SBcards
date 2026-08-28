import React from 'react';
import { Walkthrough } from '../walkthrough/Walkthrough';
import { Reveal } from '../motion/Reveal';
import { Ambience } from '../motion/effects';

/**
 * The narrated product walkthrough: account to first connection, start to finish.
 * Sits directly under the hero because it answers the first question a visitor
 * has — what actually happens when I install this?
 */
export function SeeItWork() {
  return (
    <section
      id="walkthrough"
      className="relative overflow-hidden border-t border-ink-700/70 bg-ink-900 py-20 sm:py-28">

      <Ambience grid={false} />

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Watch it happen
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-strong sm:text-4xl">
            From nothing to your first connection
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fog-300 sm:text-base">
            Six steps, about thirty seconds. Create an account, build a card,
            show your code, scan someone else’s — and watch the connection land
            with the context still attached.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <Walkthrough />
        </Reveal>
      </div>
    </section>);

}
