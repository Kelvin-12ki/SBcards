import React, { useEffect, useState } from 'react';
import { X, Share2, User, MessageCircle, Mail, Phone, Globe } from 'lucide-react';
import type { WalletCardEntry } from '@/api/cards';
import CardPreview from '@/components/cards/CardPreview';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import SaveContactButton from '@/components/ui/SaveContactButton';
import { cn } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

export interface WalletCardModalProps {
  walletCard: WalletCardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const WalletCardModal: React.FC<WalletCardModalProps> = ({ walletCard, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !walletCard) return null;

  const { card, sender } = walletCard;

  const initials = sender.displayName
    ? sender.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/card/${card.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${sender.displayName || card.fullName}'s Business Card`,
          text: `Check out ${sender.displayName || card.fullName}'s business card!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border-subtle bg-surface-1 p-6 shadow-2xl transition-all duration-300',
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Card Preview */}
        <div className="mb-6">
          <CardPreview card={card} className="w-full" />
        </div>

        {/* Sender Profile */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar size="lg" src={sender.avatarUrl} fallbackInitials={initials} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {sender.displayName || card.fullName}
            </h2>
            {sender.title && (
              <p className="text-sm text-text-secondary truncate">{sender.title}</p>
            )}
            {sender.company && (
              <p className="text-xs text-text-tertiary truncate">{sender.company}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {sender.bio && (
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">{sender.bio}</p>
        )}

        {/* Contact Details */}
        <div className="space-y-3 mb-6">
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="md"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share Card
          </Button>
          <SaveContactButton card={card} size="md" className="w-full" />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => {
                navigate(`/profile/${sender.id}`);
                onClose();
              }}
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => {
                navigate(`/messages?userId=${sender.id}`);
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCardModal;
