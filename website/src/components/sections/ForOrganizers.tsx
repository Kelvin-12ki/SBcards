import React from 'react';
import { Reveal } from '../motion/Reveal';
import {
  BarChart3Icon,
  CalendarIcon,
  LayoutGridIcon,
  MapIcon,
  MonitorIcon,
  ScanLineIcon,
  SmartphoneIcon,
  StoreIcon } from
'lucide-react';

const ORGANIZER_TOOLS = [
{
  icon: LayoutGridIcon,
  title: 'Table layouts & seating',
  body: 'Set table count and seats, run the assignment, and advance rotation rounds live.'
},
{
  icon: ScanLineIcon,
  title: 'Check-in desk',
  body: 'Scan attendees in at the door. The counter updates as the room fills.'
},
{
  icon: CalendarIcon,
  title: 'Sessions & schedule',
  body: 'Publish the agenda attendees browse from their phones.'
},
{
  icon: StoreIcon,
  title: 'Exhibitors',
  body: 'List stands and sponsors so attendees can find and connect with them.'
},
{
  icon: MapIcon,
  title: 'Venue heatmap',
  body: 'Watch where the room is dense and move refreshments accordingly.'
},
{
  icon: BarChart3Icon,
  title: 'Event analytics',
  body: 'Check-ins, connections made, and engagement across the whole event.'
}];


/**
 * Organizer tooling deliberately lives on the web while the mobile app stays
 * attendee-only, so the split is stated plainly rather than left implicit.
 */
export function ForOrganizers() {
  return (
    <section
      id="organizers"
      className="border-b border-ink-600/70 bg-ink-850">

      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              For organizers
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
              Run the event from a browser
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-fog-400">
            Organizer tools live on the web, where a laptop at the check-in desk
            belongs. The app stays focused on the person in the room.
          </p>
        </div>

        {/* the split, stated plainly */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="lift rounded-2xl border border-accent/25 bg-accent/[0.05] p-5">
            <div className="flex items-center gap-2">
              <MonitorIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              <p className="text-[13px] font-bold text-strong">Web · organizers</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-fog-300">
              Table setup, seating and rotation, the check-in desk, attendee lists,
              exhibitors, and analytics.
            </p>
          </div>
          <div className="lift rounded-2xl border border-ink-600/80 bg-ink-800 p-5">
            <div className="flex items-center gap-2">
              <SmartphoneIcon className="h-4 w-4 text-fog-300" aria-hidden="true" />
              <p className="text-[13px] font-bold text-strong">Mobile · attendees</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-fog-400">
              Check in, see my table, share a card, scan someone, and follow up
              afterwards.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ORGANIZER_TOOLS.map((tool, i) =>
          <Reveal key={tool.title} delay={i * 60} scale>
          <article
            key={tool.title}
            className="lift sheen rounded-2xl border border-ink-600/80 bg-ink-700 p-5">

              <span className="grid h-9 w-9 place-items-center rounded-xl border border-ink-500 bg-ink-600 text-fog-300">
                <tool.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-bold tracking-tight text-strong">
                {tool.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fog-400">
                {tool.body}
              </p>
            </article>
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}
