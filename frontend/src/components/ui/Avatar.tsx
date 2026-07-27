import React, { useState } from 'react';
import { cn } from '@/utils/helpers';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
  onClick?: () => void;
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16 sm:h-20 sm:w-20',
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  className,
  fallbackInitials,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initials = fallbackInitials || '?';

  // If src is provided and hasn't errored, render the image
  if (src && !imgError) {
    return (
      <div className={cn('relative flex-shrink-0', className)} onClick={onClick}>
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className={cn(sizeClass, 'rounded-full object-cover')}
        />
      </div>
    );
  }

  // If src errored, render a human silhouette SVG with bg-surface-3
  if (src && imgError) {
    return (
      <div
        className={cn(
          sizeClass,
          'relative flex-shrink-0 rounded-full bg-surface-3 text-text-tertiary flex items-center justify-center overflow-hidden',
          className,
        )}
        onClick={onClick}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-2/3 w-2/3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </div>
    );
  }

  // No src — render initials in a gradient circle
  return (
    <div
      className={cn(
        sizeClass,
        'relative flex-shrink-0 rounded-full gradient-magical flex items-center justify-center text-sm font-bold text-white',
        className,
      )}
      onClick={onClick}
    >
      {initials}
    </div>
  );
};

export default Avatar;
