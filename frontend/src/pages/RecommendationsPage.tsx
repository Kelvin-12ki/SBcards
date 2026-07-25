import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRecommendations } from '@/api/matching';
import { getEvent } from '@/api/events';
import { useAuth } from '@/auth/useAuth';
import type { Recommendation } from '@/types/recommendation';
import type { Event } from '@/types/event';
import EnhancedMatchCard from '@/components/matching/EnhancedMatchCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const RecommendationsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        const [eventData, recsData] = await Promise.all([
          getEvent(eventId),
          getRecommendations(eventId),
        ]);
        setEvent(eventData);
        setRecommendations(recsData);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Failed to load recommendations.';
        toast.error(message);
        navigate(`/events/${eventId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, navigate]);

  const isCreator = user?.id === event?.creatorId;

  // Sort by match score descending
  const sorted = [...recommendations].sort((a, b) => b.matchScore - a.matchScore);

  const handleWhy = (targetUserId: string) => {
    navigate(`/events/${eventId}/recommendations/why/${targetUserId}`);
  };

  const handleConnect = (_targetUserId: string) => {
    toast.success('Connection request sent!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Event
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
            People You Should Meet
          </h1>
          {event && (
            <p className="mt-1 text-sm text-text-secondary">{event.name}</p>
          )}
        </div>
      </div>

      {/* Body */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          title="No recommendations yet"
          description={
            isCreator
              ? 'Run matching first to generate AI-powered recommendations for your event.'
              : 'Recommendations will appear here once the event organizer runs the matching algorithm.'
          }
          action={
            isCreator
              ? {
                  label: 'Run Matching',
                  onClick: () => navigate(`/events/${eventId}/active`),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((rec) => (
            <EnhancedMatchCard
              key={rec.id || rec.targetUserId}
              match={rec}
              onConnect={handleConnect}
              onWhy={handleWhy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
