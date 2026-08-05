import React, { useState } from 'react';
import { cn } from '@/utils/helpers';
import type { Connection, LeadQualification } from '@/types/connection';
import { updateLeadQualification } from '@/api/connections';
import toast from 'react-hot-toast';
import { Flame, Cloud, Snowflake, Circle, Loader2 } from 'lucide-react';

interface LeadQualificationPanelProps {
  connection: Connection;
  onUpdate: (qualification: LeadQualification) => void;
  className?: string;
}

const leadScores = [
  { value: 'none', label: 'None', icon: Circle, classes: 'bg-surface-3 text-text-tertiary border-border-subtle' },
  { value: 'hot', label: 'Hot', icon: Flame, classes: 'bg-red-500/15 text-red-400 border-red-500/30', activeClasses: 'bg-red-500/25 text-red-300 border-red-500/50 ring-2 ring-red-500/30' },
  { value: 'warm', label: 'Warm', icon: Cloud, classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', activeClasses: 'bg-yellow-500/25 text-yellow-300 border-yellow-500/50 ring-2 ring-yellow-500/30' },
  { value: 'cold', label: 'Cold', icon: Snowflake, classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', activeClasses: 'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 ring-2 ring-cyan-500/30' },
];

const followUpStatuses = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_follow_up', label: 'No follow-up' },
];

const quickTags = ['Investor', 'Partner', 'Client', 'Speaker', 'Vendor', 'Mentor', 'Talent'];

const LeadQualificationPanel: React.FC<LeadQualificationPanelProps> = ({ connection, onUpdate, className }) => {
  const qual = connection.leadQualification;
  const [leadScore, setLeadScore] = useState<string>(qual?.leadScore || 'none');
  const [followUpStatus, setFollowUpStatus] = useState<string>(qual?.followUpStatus || 'not_started');
  const [tags, setTags] = useState<string[]>(qual?.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (updates: Partial<{ leadScore: string; followUpStatus: string; tags: string[] }>) => {
    setSaving(true);
    try {
      const newScore = updates.leadScore ?? leadScore;
      const newStatus = updates.followUpStatus ?? followUpStatus;
      const newTags = updates.tags ?? tags;

      if (updates.leadScore !== undefined) setLeadScore(updates.leadScore);
      if (updates.followUpStatus !== undefined) setFollowUpStatus(updates.followUpStatus);
      if (updates.tags !== undefined) setTags(updates.tags);

      const updated = await updateLeadQualification(connection.id, {
        leadScore: newScore,
        followUpStatus: newStatus,
        tags: newTags,
      });
      if (updated.leadQualification) {
        onUpdate(updated.leadQualification);
      }
    } catch (err: any) {
      toast.error('Failed to update qualification');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      handleSave({ tags: [...tags, trimmed] });
    }
  };

  const removeTag = (tag: string) => {
    handleSave({ tags: tags.filter((t) => t !== tag) });
  };

  const handleCustomTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTag.trim()) {
      addTag(customTag);
      setCustomTag('');
    }
  };

  return (
    <div className={cn('card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary">Lead Qualification</h3>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />}
      </div>

      {/* Lead Score */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">Lead Score</label>
        <div className="grid grid-cols-4 gap-2">
          {leadScores.map((score) => {
            const Icon = score.icon;
            const isActive = leadScore === score.value;
            return (
              <button
                key={score.value}
                type="button"
                onClick={() => handleSave({ leadScore: score.value })}
                disabled={saving}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-all',
                  isActive ? (score as any).activeClasses : score.classes,
                  !isActive && 'hover:border-gold/30',
                  'disabled:opacity-50',
                )}
              >
                <Icon className="h-4 w-4" />
                {score.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Follow-up Status */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">Follow-up Status</label>
        <div className="grid grid-cols-2 gap-2">
          {followUpStatuses.map((status) => {
            const isActive = followUpStatus === status.value;
            return (
              <button
                key={status.value}
                type="button"
                onClick={() => handleSave({ followUpStatus: status.value })}
                disabled={saving}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-gold/15 text-gold border-gold/30 ring-1 ring-gold/20'
                    : 'bg-surface-2 text-text-secondary border-border-subtle hover:border-gold/20',
                  'disabled:opacity-50',
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {quickTags.map((tag) => {
            const isActive = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => isActive ? removeTag(tag) : addTag(tag)}
                disabled={saving}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                  isActive
                    ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/30'
                    : 'bg-surface-2 text-text-tertiary border-border-subtle hover:border-neon-purple/20 hover:text-text-secondary',
                  'disabled:opacity-50',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {/* Custom tag input */}
        <form onSubmit={handleCustomTagSubmit} className="mt-2 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Custom tag..."
            className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          <button
            type="submit"
            disabled={!customTag.trim() || saving}
            className="rounded-lg bg-neon-purple/10 px-3 py-1.5 text-xs font-medium text-neon-purple hover:bg-neon-purple/20 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {/* Display custom tags with remove */}
        {tags.filter((t) => !quickTags.includes(t)).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.filter((t) => !quickTags.includes(t)).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-neon-purple/10 px-2 py-0.5 text-[10px] font-medium text-neon-purple"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadQualificationPanel;
