import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'violet' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

const variants = {
  violet: 'bg-violet-dim text-violet-light border border-violet-600/30',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  neutral: 'bg-surface text-ink-muted border border-border',
  outline: 'bg-transparent text-ink-muted border border-border',
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function Badge({ variant = 'neutral', size = 'md', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
