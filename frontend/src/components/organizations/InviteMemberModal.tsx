import React, { useState, type FormEvent } from 'react';
import type { OrgRole } from '@/types/organization';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { userId: string; role: OrgRole }) => void;
}

const roleOptions: { value: OrgRole; label: string }[] = [
  { value: 'org_admin', label: 'Admin' },
  { value: 'event_organizer', label: 'Event Organizer' },
  { value: 'staff', label: 'Staff' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'exhibitor', label: 'Exhibitor' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'attendee', label: 'Attendee' },
];

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<OrgRole>('attendee');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }
    setError('');
    onSubmit({ userId: userId.trim(), role });
    setUserId('');
    setRole('attendee');
    onClose();
  };

  const handleClose = () => {
    setUserId('');
    setRole('attendee');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="User ID"
          placeholder="Enter user ID to invite"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          error={error}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
