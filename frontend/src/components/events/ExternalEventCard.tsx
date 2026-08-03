import React from 'react';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { ExternalEvent } from '@/api/events';

interface ExternalEventCardProps {
  event: ExternalEvent;
}

function formatEventDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Date TBA') return 'Date TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const ExternalEventCard: React.FC<ExternalEventCardProps> = ({ event }) => {
  return (
    <a
      href={event.eventUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 transition-all duration-300 hover:border-gold/40 hover-glow-gold"
    >
      {/* Image */}
      {event.imageUrl ? (
        <div className="relative h-44 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {/* Source badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-ink">
              <ExternalLink className="h-3 w-3" />
              Nairobi Events Guide
            </span>
          </div>
          {/* Date badge */}
          {event.parsedDate && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
                <Calendar className="h-3 w-3" />
                {formatEventDate(event.parsedDate)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex h-44 items-center justify-center bg-surface-2">
          <Calendar className="h-12 w-12 text-text-tertiary" />
          {event.parsedDate && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-medium text-gold">
                <Calendar className="h-3 w-3" />
                {formatEventDate(event.parsedDate)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-text-primary group-hover:text-gold transition-colors">
          {event.title}
        </h3>

        {event.venue && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}

        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {event.description}
          </p>
        )}

        {/* Date string from site (more detailed) */}
        {!event.parsedDate && event.dateString !== 'Date TBA' && (
          <div className="mt-auto flex items-center gap-1.5 text-xs text-text-tertiary">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{event.dateString}</span>
          </div>
        )}
      </div>
    </a>
  );
};

export default ExternalEventCard;
