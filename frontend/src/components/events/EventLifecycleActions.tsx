import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { activateEvent, cancelEvent, completeEvent } from '@/api/events';
import type { Event } from '@/types/event';
import { eventLifecycle } from '@/utils/eventStatus';
import { showApiError } from '@/utils/errorHandler';
import Button from '@/components/ui/Button';

export interface EventLifecycleActionsProps {
  event: Event;
  /** Called with the updated event so the page can refresh in place. */
  onChanged: (event: Event) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Creator-only lifecycle controls: upcoming -> active -> completed, plus
 * cancel. `activateEvent` existed in the API layer but nothing ever called it,
 * so the Active dashboard, "View Matches" and the Active filter tab were all
 * unreachable for events created on the web.
 */
const EventLifecycleActions: React.FC<EventLifecycleActionsProps> = ({
  event,
  onChanged,
  size = 'sm',
  className,
}) => {
  const [busy, setBusy] = useState<'activate' | 'complete' | 'cancel' | null>(
    null,
  );

  const { canActivate, canComplete, canCancel } = eventLifecycle(event);

  const run = async (
    kind: 'activate' | 'complete' | 'cancel',
    action: () => Promise<Event>,
    successMessage: string,
  ) => {
    setBusy(kind);
    try {
      const updated = await action();
      onChanged(updated);
      toast.success(successMessage);
    } catch (err) {
      showApiError(err, 'Could not update the event status.');
    } finally {
      setBusy(null);
    }
  };

  if (!canActivate && !canComplete && !canCancel) return null;

  return (
    <div className={className}>
      {canActivate && (
        <Button
          variant="primary"
          size={size}
          loading={busy === 'activate'}
          onClick={() =>
            run('activate', () => activateEvent(event.id), 'Event is now live')
          }
        >
          Start Event
        </Button>
      )}

      {canComplete && (
        <Button
          variant="secondary"
          size={size}
          loading={busy === 'complete'}
          onClick={() =>
            run(
              'complete',
              () => completeEvent(event.id),
              'Event marked as completed',
            )
          }
        >
          End Event
        </Button>
      )}

      {canCancel && (
        <Button
          variant="ghost"
          size={size}
          loading={busy === 'cancel'}
          onClick={() => {
            if (
              !window.confirm(
                'Cancel this event? Attendees will no longer be able to join.',
              )
            ) {
              return;
            }
            run('cancel', () => cancelEvent(event.id), 'Event cancelled');
          }}
        >
          Cancel Event
        </Button>
      )}
    </div>
  );
};

export default EventLifecycleActions;
