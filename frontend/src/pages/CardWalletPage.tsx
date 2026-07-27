import React, { useEffect, useState, useMemo } from 'react';
import { Wallet, Search, CreditCard } from 'lucide-react';
import { getWalletCards, type WalletCardEntry } from '@/api/cards';
import CardPreview from '@/components/cards/CardPreview';
import WalletCardModal from '@/components/cards/WalletCardModal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/utils/helpers';

const CardWalletPage: React.FC = () => {
  const [walletCards, setWalletCards] = useState<WalletCardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<WalletCardEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchWalletCards = async () => {
      try {
        const data = await getWalletCards();
        if (!cancelled) setWalletCards(data);
      } catch (err) {
        console.error('Failed to load wallet cards:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWalletCards();
    return () => { cancelled = true; };
  }, []);

  // Filter wallet cards by sender name
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return walletCards;
    const query = searchQuery.toLowerCase();
    return walletCards.filter(
      (entry) =>
        entry.sender.displayName?.toLowerCase().includes(query) ||
        entry.sender.company?.toLowerCase().includes(query) ||
        entry.sender.title?.toLowerCase().includes(query),
    );
  }, [walletCards, searchQuery]);

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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">
          Card Wallet
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Business cards from your connections.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4 card-magical">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{walletCards.length}</p>
              <p className="text-xs text-text-secondary">Total Cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or title..."
            className={cn(
              'w-full rounded-xl border border-border-subtle bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text-primary',
              'placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
              'transition-all duration-200',
            )}
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-10 w-10" />}
          title={walletCards.length === 0 ? 'No cards in your wallet yet' : 'No cards match your search'}
          description={
            walletCards.length === 0
              ? 'Connect with other users to collect their business cards.'
              : 'Try a different search term.'
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((entry) => (
            <div
              key={entry.card.id}
              onClick={() => setSelectedCard(entry)}
              className="cursor-pointer group flex flex-col rounded-2xl border border-border-subtle bg-surface-1 overflow-hidden card-magical transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="p-4 pb-2">
                <CardPreview card={entry.card} className="w-full" />
              </div>
              <div className="px-4 pb-4">
                <h3 className="font-semibold text-text-primary truncate">
                  {entry.sender.displayName || entry.card.fullName}
                </h3>
                {entry.sender.title && (
                  <p className="text-xs text-text-tertiary truncate mt-0.5">
                    {entry.sender.title}
                    {entry.sender.company ? ` at ${entry.sender.company}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet Card Modal */}
      <WalletCardModal
        walletCard={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};

export default CardWalletPage;
