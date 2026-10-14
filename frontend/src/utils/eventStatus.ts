import type { Event, EventStatus } from '@/types/event';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface EventStatusMeta {
  key: EventStatus;
  label: string;
  /** Variant for the app's shared <Badge> component. */
  variant: BadgeVariant;
  /** Raw tailwind classes, for places that style their own chip. */
  classes: string;
}

/**
 * Single source of truth for event status presentation. Previously each of
 * EventCard, EventDashboard, EventDetailPage and AdminEventsPage carried its
 * own map, and none of them included 'upcoming' — the status every event
 * actually starts with — so the badge rendered blank.
 */
export const EVENT_STATUS_META: Record<EventStatus, EventStatusMeta> = {
  upcoming: {
    key: 'upcoming',
    label: 'Upcoming',
    variant: 'primary',
    classes: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
  },
  draft: {
    key: 'draft',
    label: 'Draft',
    variant: 'warning',
    classes: 'bg-warning/20 text-warning border-warning/30',
  },
  active: {
    key: 'active',
    label: 'Active',
    variant: 'success',
    classes: 'bg-success/20 text-success border-success/30',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    variant: 'default',
    classes: 'bg-surface-3 text-text-secondary border-border-subtle',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelled',
    variant: 'danger',
    classes: 'bg-danger/20 text-danger border-danger/30',
  },
};

/** Order used by filter tabs and status pickers. */
export const EVENT_STATUS_ORDER: readonly EventStatus[] = [
  'upcoming',
  'draft',
  'active',
  'completed',
  'cancelled',
];

/** Options for a <select>. */
export const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] =
  EVENT_STATUS_ORDER.map((key) => ({
    value: key,
    label: EVENT_STATUS_META[key].label,
  }));

/**
 * The backend stores `status` as a free string and older rows may hold values
 * the app never writes. Map anything unknown to 'upcoming' so the UI always
 * has a label to render instead of an empty badge.
 */
export const normaliseEventStatus = (raw?: string | null): EventStatus =>
  raw && raw in EVENT_STATUS_META ? (raw as EventStatus) : 'upcoming';

export const eventStatusLabel = (status?: string | null): string =>
  EVENT_STATUS_META[normaliseEventStatus(status)].label;

export const eventStatusVariant = (status?: string | null): BadgeVariant =>
  EVENT_STATUS_META[normaliseEventStatus(status)].variant;

export const eventStatusClasses = (status?: string | null): string =>
  EVENT_STATUS_META[normaliseEventStatus(status)].classes;

/**
 * Is the event in its live window? Prefer this over comparing
 * `event.isActive === true` or `event.status === 'active'` directly —
 * the two used to disagree because only `activate` ever cleared `isActive`.
 */
export const isEventLive = (event?: Pick<Event, 'status' | 'isActive'> | null): boolean =>
  !!event && (event.status === 'active' || event.isActive === true);

/** May an attendee still join? */
export const canJoinEvent = (event?: Pick<Event, 'status'> | null): boolean => {
  const status = normaliseEventStatus(event?.status);
  return status === 'upcoming' || status === 'draft' || status === 'active';
};

/** Lifecycle transitions the current status permits, for the creator UI. */
export interface EventLifecycleActions {
  canActivate: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

export const eventLifecycle = (
  event?: Pick<Event, 'status'> | null,
): EventLifecycleActions => {
  const status = normaliseEventStatus(event?.status);
  return {
    canActivate: status === 'upcoming' || status === 'draft',
    canComplete: status === 'active',
    canCancel: status === 'upcoming' || status === 'draft' || status === 'active',
  };
};
