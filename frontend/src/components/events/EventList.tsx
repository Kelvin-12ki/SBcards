import React, { useState, useMemo } from 'react';
import { cn } from '@/utils/helpers';
import type { Event } from '@/types/event';
import EventCard from './EventCard';
import EmptyState from '@/components/ui/EmptyState';

export interface EventListProps {
  events: Event[];
  onJoin?: (eventId: string) => void;
  onView?: (eventId: string) => void;
}

type FilterTab = 'all' | 'upcoming' | 'active' | 'completed';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const EventList: React.FC<EventListProps> = ({ events, onJoin, onView }) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return events;
    return events.filter((event) => event.status === activeTab);
  }, [events, activeTab]);

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          title="No events found"
          description={
            activeTab === 'all'
              ? 'There are no events yet. Create one to get started.'
              : `No ${activeTab} events to show.`
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onJoin={onJoin} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
