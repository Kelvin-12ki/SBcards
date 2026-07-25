import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventSessions, createSession, deleteSession, checkinSession } from '@/api/sessions';
import { getEvent } from '@/api/events';
import { useAuth } from '@/auth/useAuth';
import type { Event } from '@/types/event';
import type { Session } from '@/types/session';
import ScheduleTimeline from '@/components/events/ScheduleTimeline';
import SessionForm from '@/components/events/SessionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const SchedulePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [checkedInSessions, setCheckedInSessions] = useState<string[]>([]);

  const isOrganizer = user?.id === event?.creatorId;

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [eventData, sessionData] = await Promise.all([
        getEvent(eventId),
        getEventSessions(eventId),
      ]);
      setEvent(eventData);
      setSessions(sessionData);
    } catch (err: any) {
      toast.error('Failed to load schedule.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSession = async (data: Partial<Session>) => {
    if (!eventId) return;
    setFormLoading(true);
    try {
      const newSession = await createSession(eventId, data);
      setSessions((prev) => [...prev, newSession].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ));
      toast.success('Session created!');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create session.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session deleted.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete session.');
    }
  };

  const handleCheckin = async (sessionId: string) => {
    try {
      await checkinSession(sessionId);
      setCheckedInSessions((prev) => [...prev, sessionId]);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, checkinCount: s.checkinCount + 1 } : s,
        ),
      );
      toast.success('Checked in!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check in.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Event
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
            Event Schedule
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{event.name}</p>
        </div>
        {isOrganizer && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Session
          </Button>
        )}
      </div>

      {/* Schedule Timeline */}
      <ScheduleTimeline
        sessions={sessions}
        onCheckin={handleCheckin}
        checkedInSessions={checkedInSessions}
        isOrganizer={isOrganizer}
        onDelete={handleDeleteSession}
        onEdit={() => {
          toast('Edit functionality coming soon');
        }}
      />

      {/* Create Session Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Session"
        size="lg"
      >
        <SessionForm
          onSubmit={handleCreateSession}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
};

export default SchedulePage;
