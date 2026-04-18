'use client';
import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-surface rounded-xl border border-border ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all duration-150
            ${active === tab.id
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-ink-muted hover:text-ink hover:bg-card'
            }
          `}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active === tab.id ? 'bg-white/20' : 'bg-border text-ink-dim'}`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
