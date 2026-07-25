import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent } from '@/api/events';
import type { Event } from '@/types/event';
import EventList from '@/components/events/EventList';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTableCount, setNewTableCount] = useState('4');
  const [newTableCapacity, setNewTableCapacity] = useState('6');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!newName.trim() || !newStartDate || !newEndDate) {
      toast.error('Name, start date, and end date are required.');
      return;
    }

    setCreateLoading(true);
    try {
      await createEvent({
        name: newName.trim(),
        description: newDescription.trim(),
        location: newLocation.trim(),
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
        tableCount: parseInt(newTableCount, 10) || 4,
        tableCapacity: parseInt(newTableCapacity, 10) || 6,
      });
      toast.success('Event created!');
      setCreateModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create event.');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewLocation('');
    setNewStartDate('');
    setNewEndDate('');
    setNewTableCount('4');
    setNewTableCapacity('6');
  };

  const handleJoin = async (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleView = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-magical">Events</h1>
        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <EventList events={events} onJoin={handleJoin} onView={handleView} />
      )}

      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); resetForm(); }}
        title="Create Event"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreateModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" loading={createLoading} onClick={handleCreateEvent}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Event Name *"
            placeholder="Networking Mixer"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the event..."
              rows={3}
              style={{ color: '#F5F5F7', WebkitTextFillColor: '#F5F5F7', caretColor: '#F5F5F7' }}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <Input
            label="Location"
            placeholder="123 Main St, City"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="datetime-local"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
            />
            <Input
              label="End Date *"
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of Tables"
              type="number"
              min={1}
              value={newTableCount}
              onChange={(e) => setNewTableCount(e.target.value)}
            />
            <Input
              label="Seats per Table"
              type="number"
              min={1}
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventsPage;
