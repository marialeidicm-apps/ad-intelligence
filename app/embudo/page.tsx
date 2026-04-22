'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TrendingUp, RefreshCw, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Brand, FunnelAnalysis, FunnelStage } from '@/lib/types';
import { getBrands, getFunnelAnalyses, saveFunnelAnalysis, generateId } from '@/lib/storage';

const STAGE_ICONS = {
  awareness: '📢',
  consideration: '🤔',
  decision: '⚖️',
  purchase: '🛒',
  retention: '💜',
};

const STAGE_COLORS = {
  bien: { border: 'border-emerald-600/40', bg: 'bg-emerald-950/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  regular: { border: 'border-amber-600/40', bg: 'bg-amber-950/20', text: 'text-amber-400', bar: 'bg-amber-500' },
  mal: { border: 'border-red-600/40', bg: 'bg-red-950/20', text: 'text-red-400', bar: 'bg-red-500' },
};

function StatusIcon({ status }: { status: FunnelStage['status'] }) {
  if (status === 'bien') return <CheckCircle size={14} className="text-emerald-400" />;
  if (status === 'regular') return <AlertTriangle size={14} className="text-amber-400" />;
  return <XCircle size={14} className="text-red-400" />;
}

function FunnelVisual({ stages }: { stages: FunnelAnalysis['stages'] }) {
  const stageList = [
    { key: 'awareness', data: stages.awareness },
    { key: 'consideration', data: stages.consideration },
    { key: 'decision', data: stages.decision },
    { key: 'purchase', data: stages.purchase },
    { key: 'retention', data: stages.retention },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-0 my-2">
      {stageList.map(({ key, data }, i) => {
        const w = 100 - i * 12;
        const colors = STAGE_COLORS[data.status];
        return (
          <div key={key} className="relative flex flex-col items-center w-full">
            <div
              className={`border ${colors.border} ${colors.bg} rounded-lg px-4 py-3 flex items-center justify-between transition-all`}
              style={{ width: `${w}%`, minWidth: 200 }}
            >
              <div className="flex items-center gap-2">
                <span>{STAGE_ICONS[key]}</span>
                <span className="font-semibold text-ink text-sm">{data.name}</span>
                <StatusIcon status={data.status} />
              </div>
              <span className={`text-lg font-bold ${colors.text}`}>{data.score}</span>
            </div>
            {i < stageList.length - 1 && (
              <div className="w-0.5 h-3 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StageCard({ stageKey, stage, expanded, onToggle }: {
  stageKey: string;
  stage: FunnelStage;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = STAGE_COLORS[stage.status];
  return (
    <div className={`bg-card border ${colors.border} rounded-xl overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{STAGE_ICONS[stageKey as keyof typeof STAGE_ICONS]}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">{stage.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusIcon status={stage.status} />
              <span className={`text-xs ${colors.text} capitalize`}>{stage.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-xl font-bold ${colors.text}`}>{stage.score}</p>
            <p className="text-xs text-ink-dim">/ 100</p>
          </div>
          {expanded ? <ChevronUp size={14} className="text-ink-dim" /> : <ChevronDown size={14} className="text-ink-dim" />}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-3 border-t border-border space-y-3">
          <div>
            <p className="text-xs font-semibold text-ink-dim uppercase mb-1">Por qué está así</p>
            <p className="text-sm text-ink-muted leading-relaxed">{stage.whyFailing}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-dim uppercase mb-2">Mejoras sugeridas</p>
            <ul className="space-y-1.5">
              {stage.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span className={`${colors.text} mt-0.5`}>→</span>{imp}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function EmbudoPageInner() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(searchParams.get('brandId') || '');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FunnelAnalysis | null>(null);
  const [history, setHistory] = useState<FunnelAnalysis[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const b = getBrands();
    setBrands(b);
    if (searchParams.get('brandId') && b.length > 0) {
      setHistory(getFunnelAnalyses(searchParams.get('brandId')!));
    }
  }, [searchParams]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleAnalyze = async () => {
    if (!selectedBrand) { setError('Seleccioná una marca'); return; }
    setError('');
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/embudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const result: FunnelAnalysis = {
        id: generateId(),
        brandId: selectedBrandId,
        stages: data.stages,
        weakestStage: data.weakestStage,
        strategicPlan: data.strategicPlan,
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setAnalysis(result);
      setExpandedStage(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando análisis');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    await saveFunnelAnalysis(analysis);
    setSaved(true);
    setHistory(getFunnelAnalyses(selectedBrandId));
  };

  const stageList = analysis ? [
    { key: 'awareness', data: analysis.stages.awareness },
    { key: 'consideration', data: analysis.stages.consideration },
    { key: 'decision', data: analysis.stages.decision },
    { key: 'purchase', data: analysis.stages.purchase },
    { key: 'retention', data: analysis.stages.retention },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <TrendingUp size={24} className="text-violet-400" />Embudo de Marca
        </h1>
        <p className="text-ink-dim mt-1">Visualizá en qué etapa falla tu marca y por qué. Con plan concreto para mejorarlo.</p>
      </div>

      {/* Selector de marca */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Seleccioná la marca</label>
            <select
              value={selectedBrandId}
              onChange={e => {
                setSelectedBrandId(e.target.value);
                setAnalysis(null);
                if (e.target.value) setHistory(getFunnelAnalyses(e.target.value));
              }}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              <option value="">Elegí una marca...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedBrandId}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? <><RefreshCw size={14} className="animate-spin" />Analizando...</> : 'Analizar embudo'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Resultado */}
      {analysis && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Funnel visual */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-dim uppercase mb-4">Vista del embudo</p>
              <FunnelVisual stages={analysis.stages} />
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-ink-dim">Etapa más débil: <span className="text-red-400 font-semibold">{analysis.weakestStage}</span></p>
              </div>
            </div>

            {/* Resumen + plan */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs font-semibold text-ink-dim uppercase mb-2">Diagnóstico</p>
                <p className="text-sm text-ink-muted leading-relaxed">{analysis.summary}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs font-semibold text-ink-dim uppercase mb-3">Plan estratégico</p>
                <ol className="space-y-2">
                  {analysis.strategicPlan.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="w-5 h-5 rounded-full bg-violet-dim border border-violet-600/30 text-violet-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 disabled:opacity-50 text-sm transition-colors"
            >
              {saved ? <><CheckCircle size={14} />Guardado</> : <><Save size={14} />Guardar análisis</>}
            </button>
          </div>

          {/* Detalle por etapa */}
          <div>
            <p className="text-sm font-semibold text-ink-dim mb-3">Detalle por etapa</p>
            <div className="space-y-2">
              {stageList.map(({ key, data }) => (
                <StageCard
                  key={key}
                  stageKey={key}
                  stage={data}
                  expanded={expandedStage === key}
                  onToggle={() => setExpandedStage(expandedStage === key ? null : key)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {history.length > 0 && !analysis && (
        <div>
          <h2 className="text-sm font-semibold text-ink-dim mb-3">Análisis anteriores</h2>
          <div className="space-y-2">
            {history.slice(0, 3).map(h => (
              <button
                key={h.id}
                onClick={() => setAnalysis(h)}
                className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-violet-600/30 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-ink">Análisis del {new Date(h.createdAt).toLocaleDateString('es-AR')}</p>
                  <p className="text-xs text-red-400">Etapa débil: {h.weakestStage}</p>
                </div>
                <span className="text-xs text-ink-dim">Ver →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmbudoPage() {
  return (
    <Suspense>
      <EmbudoPageInner />
    </Suspense>
  );
}
