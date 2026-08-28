import { Reveal } from '../motion/Reveal';
import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { plans } from '../../data/site';
import { LinkButton } from '../ui/Button';
import { cn } from '../../utils/cn';
import { appLinkProps, appRoutes } from '../../config/app';

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Pricing</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
            Free to carry a card. Paid to never drop a lead.
          </h2>
        </div>

        <div
          role="radiogroup"
          aria-label="Billing period"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-ink-600 bg-ink-800 p-1">
          
          {[
          { id: 'monthly', label: 'Monthly' },
          { id: 'annual', label: 'Annual · save 22%' }].
          map((option) => {
            const selected = option.id === 'annual' === annual;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnnual(option.id === 'annual')}
                className={cn(
                  'h-9 rounded-lg px-3.5 text-xs font-bold transition-[background-color,color] duration-150 ease-out',
                  selected ? 'bg-accent text-onaccent' : 'text-fog-400 hover:text-fog-100'
                )}>
                
                {option.label}
              </button>);

          })}
        </div>
      </div>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-3">
        {plans.map((plan, planIndex) => {
          const price = annual ? plan.annual : plan.monthly;
          return (
            <Reveal key={plan.id} delay={planIndex * 110} scale>
            <article
              className={cn(
                'lift sheen flex h-full flex-col rounded-3xl border p-6',
                plan.featured ?
                'border-accent/40 bg-ink-700 shadow-glow lg:-mt-4 lg:pb-8' :
                'border-ink-600/80 bg-ink-800'
              )}
              aria-labelledby={`plan-${plan.id}`}>
              
              <div className="flex items-center justify-between gap-3">
                <h3 id={`plan-${plan.id}`} className="text-lg font-bold tracking-tight text-strong">
                  {plan.name}
                </h3>
                {plan.featured &&
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Most popular
                  </span>
                }
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-fog-400">{plan.tagline}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-strong">
                  {price === 0 ? 'Free' : `$${price}`}
                </span>
                {price > 0 &&
                <span className="text-xs text-fog-500">
                    per user / month{annual ? ', billed yearly' : ''}
                  </span>
                }
              </p>

              <LinkButton
                href={plan.id === 'org' ? appRoutes.events : appRoutes.register}
                {...appLinkProps}
                variant={plan.featured ? 'accent' : 'outline'}
                size="md"
                className="mt-6 w-full">
                
                {plan.cta}
              </LinkButton>

              <ul className="mt-6 space-y-2.5 border-t border-ink-600/80 pt-6">
                {plan.includes.map((item) =>
                <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-fog-200">
                    <CheckIcon
                    className={cn('mt-0.5 h-4 w-4 shrink-0', plan.featured ? 'text-accent' : 'text-fog-500')}
                    aria-hidden="true" />
                  
                    {item}
                  </li>
                )}
              </ul>
            </article>
            </Reveal>);

        })}
      </div>
    </section>);

}