import React from 'react';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import {
  CheckInArt,
  CreateEventArt,
  SeatRotateArt,
  TableLayoutArt } from
'../illustrations/OrganizerArt';
import { LinkButton } from '../ui/Button';
import { Reveal } from '../motion/Reveal';
import { appLinkProps, appRoutes } from '../../config/app';

/**
 * How someone actually becomes an organizer.
 *
 * There is no application or approval step in the product — whoever creates an
 * event is that event's organizer — so the section says exactly that instead of
 * implying a gate that does not exist.
 */
const JOURNEY = [
{
  step: '01',
  title: 'Create your account',
  body: 'The same free account attendees use. No separate organizer plan, no sales call to get started.',
  art: CreateEventArt,
  href: appRoutes.register,
  cta: 'Create an account'
},
{
  step: '02',
  title: 'Create an event',
  body: 'Give it a name, a date, and a venue. The moment you create it, you are its organizer — the portal unlocks on the spot.',
  art: TableLayoutArt,
  href: appRoutes.events,
  cta: 'Go to Events'
},
{
  step: '03',
  title: 'Lay out the room',
  body: 'Set how many tables you have and how many seats each one holds. That layout is what the seating engine works with.',
  art: CheckInArt,
  href: null,
  cta: null
},
{
  step: '04',
  title: 'Open the doors and seat the room',
  body: 'Scan attendees in at the check-in desk, run the assignment, and advance a rotation round whenever you want the room to mix again.',
  art: SeatRotateArt,
  href: null,
  cta: null
}];


const INCLUDED = [
'Table layout, seating, and rotation rounds',
'A check-in desk with a live counter',
'The full attendee list for your event',
'Exhibitor listings and the venue heatmap',
'Event analytics once the day is done'];


export function BecomeOrganizer() {
  return (
    <section
      id="become-organizer"
      className="border-b border-ink-600/70 bg-ink-900">

      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Become an organizer
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
            Anyone can run an event
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fog-300 sm:text-base">
            There is no application and nothing to unlock. Create an event and you
            are its organizer — the portal, the check-in desk, and the seating
            engine are yours from that moment.
          </p>
        </Reveal>

        {/* the journey */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {JOURNEY.map((stage, index) => {
            const Art = stage.art;
            return (
              <Reveal key={stage.step} delay={index * 90} scale>
                <article className="lift sheen flex h-full flex-col rounded-2xl border border-ink-600/80 bg-ink-850 p-5">
                  <div className="overflow-hidden rounded-xl">
                    <Art />
                  </div>

                  <div className="mt-5 flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                      {stage.step}
                    </span>
                    <h3 className="text-[15px] font-bold tracking-tight text-strong">
                      {stage.title}
                    </h3>
                  </div>

                  <p className="mt-2 text-[13px] leading-relaxed text-fog-400">
                    {stage.body}
                  </p>

                  {stage.href && stage.cta &&
                  <a
                    href={stage.href}
                    {...appLinkProps}
                    className="group mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent transition-colors hover:text-strong">

                      {stage.cta}
                      <ArrowRightIcon
                      className="h-3.5 w-3.5 transition-transform duration-300 ease-smooth group-hover:translate-x-1"
                      aria-hidden="true" />

                    </a>}

                </article>
              </Reveal>);

          })}
        </div>

        {/* what you get + the call to action */}
        <Reveal delay={120} className="mt-6">
          <div className="grid gap-6 rounded-3xl border border-accent/25 bg-accent/[0.05] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-strong">
                What the organizer portal gives you
              </h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {INCLUDED.map((item) =>
                <li key={item} className="flex items-start gap-2">
                    <CheckIcon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                    aria-hidden="true" />

                    <span className="text-[13px] leading-relaxed text-fog-300">
                      {item}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-2.5">
              <LinkButton
                href={appRoutes.register}
                variant="primary"
                size="lg"
                {...appLinkProps}>

                Start an event
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton
                href={appRoutes.events}
                variant="outline"
                size="lg"
                {...appLinkProps}>

                Browse events
              </LinkButton>
              <p className="mt-1 text-center text-[11px] leading-relaxed text-fog-500">
                Organizer tools run in the browser. Attendees use the mobile app.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>);

}
