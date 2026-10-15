import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getEventSuggestions } from '@/api/events';
import { createConnection } from '@/api/connections';
import type { EventSuggestion } from '@/types/event';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { showApiError } from '@/utils/errorHandler';

type RowState = 'idle' | 'connecting' | 'requested';

const skippedKey = (eventId: string) => `sbcards:skipped:${eventId}`;

function readSkipped(eventId: string): string[] {
  try {
    const raw = localStorage.getItem(skippedKey(eventId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeSkipped(eventId: string, userIds: string[]) {
  try {
    localStorage.setItem(skippedKey(eventId), JSON.stringify(userIds));
  } catch {
    // Storage unavailable (private mode); skips just won't persist.
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

/**
 * Shown straight after joining an event: who else is here, with a per-person
 * Connect or Skip.
 *
 * The API sends a reduced profile for this screen on purpose - phone and email
 * are never included, so the display name and card headline are all there is.
 * Keep it that way if you extend the shape.
 */
const EventPeoplePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [eventName, setEventName] = useState('');
  const [people, setPeople] = useState<EventSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await getEventSuggestions(id);
        setEventName(res.eventName);
        setPeople(res.suggestions);
        setSkipped(readSkipped(id));
      } catch (err) {
        showApiError(err, 'Could not load people at this event.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleSkip = useCallback(
    (userId: string) => {
      if (!id) return;
      setSkipped((prev) => {
        const next = prev.includes(userId) ? prev : [...prev, userId];
        writeSkipped(id, next);
        return next;
      });
    },
    [id],
  );

  const handleShowAll = useCallback(() => {
    if (!id) return;
    setSkipped([]);
    writeSkipped(id, []);
  }, [id]);

  const handleConnect = useCallback(
    async (person: EventSuggestion) => {
      setStates((prev) => ({ ...prev, [person.userId]: 'connecting' }));
      try {
        await createConnection({
          connectedUserId: person.userId,
          eventId: id,
          source: 'event_recommendation',
        });
        setStates((prev) => ({ ...prev, [person.userId]: 'requested' }));
        toast.success('Request sent');
      } catch (err) {
        setStates((prev) => ({ ...prev, [person.userId]: 'idle' }));
        showApiError(err, 'Could not send the request.');
      }
    },
    [id],
  );

  const visible = useMemo(
    () => people.filter((p) => !skipped.includes(p.userId)),
    [people, skipped],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/events/${id}`}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Event
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-magical">
          People here{eventName ? ` - ${eventName}` : ''}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {visible.length} other{visible.length !== 1 ? 's' : ''} you can connect with
        </p>
      </div>

      {people.length === 0 ? (
        <EmptyState
          title="You're the first one here"
          description="As more people join, they'll show up on this page so you can connect."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing left to review"
          description="You've skipped everyone for now."
          action={{ label: 'Show everyone again', onClick: handleShowAll }}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((person) => {
            const name =
              person.card?.fullName || person.displayName || 'Unknown';
            const subtitle =
              person.card?.headline ||
              [person.card?.role, person.card?.company]
                .filter(Boolean)
                .join(' · ');
            const state = states[person.userId] || 'idle';

            return (
              <div
                key={person.userId}
                className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-4"
              >
                <Avatar
                  src={person.avatarUrl}
                  alt={name}
                  size="md"
                  fallbackInitials={initials(name)}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {name}
                  </p>
                  {subtitle && (
                    <p className="truncate text-xs text-text-secondary">
                      {subtitle}
                    </p>
                  )}
                </div>

                {state === 'requested' ? (
                  <span className="text-xs font-semibold text-success">
                    Requested
                  </span>
                ) : (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSkip(person.userId)}
                    >
                      Skip
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={state === 'connecting'}
                      onClick={() => void handleConnect(person)}
                    >
                      Connect
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventPeoplePage;
