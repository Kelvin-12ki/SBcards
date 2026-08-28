import React from 'react';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { QrCode } from '../QrCode';
import { LinkButton } from '../ui/Button';
import { appLinkProps, appRoutes } from '../../config/app';
import { Ambience } from '../motion/effects';
import { Reveal } from '../motion/Reveal';

export function FinalCta() {
  return (
    <section id="cta" className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
      <Reveal scale>
      <div className="relative overflow-hidden rounded-3xl border border-ink-600/80 bg-ink-700 p-8 sm:p-12">
        <Ambience grid={false} />
        <svg
          viewBox="0 0 600 300"
          preserveAspectRatio="none"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[460px] lg:block"
          aria-hidden="true">
          
          {Array.from({ length: 16 }).map((_, index) =>
          <line
            key={index}
            x1={60 + index * 36}
            y1={-20}
            x2={200 + index * 36}
            y2={320}
            stroke="rgb(var(--accent))"
            strokeWidth="0.8"
            opacity={0.1 + index % 4 * 0.035} />

          )}
        </svg>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
              Your next conversation starts with one scan.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-fog-300">
              Create a card in under four minutes. Free forever for one card, no credit card, and
              your wallet exports whenever you want it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={appRoutes.register} variant="primary" size="lg" {...appLinkProps}>
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Create New Card
              </LinkButton>
              <LinkButton href={appRoutes.login} variant="outline" size="lg" {...appLinkProps}>
                Launch Dashboard
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-ink-500 bg-ink-800 p-4">
            <span className="h-[104px] w-[104px] shrink-0">
              <QrCode seed={204} label="QR code to download NEXAS" />
            </span>
            <div className="max-w-[180px]">
              <p className="text-sm font-bold text-strong">Get it on your phone</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-400">
                Scan to install NEXAS for iOS or Android.
              </p>
            </div>
          </div>
        </div>
      </div>
      </Reveal>
    </section>);

}