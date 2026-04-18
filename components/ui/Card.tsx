import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export function Card({ glow, hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-card border border-border rounded-xl
        ${hover ? 'hover:border-violet-600/50 hover:bg-card-hover transition-all duration-150 cursor-pointer' : ''}
        ${glow ? 'shadow-lg shadow-violet-600/10' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-5 py-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
