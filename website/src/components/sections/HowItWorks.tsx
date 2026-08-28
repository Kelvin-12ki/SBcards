import React from 'react';
import { steps } from '../../data/site';
import { Reveal } from '../motion/Reveal';

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">How it works</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
            Three steps, then it runs itself
          </h2>
          <p className="mt-4 text-base leading-relaxed text-fog-300">
            Setup takes about four minutes. The part that usually fails — remembering to follow up —
            is the part NEXAS handles for you.
          </p>
        </div>

        <ol className="relative space-y-10 border-l border-ink-600 pl-8">
          {steps.map((step, index) =>
          <Reveal key={step.number} as="li" delay={index * 120} direction="right">
            <div className="relative">
              <span
              className="absolute -left-[41px] grid h-6 w-6 place-items-center rounded-full border border-accent/40 bg-ink-900 text-[10px] font-bold text-accent"
              aria-hidden="true">
              
                {step.number}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-strong">{step.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fog-400">{step.body}</p>
            </div>
          </Reveal>
          )}
        </ol>
      </div>
    </section>);

}