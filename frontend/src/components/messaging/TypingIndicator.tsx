import React from 'react';

interface TypingIndicatorProps {
  name?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name }) => {
  return (
    <div className="flex items-start gap-2 px-4 py-1">
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-2.5 border border-border-subtle">
        <div className="flex items-center gap-1">
          <span className="typing-dot" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot" style={{ animationDelay: '150ms' }} />
          <span className="typing-dot" style={{ animationDelay: '300ms' }} />
        </div>
        {name && (
          <span className="text-xs text-text-secondary">{name} is typing...</span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
