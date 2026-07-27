import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search people, events, companies...',
  loading = false,
  className,
}) => {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 2) {
          onSearch(value.trim());
        }
      }, 300);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && query.trim().length >= 2) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        onSearch(query.trim());
      }
    },
    [onSearch, query],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative flex items-center rounded-2xl border border-border-subtle bg-surface-1 transition-all duration-300',
        'focus-within:border-gold/50 focus-within:shadow-lg focus-within:shadow-gold/10',
        'card-magical',
        className,
      )}
    >
      <div className="flex items-center justify-center pl-4 pr-2 text-text-tertiary">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-3.5 pr-2 text-sm text-text-primary placeholder-text-tertiary outline-none"
        aria-label="Search"
      />
      {query && (
        <button
          onClick={handleClear}
          className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
