import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

export function Spinner({ size = 20, text, fullScreen }: SpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={size} className="animate-spin text-violet-400" />
      {text && <p className="text-sm text-ink-muted">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {icon && <div className="mb-4 text-ink-dim">{icon}</div>}
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      {description && <p className="text-sm text-ink-muted max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
