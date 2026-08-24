import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/auth/useAuth';
import { getEvent, getParticipants } from '@/api/events';
import {
  getCheckIns,
  getTableAttendees,
  getEventTables,
  setupTables,
  assignTables,
  rotateTables,
  checkOut,
} from '@/api/tables';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import CheckInCounter from '@/components/events/organizer/CheckInCounter';
import TableGrid from '@/components/events/organizer/TableGrid';
import AttendeeTable from '@/components/events/organizer/AttendeeTable';
import SetupTablesModal from '@/components/events/organizer/SetupTablesModal';
import type { Event } from '@/types/event';
import type {
  CheckInRecord,
  EventTable,
  TableAttendee,
  SetupTablesPayload,
} from '@/types/table';

/** How often the arrivals list refreshes while the dashboard is open. */
const POLL_MS = 5000;

const EventOrganizerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [attendees, setAttendees] = useState<TableAttendee[]>([]);
  const [tables, setTables] = useState<EventTable[]>([]);
  const [expected, setExpected] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  // Avoids a slow poll response overwriting fresher state after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isOrganizer = !!event && !!user && event.creatorId === user.id;

  /** Initial load: event + everything the dashboard shows. */
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

        // Only the creator may read the organizer-only endpoints; skip them
        // otherwise so we don't fire calls that will 403.
        if (user && ev.creatorId === user.id) {
          const [ci, at, tb] = await Promise.all([
            getCheckIns(id),
            getTableAttendees(id),
            getEventTables(id),
          ]);
          if (cancelled) return;
          setCheckIns(ci);
          setAttendees(at);
          setTables(tb);

          // Expected headcount for the "14 / 36" counter.
          try {
            const participants = await getParticipants(id);
            if (!cancelled) setExpected(participants.length);
          } catch {
            // Non-fatal: the counter just renders without a denominator.
          }
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
  }, [id, user]);

  /** Live arrivals: poll check-ins while the dashboard is open. */
  useEffect(() => {
    if (!id || !isOrganizer) return;

    const tick = async () => {
      try {
        const [ci, at] = await Promise.all([
          getCheckIns(id),
          getTableAttendees(id),
        ]);
        if (mounted.current) {
          setCheckIns(ci);
          setAttendees(at);
        }
      } catch {
        // Silent: a dropped poll shouldn't spam the organizer mid-event.
      }
    };

    const handle = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(handle);
  }, [id, isOrganizer]);

  const refreshTables = useCallback(async () => {
    if (!id) return;
    try {
      const tb = await getEventTables(id);
      if (mounted.current) setTables(tb);
    } catch {
      // Ignored — the action handlers already surface their own errors.
    }
  }, [id]);

  const handleSetup = async (payload: SetupTablesPayload) => {
    if (!id) return;
    const result = await setupTables(id, payload);
    setTables(result);
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            tableCount: payload.tableCount,
            tableCapacity: payload.seatsPerTable,
          }
        : prev,
    );
    toast.success(
      `${payload.tableCount} tables x ${payload.seatsPerTable} seats saved`,
    );
  };

  const handleAssign = async () => {
    if (!id) return;
    setAssigning(true);
    try {
      const result = await assignTables(id);
      setTables(result);
      const seated = result.reduce((n, t) => n + t.attendees.length, 0);
      toast.success(`Seated ${seated} across ${result.length} tables`);
    } catch (err) {
      toast.error(
        (err as { friendlyMessage?: string })?.friendlyMessage ??
          'Table assignment failed.',
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleRotate = async () => {
    if (!id) return;
    setRotating(true);
    try {
      const result = await rotateTables(id);
      setTables(result);
      toast.success('Rotated — everyone has new tablemates');
    } catch (err) {
      toast.error(
        (err as { friendlyMessage?: string })?.friendlyMessage ??
          'Rotation failed.',
      );
    } finally {
      setRotating(false);
    }
  };

  const handleCheckOut = async (userId: string) => {
    if (!id) return;
    // Optimistic: the row disappears immediately, poll reconciles either way.
    setCheckIns((prev) => prev.filter((c) => c.userId !== userId));
    try {
      await checkOut(id, userId);
      await refreshTables();
    } catch (err) {
      toast.error(
        (err as { friendlyMessage?: string })?.friendlyMessage ??
          'Could not check that person out.',
      );
      const ci = await getCheckIns(id).catch(() => null);
      if (ci && mounted.current) setCheckIns(ci);
    }
  };

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

  // Attendees land on the check-in view; organizer tools are creator-only.
  if (!isOrganizer) {
    return <Navigate to={`/events/${event.id}/check-in`} replace />;
  }

  const seatsPerTable = event.tableCapacity;
  const hasTables = tables.length > 0;
  const seatedCount = tables.reduce((n, t) => n + t.attendees.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <Link
          to={`/events/${event.id}`}
          className="text-sm text-text-secondary transition hover:text-text-primary"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-gradient-magical sm:text-3xl">
          Organizer Portal
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Run check-in, seat attendees, and rotate tables.
          {typeof event.currentRotationRound === 'number' &&
            event.currentRotationRound > 0 && (
              <> Currently on round {event.currentRotationRound + 1}.</>
            )}
        </p>
      </header>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setSetupOpen(true)}>
          Setup Tables
        </Button>
        <Button
          onClick={handleAssign}
          loading={assigning}
          disabled={attendees.length === 0}
        >
          Assign Tables
        </Button>
        <Button
          variant="secondary"
          onClick={handleRotate}
          loading={rotating}
          disabled={!hasTables || seatedCount === 0}
        >
          Rotate
        </Button>
      </div>

      {attendees.length === 0 && (
        <p className="mb-6 rounded-xl border border-border-subtle bg-surface-2 p-3 text-sm text-text-secondary">
          Assignment needs checked-in attendees who have a card. Nobody
          qualifies yet.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CheckInCounter
            checkIns={checkIns}
            expected={expected}
            onCheckOut={handleCheckOut}
          />
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold text-text-primary">
            Table layout
          </h2>
          <TableGrid tables={tables} seatsPerTable={seatsPerTable} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-text-primary">
          Checked-in attendees{' '}
          <span className="text-sm font-normal text-text-secondary">
            ({attendees.length})
          </span>
        </h2>
        <AttendeeTable attendees={attendees} />
      </section>

      <SetupTablesModal
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSubmit={handleSetup}
        initial={{
          tableCount: event.tableCount,
          seatsPerTable: event.tableCapacity,
        }}
        attendeeCount={attendees.length}
      />
    </div>
  );
};

export default EventOrganizerPage;
