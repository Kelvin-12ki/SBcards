import { Reveal } from '../motion/Reveal';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { faqs } from '../../data/site';
import { cn } from '../../utils/cn';

const EASE = [0.23, 1, 0.32, 1] as const;

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-ink-600/70 bg-ink-850">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[36px]">
              Questions people ask before signing up
            </h2>
          </div>

          <ul className="divide-y divide-ink-600/80 border-y border-ink-600/80">
            {faqs.map((faq, index) => {
              const open = openIndex === index;
              return (
                <Reveal key={faq.q} as="li" delay={index * 55}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex w-full items-center gap-4 py-5 text-left">
                    
                    <span
                      className={cn(
                        'text-base font-bold tracking-tight transition-colors duration-300 ease-smooth',
                        open ? 'text-strong' : 'text-fog-200'
                      )}>
                      
                      {faq.q}
                    </span>
                    <PlusIcon
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0 transition-transform duration-500 ease-smooth',
                        open ? 'rotate-45 text-accent' : 'text-fog-500'
                      )}
                      aria-hidden="true" />
                    
                  </button>
                  <AnimatePresence initial={false}>
                    {open &&
                    <motion.div
                      id={`faq-panel-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.42, ease: EASE }}
                      className="overflow-hidden">
                      
                        <p className="max-w-2xl pb-6 text-sm leading-relaxed text-fog-400">{faq.a}</p>
                      </motion.div>
                    }
                  </AnimatePresence>
                </Reveal>);

            })}
          </ul>
        </div>
      </div>
    </section>);

}