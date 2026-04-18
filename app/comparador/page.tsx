'use client';
import { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { getBrands } from '@/lib/storage';
import { buildBrandContext, getCountryLabel, getLanguageLabel, getObjectiveLabel, getPlatformLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Spinner';
import { ArrowLeftRight, Sparkles, AlertCircle, TrendingUp, CheckCircle2, XCircle, Minus } from 'lucide-react';

interface ComparisonResult {
  summary: string;
  categories: {
    name: string;
    brandA: { score: number; notes: string };
    brandB: { score: number; notes: string };
    winner: 'A' | 'B' | 'tie';
  }[];
  brandAStrengths: string[];
  brandBStrengths: string[];
  recommendations: { brand: string; action: string }[];
}

function WinnerIcon({ winner, side }: { winner: 'A' | 'B' | 'tie'; side: 'A' | 'B' }) {
  if (winner === 'tie') return <Minus size={14} className="text-ink-dim" />;
  if (winner === side) return <CheckCircle2 size={14} className="text-success" />;
  return <XCircle size={14} className="text-danger opacity-40" />;
}

export default function ComparadorPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandAId, setBrandAId] = useState('');
  const [brandBId, setBrandBId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length >= 2) {
      setBrandAId(list[0].id);
      setBrandBId(list[1].id);
    } else if (list.length === 1) {
      setBrandAId(list[0].id);
    }
  }, []);

  const brandA = brands.find(b => b.id === brandAId);
  const brandB = brands.find(b => b.id === brandBId);

  const compare = async () => {
    if (!brandA || !brandB) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hook',
          brandContext: `MARCA A:\n${buildBrandContext(brandA)}\n\nMARCA B:\n${buildBrandContext(brandB)}`,
          language: brandA.language,
          topic: `comparación estratégica entre ${brandA.name} y ${brandB.name}`,
          extraContext: `Comparar estas dos marcas en términos de estrategia, contenido, posicionamiento y oportunidades.

Respondé SOLO con JSON:
{
  "hooks": [{"text": "placeholder", "type": "comparison", "why": ""}],
  "comparison": {
    "summary": "<resumen de 2-3 oraciones comparando ambas marcas>",
    "categories": [
      {
        "name": "<categoría: ej 'Estrategia de contenido'>",
        "brandA": { "score": <0-100>, "notes": "<notas breves>" },
        "brandB": { "score": <0-100>, "notes": "<notas breves>" },
        "winner": "A|B|tie"
      }
    ],
    "brandAStrengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
    "brandBStrengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
    "recommendations": [
      { "brand": "${brandA.name}", "action": "acción recomendada" },
      { "brand": "${brandB.name}", "action": "acción recomendada" }
    ]
  }
}

Categorías a comparar: Estrategia de contenido, Voz de marca, Propuesta de valor, Claridad del objetivo, Potencial de crecimiento`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const comparison = data.result?.comparison || data.result;
      setResult(comparison);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al comparar');
    } finally {
      setLoading(false);
    }
  };

  const BrandProfile = ({ brand, label }: { brand: Brand; label: string }) => (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="violet" size="sm">{label}</Badge>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: brand.logoColor ?? '#7C3AED' }}
        >
          {brand.name[0]}
        </div>
        <h3 className="text-sm font-semibold text-ink">{brand.name}</h3>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">Rubro</span>
          <span className="text-ink">{brand.industry}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">País</span>
          <span className="text-ink">{getCountryLabel(brand.country)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">Idioma</span>
          <span className="text-ink">{getLanguageLabel(brand.language)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">Objetivo</span>
          <span className="text-ink">{getObjectiveLabel(brand.objective)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">Plataforma</span>
          <span className="text-ink">{getPlatformLabel(brand.ecommercePlatform)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-ink-dim w-20 flex-shrink-0">Redes</span>
          <span className="text-ink">{brand.socialNetworks.join(', ')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Comparador</h1>
        <p className="text-sm text-ink-muted mt-1">Dos marcas lado a lado — estrategia, contenido y oportunidades</p>
      </div>

      {/* Selection */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        {brands.length < 2 ? (
          <div className="text-center py-4">
            <p className="text-sm text-ink-muted mb-2">Necesitás al menos 2 marcas para comparar.</p>
            <a href="/marcas" className="text-sm text-violet-light hover:underline">Agregar marcas →</a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select
                label="Marca A"
                value={brandAId}
                options={brands.filter(b => b.id !== brandBId).map(b => ({ value: b.id, label: b.name }))}
                onChange={e => { setBrandAId(e.target.value); setResult(null); }}
              />
              <Select
                label="Marca B"
                value={brandBId}
                options={brands.filter(b => b.id !== brandAId).map(b => ({ value: b.id, label: b.name }))}
                onChange={e => { setBrandBId(e.target.value); setResult(null); }}
              />
            </div>

            {/* Profiles side by side */}
            {brandA && brandB && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <BrandProfile brand={brandA} label="A" />
                <BrandProfile brand={brandB} label="B" />
              </div>
            )}

            <Button
              onClick={compare}
              loading={loading}
              disabled={!brandAId || !brandBId || brandAId === brandBId || loading}
              icon={<ArrowLeftRight size={16} />}
            >
              Comparar marcas
            </Button>
          </>
        )}

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
            <ArrowLeftRight size={28} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-ink">Comparando {brandA?.name} vs {brandB?.name}...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 animate-slide-up">
          {/* Summary */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-sm text-ink leading-relaxed">{result.summary}</p>
          </div>

          {/* Categories comparison */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-0 border-b border-border px-5 py-3">
              <span className="text-xs font-semibold text-ink-dim">Categoría</span>
              <span className="text-xs font-semibold text-ink-dim text-center w-24">{brandA?.name}</span>
              <span className="text-xs font-semibold text-ink-dim text-center w-24">{brandB?.name}</span>
              <span className="text-xs font-semibold text-ink-dim text-center w-16">Ganador</span>
            </div>
            <div className="divide-y divide-border/50">
              {result.categories?.map((cat, i) => (
                <div key={i} className="grid grid-cols-[1fr,auto,auto,auto] gap-0 px-5 py-4 hover:bg-surface transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ink mb-0.5">{cat.name}</p>
                  </div>
                  <div className="w-24 text-center">
                    <div className={`inline-flex items-center gap-1 text-sm font-bold ${cat.brandA.score >= 70 ? 'text-success' : cat.brandA.score >= 50 ? 'text-warning' : 'text-danger'}`}>
                      <WinnerIcon winner={cat.winner} side="A" />
                      {cat.brandA.score}
                    </div>
                    <p className="text-[10px] text-ink-dim mt-0.5 leading-tight">{cat.brandA.notes}</p>
                  </div>
                  <div className="w-24 text-center">
                    <div className={`inline-flex items-center gap-1 text-sm font-bold ${cat.brandB.score >= 70 ? 'text-success' : cat.brandB.score >= 50 ? 'text-warning' : 'text-danger'}`}>
                      <WinnerIcon winner={cat.winner} side="B" />
                      {cat.brandB.score}
                    </div>
                    <p className="text-[10px] text-ink-dim mt-0.5 leading-tight">{cat.brandB.notes}</p>
                  </div>
                  <div className="w-16 flex items-center justify-center">
                    {cat.winner === 'tie' ? (
                      <Badge variant="neutral" size="sm">Empate</Badge>
                    ) : (
                      <Badge variant="success" size="sm">{cat.winner === 'A' ? brandA?.name : brandB?.name}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white">A</div>
                <h3 className="text-sm font-semibold text-ink">Fortalezas de {brandA?.name}</h3>
              </div>
              <ul className="space-y-1.5">
                {result.brandAStrengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                    <TrendingUp size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded bg-success flex items-center justify-center text-[9px] font-bold text-white">B</div>
                <h3 className="text-sm font-semibold text-ink">Fortalezas de {brandB?.name}</h3>
              </div>
              <ul className="space-y-1.5">
                {result.brandBStrengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                    <TrendingUp size={12} className="text-success flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-violet-dim border border-violet-600/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-ink">Recomendaciones</h3>
              </div>
              <div className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Badge variant="violet" size="sm">{r.brand}</Badge>
                    <p className="text-sm text-ink-muted">{r.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && brands.length >= 2 && (
        <EmptyState
          icon={<ArrowLeftRight size={48} strokeWidth={1} />}
          title="Seleccioná dos marcas y comparalas"
          description="Análisis lado a lado: estrategia, voz, objetivos y oportunidades de mejora."
        />
      )}
    </div>
  );
}
