import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, Edit3, CreditCard, Trash2 } from 'lucide-react';
import { getCards, setDefaultCard, deleteCard } from '@/api/cards';
import type { Card } from '@/types/card';
import CardPreview from '@/components/cards/CardPreview';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const MyCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
      showApiError(err, 'Failed to load your cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultCard(id);
      toast.success('Default card updated!');
      await fetchCards();
    } catch (err: any) {
      showApiError(err, 'Failed to set default card.');
    }
  };

  const handleDelete = async (id: string, cardName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the card for "${cardName}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteCard(id);
      toast.success('Card deleted successfully.');
      await fetchCards();
    } catch (err: any) {
      showApiError(err, 'Failed to delete card.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
            My Cards
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} total
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/cards/new')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Card
        </Button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-10 w-10" />}
          title="No cards yet"
          description="Create your first digital business card to get started."
          action={{
            label: 'Create New Card',
            onClick: () => navigate('/cards/new'),
          }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative flex flex-col rounded-2xl border border-border-subtle bg-surface-1 overflow-hidden card-magical transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
            >
              {/* Default badge */}
              {card.isDefault && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-gold" />
                  Default
                </div>
              )}

              {/* Card Preview */}
              <div className="p-4 pb-2">
                <CardPreview card={card} className="w-full" />
              </div>

              {/* Card info */}
              <div className="px-4 pb-2">
                <h3 className="font-semibold text-text-primary truncate">
                  {card.fullName}
                </h3>
                {card.headline && (
                  <p className="text-xs text-text-tertiary truncate mt-0.5">
                    {card.headline}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto flex items-center gap-2 border-t border-border-subtle px-4 py-3">
                <button
                  onClick={() => navigate(`/cards/${card.id}/edit`)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(card.id, card.fullName)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/10 transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCardsPage;
