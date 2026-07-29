import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '@/api/events';
import type { Event } from '@/types/event';
import EventList from '@/components/events/EventList';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleJoin = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleView = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-magical">Events</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <EventList events={events} onJoin={handleJoin} onView={handleView} />
      )}
    </div>
  );
};

export default EventsPage;
