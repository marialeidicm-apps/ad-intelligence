'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Zap, RefreshCw, Printer, Clock, CheckSquare, Lightbulb, HelpCircle, TrendingUp, Save, CheckCircle } from 'lucide-react';
import { Brand, MeetingBriefing } from '@/lib/types';
import { getBrands, getContent, getClientMemories, getMeetingBriefings, saveMeetingBriefing, generateId } from '@/lib/storage';
import { formatRelative } from '@/lib/utils';

function BriefingSection({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={color}>{icon}</span>
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm text-ink-muted`}>
            <span className={`${color} mt-0.5 flex-shrink-0`}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReunionPageInner() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(searchParams.get('brandId') || '');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [briefing, setBriefing] = useState<MeetingBriefing | null>(null);
  const [history, setHistory] = useState<MeetingBriefing[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBrands(getBrands());
    const bid = searchParams.get('brandId');
    if (bid) setHistory(getMeetingBriefings(bid));
  }, [searchParams]);

  useEffect(() => {
    if (selectedBrandId) setHistory(getMeetingBriefings(selectedBrandId));
  }, [selectedBrandId]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleGenerate = async () => {
    if (!selectedBrand) { setError('Seleccioná una marca'); return; }
    setError('');
    setLoading(true);
    setBriefing(null);
    setSaved(false);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 200);

    try {
      const recentContent = getContent().filter(c => c.brandId === selectedBrandId).slice(0, 10);
      const memories = getClientMemories(selectedBrandId);
      const res = await fetch('/api/reunion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand, recentContent, memories }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      clearInterval(interval);
      setProgress(100);
      const result: MeetingBriefing = {
        id: generateId(),
        brandId: selectedBrandId,
        currentState: data.currentState,
        pending: data.pending,
        proposals: data.proposals,
        questionsToAsk: data.questionsToAsk,
        opportunities: data.opportunities,
        createdAt: new Date().toISOString(),
      };
      setTimeout(() => {
        setBriefing(result);
        setLoading(false);
        setProgress(0);
      }, 400);
    } catch (e) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : 'Error generando briefing');
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSave = async () => {
    if (!briefing) return;
    await saveMeetingBriefing(briefing);
    setHistory(getMeetingBriefings(selectedBrandId));
    setSaved(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Zap size={24} className="text-violet-400" />Modo Reunión
        </h1>
        <p className="text-ink-dim mt-1">Antes de hablar con un cliente, preparate en 2 minutos con todo lo que necesitás saber.</p>
      </div>

      {/* Selector */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-ink-dim mb-1.5">¿Con qué marca vas a reunirte?</label>
            <select
              value={selectedBrandId}
              onChange={e => { setSelectedBrandId(e.target.value); setBriefing(null); }}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              <option value="">Elegí la marca...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedBrandId}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? <><RefreshCw size={14} className="animate-spin" />Preparando...</> : <><Zap size={14} />Preparar reunión</>}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        {/* Progress bar */}
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-ink-dim">
              <span>Analizando toda la info de {selectedBrand?.name}...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Briefing */}
      {briefing && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-violet-950/30 border border-violet-600/30 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-violet-400 uppercase font-semibold mb-1">Briefing de reunión</p>
                <h2 className="text-xl font-bold text-ink">{selectedBrand?.name}</h2>
                <p className="text-xs text-ink-dim flex items-center gap-1 mt-1">
                  <Clock size={10} />{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg text-xs hover:bg-emerald-600/30 disabled:opacity-50"
                >
                  {saved ? <><CheckCircle size={12} />Guardado</> : <><Save size={12} />Guardar</>}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-ink-dim rounded-lg text-xs hover:text-ink hover:border-violet-600/30"
                >
                  <Printer size={12} />Imprimir
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-violet-600/20">
              <p className="text-xs font-semibold text-ink-dim uppercase mb-1">Estado actual</p>
              <p className="text-sm text-ink-muted leading-relaxed">{briefing.currentState}</p>
            </div>
          </div>

          {/* Grid de secciones */}
          <div className="grid md:grid-cols-2 gap-3">
            <BriefingSection
              icon={<CheckSquare size={14} />} title="Pendientes"
              items={briefing.pending} color="text-amber-400"
            />
            <BriefingSection
              icon={<Lightbulb size={14} />} title="Qué proponer hoy"
              items={briefing.proposals} color="text-violet-400"
            />
            <BriefingSection
              icon={<HelpCircle size={14} />} title="Qué preguntarle"
              items={briefing.questionsToAsk} color="text-blue-400"
            />
            <BriefingSection
              icon={<TrendingUp size={14} />} title="Oportunidades detectadas"
              items={briefing.opportunities} color="text-emerald-400"
            />
          </div>

          {/* Memoria del cliente */}
          {selectedBrandId && (() => {
            const memories = getClientMemories(selectedBrandId);
            if (memories.length === 0) return null;
            const lastAgreement = memories.find(m => m.category === 'acuerdo');
            const dislikes = memories.filter(m => m.category === 'no_gusta').slice(0, 2);
            return (
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-400 uppercase mb-2">Recordá de reuniones anteriores</p>
                {lastAgreement && (
                  <p className="text-sm text-ink-muted mb-1">
                    <span className="text-amber-300">Último acuerdo:</span> {lastAgreement.content}
                  </p>
                )}
                {dislikes.map((d, i) => (
                  <p key={i} className="text-sm text-ink-muted">
                    <span className="text-red-400">No le gusta:</span> {d.content}
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Historial */}
      {history.length > 0 && !briefing && !loading && (
        <div>
          <h2 className="text-sm font-semibold text-ink-dim mb-3">Briefings anteriores</h2>
          <div className="space-y-2">
            {history.slice(0, 4).map(h => (
              <button
                key={h.id}
                onClick={() => setBriefing(h)}
                className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-violet-600/30 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-ink">Reunión del {new Date(h.createdAt).toLocaleDateString('es-AR')}</p>
                  <p className="text-xs text-ink-dim">{formatRelative(h.createdAt)}</p>
                </div>
                <span className="text-xs text-violet-400">Ver →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReunionPage() {
  return (
    <Suspense>
      <ReunionPageInner />
    </Suspense>
  );
}
