import React, { useState } from 'react';
import type { Card } from '@/types/card';
import Button from '@/components/ui/Button';
import { cn } from '@/utils/helpers';

export interface EventJoinProps {
  eventId: string;
  userCards: Card[];
  onJoined: (eventId: string, cardId: string) => void;
  loading?: boolean;
  className?: string;
}

const EventJoin: React.FC<EventJoinProps> = ({
  eventId,
  userCards,
  onJoined,
  loading = false,
  className,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(
    userCards.find((c) => c.isDefault)?.id || userCards[0]?.id || '',
  );

  const handleJoin = () => {
    if (!selectedCardId) return;
    onJoined(eventId, selectedCardId);
  };

  if (userCards.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center',
          className,
        )}
      >
        <p className="text-text-secondary text-sm">
          You need to create a card before joining an event.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border-subtle bg-surface-1 p-6',
        className,
      )}
    >
      <h3 className="font-display text-lg font-bold text-gradient-gold mb-4">Join Event</h3>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-text-secondary">
          Select a card to use
        </label>
        <div className="space-y-2">
          {userCards.map((card) => (
            <label
              key={card.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-300',
                selectedCardId === card.id
                  ? 'border-neon-cyan bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 shadow-lg shadow-neon-cyan/10'
                  : 'border-border-subtle hover:border-text-tertiary',
              )}
            >
              <input
                type="radio"
                name="card-select"
                value={card.id}
                checked={selectedCardId === card.id}
                onChange={() => setSelectedCardId(card.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border-2',
                  selectedCardId === card.id
                    ? 'border-neon-cyan'
                    : 'border-border-subtle',
                )}
              >
                {selectedCardId === card.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-neon-cyan animate-glow-pulse" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{card.fullName}</p>
                {card.headline && (
                  <p className="text-xs text-text-secondary">{card.headline}</p>
                )}
              </div>
              {card.isDefault && (
                <span className="ml-auto text-xs text-neon-cyan font-semibold">Default</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        className="mt-4 w-full"
        onClick={handleJoin}
        loading={loading}
        disabled={!selectedCardId}
      >
        Join Event
      </Button>
    </div>
  );
};

export default EventJoin;
