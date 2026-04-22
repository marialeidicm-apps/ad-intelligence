'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, CheckCircle, Clock, Sparkles, BarChart2,
  Store, ShoppingBag, TrendingUp, ChevronRight, RefreshCw,
  Bell, Zap, LayoutGrid
} from 'lucide-react';
import { Brand } from '@/lib/types';
import {
  getBrands, getContent, getStoreAnalyses,
  getFunnelAnalyses, getClientMemories
} from '@/lib/storage';
import { formatRelative } from '@/lib/utils';

interface BrandHealth {
  brand: Brand;
  score: number;
  alerts: string[];
  lastActivity: string | null;
  hasInstagram: boolean;
  hasStore: boolean;
  hasFunnel: boolean;
  contentCount: number;
}

function computeHealth(brand: Brand): BrandHealth {
  const content = getContent().filter(c => c.brandId === brand.id);
  const storeAnalyses = getStoreAnalyses(brand.id);
  const funnelAnalyses = getFunnelAnalyses(brand.id);

  const hasInstagram = content.some(c => c.type === 'instagram_analysis');
  const hasStore = storeAnalyses.length > 0;
  const hasFunnel = funnelAnalyses.length > 0;

  let score = 50;
  const alerts: string[] = [];

  if (hasInstagram) score += 12;
  else alerts.push('Sin análisis de Instagram');

  if (hasStore) {
    score += 10;
    const latest = storeAnalyses[0];
    score += Math.round((latest.overallScore - 50) / 10);
  } else {
    alerts.push('Sin análisis de tienda');
  }

  if (hasFunnel) score += 10;
  else alerts.push('Sin análisis de embudo');

  const recent = content.filter(c => {
    const d = new Date(c.createdAt);
    return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
  });
  if (recent.length === 0) alerts.push('Sin contenido en 30 días');
  else if (recent.length >= 5) score += 8;

  const memories = getClientMemories(brand.id);
  if (memories.length > 0) score += 5;

  score = Math.max(0, Math.min(100, score));

  const lastActivity = content.length > 0 ? content[0].createdAt : null;

  return { brand, score, alerts, lastActivity, hasInstagram, hasStore, hasFunnel, contentCount: content.length };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} stroke="#1e1b2e" strokeWidth="6" fill="none" />
        <circle
          cx="32" cy="32" r={r}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-ink">{score}</span>
    </div>
  );
}

function AlertBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} />Todo OK</span>;
  return (
    <span className="text-xs text-amber-400 flex items-center gap-1">
      <AlertTriangle size={12} />{count} alerta{count > 1 ? 's' : ''}
    </span>
  );
}

