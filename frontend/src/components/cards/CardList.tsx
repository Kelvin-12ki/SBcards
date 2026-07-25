import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card } from '@/types/card';
import CardBadge from './CardBadge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

export interface CardListProps {
  cards: Card[];
  onEdit?: (card: Card) => void;
  onDelete?: (card: Card) => void;
  onSetDefault?: (card: Card) => void;
}

const CardList: React.FC<CardListProps> = ({
  cards,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const navigate = useNavigate();

  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        }
        title="No cards yet"
        description="Create your first digital business card to get started."
        action={{
          label: 'Create Card',
          onClick: () => navigate('/cards/new'),
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div key={card.id} className="group relative">
          <CardBadge
            card={card}
            isDefault={card.isDefault}
            onClick={() => onEdit?.(card)}
          />
          {/* Action buttons */}
          <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
            {!card.isDefault && onSetDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="!p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(card);
                }}
                title="Set as default"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="!p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                title="Edit card"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="!p-1 text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card);
                }}
                title="Delete card"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardList;
