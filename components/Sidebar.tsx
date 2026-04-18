'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store, Sparkles, BarChart2, ClipboardList, LayoutGrid,
  Users, CalendarDays, FileText, ArrowLeftRight, Zap, X, Menu
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/marcas', icon: Store, label: 'Marcas' },
  { href: '/generator', icon: Sparkles, label: 'Generador' },
  { href: '/instagram', icon: BarChart2, label: 'Instagram' },
  { href: '/auditoria', icon: ClipboardList, label: 'Auditoría' },
  { href: '/feed', icon: LayoutGrid, label: 'Armado de Feed' },
  { href: '/competencia', icon: Users, label: 'Competencia' },
  { href: '/calendario', icon: CalendarDays, label: 'Calendario' },
  { href: '/brief', icon: FileText, label: 'Brief' },
  { href: '/comparador', icon: ArrowLeftRight, label: 'Comparador' },
];

function NavItem({ href, icon: Icon, label, active, onClick }: {
  href: string;
  icon: typeof Store;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
        ${active
          ? 'bg-violet-dim text-violet-light border border-violet-600/30'
          : 'text-ink-dim hover:text-ink hover:bg-card'
        }
      `}
    >
      <Icon size={17} className={active ? 'text-violet-400' : 'text-ink-dim group-hover:text-ink-muted'} />
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink leading-none">Ad Intelligence</p>
            <p className="text-[10px] text-ink-dim mt-0.5">by María</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-[10px] text-ink-dim text-center">Ad Intelligence v2.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-border h-screen sticky top-0 flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-card border border-border rounded-lg flex items-center justify-center text-ink-muted hover:text-ink"
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-surface border-r border-border h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 text-ink-dim hover:text-ink"
            >
              <X size={18} />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
