'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MessageSquare, RefreshCw, Save, CheckCircle, Lightbulb, ThumbsUp, HelpCircle, AlertCircle, Gift, Wrench } from 'lucide-react';
import { Brand, CommentAnalysis } from '@/lib/types';
import { getBrands, getCommentAnalyses, saveCommentAnalysis, generateId } from '@/lib/storage';

function ComentariosPageInner() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(searchParams.get('brandId') || '');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [manualComments, setManualComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);
  const [history, setHistory] = useState<CommentAnalysis[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const b = getBrands();
    setBrands(b);
    const bid = searchParams.get('brandId');
    if (bid) {
      const brand = b.find(br => br.id === bid);
      if (brand?.instagramUsername) setInstagramUsername(brand.instagramUsername);
      setHistory(getCommentAnalyses(bid));
    }
  }, [searchParams]);

  useEffect(() => {
    const brand = brands.find(b => b.id === selectedBrandId);
    if (brand?.instagramUsername) setInstagramUsername(brand.instagramUsername);
    if (selectedBrandId) setHistory(getCommentAnalyses(selectedBrandId));
  }, [selectedBrandId, brands]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleAnalyze = async () => {
    if (!instagramUsername && !selectedBrand) { setError('Ingresá un usuario de Instagram o seleccioná una marca'); return; }
    setError('');
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand, instagramUsername, manualComments: manualComments || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const result: CommentAnalysis = {
        id: generateId(),
        brandId: selectedBrandId || undefined,
        instagramUsername: instagramUsername || selectedBrand?.instagramUsername || '',
        faqs: data.faqs,
        objections: data.objections,
        positive: data.positive,
        requests: data.requests,
        contentIdeas: data.contentIdeas,
        productImprovements: data.productImprovements,
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error analizando comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    await saveCommentAnalysis(analysis);
    setHistory(getCommentAnalyses(selectedBrandId));
    setSaved(true);
  };

  const sections = analysis ? [
    {
      key: 'faqs', label: 'Preguntas frecuentes', icon: <HelpCircle size={14} className="text-blue-400" />,
      items: analysis.faqs, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-800/30',
    },
    {
      key: 'objections', label: 'Objeciones y quejas', icon: <AlertCircle size={14} className="text-red-400" />,
      items: analysis.objections, color: 'text-red-400', bg: 'bg-red-950/20 border-red-800/30',
    },
    {
      key: 'positive', label: 'Qué les gusta', icon: <ThumbsUp size={14} className="text-emerald-400" />,
      items: analysis.positive, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/30',
    },
    {
      key: 'requests', label: 'Qué piden', icon: <Gift size={14} className="text-amber-400" />,
      items: analysis.requests, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-800/30',
    },
    {
      key: 'contentIdeas', label: 'Ideas de contenido', icon: <Lightbulb size={14} className="text-violet-400" />,
      items: analysis.contentIdeas, color: 'text-violet-400', bg: 'bg-violet-dim border-violet-600/20',
    },
    {
      key: 'productImprovements', label: 'Mejoras sugeridas', icon: <Wrench size={14} className="text-cyan-400" />,
      items: analysis.productImprovements, color: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-800/30',
    },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <MessageSquare size={24} className="text-violet-400" />Análisis de Comentarios
        </h1>
        <p className="text-ink-dim mt-1">Detectá qué preguntan, qué piden y qué les gusta en los comentarios de Instagram.</p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Marca (opcional)</label>
            <select
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              <option value="">Sin marca específica</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Usuario de Instagram</label>
            <div className="flex">
              <span className="px-3 py-2 bg-surface border border-r-0 border-border rounded-l-lg text-ink-dim text-sm">@</span>
              <input
                type="text"
                value={instagramUsername}
                onChange={e => setInstagramUsername(e.target.value)}
                placeholder="nombreusuario"
                className="flex-1 bg-surface border border-border rounded-r-lg px-3 py-2 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-dim mb-1.5">
            Pegá comentarios reales (opcional, para un análisis más preciso)
          </label>
          <textarea
            value={manualComments}
            onChange={e => setManualComments(e.target.value)}
            placeholder="Pegá comentarios reales de los posts acá. Si no pegás nada, la IA va a generar un análisis basado en el perfil de la marca..."
            rows={5}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-violet-500 resize-none"
          />
          <p className="text-xs text-ink-dim mt-1">Podés pegar comentarios copiados de Instagram, uno por línea o en bloque.</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading || (!instagramUsername && !selectedBrandId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loading ? <><RefreshCw size={14} className="animate-spin" />Analizando...</> : <><MessageSquare size={14} />Analizar comentarios</>}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold text-ink-dim uppercase mb-2">Resumen del análisis</p>
            <p className="text-sm text-ink-muted leading-relaxed">{analysis.summary}</p>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg text-xs hover:bg-emerald-600/30 disabled:opacity-50"
              >
                {saved ? <><CheckCircle size={12} />Guardado</> : <><Save size={12} />Guardar</>}
              </button>
            </div>
          </div>

          {/* Sections grid */}
          <div className="grid md:grid-cols-2 gap-3">
            {sections.map(({ key, label, icon, items, bg }) => (
              <div key={key} className={`bg-card border ${bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  {icon}
                  <p className="text-xs font-semibold text-ink uppercase">{label}</p>
                  <span className="text-xs text-ink-dim ml-auto">{items.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm text-ink-muted leading-snug">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !analysis && (
        <div>
          <h2 className="text-sm font-semibold text-ink-dim mb-3">Análisis anteriores</h2>
          <div className="space-y-2">
            {history.slice(0, 4).map(h => (
              <button
                key={h.id}
                onClick={() => setAnalysis(h)}
                className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-violet-600/30 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-ink">@{h.instagramUsername}</p>
                  <p className="text-xs text-ink-dim">{new Date(h.createdAt).toLocaleDateString('es-AR')} · {h.contentIdeas.length} ideas de contenido</p>
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

export default function ComentariosPage() {
  return (
    <Suspense>
      <ComentariosPageInner />
    </Suspense>
  );
}
