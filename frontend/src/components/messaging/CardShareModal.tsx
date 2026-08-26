import React, { useEffect, useState } from 'react';
import { Contact, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { getCards } from '@/api/cards';
import type { Card } from '@/types/card';
import type { SharedCardData } from '@/types/messaging';

export interface CardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cardData: SharedCardData) => void;
}

/**
 * WEB: pick one of the current user's business cards to share into a chat.
 *
 * The chosen card is flattened into the snapshot the message stores, so the
 * bubble still renders correctly if the card is later edited or deleted.
 */
const CardShareModal: React.FC<CardShareModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCards();
        if (!cancelled) setCards(data);
      } catch {
        if (!cancelled) setError('Could not load your cards. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handlePick = (card: Card) => {
    onSelect({
      cardId: card.id,
      name: card.fullName,
      role: card.role,
      company: card.company,
      template: card.theme,
      avatarUrl: card.avatarUrl,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share a card" size="md">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-400">{error}</p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-4 rounded-2xl gradient-magical p-4 text-white">
            <Contact className="h-7 w-7" />
          </div>
          <p className="text-sm text-text-secondary">
            You don&apos;t have any cards yet. Create one to share it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {cards.map((card) => {
            const subtitle = [card.role, card.company].filter(Boolean).join(' at ');
            return (
              <button
                key={card.id}
                onClick={() => handlePick(card)}
                className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3 text-left transition-all duration-200 hover:bg-surface-3 hover:border-gold/40 active:scale-[0.99]"
              >
                <Avatar
                  src={card.avatarUrl}
                  alt={card.fullName}
                  size="md"
                  className="border border-border-subtle ring-2 ring-gold/20 flex-shrink-0"
                  fallbackInitials={card.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {card.fullName}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-text-tertiary truncate">{subtitle}</p>
                  )}
                </div>
                {card.isDefault && (
                  <span className="flex-shrink-0 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                    Default
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default CardShareModal;
