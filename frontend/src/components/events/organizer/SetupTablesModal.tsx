import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { SetupTablesPayload } from '@/types/table';

export interface SetupTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SetupTablesPayload) => Promise<void>;
  /** Current values, so reopening the form shows what is configured. */
  initial?: Partial<SetupTablesPayload>;
  attendeeCount?: number;
}

const SetupTablesModal: React.FC<SetupTablesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initial,
  attendeeCount,
}) => {
  const [tableCount, setTableCount] = useState(String(initial?.tableCount ?? 6));
  const [seatsPerTable, setSeatsPerTable] = useState(
    String(initial?.seatsPerTable ?? 6),
  );
  const [rotationInterval, setRotationInterval] = useState(
    String(initial?.rotationIntervalMinutes ?? 20),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tables = Number(tableCount);
  const seats = Number(seatsPerTable);
  const rotation = Number(rotationInterval);
  const totalSeats = tables > 0 && seats > 0 ? tables * seats : 0;

  const valid =
    Number.isInteger(tables) &&
    tables >= 1 &&
    Number.isInteger(seats) &&
    seats >= 2 &&
    Number.isInteger(rotation) &&
    // Backend DTO is @Min(1); allowing 0 here produced a client-side-valid
    // form that the API rejected with a 400.
    rotation >= 1;

  const handleSubmit = async () => {
    if (!valid) {
      setError('Enter at least 1 table and 2 seats per table.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        tableCount: tables,
        seatsPerTable: seats,
        rotationIntervalMinutes: rotation,
      });
      onClose();
    } catch (err) {
      setError(
        (err as { friendlyMessage?: string })?.friendlyMessage ??
          'Could not save the table layout.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setup Tables">
      <div className="space-y-4">
        <Input
          label="Number of tables"
          type="number"
          min={1}
          value={tableCount}
          onChange={(e) => setTableCount(e.target.value)}
        />
        <Input
          label="Seats per table"
          type="number"
          min={2}
          value={seatsPerTable}
          onChange={(e) => setSeatsPerTable(e.target.value)}
        />
        <Input
          label="Rotation interval (minutes)"
          type="number"
          min={0}
          value={rotationInterval}
          onChange={(e) => setRotationInterval(e.target.value)}
        />

        {totalSeats > 0 && (
          <p className="text-sm text-text-secondary">
            {tables} tables x {seats} seats ={' '}
            <span className="font-semibold text-text-primary">
              {totalSeats} seats
            </span>
            {typeof attendeeCount === 'number' && (
              <>
                {' '}for {attendeeCount} checked-in{' '}
                {attendeeCount === 1 ? 'attendee' : 'attendees'}
                {attendeeCount > totalSeats && (
                  <span className="mt-1 block text-warning">
                    Not enough seats — extra tables will be created
                    automatically when you assign.
                  </span>
                )}
              </>
            )}
          </p>
        )}

        <p className="text-xs text-text-secondary">
          Saving replaces the existing layout and clears any current seating.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!valid}>
            Save layout
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SetupTablesModal;
