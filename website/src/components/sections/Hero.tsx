import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ScanLineIcon } from 'lucide-react';
import { heroCard, heroStats, secondaryCards } from '../../data/site';
import { DigitalCard } from '../DigitalCard';
import { QrCode } from '../QrCode';
import { LinkButton } from '../ui/Button';
import { cn } from '../../utils/cn';
import { appLinkProps, appRoutes } from '../../config/app';
import { Ambience, Parallax } from '../motion/effects';

const EASE = [0.23, 1, 0.32, 1] as const;

export function Hero({ layout = 'split' }: {layout?: 'split' | 'centered';}) {
  const centered = layout === 'centered';

  return (
    <section id="top" className="relative overflow-hidden">
      <Ambience />
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true">
        
        {Array.from({ length: 26 }).map((_, index) =>
        <line
          key={index}
          x1={-200 + index * 70}
          y1={-40}
          x2={100 + index * 70}
          y2={640}
          stroke="rgb(var(--accent))"
          strokeWidth="0.7"
          opacity={0.06 + index % 5 * 0.012} />

        )}
      </svg>

      <div
        className={cn(
          'relative mx-auto grid w-full max-w-[1240px] gap-14 px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24',
          centered ? 'justify-items-center text-center' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center'
        )}>
        
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className={cn('max-w-2xl', centered && 'mx-auto')}>
          
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.07] px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Now with AI Match
          </span>

          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-strong sm:text-[56px] lg:text-[64px]">
            Stop losing the people
            <br />
            you already met.
          </h1>

          <p
            className={cn(
              'mt-5 text-lg leading-relaxed text-fog-300',
              centered ? 'mx-auto max-w-xl' : 'max-w-xl'
            )}>
            
            NEXAS turns a two-second scan into a searchable wallet, a scored relationship, and a
            follow-up you actually send. Digital business cards with the memory of a great assistant.
          </p>

          <div
            className={cn(
              'mt-8 flex flex-wrap items-center gap-3',
              centered && 'justify-center'
            )}>
            
            <LinkButton href={appRoutes.register} variant="primary" size="lg" {...appLinkProps}>
              Create your free card
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="#walkthrough" variant="outline" size="lg">
              <ScanLineIcon className="h-4 w-4" aria-hidden="true" />
              Watch the walkthrough
            </LinkButton>
          </div>


          <dl
            className={cn(
              'mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-600/80 pt-6',
              centered && 'mx-auto'
            )}>
            
            {heroStats.map((stat, statIndex) =>
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 + statIndex * 0.1, ease: EASE }}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-extrabold tracking-tight text-strong">
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-fog-500">{stat.label}</span>
                </dd>
              </motion.div>
            )}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
          className={cn('relative w-full', centered ? 'max-w-[460px]' : '')}>
          
          <div className="relative">
            <Parallax strength={26}>
              <div className="absolute -right-2 top-6 hidden w-[86%] rotate-[6deg] sm:block">
                <DigitalCard card={secondaryCards[1]} size="sm" className="opacity-40" />
              </div>
            </Parallax>
            <Parallax strength={14}>
              <div className="absolute -left-1 top-3 hidden w-[92%] -rotate-[4deg] sm:block">
                <DigitalCard card={secondaryCards[0]} size="sm" className="opacity-70" />
              </div>
            </Parallax>

            <div className="relative animate-float shadow-panel">
              <DigitalCard card={heroCard} className="shadow-glow" />
            </div>

            <div className="lift sheen relative mt-5 flex items-center gap-4 rounded-2xl border border-ink-600/80 bg-ink-700 p-4">
              <span className="h-[86px] w-[86px] shrink-0">
                <QrCode seed={71} label="QR code for Barak Imani’s NEXAS profile" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-strong">Scan to swap details</p>
                <p className="mt-1 text-xs leading-relaxed text-fog-400">
                  Both wallets update instantly — tagged with the event you met at.
                </p>
                <p className="mt-2 text-xs font-semibold text-accent">nexas.app/amara</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

}