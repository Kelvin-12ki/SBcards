import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMatches, getMyTable } from '@/api/matching';
import { getEvent } from '@/api/events';
import type { Match, TableAssignment } from '@/types/match';
import type { Event } from '@/types/event';
import MatchList from '@/components/matching/MatchList';
import TableAssignmentComponent from '@/components/matching/TableAssignment';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const MatchesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableAssignment, setTableAssignment] = useState<TableAssignment | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [eventData, matchesData] = await Promise.all([
          getEvent(id),
          getMatches(id),
        ]);
        setEvent(eventData);
        setMatches(matchesData);

        try {
          const tableData = await getMyTable(id);
          setTableAssignment(tableData);
        } catch {
          // No table assigned
        }
      } catch (err) {
        toast.error('Failed to load matches.');
        navigate('/events');
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const filteredMatches = useMemo(() => {
    if (!search.trim()) return matches;
    const query = search.toLowerCase();
    return matches.filter((match) => {
      const name = match.matchedUser?.displayName?.toLowerCase() || '';
      const keywords = match.sharedKeywords?.some((kw) => kw.toLowerCase().includes(query));
      return name.includes(query) || keywords;
    });
  }, [matches, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/events/${id}`}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Event
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-magical">
            Matches{event ? ` — ${event.name}` : ''}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/events/${id}/recommendations`)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          AI Recommendations
        </Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by name or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gradient-magical">Your Table</h2>
        <TableAssignmentComponent tableAssignment={tableAssignment} loading={tableLoading} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gradient-magical">All Matches</h2>
        <MatchList matches={filteredMatches} loading={false} />
      </section>
    </div>
  );
};

export default MatchesPage;
