import React from 'react';
import { cn } from '@/utils/helpers';

export interface ConnectionFiltersState {
  tag?: string;
  status?: string;
  search?: string;
  leadScore?: string;
}

export interface ConnectionFiltersProps {
  filters: ConnectionFiltersState;
  onChange: (filters: ConnectionFiltersState) => void;
  className?: string;
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
];

const ConnectionFilters: React.FC<ConnectionFiltersProps> = ({ filters, onChange, className }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value || undefined });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, tag: e.target.value || undefined });
  };

  const handleLeadScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, leadScore: e.target.value || undefined });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.search || filters.status || filters.tag || filters.leadScore;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search connections..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="w-full rounded-xl border border-border-subtle bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary whitespace-nowrap">
            Status:
          </label>
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tag filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary whitespace-nowrap">
            Tag:
          </label>
          <input
            type="text"
            placeholder="Filter by tag..."
            value={filters.tag || ''}
            onChange={handleTagChange}
            className="w-32 rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        {/* Lead Score filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary whitespace-nowrap">
            Lead Score:
          </label>
          <select
            value={filters.leadScore || ''}
            onChange={handleLeadScoreChange}
            className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="">All</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🌤️ Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionFilters;
