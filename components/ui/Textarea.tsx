import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  hint,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`
          w-full rounded-lg bg-surface border text-ink text-sm px-3 py-2.5
          placeholder:text-ink-dim resize-none
          focus:outline-none focus:ring-2 focus:ring-violet-600/40 focus:border-violet-600
          transition-all duration-150
          ${error ? 'border-danger/50' : 'border-border hover:border-border'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-dim">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
