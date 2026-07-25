import React, { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import Button from './Button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-5 rounded-2xl gradient-magical p-4 text-white animate-glow-pulse">{icon}</div>
      )}
      <h3 className="font-display text-xl font-bold text-gradient-magical">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-base text-text-secondary leading-7">{description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
