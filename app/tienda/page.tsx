'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Store, ExternalLink, AlertTriangle, TrendingUp, CheckCircle,
  ChevronDown, ChevronUp, Save, RefreshCw, Star
} from 'lucide-react';
import { Brand, StoreAnalysis } from '@/lib/types';
import { getBrands, getStoreAnalyses, saveStoreAnalysis, generateId } from '@/lib/storage';

const SCORE_LABELS: Record<string, string> = {
  design: 'Diseño y Estética',
  navigation: 'Navegación',
  productPages: 'Fichas de Producto',
  checkout: 'Proceso de Compra',
  speed: 'Velocidad Percibida',
  ctas: 'Llamadas a la Acción',
  funnel: 'Embudo de Venta',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className={`font-semibold ${value >= 75 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BigScore({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} stroke="#1e1b2e" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-ink">{score}</p>
        <p className="text-xs text-ink-dim">/ 100</p>
      </div>
    </div>
  );
}

function TiendaPageInner() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(searchParams.get('brandId') || '');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StoreAnalysis | null>(null);
  const [history, setHistory] = useState<StoreAnalysis[]>([]);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('issues');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBrands(getBrands());
    setHistory(getStoreAnalyses());
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleAnalyze = async () => {
    if (!url) { setError('Ingresá la URL de la tienda'); return; }
    setError('');
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brand: selectedBrand }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const result: StoreAnalysis = {
        id: generateId(),
        brandId: selectedBrandId || undefined,
        url,
        platform: data.platform,
        overallScore: data.overallScore,
        scores: data.scores,
        issues: data.issues,
        opportunities: data.opportunities,
        improvements: data.improvements,
        designAnalysis: data.designAnalysis,
        navigationAnalysis: data.navigationAnalysis,
        productPageAnalysis: data.productPageAnalysis,
        checkoutAnalysis: data.checkoutAnalysis,
        ctaAnalysis: data.ctaAnalysis,
        funnelAnalysis: data.funnelAnalysis,
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando análisis');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    await saveStoreAnalysis(analysis);
    setHistory(getStoreAnalyses());
    setSaved(true);
  };

  const priorityColor = { alta: 'text-red-400 bg-red-950/30 border-red-800/30', media: 'text-amber-400 bg-amber-950/30 border-amber-800/30', baja: 'text-blue-400 bg-blue-950/30 border-blue-800/30' };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Store size={24} className="text-violet-400" />Análisis de Tienda
        </h1>
        <p className="text-ink-dim mt-1">Ingresá la URL y la app hace una lectura completa con score y plan de mejoras.</p>
      </div>

      {/* Formulario */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">URL de la tienda *</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://mitienda.com.ar"
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-violet-500"
              />
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center px-2 text-ink-dim hover:text-violet-400">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Marca (opcional)</label>
            <select
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              <option value="">Sin marca asociada</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading || !url}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
        >
          {loading ? <><RefreshCw size={14} className="animate-spin" />Analizando tienda...</> : <><Store size={14} />Analizar tienda</>}
        </button>
      </div>

      {/* Resultado */}
      {analysis && (
        <div className="space-y-4">
          {/* Score general */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="text-center">
                <BigScore score={analysis.overallScore} />
                <p className="text-sm font-semibold text-ink mt-2">{analysis.platform}</p>
                <p className="text-xs text-ink-dim">{analysis.url}</p>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {Object.entries(analysis.scores).map(([key, val]) => (
                  <ScoreBar key={key} label={SCORE_LABELS[key] || key} value={val} />
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-ink-muted leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 disabled:opacity-50 text-sm transition-colors"
            >
              {saved ? <><CheckCircle size={14} />Guardado</> : <><Save size={14} />Guardar análisis</>}
            </button>
          </div>

          {/* Secciones colapsables */}
          <div className="space-y-2">
            {[
              { key: 'issues', label: 'Problemas detectados', icon: <AlertTriangle size={14} className="text-red-400" />, content: (
                <ul className="space-y-2">
                  {analysis.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="text-red-400 mt-0.5">✗</span>{issue}
                    </li>
                  ))}
                </ul>
              )},
              { key: 'opportunities', label: 'Oportunidades', icon: <TrendingUp size={14} className="text-emerald-400" />, content: (
                <ul className="space-y-2">
                  {analysis.opportunities.map((op, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="text-emerald-400 mt-0.5">→</span>{op}
                    </li>
                  ))}
                </ul>
              )},
              { key: 'improvements', label: 'Plan de mejoras priorizado', icon: <Star size={14} className="text-violet-400" />, content: (
                <div className="space-y-2">
                  {analysis.improvements.map((imp, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${priorityColor[imp.priority]}`}>
                      <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded border ${priorityColor[imp.priority]} flex-shrink-0`}>{imp.priority}</span>
                      <div>
                        <p className="text-ink font-medium">{imp.action}</p>
                        <p className="text-xs text-ink-dim mt-0.5">{imp.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )},
              { key: 'design', label: 'Diseño y estética', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.designAnalysis}</p> },
              { key: 'navigation', label: 'Navegación', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.navigationAnalysis}</p> },
              { key: 'product', label: 'Fichas de producto', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.productPageAnalysis}</p> },
              { key: 'checkout', label: 'Proceso de compra', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.checkoutAnalysis}</p> },
              { key: 'cta', label: 'Llamadas a la acción', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.ctaAnalysis}</p> },
              { key: 'funnel', label: 'Embudo de venta', icon: null, content: <p className="text-sm text-ink-muted leading-relaxed">{analysis.funnelAnalysis}</p> },
            ].map(({ key, label, icon, content }) => (
              <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">{icon}{label}</span>
                  {expandedSection === key ? <ChevronUp size={14} className="text-ink-dim" /> : <ChevronDown size={14} className="text-ink-dim" />}
                </button>
                {expandedSection === key && (
                  <div className="px-5 pb-4 border-t border-border pt-4">{content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {history.length > 0 && !analysis && (
        <div>
          <h2 className="text-sm font-semibold text-ink-dim mb-3">Análisis anteriores</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map(h => (
              <button
                key={h.id}
                onClick={() => setAnalysis(h)}
                className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-violet-600/30 text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{h.url}</p>
                  <p className="text-xs text-ink-dim">{h.platform} · {new Date(h.createdAt).toLocaleDateString('es-AR')}</p>
                </div>
                <span className={`text-lg font-bold ${h.overallScore >= 75 ? 'text-emerald-400' : h.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {h.overallScore}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TiendaPage() {
  return (
    <Suspense>
      <TiendaPageInner />
    </Suspense>
  );
}
