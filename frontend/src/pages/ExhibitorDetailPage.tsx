import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExhibitor, recordVisit, recordLead } from '@/api/exhibitors';
import type { Exhibitor } from '@/types/exhibitor';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

const ExhibitorDetailPage: React.FC = () => {
  const { eventId, id } = useParams<{ eventId: string; id: string }>();
  const navigate = useNavigate();

  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitLoading, setVisitLoading] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await getExhibitor(id);
        setExhibitor(data);
      } catch {
        toast.error('Failed to load exhibitor details.');
        navigate(`/events/${eventId}/exhibitors`);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, eventId, navigate]);

  const handleVisit = async () => {
    if (!id) return;
    setVisitLoading(true);
    try {
      await recordVisit(id);
      setExhibitor((prev) =>
        prev ? { ...prev, visitorCount: prev.visitorCount + 1 } : prev,
      );
      toast.success('Visit recorded!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record visit.');
    } finally {
      setVisitLoading(false);
    }
  };

  const handleLead = async () => {
    if (!id) return;
    setLeadLoading(true);
    try {
      await recordLead(id);
      setExhibitor((prev) =>
        prev ? { ...prev, leadCount: prev.leadCount + 1 } : prev,
      );
      toast.success('Lead recorded!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record lead.');
    } finally {
      setLeadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!exhibitor) {
    return <div className="text-center py-20 text-text-secondary">Exhibitor not found.</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/events/${eventId}/exhibitors`)}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Exhibitors
      </button>

      {/* Main Card */}
      <div className="card-magical rounded-2xl p-6 shimmer-magical">
        <div className="flex items-start gap-5">
          {/* Logo */}
          {exhibitor.logoUrl ? (
            <img
              src={exhibitor.logoUrl}
              alt={`${exhibitor.companyName} logo`}
              className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30">
              <span className="text-2xl font-bold text-white">
                {exhibitor.companyName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
              {exhibitor.companyName}
            </h1>
            {exhibitor.description && (
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {exhibitor.description}
              </p>
            )}
            {exhibitor.website && (
              <a
                href={exhibitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-neon-cyan hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.27a4.5 4.5 0 00-4.555-4.555m3.313 13.313l-1.757 1.757a4.5 4.5 0 01-6.364-6.364l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                </svg>
                {exhibitor.website}
              </a>
            )}
          </div>
        </div>

        {/* Booth Info */}
        {(exhibitor.boothNumber || exhibitor.boothLocation) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-text-tertiary border-t border-border-subtle pt-4">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>
              {exhibitor.boothNumber && `Booth ${exhibitor.boothNumber}`}
              {exhibitor.boothNumber && exhibitor.boothLocation && ' · '}
              {exhibitor.boothLocation}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border-subtle pt-4">
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-neon-cyan">{exhibitor.visitorCount}</p>
            <p className="text-xs text-text-secondary">Visitors</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-gold">{exhibitor.leadCount}</p>
            <p className="text-xs text-text-secondary">Leads</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-extrabold text-neon-pink">
              {exhibitor.visitorCount > 0
                ? `${((exhibitor.leadCount / exhibitor.visitorCount) * 100).toFixed(0)}%`
                : '0%'}
            </p>
            <p className="text-xs text-text-secondary">Conversion</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" loading={visitLoading} onClick={handleVisit}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Visit
          </Button>
          <Button variant="secondary" size="sm" loading={leadLoading} onClick={handleLead}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Contact
          </Button>
        </div>
      </div>

      {/* Products */}
      {exhibitor.products.length > 0 && (
        <div className="card-magical rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-gradient-magical mb-3">Products</h2>
          <div className="flex flex-wrap gap-2">
            {exhibitor.products.map((p) => (
              <Badge key={p} variant="primary">{p}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {exhibitor.services.length > 0 && (
        <div className="card-magical rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-gradient-magical mb-3">Services</h2>
          <div className="flex flex-wrap gap-2">
            {exhibitor.services.map((s) => (
              <Badge key={s} variant="primary">{s}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhibitorDetailPage;
