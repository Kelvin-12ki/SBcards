import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export interface QuickConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedUser: {
    userId?: string;
    displayName?: string;
    company?: string;
    role?: string;
    avatarUrl?: string;
  } | null;
  onConnect: (notes?: string) => void;
}

const QuickConnectModal: React.FC<QuickConnectModalProps> = ({
  isOpen,
  onClose,
  scannedUser,
  onConnect,
}) => {
  const [notes, setNotes] = useState('');

  const handleConnect = () => {
    onConnect(notes.trim() || undefined);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!scannedUser) return null;

  const initials = scannedUser.displayName
    ? scannedUser.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Quick Connect" size="md">
      <div className="space-y-5">
        {/* User info */}
        <div className="flex items-center gap-4 card-magical rounded-xl border border-border-subtle p-4">
          {scannedUser.avatarUrl ? (
            <img
              src={scannedUser.avatarUrl}
              alt={scannedUser.displayName || 'User'}
              className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-3 text-lg font-bold text-text-secondary">
              {initials}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {scannedUser.displayName || 'Unknown User'}
            </h3>
            {(scannedUser.role || scannedUser.company) && (
              <p className="text-sm text-text-secondary">
                {[scannedUser.role, scannedUser.company].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Notes field */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Add a note (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Met at the networking event — interested in collaboration..."
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleConnect}>
            Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickConnectModal;
