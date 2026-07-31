import React, { useEffect, useState, useCallback } from 'react';
import { getAllEvents, createEvent, updateEvent, deleteEvent, type PaginatedEvents } from '@/api/admin';
import { formatDate } from '@/utils/helpers';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

// ─── Status Badge ───────────────────────────────────────────────────────────

const EventStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── Event Modal ────────────────────────────────────────────────────────────

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
  title: string;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, initialData, title }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    maxAttendees: '',
    tableCount: '5',
    tableCapacity: '6',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        location: initialData.location || '',
        startDate: initialData.startDate ? initialData.startDate.slice(0, 16) : '',
        endDate: initialData.endDate ? initialData.endDate.slice(0, 16) : '',
        status: initialData.status || 'upcoming',
        maxAttendees: initialData.maxAttendees?.toString() || '',
        tableCount: initialData.tableCount?.toString() || '5',
        tableCapacity: initialData.tableCapacity?.toString() || '6',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        status: 'upcoming',
        maxAttendees: '',
        tableCount: '5',
        tableCapacity: '6',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Record<string, any> = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : undefined,
        tableCount: parseInt(formData.tableCount, 10),
        tableCapacity: parseInt(formData.tableCapacity, 10),
      };
      // Remove empty strings
      Object.keys(data).forEach((key) => {
        if (data[key] === '') data[key] = undefined;
      });
      await onSave(data);
      onClose();
    } catch (err: any) {
      showApiError(err, 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-1 border border-border-subtle rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-text-primary mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date *</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date *</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              >
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Max Attendees</label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tables</label>
              <input
                type="number"
                value={formData.tableCount}
                onChange={(e) => setFormData({ ...formData, tableCount: e.target.value })}
                className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-neon-cyan/20 text-neon-cyan px-5 py-2.5 text-sm font-medium hover:bg-neon-cyan/30 transition-colors border border-neon-cyan/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Events Page ────────────────────────────────────────────────────────────

const AdminEventsPage: React.FC = () => {
  const [eventsData, setEventsData] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Record<string, any> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllEvents(page, 20);
      setEventsData(data);
    } catch (err: any) {
      showApiError(err, 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (data: Record<string, any>) => {
    await createEvent(data);
    toast.success('Event created');
    fetchEvents();
  };

  const handleUpdate = async (data: Record<string, any>) => {
    if (!editingEvent?.id) return;
    await updateEvent(editingEvent.id, data);
    toast.success('Event updated');
    fetchEvents();
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err: any) {
      showApiError(err, 'Failed to delete event');
    }
  };

  const openEditModal = (event: Record<string, any>) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Events</h1>
          <p className="text-text-tertiary mt-1">Manage all events on the platform.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-neon-cyan/20 text-neon-cyan px-4 py-2.5 text-sm font-medium hover:bg-neon-cyan/30 transition-colors border border-neon-cyan/30 flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Event
        </button>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden lg:table-cell">Participants</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-tertiary">
                  <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : eventsData?.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-tertiary">
                  No events found.
                </td>
              </tr>
            ) : (
              eventsData?.data.map((event: any) => (
                <tr key={event.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{event.name}</p>
                      {event.location && (
                        <p className="text-xs text-text-tertiary mt-0.5">{event.location}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><EventStatusBadge status={event.status} /></td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {event.startDate ? formatDate(event.startDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                    {event.participantCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {eventsData && eventsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">
            Showing {(eventsData.page - 1) * eventsData.limit + 1}-{Math.min(eventsData.page * eventsData.limit, eventsData.total)} of {eventsData.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surface-1 border border-border-subtle text-text-secondary hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(eventsData.totalPages, p + 1))}
              disabled={page >= eventsData.totalPages}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surface-1 border border-border-subtle text-text-secondary hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={editingEvent ? handleUpdate : handleCreate}
        initialData={editingEvent || undefined}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
      />
    </div>
  );
};

export default AdminEventsPage;
