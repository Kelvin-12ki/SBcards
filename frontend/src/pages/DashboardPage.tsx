import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, Wallet, Sparkles, Search, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { getCards } from '@/api/cards';
import { getEvents } from '@/api/events';
import { getMatches } from '@/api/matching';
import { getUnreadCount } from '@/api/messaging';
import { getUserFeed } from '@/api/timeline';
import { getInsights } from '@/api/insights';
import { isEmailVerified, resendVerificationEmail } from '@/api/auth';
import toast from 'react-hot-toast';
import type { Card } from '@/types/card';
import type { Event } from '@/types/event';
import type { Match } from '@/types/match';
import type { Activity } from '@/types/timeline';
import type { Insight } from '@/types/insight';
import CardPreview from '@/components/cards/CardPreview';
import EventCard from '@/components/events/EventCard';
import MatchCard from '@/components/matching/MatchCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  // New state for engagement widgets
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [unreadLoading, setUnreadLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // AI Insights state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Email verification state
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resending, setResending] = useState(false);

  // New user welcome state (flag set by RegisterPage)
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsData, eventsData, unreadData, activityData, insightsData] = await Promise.all([
          getCards(),
          getEvents({ limit: 5 }),
          getUnreadCount().catch(() => ({ count: 0 })),
          getUserFeed(1, 5).catch(() => [] as Activity[]),
          getInsights().catch(() => [] as Insight[]),
        ]);
        setCards(cardsData);
        setEvents(eventsData.slice(0, 3));
        setUnreadCount(unreadData.count);
        setRecentActivities(activityData.slice(0, 3));
        setInsights(insightsData);

        const activeEvents = eventsData.filter((e) => e.status === 'active');
        if (activeEvents.length > 0) {
          const matchPromises = activeEvents.slice(0, 1).map((e) => getMatches(e.id));
          const matchResults = await Promise.all(matchPromises);
          const allMatches = matchResults.flat();
          setMatches(allMatches.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setCardsLoading(false);
        setEventsLoading(false);
        setMatchesLoading(false);
        setUnreadLoading(false);
        setActivitiesLoading(false);
        setInsightsLoading(false);
      }
    };

    fetchData();

    // Check email verification status
    isEmailVerified().then(setEmailVerified).catch(() => setEmailVerified(false));
  }, []);

  // Check if user just registered
  useEffect(() => {
    if (localStorage.getItem('sbcards_just_registered') === '1') {
      setIsNewUser(true);
      localStorage.removeItem('sbcards_just_registered');
    }
  }, []);

  const defaultCard = cards.find((c) => c.isDefault) || cards[0];

  return (
    <div className="space-y-6 md:space-y-10">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-gold">
          {isNewUser ? 'Welcome' : 'Welcome back'}{user?.displayName ? `, ${user.displayName}` : ''}!
        </h1>
        <p className="mt-1.5 text-base text-text-secondary">
          {isNewUser ? 'Let\'s get you started with SBCards.' : 'Here\'s your networking overview.'}
        </p>
      </div>

      {/* Email Verification Banner */}
      {emailVerified === false && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">Verify your email address</p>
            <p className="text-xs text-text-secondary truncate">Check your inbox for a verification link.</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            loading={resending}
            onClick={async () => {
              setResending(true);
              try {
                await resendVerificationEmail();
                toast.success('Verification email sent!');
              } catch {
                toast.error('Failed to send verification email');
              } finally {
                setResending(false);
              }
            }}
          >
            Resend
          </Button>
        </div>
      )}

      {emailVerified === true && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>Email verified</span>
        </div>
      )}

      {/* Quick Search */}
      <div>
        <button
          onClick={() => navigate('/search')}
          className="flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 text-left transition-all duration-200 card-magical hover-glow-gold group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan/10 text-neon-cyan group-hover:bg-neon-cyan/20 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Search SBCards</p>
            <p className="text-xs text-text-secondary">Find people, events, organizations...</p>
          </div>
          <kbd className="hidden rounded-md border border-border-subtle bg-surface-2 px-2 py-0.5 text-[10px] text-text-tertiary sm:inline-block">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Quick-access cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {/* Messages */}
        <button
          onClick={() => navigate('/messages')}
          className="rounded-2xl border border-border-subtle bg-surface-1 p-3 sm:p-5 text-left transition-all duration-200 card-magical hover-glow-gold group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            {unreadCount > 0 && !unreadLoading && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-gold-ink shadow-lg shadow-gold/30 animate-glow-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Messages</h3>
          <p className="text-xs text-text-secondary mt-1">
            {unreadLoading
              ? 'Loading...'
              : unreadCount > 0
                ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
                : 'No unread messages'}
          </p>
        </button>

        {/* Timeline */}
        <button
          onClick={() => navigate('/timeline')}
          className="rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-all duration-200 card-magical hover-glow-magical group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan/10 text-neon-cyan group-hover:bg-neon-cyan/20 transition-colors">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Activity Feed</h3>
          <p className="text-xs text-text-secondary mt-1">
            {activitiesLoading
              ? 'Loading...'
              : recentActivities.length > 0
                ? `${recentActivities.length} recent activit${recentActivities.length !== 1 ? 'ies' : 'y'}`
                : 'No recent activity'}
          </p>
        </button>

        {/* Wallet */}
        <button
          onClick={() => navigate('/wallet')}
          className="rounded-2xl border border-border-subtle bg-surface-1 p-3 sm:p-5 text-left transition-all duration-200 card-magical hover-glow-gold group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-purple/10 text-neon-purple group-hover:bg-neon-purple/20 transition-colors">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Card Wallet</h3>
          <p className="text-xs text-text-secondary mt-1">
            {cardsLoading ? 'Loading...' : `${cards.length} card${cards.length !== 1 ? 's' : ''} collected`}
          </p>
        </button>

        {/* AI Insights */}
        <button
          onClick={() => navigate('/insights')}
          className="rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-all duration-200 card-magical hover-glow-magical group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/10 text-neon-purple group-hover:from-neon-purple/30 group-hover:to-neon-cyan/20 transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">AI Insights</h3>
          <p className="text-xs text-text-secondary mt-1">
            {insightsLoading
              ? 'Loading...'
              : insights.length > 0
                ? `${insights.length} insight${insights.length !== 1 ? 's' : ''} available`
                : 'No insights yet'}
          </p>
        </button>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gradient-gold">
            {defaultCard ? 'Your Card' : 'Get Started'}
          </h2>
          {defaultCard && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/cards/new')}>
              Edit
            </Button>
          )}
        </div>

        {cardsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : defaultCard ? (
          <CardPreview card={defaultCard} className="max-w-md" />
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center">
            <p className="text-sm text-text-secondary mb-4">
              You haven&apos;t created a card yet.
            </p>
            <Button variant="primary" onClick={() => navigate('/cards/new')}>
              Create Your First Card
            </Button>
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gradient-gold">Upcoming Events</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
            View All
          </Button>
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center">
            <p className="text-sm text-text-secondary mb-4">No upcoming events.</p>
            <Button variant="primary" onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onView={(id) => navigate(`/events/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gradient-magical">Recent Matches</h2>
        </div>

        {matchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center">
            <p className="text-sm text-text-secondary">
              No matches yet. Join an active event to find connections.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
