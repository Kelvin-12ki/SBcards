import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventExhibitors, createExhibitor } from '@/api/exhibitors';
import { getEvent } from '@/api/events';
import { useAuth } from '@/auth/useAuth';
import type { Event } from '@/types/event';
import type { Exhibitor } from '@/types/exhibitor';
import ExhibitorCard from '@/components/exhibitors/ExhibitorCard';
import ExhibitorForm from '@/components/exhibitors/ExhibitorForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const ExhibitorsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOrganizer = user?.id === event?.creatorId;

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [eventData, exhibitorData] = await Promise.all([
        getEvent(eventId),
        getEventExhibitors(eventId),
      ]);
      setEvent(eventData);
      setExhibitors(exhibitorData);
    } catch (err: any) {
      toast.error('Failed to load exhibitors.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateExhibitor = async (data: Partial<Exhibitor>) => {
    if (!eventId) return;
    setFormLoading(true);
    try {
      const newExhibitor = await createExhibitor(eventId, data);
      setExhibitors((prev) => [...prev, newExhibitor]);
      toast.success('Exhibitor added!');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add exhibitor.');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return exhibitors;
    const q = searchQuery.toLowerCase();
    return exhibitors.filter(
      (e) =>
        e.companyName.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.products?.some((p) => p.toLowerCase().includes(q)) ||
        e.services?.some((s) => s.toLowerCase().includes(q)),
    );
  }, [exhibitors, searchQuery]);

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
            Exhibitors
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{event.name}</p>
        </div>
        {isOrganizer && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Exhibitor
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search exhibitors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Exhibitors Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exhibitor) => (
            <ExhibitorCard
              key={exhibitor.id}
              exhibitor={exhibitor}
              onClick={() => navigate(`/events/${eventId}/exhibitors/${exhibitor.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
          title={searchQuery ? 'No exhibitors match your search' : 'No exhibitors yet'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Exhibitors will appear here once they are added to the event.'
          }
          {...(isOrganizer && !searchQuery
            ? { action: { label: 'Add Exhibitor', onClick: () => setShowForm(true) } }
            : {})}
        />
      )}

      {/* Create Exhibitor Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Exhibitor"
        size="lg"
      >
        <ExhibitorForm
          onSubmit={handleCreateExhibitor}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
};

export default ExhibitorsPage;
