import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventAnalytics } from '@/api/analytics';
import { getEvent } from '@/api/events';
import type { Event } from '@/types/event';
import type { EventAnalytics } from '@/types/analytics';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const AnalyticsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        const [eventData, analyticsData] = await Promise.all([
          getEvent(eventId),
          getEventAnalytics(eventId),
        ]);
        setEvent(eventData);
        setAnalytics(analyticsData);
      } catch (err: any) {
        toast.error('Failed to load analytics.');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, navigate]);

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

  if (!analytics) {
    return (
      <EmptyState
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        }
        title="Analytics not available"
        description="Analytics data is not yet available for this event."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Event Analytics
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{event.name}</p>
      </div>

      {/* Dashboard */}
      <AnalyticsDashboard analytics={analytics} />
    </div>
  );
};

export default AnalyticsPage;
