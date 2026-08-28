import React from 'react';
import { Reveal } from '../motion/Reveal';
import { RefreshCwIcon, ScanLineIcon, SparklesIcon, UsersIcon } from 'lucide-react';
import { tableMatchingSteps } from '../../data/site';
import { GeometricAvatar } from '../GeometricAvatar';
import { cn } from '../../utils/cn';

/** Seats around one table, coloured by the industry the attendee comes from. */
const TABLE_ONE = [
{ name: 'Barak Imani', field: 'Security', tone: 'cyan' },
{ name: 'Tunde Adeyemi', field: 'Payments', tone: 'gold' },
{ name: 'Leila Mwangi', field: 'Design', tone: 'violet' },
{ name: 'Kwame Osei', field: 'Infra', tone: 'mint' },
{ name: 'Nadia Farouk', field: 'Policy', tone: 'cyan' },
{ name: 'Bilal Rahman', field: 'Capital', tone: 'gold' }] as
const;

const TONE: Record<string, string> = {
  cyan: 'border-accent/40 bg-accent/10 text-accent',
  gold: 'border-gold/40 bg-gold/10 text-gold',
  violet: 'border-[#A78BFA]/40 bg-[#A78BFA]/10 text-[#A78BFA]',
  mint: 'border-success/40 bg-success/10 text-success'
};

const SEEDS = [71, 12, 33, 54, 96, 118];

export function TableMatching() {
  return (
    <section
      id="tables"
      className="border-y border-ink-600/70 bg-ink-900">

      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Physical AI matching
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
            The room seats itself
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fog-300 sm:text-base">
            Most networking apps stop at the introduction. NEXAS decides who sits
            where. Organizers lay out the tables, attendees check in at the door,
            and seating balances skills, industry, and seniority across every table
            — then rotates the room so the next round is a new set of faces.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          {/* the sequence */}
          <ol className="space-y-3">
            {tableMatchingSteps.map((step, index) =>
            <Reveal key={step.title} as="li" delay={index * 90} direction="right">
              <div className="lift flex gap-4 rounded-2xl border border-ink-600/80 bg-ink-850 p-5">

                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-[12px] font-bold text-accent">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold tracking-tight text-strong">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fog-400">
                    {step.body}
                  </p>
                </div>
              </div>
            </Reveal>
            )}
          </ol>

          {/* the table */}
          <div className="rounded-2xl border border-ink-600/80 bg-ink-850 p-6">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              <p className="text-[13px] font-bold text-strong">Table 4</p>
              <span className="ml-auto rounded-full border border-accent/30 bg-accent/[0.07] px-2.5 py-0.5 text-[10px] font-bold text-accent">
                Round 2
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-fog-500">
              Six seats, six industries, no repeat pairings from round one.
            </p>

            <ul className="mt-5 space-y-2">
              {TABLE_ONE.map((seat, index) =>
              <li
                key={seat.name}
                className="flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-800 px-3 py-2 transition-colors duration-300 hover:border-accent/40">

                  <GeometricAvatar
                  seed={SEEDS[index]}
                  name={seat.name}
                  size={28} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-fog-100">
                      {seat.name}
                    </span>
                    <span className="block text-[10px] text-fog-500">
                      Seat {index + 1}
                    </span>
                  </span>
                  <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold',
                    TONE[seat.tone]
                  )}>

                    {seat.field}
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800/60 px-3 py-2.5">
              <RefreshCwIcon
                className="h-3.5 w-3.5 shrink-0 text-fog-400"
                aria-hidden="true" />

              <p className="text-[11px] leading-snug text-fog-400">
                Next round re-seats everyone, avoiding people you have already met.
              </p>
            </div>
          </div>
        </div>

        {/* supporting points */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
          {
            icon: ScanLineIcon,
            title: 'Check-in is the gate',
            body: 'Only attendees who actually scanned in at the door get a seat.'
          },
          {
            icon: SparklesIcon,
            title: 'Diversity first',
            body: 'Tables are balanced across skill, industry, and seniority before interests are matched.'
          },
          {
            icon: RefreshCwIcon,
            title: 'Rotation that mixes',
            body: 'Repeat pairings are penalised, so every round puts new people together.'
          }].
          map((item) =>
          <div
            key={item.title}
            className="lift sheen rounded-2xl border border-ink-600/80 bg-ink-850 p-5">

              <item.icon className="h-4 w-4 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-[14px] font-bold tracking-tight text-strong">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fog-400">
                {item.body}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>);

}
