import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, getAttendees, getParticipants } from '@/api/events';
import { getMatches, runMatching, getMyTable, assignTables } from '@/api/matching';
import { useAuth } from '@/auth/useAuth';
import type { Event, EventParticipation, EventParticipant } from '@/types/event';
import type { Match, TableAssignment } from '@/types/match';
import EventDashboard from '@/components/events/EventDashboard';
import ParticipantList from '@/components/events/ParticipantList';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const EventActivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipation[]>([]);
  const [detailedParticipants, setDetailedParticipants] = useState<EventParticipant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [tableAssignment, setTableAssignment] = useState<TableAssignment | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [assignTablesLoading, setAssignTablesLoading] = useState(false);

  const isCreator = user?.id === event?.creatorId;

  const fetchData = async () => {
    if (!id) return;

    try {
      const [eventData, attendeeData] = await Promise.all([
        getEvent(id),
        getAttendees(id),
      ]);
      setEvent(eventData);
      setParticipants(attendeeData);

      // If creator, fetch detailed participant info
      if (user?.id === eventData.creatorId) {
        try {
          const detailedData = await getParticipants(id);
          setDetailedParticipants(detailedData);
        } catch {
          // Participant details may not be available
        }
      }

      try {
        const matchData = await getMatches(id);
        setMatches(matchData);
      } catch {
        // Matching may not have run yet
      }
      setMatchesLoading(false);

      try {
        const tableData = await getMyTable(id);
        setTableAssignment(tableData);
      } catch {
        // Table may not be assigned yet
      }
      setTableLoading(false);
    } catch (err) {
      toast.error('Failed to load event data.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const handleRunMatching = async () => {
    if (!id) return;
    setMatchingLoading(true);
    try {
      const matchData = await runMatching(id);
      setMatches(matchData);
      toast.success('Matching complete!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to run matching.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAssignTables = async () => {
    if (!id) return;
    setAssignTablesLoading(true);
    try {
      await assignTables(id);
      toast.success('Tables assigned!');
      const tableData = await getMyTable(id);
      setTableAssignment(tableData);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign tables.');
    } finally {
      setAssignTablesLoading(false);
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/events/${id}`)}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Event
        </button>

        {isCreator && (
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" loading={matchingLoading} onClick={handleRunMatching}>
              Run Matching
            </Button>
            <Button variant="secondary" size="sm" loading={assignTablesLoading} onClick={handleAssignTables} disabled={matches.length === 0}>
              Assign Tables
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-2">
        <span
          className="inline-flex items-center rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 px-4 py-1.5 text-sm font-semibold text-neon-cyan border border-neon-cyan/30 cursor-default"
        >
          Dashboard
        </span>
        <button
          onClick={() => navigate(`/events/${id}/schedule`)}
          className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Schedule
        </button>
        <button
          onClick={() => navigate(`/events/${id}/exhibitors`)}
          className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Exhibitors
        </button>
        {isCreator && (
          <button
            onClick={() => navigate(`/events/${id}/analytics`)}
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Analytics
          </button>
        )}
      </div>

      <EventDashboard
        event={event}
        participants={participants}
        matches={matches}
        matchesLoading={matchesLoading}
        tableAssignment={tableAssignment}
        tableLoading={tableLoading}
      />

      {isCreator && detailedParticipants.length > 0 && (
        <div className="card-magical rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-gradient-magical mb-4">
            Participants ({detailedParticipants.length})
          </h2>
          <ParticipantList participants={detailedParticipants} />
        </div>
      )}
    </div>
  );
};

export default EventActivePage;
