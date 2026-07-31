import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, Trash2 } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import { globalSearch } from '@/api/search';
import type { SearchResponse, SearchResult } from '@/types/search';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { showApiError } from '@/utils/errorHandler';

const RECENT_SEARCHES_KEY = 'sbcards_recent_searches';
const MAX_RECENT = 8;

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [_query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!searchParams.get('q'));
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;

      setQuery(trimmed);
      setSearchParams({ q: trimmed }, { replace: true });
      setLoading(true);
      setSearched(true);

      try {
        const data = await globalSearch(trimmed);
        setResults(data);
        saveRecentSearch(trimmed);
      } catch (err: any) {
        showApiError(err, 'Search failed. Please try again.');
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [setSearchParams, saveRecentSearch],
  );

  // Search on mount if query param exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback((_result: SearchResult) => {
    // Navigation is handled inside SearchResults
  }, []);

  const handleRemoveRecent = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== item);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-gold">Search</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Find people, events, organizations, and more.
        </p>
      </div>

      {/* Search bar */}
      <SearchBar
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <SearchResults results={results} onSelect={handleSelect} />
      )}

      {/* Empty state - searched but no results */}
      {!loading && searched && !results && (
        <EmptyState
          icon={
            <Search className="h-8 w-8" />
          }
          title="No results found"
          description="We couldn't find anything matching your search. Try different keywords."
        />
      )}

      {/* Recent searches (only shown before search) */}
      {!searched && !loading && (
        <div>
          {recentSearches.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  Recent Searches
                </h2>
                <button
                  onClick={clearRecentSearches}
                  className="flex items-center gap-1 text-xs text-text-tertiary hover:text-danger transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="group inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-gold/30 hover:text-text-primary card-magical"
                  >
                    <Clock className="h-3 w-3 text-text-tertiary group-hover:text-gold transition-colors" />
                    {item}
                    <span
                      onClick={(e) => handleRemoveRecent(e, item)}
                      className="ml-0.5 rounded-full p-0.5 text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-text-tertiary mb-4" />
              <h3 className="font-display text-lg font-bold text-text-primary">Search across SBCards</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-md">
                Find people, events, organizations, exhibitors, and more. Start typing above to search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
