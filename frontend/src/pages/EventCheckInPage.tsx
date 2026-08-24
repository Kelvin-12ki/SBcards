import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/auth/useAuth';
import { getEvent } from '@/api/events';
import { checkIn, getMyAssignment } from '@/api/tables';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { initialsOf } from '@/components/events/organizer/CheckInCounter';
import type { Event } from '@/types/event';
import type { MyAssignment } from '@/types/table';

/** While waiting to be seated, re-check for an assignment on this cadence. */
const POLL_MS = 8000;

const EventCheckInPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [assignment, setAssignment] = useState<MyAssignment | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isOrganizer = !!event && !!user && event.creatorId === user.id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const ev = await getEvent(id);
        if (cancelled) return;
        setEvent(ev);

        // An existing assignment means they're already checked in and seated.
        const mine = await getMyAssignment(id).catch(() => null);
        if (cancelled) return;
        if (mine) {
          setAssignment(mine);
          setCheckedIn(true);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            (err as { friendlyMessage?: string })?.friendlyMessage ??
              'Could not load this event.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /** Once checked in but not yet seated, watch for the organizer's assignment. */
  useEffect(() => {
    if (!id || !checkedIn || assignment) return;

    const handle = window.setInterval(async () => {
      const mine = await getMyAssignment(id).catch(() => null);
      if (mine && mounted.current) setAssignment(mine);
    }, POLL_MS);

    return () => window.clearInterval(handle);
  }, [id, checkedIn, assignment]);

  const handleCheckIn = useCallback(async () => {
    if (!id) return;
    setCheckingIn(true);
    try {
      const result = await checkIn(id);
      setCheckedIn(true);
      if (!result.hasCard) {
        toast('Checked in. Add a card to be seated at a table.', {
          icon: '⚠️',
        });
      } else {
        toast.success("You're checked in");
      }
      const mine = await getMyAssignment(id).catch(() => null);
      if (mine && mounted.current) setAssignment(mine);
    } catch (err) {
      toast.error(
        (err as { friendlyMessage?: string })?.friendlyMessage ??
          'Check-in failed.',
      );
    } finally {
      setCheckingIn(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Event unavailable
        </h1>
        <p className="mt-2 text-text-secondary">
          {loadError ?? 'This event could not be found.'}
        </p>
        <Link to="/events" className="mt-6 inline-block">
          <Button variant="secondary">Back to events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <Link
          to={`/events/${event.id}`}
          className="text-sm text-text-secondary transition hover:text-text-primary"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-gradient-magical sm:text-3xl">
          {checkedIn ? 'My Table' : 'Check In'}
        </h1>
      </header>

      {isOrganizer && (
        <Link to={`/events/${event.id}/organizer`} className="mb-6 block">
          <Button variant="secondary" size="sm">
            Open Organizer Portal
          </Button>
        </Link>
      )}

      {!checkedIn && (
        <div className="card-magical rounded-2xl p-6 text-center">
          <p className="mb-5 text-text-secondary">
            Check in when you arrive so the organizer can seat you at a table.
          </p>
          <Button size="lg" onClick={handleCheckIn} loading={checkingIn}>
            Check In
          </Button>
        </div>
      )}

      {checkedIn && !assignment && (
        <EmptyState
          title="You're checked in"
          description="You'll see your table here as soon as the organizer runs the seating."
        />
      )}

      {assignment && (
        <div className="space-y-5">
          <div className="card-magical rounded-2xl p-6 text-center shimmer-magical">
            <p className="text-sm uppercase tracking-wide text-text-secondary">
              You're seated at
            </p>
            <p className="mt-1 font-display text-4xl font-bold text-gradient-magical">
              {assignment.label || `Table ${assignment.tableNumber}`}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Seat {assignment.seatNumber}
              {assignment.rotationRound > 0 && (
                <> · Round {assignment.rotationRound + 1}</>
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-text-primary">
              Your tablemates{' '}
              <span className="text-sm font-normal text-text-secondary">
                ({assignment.tablemates.length})
              </span>
            </h2>

            {assignment.tablemates.length === 0 ? (
              <p className="text-sm text-text-secondary">
                You're the first at this table.
              </p>
            ) : (
              <ul className="space-y-4">
                {assignment.tablemates.map((m) => (
                  <li key={m.userId} className="card-magical rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={m.avatarUrl}
                        alt={m.userName}
                        fallbackInitials={initialsOf(m.userName)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary">
                          {m.userName}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {[m.jobRole, m.company].filter(Boolean).join(' · ') ||
                            'Seat ' + m.seatNumber}
                        </p>

                        {m.sharedKeywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.sharedKeywords.slice(0, 5).map((k) => (
                              <span
                                key={k}
                                className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-secondary"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {m.conversationStarters.length > 0 && (
                      <div className="mt-3 border-t border-border-subtle pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                          Conversation starters
                        </p>
                        <ul className="space-y-1.5">
                          {m.conversationStarters.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm leading-relaxed text-text-primary"
                            >
                              · {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCheckInPage;
