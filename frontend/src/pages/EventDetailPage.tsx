import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, joinEvent, getAttendees, checkParticipation, getParticipants } from '@/api/events';
import { getCards } from '@/api/cards';
import type { Event } from '@/types/event';
import type { Card } from '@/types/card';
import type { EventParticipation, EventParticipant } from '@/types/event';
import { useAuth } from '@/auth/useAuth';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import EventJoin from '@/components/events/EventJoin';
import ParticipantList from '@/components/events/ParticipantList';
import { formatDate } from '@/utils/helpers';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [attendees, setAttendees] = useState<EventParticipation[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const eventData = await getEvent(id);
        setEvent(eventData);

        try {
          const cardsData = await getCards();
          setUserCards(cardsData);
        } catch {
          setUserCards([]);
        }

        if (user) {
          // Check participation directly (works even if visibility is off)
          try {
            const participation = await checkParticipation(id);
            if (participation) {
              setHasJoined(true);
            }
          } catch {
            // ignore
          }

          // Also get attendees for display
          try {
            const attendeeData = await getAttendees(id);
            setAttendees(attendeeData);
          } catch {
            // Attendees may not be available
          }

          // If creator, fetch full participant details
          if (eventData.creatorId === user.id) {
            try {
              const participantData = await getParticipants(id);
              setParticipants(participantData);
            } catch {
              // Participant details may not be available
            }
          }
        }
      } catch (err: any) {
        showApiError(err, 'Failed to load event.');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleJoin = async (_eventId: string, cardId: string) => {
    if (!id) return;
    setJoinLoading(true);
    try {
      await joinEvent(id, cardId);
      toast.success('Joined event!');
      setHasJoined(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to join event.';
      // If already participating, treat as success
      if (message.includes('Already participating')) {
        toast.success('Already joined this event!');
        setHasJoined(true);
      } else {
        showApiError(err, 'Failed to join event.');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-20 text-text-secondary">Event not found.</div>;
  }

  const statusVariant =
    event.status === 'active' ? 'success' : event.status === 'completed' ? 'default' : 'default';

  const isCreator = user?.id === event.creatorId;

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Events
      </button>

      <div className="card-magical rounded-2xl p-6 shimmer-magical">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">{event.name}</h1>
            {event.description && (
              <p className="mt-2 text-sm text-text-secondary">{event.description}</p>
            )}
          </div>
          <Badge variant={statusVariant}>{event.status}</Badge>
        </div>

        <div className="mt-4 space-y-2 text-sm text-text-tertiary">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>{attendees.length} participant{attendees.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!hasJoined && event.status !== 'completed' && event.status !== 'cancelled' && (
            <Button variant="primary" onClick={() => setHasJoined(true)}>
              Join Event
            </Button>
          )}
          {hasJoined && event.isActive && (
            <Button variant="primary" onClick={() => navigate(`/events/${event.id}/active`)}>
              View Active Dashboard
            </Button>
          )}
          {isCreator && (
            <Button variant="secondary" onClick={() => navigate(`/events/${event.id}/active`)}>
              Manage Event
            </Button>
          )}
          {isCreator && (
            <Button variant="secondary" onClick={() => navigate(`/events/${event.id}/organizer`)}>
              Organizer Portal
            </Button>
          )}
          {hasJoined && !isCreator && (
            <Button variant="primary" onClick={() => navigate(`/events/${event.id}/check-in`)}>
              Check In
            </Button>
          )}
          {hasJoined && event.status === 'active' && (
            <Button variant="ghost" onClick={() => navigate(`/events/${event.id}/matches`)}>
              View Matches
            </Button>
          )}
        </div>
      </div>

      {!hasJoined && event.status !== 'completed' && event.status !== 'cancelled' && (
        <EventJoin
          eventId={event.id}
          userCards={userCards}
          onJoined={handleJoin}
          loading={joinLoading}
        />
      )}

      {isCreator && participants.length > 0 && (
        <div className="card-magical rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-gradient-magical mb-4">
            Participants ({participants.length})
          </h2>
          <ParticipantList participants={participants} />
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
