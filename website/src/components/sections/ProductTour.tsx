import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tourScreens } from '../../data/site';
import { AppFrame } from '../tour/AppFrame';
import {
  AiMatchScreen,
  DashboardScreen,
  ScanScreen,
  WalletScreen } from
'../tour/TourScreens';
import { cn } from '../../utils/cn';

const EASE = [0.23, 1, 0.32, 1] as const;

const SCREENS: Record<string, React.ReactNode> = {
  dashboard: <DashboardScreen />,
  wallet: <WalletScreen />,
  ai: <AiMatchScreen />,
  scan: <ScanScreen />
};

const FRAME_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  wallet: 'Card Wallet',
  ai: 'AI Insights & Matchmaker',
  scan: 'Scan QR Code'
};

export function ProductTour() {
  const [activeId, setActiveId] = useState(tourScreens[0].id);
  const active = tourScreens.find((screen) => screen.id === activeId) ?? tourScreens[0];

  return (
    <section id="tour" className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Product tour</p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
          Four screens do the work of a CRM
        </h2>
        <p className="mt-4 text-base leading-relaxed text-fog-300">
          Click through the app the way you would after a conference — from the morning dashboard to
          the scan that started it.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <div
          role="tablist"
          aria-label="Product tour screens"
          aria-orientation="vertical"
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          
          {tourScreens.map((screen) => {
            const isActive = screen.id === activeId;
            return (
              <button
                key={screen.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveId(screen.id)}
                className={cn(
                  'shrink-0 rounded-xl border px-4 py-3 text-left transition-[background-color,border-color,color] duration-150 ease-out lg:w-full',
                  isActive ?
                  'border-accent/40 bg-accent/[0.07] text-strong' :
                  'border-ink-600 bg-ink-800/60 text-fog-400 hover:border-ink-500 hover:text-fog-200'
                )}>
                
                <span className="block text-sm font-bold">{screen.tab}</span>
                <span
                  className={cn(
                    'mt-0.5 hidden text-[11px] lg:block',
                    isActive ? 'text-accent' : 'text-fog-500'
                  )}>
                  
                  {isActive ? 'Viewing' : 'View screen'}
                </span>
              </button>);

          })}
        </div>

        <div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}>
              
              <AppFrame activeId={activeId} title={FRAME_TITLES[activeId]}>
                {SCREENS[activeId]}
              </AppFrame>
              <div className="mt-6 max-w-2xl">
                <h3 className="text-lg font-bold tracking-tight text-strong">{active.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog-300">{active.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>);

}