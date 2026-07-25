import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

export interface ConversationStartersProps {
  starters: string[];
  compact?: boolean;
  className?: string;
}

const ConversationStarters: React.FC<ConversationStartersProps> = ({
  starters,
  compact = false,
  className,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = useCallback(
    async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    },
    [],
  );

  const handleCopyAll = useCallback(async () => {
    try {
      const allText = starters.join('\n\n');
      await navigator.clipboard.writeText(allText);
      toast.success('All conversation starters copied!');
    } catch {
      toast.error('Failed to copy all');
    }
  }, [starters]);

  if (!starters || starters.length === 0) return null;

  return (
    <div className={cn(className)}>
      {!compact && (
        <h4 className="mb-3 font-display text-base font-bold text-gradient-gold">
          Conversation Starters
        </h4>
      )}
      {compact && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Conversation Starters
        </p>
      )}
      <div className={cn('space-y-2', compact ? 'max-h-48 overflow-y-auto' : '')}>
        {starters.map((starter, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleCopy(starter, i)}
            className={cn(
              'flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all duration-200',
              'border-border-subtle bg-surface-2/50 hover:bg-surface-2 hover:border-neon-cyan/30',
              'cursor-pointer group',
            )}
          >
            {/* Chat bubble icon */}
            <span className="mt-0.5 flex-shrink-0 text-neon-cyan/60 group-hover:text-neon-cyan transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </span>

            <span className="flex-1 text-sm leading-5 text-text-primary">
              {starter}
            </span>

            {/* Copy indicator */}
            <span
              className={cn(
                'flex-shrink-0 text-xs transition-all duration-200',
                copiedIndex === i
                  ? 'text-success'
                  : 'text-text-tertiary opacity-0 group-hover:opacity-100',
              )}
            >
              {copiedIndex === i ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>

      {starters.length > 1 && (
        <button
          type="button"
          onClick={handleCopyAll}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-2/30 py-2 text-xs font-medium text-text-secondary transition-all duration-200 hover:bg-surface-2 hover:text-neon-cyan hover:border-neon-cyan/30"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.25 9.75H18a2.25 2.25 0 002.25-2.25M5.25 7.5h-.844A2.625 2.625 0 001.781 9.75v9.75c0 .621.504 1.125 1.125 1.125h3a1.125 1.125 0 001.125-1.125v-9.75A2.625 2.625 0 005.25 7.5z" />
          </svg>
          Copy All
        </button>
      )}
    </div>
  );
};

export default ConversationStarters;
