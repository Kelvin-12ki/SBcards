import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar, Plus } from 'lucide-react';
import { getEvents, getExternalEvents } from '@/api/events';
import type { Event } from '@/types/event';
import type { ExternalEvent } from '@/api/events';
import EventList from '@/components/events/EventList';
import ExternalEventCard from '@/components/events/ExternalEventCard';
import CreateEventModal from '@/components/events/CreateEventModal';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { showApiError } from '@/utils/errorHandler';
import { useAuth } from '@/auth/useAuth';
import { canOrganize } from '@/types/user';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = canOrganize(user);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [externalLoading, setExternalLoading] = useState(true);

  useEffect(() => {
    // Fetch local events
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        showApiError(err, 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch external events from Nairobi Events Guide
    const fetchExternal = async () => {
      setExternalLoading(true);
      try {
        const data = await getExternalEvents();
        setExternalEvents(data);
      } catch {
        // Silently fail — external events are optional
      } finally {
        setExternalLoading(false);
      }
    };

    fetchEvents();
    fetchExternal();
  }, []);

  const handleJoin = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleView = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleCreated = (created: Event) => {
    setEvents((prev) => [created, ...prev]);
    setTab('mine');
    navigate(`/events/${created.id}`);
  };

  // "My Events" is organizer-only, so an attendee always sees the full list.
  const visibleEvents =
    isOrganizer && tab === 'mine'
      ? events.filter((e) => e.creatorId === user?.id)
      : events;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
          Events
        </h1>
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Event
            </Button>
          )}
          <a
            href="https://nairobieventsguide.com/upcoming-events/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-all hover:border-gold/40 hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Nairobi Events Guide
          </a>
        </div>
      </div>

      {/* Tabs — organizers only; attendees have nothing to filter by */}
      {isOrganizer && (
        <div className="mb-5 flex gap-1 border-b border-border-subtle" role="tablist">
          {([['all', 'All Events'], ['mine', 'My Events']] as const).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? 'border-b-2 border-gold px-4 py-2.5 text-sm font-semibold text-gold'
                    : 'border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary'
                }
              >
                {label}
              </button>
            ),
          )}
        </div>
      )}

      {/* Local Events */}
      <section>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <EventList events={visibleEvents} onJoin={handleJoin} onView={handleView} />
        )}
      </section>

      {isOrganizer && (
        <CreateEventModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* External Events from Nairobi Events Guide */}
      {(externalLoading || externalEvents.length > 0) && (
        <section className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl gradient-magical p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Upcoming in Nairobi
              </h2>
              <p className="text-xs text-text-secondary">
                Powered by{' '}
                <a
                  href="https://nairobieventsguide.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  nairobieventsguide.com
                </a>
              </p>
            </div>
          </div>

          {externalLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {externalEvents.map((event, idx) => (
                <ExternalEventCard key={`${event.eventUrl}-${idx}`} event={event} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EventsPage;