export default function PanelPage() {
  const [healths, setHealths] = useState<BrandHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const brands = getBrands();
    const h = brands.map(computeHealth).sort((a, b) => a.score - b.score);
    setHealths(h);
    setLoading(false);
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      const brands = getBrands();
      setHealths(brands.map(computeHealth).sort((a, b) => a.score - b.score));
      setLoading(false);
    }, 400);
  };

  const urgent = healths.filter(h => h.score < 50 || h.alerts.length >= 3);
  const ok = healths.filter(h => h.score >= 75 && h.alerts.length === 0);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  if (healths.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <Zap size={48} className="text-violet-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Todavía no hay marcas cargadas</h2>
          <p className="text-ink-dim mb-6">Empezá creando tu primera marca para ver el panel.</p>
          <button
            onClick={() => router.push('/marcas')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          >
            Ir a Marcas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{greeting}, María 👋</h1>
          <p className="text-ink-dim mt-1">
            {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} — {healths.length} marcas activas
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-ink-dim hover:text-ink text-sm transition-colors"
        >
          <RefreshCw size={14} />Actualizar
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-ink-dim">Total marcas</p>
          <p className="text-2xl font-bold text-ink">{healths.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-ink-dim">Necesitan atención</p>
          <p className={`text-2xl font-bold ${urgent.length > 0 ? 'text-red-400' : 'text-ink'}`}>{urgent.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-ink-dim">Score promedio</p>
          <p className="text-2xl font-bold text-violet-400">
            {Math.round(healths.reduce((acc, h) => acc + h.score, 0) / healths.length)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-ink-dim">Todo OK</p>
          <p className="text-2xl font-bold text-emerald-400">{ok.length}</p>
        </div>
      </div>

      {/* Alertas urgentes */}
      {urgent.length > 0 && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-red-400" />
            <p className="text-sm font-semibold text-red-300">Necesitan atención urgente</p>
          </div>
          <div className="space-y-2">
            {urgent.map(h => (
              <div key={h.brand.id} className="flex items-center justify-between bg-red-950/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: h.brand.logoColor || '#7c3aed' }} />
                  <span className="text-sm text-ink font-medium">{h.brand.name}</span>
                  <span className="text-xs text-red-400">Score: {h.score}</span>
                </div>
                <button
                  onClick={() => router.push(`/reunion?brandId=${h.brand.id}`)}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  Preparar reunión <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de marcas */}
      <div>
        <h2 className="text-sm font-semibold text-ink-dim mb-3 uppercase tracking-wider">Todas las marcas — ordenadas por prioridad</h2>
        <div className="grid gap-3">
          {healths.map((h) => (
            <BrandHealthCard key={h.brand.id} health={h} onNavigate={router.push} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandHealthCard({ health: h, onNavigate }: { health: BrandHealth; onNavigate: (href: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = h.score >= 75 ? 'border-emerald-800/30' : h.score >= 50 ? 'border-amber-800/30' : 'border-red-800/30';

  return (
    <div className={`bg-card border ${borderColor} rounded-xl overflow-hidden transition-all`}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Color dot */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: h.brand.logoColor || '#7c3aed' }}>
          <span className="text-white font-bold text-sm">{h.brand.name[0]}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink truncate">{h.brand.name}</p>
            <AlertBadge count={h.alerts.length} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-ink-dim">{h.brand.industry}</span>
            {h.lastActivity && (
              <span className="text-xs text-ink-dim flex items-center gap-1">
                <Clock size={10} />{formatRelative(h.lastActivity)}
              </span>
            )}
          </div>
        </div>

        {/* Status icons */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1 ${h.hasInstagram ? 'text-emerald-400' : 'text-ink-dim'}`}>
            <BarChart2 size={12} />IG
          </span>
          <span className={`flex items-center gap-1 ${h.hasStore ? 'text-emerald-400' : 'text-ink-dim'}`}>
            <ShoppingBag size={12} />Tienda
          </span>
          <span className={`flex items-center gap-1 ${h.hasFunnel ? 'text-emerald-400' : 'text-ink-dim'}`}>
            <TrendingUp size={12} />Embudo
          </span>
          <span className="text-ink-dim">
            <LayoutGrid size={12} className="inline" /> {h.contentCount}
          </span>
        </div>

        {/* Score */}
        <ScoreRing score={h.score} />
        <ChevronRight size={16} className={`text-ink-dim flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Alertas */}
          {h.alerts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider">Alertas</p>
              {h.alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-amber-300">
                  <AlertTriangle size={12} />{a}
                </div>
              ))}
            </div>
          )}

          {/* Acciones rápidas */}
          <div>
            <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider mb-2">Acciones rápidas</p>
            <div className="flex flex-wrap gap-2">
              <QuickAction icon={<Sparkles size={12} />} label="Generar contenido" href={`/generator?brandId=${h.brand.id}`} onNavigate={onNavigate} />
              <QuickAction icon={<BarChart2 size={12} />} label="Analizar Instagram" href={`/instagram?brandId=${h.brand.id}`} onNavigate={onNavigate} />
              <QuickAction icon={<Store size={12} />} label="Analizar tienda" href={`/tienda?brandId=${h.brand.id}`} onNavigate={onNavigate} />
              <QuickAction icon={<TrendingUp size={12} />} label="Ver embudo" href={`/embudo?brandId=${h.brand.id}`} onNavigate={onNavigate} />
              <QuickAction icon={<Zap size={12} />} label="Modo reunión" href={`/reunion?brandId=${h.brand.id}`} onNavigate={onNavigate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, href, onNavigate }: { icon: React.ReactNode; label: string; href: string; onNavigate: (href: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(href)}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-dim border border-violet-600/20 rounded-lg text-xs text-violet-300 hover:bg-violet-600/20 transition-colors"
    >
      {icon}{label}
    </button>
  );
}
