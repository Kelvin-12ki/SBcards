import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, User, Mail, Phone, Globe } from 'lucide-react';
import { getPublicCard, type PublicCardEntry } from '@/api/cards';
import { getFriendlyErrorMessage } from '@/utils/errorHandler';
import CardPreview from '@/components/cards/CardPreview';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import SaveContactButton from '@/components/ui/SaveContactButton';

const PublicCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicCardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No card ID provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchCard = async () => {
      try {
        const result = await getPublicCard(id);
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(err, 'Failed to load card.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCard();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-8 max-w-md w-full text-center">
          <p className="text-text-secondary mb-4">{error || 'Card not found.'}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { card, owner } = data;

  const initials = owner.displayName
    ? owner.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-1/95 backdrop-blur-xl">
        <div className="max-w-lg mx-auto flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Card Preview */}
        <div className="mb-8">
          <CardPreview card={card} className="w-full" />
        </div>

        {/* Owner Profile */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar size="lg" src={owner.avatarUrl} fallbackInitials={initials} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-text-primary truncate">
              {owner.displayName || card.fullName}
            </h1>
            {owner.title && (
              <p className="text-sm text-text-secondary truncate">{owner.title}</p>
            )}
            {owner.company && (
              <p className="text-xs text-text-tertiary truncate">{owner.company}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {owner.bio && (
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">{owner.bio}</p>
        )}

        {/* Contact Details from card */}
        <div className="space-y-3 mb-8">
          {card.email && (
            <a
              href={`mailto:${card.email}`}
              className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-text-primary hover:bg-surface-3 transition-colors"
            >
              <Mail className="h-4 w-4 text-text-tertiary flex-shrink-0" />
              <span className="truncate">{card.email}</span>
            </a>
          )}
          {card.phone && (
            <a
              href={`tel:${card.phone}`}
              className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-text-primary hover:bg-surface-3 transition-colors"
            >
              <Phone className="h-4 w-4 text-text-tertiary flex-shrink-0" />
              <span>{card.phone}</span>
            </a>
          )}
          {card.website && (
            <a
              href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-text-primary hover:bg-surface-3 transition-colors"
            >
              <Globe className="h-4 w-4 text-text-tertiary flex-shrink-0" />
              <span className="truncate">{card.website}</span>
            </a>
          )}
        </div>

        {/* Connect button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => navigate(`/profile/${owner.id}`)}
        >
          <UserPlus className="h-5 w-5" />
          Connect with {owner.displayName || card.fullName}
        </Button>

        {/* Save Contact button */}
        <div className="mt-3">
          <SaveContactButton card={card} size="lg" className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default PublicCardPage;
