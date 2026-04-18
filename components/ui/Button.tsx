'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 disabled:opacity-50',
  secondary: 'bg-surface hover:bg-card-hover text-ink border border-border hover:border-violet-600 disabled:opacity-50',
  ghost: 'hover:bg-card text-ink-muted hover:text-ink disabled:opacity-50',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 disabled:opacity-50',
  outline: 'border border-violet-600 text-violet-light hover:bg-violet-dim disabled:opacity-50',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
