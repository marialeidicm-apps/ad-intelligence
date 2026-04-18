import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  icon,
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
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-10 rounded-lg bg-surface border text-ink text-sm
            placeholder:text-ink-dim
            focus:outline-none focus:ring-2 focus:ring-violet-600/40 focus:border-violet-600
            transition-all duration-150
            ${icon ? 'pl-9 pr-3' : 'px-3'}
            ${error ? 'border-danger/50 focus:border-danger focus:ring-danger/20' : 'border-border hover:border-border'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-dim">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
