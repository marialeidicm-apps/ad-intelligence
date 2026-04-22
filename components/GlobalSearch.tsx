'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Store, Sparkles, FileText, BarChart2, ShoppingBag, TrendingUp, Package, FileBarChart, Star } from 'lucide-react';
import {
  getBrands, getContent, getStoreAnalyses,
  getProductCopys, getProposals, getReviewAnalyses,
} from '@/lib/storage';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  category: string;
}

function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    getBrands().forEach(b => {
      if (b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q)) {
        found.push({
          id: `brand-${b.id}`,
          title: b.name,
          subtitle: `Marca · ${b.industry}`,
          href: `/marcas`,
          icon: <Store size={14} className="text-violet-400" />,
          category: 'Marcas',
        });
      }
    });

    getContent().slice(0, 200).forEach(c => {
      if (c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q) || c.brandName.toLowerCase().includes(q)) {
        found.push({
          id: `content-${c.id}`,
          title: c.title,
          subtitle: `Contenido · ${c.brandName}`,
          href: `/generator`,
          icon: <Sparkles size={14} className="text-violet-400" />,
          category: 'Contenido',
        });
      }
    });

    getStoreAnalyses().forEach(a => {
      if (a.url.toLowerCase().includes(q) || (a.brandId && a.brandId.toLowerCase().includes(q))) {
        found.push({
          id: `store-${a.id}`,
          title: a.url,
          subtitle: `Auditoría de Tienda · Score ${a.overallScore}`,
          href: `/tienda`,
          icon: <ShoppingBag size={14} className="text-warning" />,
          category: 'Análisis',
        });
      }
    });

    getProductCopys().forEach(p => {
      if (p.productDescription.toLowerCase().includes(q) || p.names.some(n => n.toLowerCase().includes(q))) {
        found.push({
          id: `copy-${p.id}`,
          title: p.names[0] || p.productDescription.slice(0, 40),
          subtitle: `Nombres y Copys · ${p.brandName || 'Sin marca'}`,
          href: `/nombres`,
          icon: <Package size={14} className="text-success" />,
          category: 'Generador',
        });
      }
    });

    getProposals().forEach(p => {
      if (p.brandName.toLowerCase().includes(q) || p.proposalText.toLowerCase().includes(q)) {
        found.push({
          id: `prop-${p.id}`,
          title: `Propuesta para ${p.brandName}`,
          subtitle: `Propuesta Comercial · $${p.totalPrice.toLocaleString()}`,
          href: `/propuestas`,
          icon: <FileBarChart size={14} className="text-blue-400" />,
          category: 'Propuestas',
        });
      }
    });

    getReviewAnalyses().forEach(r => {
      if (r.sourceUrl.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)) {
        found.push({
          id: `review-${r.id}`,
          title: r.sourceUrl,
          subtitle: `Análisis de Reseñas · ${r.platform}`,
          href: `/resenas`,
          icon: <Star size={14} className="text-warning" />,
          category: 'Análisis',
        });
      }
    });

    setResults(found.slice(0, 12));
  }, [query]);

  return { query, setQuery, results };
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results } = useGlobalSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const go = (href: string) => {
    router.push(href);
    close();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-ink-dim hover:text-ink hover:border-violet-600/40 transition-all"
        title="Buscar (Ctrl+K)"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline text-[10px] bg-surface px-1 rounded">Ctrl K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={close}>
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-ink-dim flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar marcas, contenido, análisis..."
            className="flex-1 bg-transparent text-ink placeholder-ink-dim text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-dim hover:text-ink">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] text-ink-dim bg-card px-1.5 py-0.5 rounded border border-border">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="py-2 max-h-80 overflow-y-auto">
            {Object.entries(
              results.reduce((acc, r) => {
                if (!acc[r.category]) acc[r.category] = [];
                acc[r.category].push(r);
                return acc;
              }, {} as Record<string, SearchResult[]>)
            ).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wider px-4 py-1.5">{cat}</p>
                {items.map(r => (
                  <button
                    key={r.id}
                    onClick={() => go(r.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-card text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-violet-dim flex items-center justify-center flex-shrink-0">
                      {r.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{r.title}</p>
                      <p className="text-xs text-ink-dim truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="py-8 text-center">
            <Search size={24} className="text-ink-dim mx-auto mb-2" />
            <p className="text-sm text-ink-dim">Sin resultados para &quot;{query}&quot;</p>
          </div>
        ) : (
          <div className="py-6 px-4">
            <p className="text-xs text-ink-dim mb-3">Accesos rápidos</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Mis Marcas', href: '/marcas', icon: <Store size={13} /> },
                { label: 'Generador', href: '/generator', icon: <Sparkles size={13} /> },
                { label: 'Instagram', href: '/instagram', icon: <BarChart2 size={13} /> },
                { label: 'Nombres y Copys', href: '/nombres', icon: <Package size={13} /> },
                { label: 'Propuestas', href: '/propuestas', icon: <FileText size={13} /> },
                { label: 'Reseñas', href: '/resenas', icon: <Star size={13} /> },
              ].map(q => (
                <button
                  key={q.href}
                  onClick={() => go(q.href)}
                  className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-card-hover border border-border rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <span className="text-violet-400">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
