import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-surface-2 px-3.5 py-2.5 text-sm placeholder-text-tertiary',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger focus:ring-danger/50 focus:border-danger'
              : 'border-border-subtle',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...props}
          style={{ color: '#F5F5F7', WebkitTextFillColor: '#F5F5F7', caretColor: '#F5F5F7' }}
        />
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="mt-1.5 text-xs text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
