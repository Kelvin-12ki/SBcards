import React, { useState } from 'react';
import type { Session } from '@/types/session';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface SessionFormProps {
  onSubmit: (data: Partial<Session>) => void;
  initialData?: Partial<Session>;
  loading?: boolean;
}

const sessionTypes: { value: Session['type']; label: string }[] = [
  { value: 'talk', label: 'Talk' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panel', label: 'Panel' },
  { value: 'break', label: 'Break' },
  { value: 'networking', label: 'Networking' },
];

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, initialData, loading = false }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<Session['type']>(initialData?.type || 'talk');
  const [startTime, setStartTime] = useState(toDatetimeLocal(initialData?.startTime));
  const [endTime, setEndTime] = useState(toDatetimeLocal(initialData?.endTime));
  const [description, setDescription] = useState(initialData?.description || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [room, setRoom] = useState(initialData?.room || '');
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data: Partial<Session> = {
      title: title.trim(),
      type,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      room: room.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      tags,
    };

    onSubmit(data);
  };

  const isValid = title.trim() && startTime && endTime;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Session title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Session['type'])}
          className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
          required
        >
          {sessionTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Time *"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <Input
          label="End Time *"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Session description"
          rows={3}
          className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Main Hall"
        />
        <Input
          label="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. Room A"
        />
      </div>

      <Input
        label="Capacity"
        type="number"
        min={0}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="Max attendees"
      />

      <Input
        label="Tags"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="comma, separated, tags"
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" loading={loading} disabled={!isValid}>
          {initialData ? 'Update Session' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;
