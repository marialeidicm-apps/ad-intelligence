'use client';
import { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { getBrands, saveContent, generateId } from '@/lib/storage';
import { buildBrandContext } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import {
  ClipboardList, Sparkles, TrendingUp, Target, Flame, Star,
  AlertCircle, CheckCircle2, ChevronRight, RefreshCw
} from 'lucide-react';

interface AuditResult {
  brandName: string;
  overallScore: number;
  summary: string;
  contenidoActual: { score: number; analysis: string; fixes: string[] };
  estrategia: { score: number; analysis: string; fixes: string[] };
  identidadVisual: { score: number; analysis: string; fixes: string[] };
  copy: { score: number; analysis: string; fixes: string[] };
  planViral: string[];
  planCrecimiento: string[];
  reelsIdeas: string[];
  quickWins: string[];
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className={`text-xs font-bold ${score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger'}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-card rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Section({ title, score, analysis, fixes, icon }: {
  title: string; score: number; analysis: string; fixes: string[]; icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
        <span className={`text-sm font-bold ${score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger'}`}>
          {score}/100
        </span>
      </div>
      <p className="text-sm text-ink-muted leading-relaxed mb-3">{analysis}</p>
      {fixes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Acciones</p>
          <ul className="space-y-1.5">
            {fixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-muted">{fix}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length > 0) setSelectedBrandId(list[0].id);
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const runAudit = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'audit',
          brandContext: buildBrandContext(selectedBrand),
          language: selectedBrand.language,
          topic: 'auditoría completa de marca',
          extraContext: `Generá una auditoría completa de la marca en JSON con este formato exacto:
{
  "brandName": "${selectedBrand.name}",
  "overallScore": <número 0-100>,
  "summary": "<párrafo resumiendo el estado actual>",
  "contenidoActual": { "score": <0-100>, "analysis": "<análisis>", "fixes": ["acción 1", "acción 2", "acción 3"] },
  "estrategia": { "score": <0-100>, "analysis": "<análisis>", "fixes": ["acción 1", "acción 2", "acción 3"] },
  "identidadVisual": { "score": <0-100>, "analysis": "<análisis>", "fixes": ["acción 1", "acción 2", "acción 3"] },
  "copy": { "score": <0-100>, "analysis": "<análisis>", "fixes": ["acción 1", "acción 2", "acción 3"] },
  "planViral": ["paso 1", "paso 2", "paso 3", "paso 4", "paso 5"],
  "planCrecimiento": ["táctica 1", "táctica 2", "táctica 3", "táctica 4"],
  "reelsIdeas": ["idea reels 1", "idea 2", "idea 3", "idea 4", "idea 5", "idea 6"],
  "quickWins": ["ganancia rápida 1", "ganancia 2", "ganancia 3"]
}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const parsed = data.result.rawText ? JSON.parse(data.result.rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '')) : data.result;
      setResult(parsed);

      saveContent({
        id: generateId(),
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        type: 'audit',
        title: `Auditoría: ${selectedBrand.name}`,
        content: JSON.stringify(parsed),
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al auditar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Auditoría de Marca</h1>
        <p className="text-sm text-ink-muted mt-1">Análisis estratégico completo + plan para viralizar y crecer</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {brands.length > 0 ? (
            <div className="flex-1">
              <Select
                label="Marca a auditar"
                value={selectedBrandId}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                onChange={e => { setSelectedBrandId(e.target.value); setResult(null); }}
              />
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              <a href="/marcas" className="text-violet-light hover:underline">Creá una marca primero</a>
            </p>
          )}
          <Button
            onClick={runAudit}
            loading={loading}
            disabled={!selectedBrandId || loading}
            icon={<ClipboardList size={16} />}
          >
            Auditar
          </Button>
        </div>
        {error && (
          <div className="mt-4 bg-danger/10 border border-danger/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-dim border border-violet-600/30 flex items-center justify-center animate-pulse-violet">
            <ClipboardList size={28} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-ink">Auditando {selectedBrand?.name}...</p>
          <p className="text-xs text-ink-muted">Analizando estrategia, contenido y oportunidades</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6 animate-slide-up">
          {/* Score general */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{result.brandName}</h2>
                <p className="text-sm text-ink-muted mt-0.5">{result.summary}</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${result.overallScore >= 75 ? 'text-success' : result.overallScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                  {result.overallScore}
                </div>
                <p className="text-xs text-ink-dim">/ 100</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreBar score={result.contenidoActual?.score} label="Contenido actual" />
              <ScoreBar score={result.estrategia?.score} label="Estrategia" />
              <ScoreBar score={result.identidadVisual?.score} label="Identidad visual" />
              <ScoreBar score={result.copy?.score} label="Copy y mensajes" />
            </div>
          </div>

          {/* Quick wins */}
          {result.quickWins?.length > 0 && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-success" />
                <h3 className="text-sm font-semibold text-ink">Quick wins — hacelo esta semana</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.quickWins.map((w, i) => (
                  <div key={i} className="bg-success/5 border border-success/15 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-success flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-ink-muted">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secciones de análisis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="Contenido actual" score={result.contenidoActual?.score} analysis={result.contenidoActual?.analysis} fixes={result.contenidoActual?.fixes || []} icon={<Sparkles size={15} className="text-violet-400" />} />
            <Section title="Estrategia" score={result.estrategia?.score} analysis={result.estrategia?.analysis} fixes={result.estrategia?.fixes || []} icon={<Target size={15} className="text-blue-400" />} />
            <Section title="Identidad visual" score={result.identidadVisual?.score} analysis={result.identidadVisual?.analysis} fixes={result.identidadVisual?.fixes || []} icon={<Star size={15} className="text-warning" />} />
            <Section title="Copy y mensajes" score={result.copy?.score} analysis={result.copy?.analysis} fixes={result.copy?.fixes || []} icon={<CheckCircle2 size={15} className="text-success" />} />
          </div>

          {/* Plan viral */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={18} className="text-danger" />
              <h3 className="text-sm font-semibold text-ink">Plan para viralizar la marca</h3>
            </div>
            <ol className="space-y-3">
              {result.planViral?.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-[10px] font-bold text-danger flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-ink-muted">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Plan crecimiento + Reels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-success" />
                <h3 className="text-sm font-semibold text-ink">Plan de crecimiento de seguidores</h3>
              </div>
              <ul className="space-y-2">
                {result.planCrecimiento?.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-success text-xs mt-0.5">→</span>
                    <p className="text-sm text-ink-muted">{t}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-ink">Ideas de Reels para Explorar</h3>
              </div>
              <ul className="space-y-2">
                {result.reelsIdeas?.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 text-xs mt-0.5">✦</span>
                    <p className="text-sm text-ink-muted">{idea}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <EmptyState
          icon={<ClipboardList size={48} strokeWidth={1} />}
          title="Seleccioná una marca y auditá"
          description="La auditoría analiza contenido, estrategia, identidad visual y copy. Incluye plan viral y de crecimiento."
        />
      )}
    </div>
  );
}
