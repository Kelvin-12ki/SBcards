import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createEvent } from '@/api/events';
import { showApiError } from '@/utils/errorHandler';
import type { Event } from '@/types/event';
import toast from 'react-hot-toast';

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (event: Event) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 && startDate.length > 0 && endDate.length > 0;

  const handleSubmit = async () => {
    if (!valid) {
      setError('Name, start and end date are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('The end date cannot be before the start date.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const created = await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      });
      toast.success('Event created');
      onCreated(created);
      onClose();
    } catch (err) {
      showApiError(err, 'Could not create the event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Event">
      <div className="space-y-4">
        <Input
          label="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nairobi Founders Mixer"
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="iHub, Senteu Plaza"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Starts"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Ends"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Input
          label="Max attendees (optional)"
          type="number"
          min={1}
          value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
        />
        <div>
          <label
            htmlFor="event-description"
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            Description
          </label>
          <textarea
            id="event-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-gold/50 focus:outline-none"
            placeholder="What is this event about?"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!valid}>
            Create event
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateEventModal;
