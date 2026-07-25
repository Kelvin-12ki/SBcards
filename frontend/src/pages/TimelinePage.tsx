import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity as ActivityIcon, Loader2 } from 'lucide-react';
import { getUserFeed } from '@/api/timeline';
import type { Activity as ActivityType } from '@/types/timeline';
import ActivityCard from '@/components/timeline/ActivityCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

const PAGE_LIMIT = 20;

const TimelinePage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await getUserFeed(1, PAGE_LIMIT);
        if (!cancelled) {
          setActivities(data);
          setHasMore(data.length >= PAGE_LIMIT);
        }
      } catch (err) {
        console.error('Failed to load activity feed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFeed();
    return () => { cancelled = true; };
  }, []);

  // Infinite scroll: IntersectionObserver
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getUserFeed(nextPage, PAGE_LIMIT);
      if (data.length === 0 || data.length < PAGE_LIMIT) {
        setHasMore(false);
      }
      setActivities((prev) => [...prev, ...data]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more activities:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loading, hasMore, loadingMore, loadMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
          Activity Feed
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          See what your network is up to.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="h-10 w-10" />}
          title="No activity yet"
          description="When you connect with people or attend events, your activity will show up here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {loadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
            )}
            {!hasMore && activities.length > 0 && (
              <p className="text-xs text-text-tertiary">You&apos;re all caught up!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
