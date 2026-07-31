import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWhyRecommendation } from '@/api/matching';
import type { WhyRecommendation } from '@/types/recommendation';
import MatchExplanation from '@/components/matching/MatchExplanation';
import ConversationStarters from '@/components/matching/ConversationStarters';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { showApiError } from '@/utils/errorHandler';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

const FACTOR_COLORS: Record<string, string> = {
  skillcomplementarity: 'bg-neon-cyan',
  industryrelevance: 'bg-gold',
  interestoverlap: 'bg-neon-pink',
  networkinggoals: 'bg-neon-purple',
  newconnection: 'bg-success',
};

const FACTOR_BG_COLORS: Record<string, string> = {
  skillcomplementarity: 'bg-neon-cyan/20',
  industryrelevance: 'bg-gold/20',
  interestoverlap: 'bg-neon-pink/20',
  networkinggoals: 'bg-neon-purple/20',
  newconnection: 'bg-success/20',
};

const factorLabels: Record<string, string> = {
  skillcomplementarity: 'Skills Match',
  industryrelevance: 'Industry',
  interestoverlap: 'Interests',
  networkinggoals: 'Goals',
  newconnection: 'New Connection',
};

const UserProfileCard: React.FC<{
  user: WhyRecommendation['targetUser'];
  label: string;
}> = ({ user, label }) => {
  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="card-magical rounded-2xl p-5 shimmer-magical flex-1">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-aurora text-2xl font-bold text-white shadow-lg shadow-neon-purple/20">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">
          {user?.displayName || 'Unknown'}
        </h3>
        {(user?.title || user?.company) && (
          <p className="text-sm text-text-secondary">
            {[user?.title, user?.company].filter(Boolean).join(' at ')}
          </p>
        )}
        {user?.industry && (
          <p className="mt-1 text-xs text-text-tertiary">{user.industry}</p>
        )}

        <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
          {user?.skills && user.skills.length > 0 && (
            <div className="w-full">
              <p className="mb-1 text-xs text-text-secondary">Skills</p>
              <div className="flex flex-wrap justify-center gap-1">
                {user.skills.slice(0, 4).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-neon-cyan/10 px-2.5 py-0.5 text-xs text-neon-cyan"
                  >
                    {s}
                  </span>
                ))}
                {user.skills.length > 4 && (
                  <span className="text-xs text-text-tertiary">
                    +{user.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
          {user?.interests && user.interests.length > 0 && (
            <div className="w-full">
              <p className="mb-1 text-xs text-text-secondary">Interests</p>
              <div className="flex flex-wrap justify-center gap-1">
                {user.interests.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-neon-pink/10 px-2.5 py-0.5 text-xs text-neon-pink"
                  >
                    {s}
                  </span>
                ))}
                {user.interests.length > 3 && (
                  <span className="text-xs text-text-tertiary">
                    +{user.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          {user?.location && (
            <p className="flex items-center gap-1 text-xs text-text-tertiary">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {user.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchDetailPage: React.FC = () => {
  const { eventId, targetUserId } = useParams<{
    eventId: string;
    targetUserId: string;
  }>();
  const navigate = useNavigate();

  const [data, setData] = useState<WhyRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !targetUserId) return;

    const fetchData = async () => {
      try {
        const result = await getWhyRecommendation(eventId, targetUserId);
        setData(result);
      } catch (err: any) {
        showApiError(err, 'Failed to load recommendation details.');
        navigate(`/events/${eventId}/recommendations`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, targetUserId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-secondary">Recommendation not found.</p>
      </div>
    );
  }

  const scorePercent = Math.round(data.matchScore * 100);
  const scoreColor =
    scorePercent >= 80
      ? 'text-success'
      : scorePercent >= 60
        ? 'text-gold'
        : 'text-neon-cyan';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/events/${eventId}/recommendations`}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Recommendations
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
          Match Detail
        </h1>
      </div>

      {/* Users side by side */}
      <div className="flex flex-col gap-5 sm:flex-row">
        <UserProfileCard user={data.currentUser} label="You" />
        <div className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-neon text-white shadow-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <UserProfileCard user={data.targetUser} label="Matched With" />
      </div>

      {/* Match Score Section */}
      <div className="card-magical rounded-2xl p-6 shimmer-magical">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-gradient-magical">
              Overall Match
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              AI-powered compatibility score based on multiple factors
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className={cn('text-5xl font-extrabold', scoreColor)}>
                {scorePercent}%
              </span>
              <p className="mt-1 text-xs text-text-secondary">Match Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      {data.factors && data.factors.length > 0 && (
        <div className="card-magical rounded-2xl p-6 shimmer-magical">
          <h2 className="mb-5 font-display text-lg font-bold text-gradient-magical">
            Factor Breakdown
          </h2>
          <div className="space-y-4">
            {data.factors.map((factor) => {
              const key = factor.name.toLowerCase().replace(/\s+/g, '');
              const colorClass = FACTOR_COLORS[key] || 'bg-neon-cyan';
              const bgClass = FACTOR_BG_COLORS[key] || 'bg-surface-3';
              const label = factorLabels[key] || factor.name;
              const factorPercent = Math.round((factor.score || 0) * 100);

              return (
                <div key={factor.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {factorPercent}%
                    </span>
                  </div>
                  <div className={cn('h-3 w-full rounded-full', bgClass)}>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        colorClass,
                      )}
                      style={{
                        width: `${factorPercent}%`,
                        boxShadow: `0 0 8px ${colorClass.includes('gold') ? 'rgba(212,168,83,0.4)' : colorClass.includes('cyan') ? 'rgba(0,245,255,0.4)' : colorClass.includes('pink') ? 'rgba(255,110,199,0.4)' : colorClass.includes('purple') ? 'rgba(191,95,255,0.4)' : colorClass.includes('blue') ? 'rgba(59,130,246,0.4)' : 'rgba(52,211,153,0.4)'}`,
                      }}
                    />
                  </div>
                  {factor.explanation && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      {factor.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Explanations */}
      {data.explanations && data.explanations.length > 0 && (
        <div className="card-magical rounded-2xl p-6 shimmer-magical">
          <MatchExplanation
            explanation={data.explanations}
            factors={data.factors || []}
          />
        </div>
      )}

      {/* Conversation Starters */}
      {data.conversationStarters && data.conversationStarters.length > 0 && (
        <div className="card-magical rounded-2xl p-6 shimmer-magical">
          <ConversationStarters starters={data.conversationStarters} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            toast.success('Connection request sent!');
          }}
        >
          Connect
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate(`/events/${eventId}/recommendations`)}
        >
          Back to Recommendations
        </Button>
      </div>
    </div>
  );
};

export default MatchDetailPage;
