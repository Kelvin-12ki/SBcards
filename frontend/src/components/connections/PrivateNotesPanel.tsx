import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import type { Connection, ConnectionNote } from '@/types/connection';
import { addConnectionNote, updateConnectionNote, deleteConnectionNote } from '@/api/connections';
import { showApiError } from '@/utils/errorHandler';
import { Lock, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PrivateNotesPanelProps {
  connection: Connection;
  onUpdate: (notes: ConnectionNote[]) => void;
  className?: string;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const PrivateNotesPanel: React.FC<PrivateNotesPanelProps> = ({ connection, onUpdate, className }) => {
  const notes = connection.leadQualification?.privateNotes || [];
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const updated = await addConnectionNote(connection.id, newNote.trim());
      if (updated.leadQualification) {
        onUpdate(updated.leadQualification.privateNotes);
      }
      setNewNote('');
      toast.success('Note added!');
    } catch (err: any) {
      showApiError(err, 'Failed to add note.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const updated = await updateConnectionNote(connection.id, noteId, editText.trim());
      if (updated.leadQualification) {
        onUpdate(updated.leadQualification.privateNotes);
      }
      setEditingId(null);
      setEditText('');
      toast.success('Note updated!');
    } catch (err: any) {
      showApiError(err, 'Failed to update note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    setSaving(true);
    try {
      await deleteConnectionNote(connection.id, noteId);
      onUpdate(notes.filter((n) => n.id !== noteId));
      toast.success('Note deleted!');
    } catch (err: any) {
      showApiError(err, 'Failed to delete note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-gold" />
          <h3 className="font-display text-sm font-bold text-text-primary">Private Notes</h3>
        </div>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />}
      </div>

      {/* Add note */}
      <div className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a private note about this connection..."
          rows={3}
          className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary resize-none focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
        />
        <button
          onClick={handleAdd}
          disabled={!newNote.trim() || saving}
          className="flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-xs text-text-tertiary italic py-2">
          No notes yet. Add your first note about this connection.
        </p>
      ) : (
        <div className="space-y-3">
          {[...notes].reverse().map((note) => (
            <div key={note.id} className="rounded-xl bg-surface-2 border border-border-subtle p-3 space-y-2">
              {editingId === note.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gold/30 bg-surface-1 px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      disabled={saving}
                      className="rounded-lg bg-gold/10 px-3 py-1 text-xs font-medium text-gold hover:bg-gold/20"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditText(''); }}
                      className="rounded-lg bg-surface-3 px-3 py-1 text-xs font-medium text-text-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-tertiary">
                      {timeAgo(note.createdAt)}
                      {note.updatedAt !== note.createdAt && ' (edited)'}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                        className="rounded p-1 text-text-tertiary hover:text-gold hover:bg-surface-3 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="rounded p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivateNotesPanel;
