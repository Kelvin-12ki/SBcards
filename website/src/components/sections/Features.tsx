import React from "react";
import { BarChart3Icon, Building2Icon, BrainCircuitIcon, CalendarIcon, CreditCardIcon, LayoutGridIcon, MapIcon, MessageSquareIcon, QrCodeIcon, SearchIcon, StoreIcon, UserSquareIcon, WalletIcon, ClockIcon, type LucideIcon } from "lucide-react";
import { features, secondaryCards } from "../../data/site";
import { DigitalCard } from "../DigitalCard";
import { cn } from "../../utils/cn";
import { Reveal } from "../motion/Reveal";
const ICONS: Record<string, LucideIcon> = {
  cards: CreditCardIcon,
  qr: QrCodeIcon,
  ai: BrainCircuitIcon,
  org: Building2Icon,
  wallet: WalletIcon,
  chat: MessageSquareIcon,
  events: CalendarIcon,
  tables: LayoutGridIcon,
  exhibitors: StoreIcon,
  heatmap: MapIcon,
  analytics: BarChart3Icon,
  search: SearchIcon,
  timeline: ClockIcon,
  profile: UserSquareIcon
};
function FeatureBody({
  id,
  title,
  body,
  icon,
  className,
  large = false







}: {id: string;title: string;body: string;icon: string;className?: string;large?: boolean;}) {
  const Icon = ICONS[icon];
  return <article className={cn('lift sheen flex flex-col rounded-2xl border border-ink-600/80 bg-ink-700 p-5', large && 'sm:p-6', className)} aria-labelledby={`feature-${id}`}>
      <span className={cn('grid h-9 w-9 place-items-center rounded-xl border', large ? 'border-accent/30 bg-accent/10 text-accent' : 'border-ink-500 bg-ink-600 text-fog-300')}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h3 id={`feature-${id}`} className={cn('mt-4 font-bold tracking-tight text-strong', large ? 'text-xl' : 'text-[15px]')}>
        {title}
      </h3>
      <p className={cn('mt-2 leading-relaxed text-fog-400', large ? 'text-sm' : 'text-[13px]')}>
        {body}
      </p>
    </article>;
}
export function Features() {
  const [primary, ...rest] = features;
  return <section id="features" className="border-y border-ink-600/70 bg-ink-850">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
              Built for the messy middle of networking
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-fog-400">
            Everything here exists because a paper card, a phone photo, and a good intention are not
            a follow-up system.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="lift sheen grid gap-4 rounded-2xl border border-ink-600/80 bg-ink-700 p-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:p-6 lg:col-span-3">
            <div className="flex flex-col">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                <CreditCardIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-strong">{primary.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog-400">{primary.body}</p>
              <ul className="mt-4 space-y-1.5 text-[13px] text-fog-300">
                <li>Per-card contact details and share links</li>
                <li>Generated geometric marks — no photo needed</li>
                <li>Default card switches with one tap</li>
              </ul>
            </div>
            <div className="flex items-center">
              <DigitalCard card={secondaryCards[0]} size="sm" className="w-full" />
            </div>
          </div>

          {rest.map((feature, i) =>
          <Reveal key={feature.id} delay={i * 60} scale>
            <FeatureBody {...feature} />
          </Reveal>
          )}
        </div>
      </div>
    </section>;
}