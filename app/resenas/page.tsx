'use client';
import { useState, useEffect } from 'react';
import { Star, Sparkles, Link, Trash2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Lightbulb, Zap, TrendingUp } from 'lucide-react';
import { Brand, ReviewAnalysis, ReviewPlatform } from '@/lib/types';
import { getBrands, getReviewAnalyses, saveReviewAnalysis, deleteReviewAnalysis, generateId } from '@/lib/storage';
import { buildBrandContext, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

const PLATFORMS: { value: ReviewPlatform; label: string }[] = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'mercadolibre', label: 'Mercado Libre' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'otro', label: 'Otro' },
];

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  muy_positivo: { label: 'Muy positivo', color: 'text-success', bg: 'bg-success/10 border-success/30' },
  positivo: { label: 'Positivo', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  neutro: { label: 'Neutro', color: 'text-ink-muted', bg: 'bg-card border-border' },
  negativo: { label: 'Negativo', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  muy_negativo: { label: 'Muy negativo', color: 'text-danger', bg: 'bg-danger/10 border-danger/30' },
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? 'text-warning fill-warning' : 'text-ink-dim'}
        />
      ))}
      <span className="text-xs text-ink-muted ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function AnalysisCard({ analysis, onDelete }: { analysis: ReviewAnalysis; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = SENTIMENT_CONFIG[analysis.sentiment];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">{analysis.sourceUrl}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sentiment.bg} ${sentiment.color} flex-shrink-0`}>
              {sentiment.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink-dim">{PLATFORMS.find(p => p.value === analysis.platform)?.label} · {analysis.reviewsAnalyzed} reseñas · {formatDate(analysis.createdAt)}</p>
            {analysis.averageRating && <StarRating rating={analysis.averageRating} />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-ink-dim hover:text-danger p-1 transition-colors">
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
          <p className="text-sm text-ink-muted leading-relaxed bg-surface rounded-lg p-3">{analysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListSection
              title="Qué aman los clientes"
              icon={<ThumbsUp size={13} className="text-success" />}
              items={analysis.loved}
              dotColor="bg-success"
            />
            <ListSection
              title="Qué les molesta"
              icon={<ThumbsDown size={13} className="text-danger" />}
              items={analysis.hated}
              dotColor="bg-danger"
            />
          </div>

          <ListSection
            title="Oportunidades detectadas"
            icon={<Lightbulb size={13} className="text-warning" />}
            items={analysis.opportunities}
            dotColor="bg-warning"
          />

          <ListSection
            title="Acciones concretas a tomar"
            icon={<Zap size={13} className="text-violet-400" />}
            items={analysis.actions}
            dotColor="bg-violet-400"
          />
        </div>
      )}
    </div>
  );
}

function ListSection({ title, icon, items, dotColor }: { title: string; icon: React.ReactNode; items: string[]; dotColor: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0 mt-1.5`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResenasPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [platform, setPlatform] = useState<ReviewPlatform>('google_maps');
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<ReviewAnalysis[]>([]);

  useEffect(() => {
    setBrands(getBrands());
    setAnalyses(getReviewAnalyses());
  }, []);

  const analyze = async () => {
    if (!sourceUrl.trim()) return;
    setLoading(true);
    try {
      const brand = brands.find(b => b.id === selectedBrand);
      const brandContext = brand ? buildBrandContext(brand) : '';

      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl, platform, brandContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newAnalysis: ReviewAnalysis = {
        id: generateId(),
        brandId: selectedBrand || undefined,
        sourceUrl,
        platform,
        ...data.result,
        createdAt: new Date().toISOString(),
      };

      saveReviewAnalysis(newAnalysis);
      setAnalyses(getReviewAnalyses());
      setSourceUrl('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al analizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-dim flex items-center justify-center">
            <Star size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Análisis de Reseñas</h1>
            <p className="text-sm text-ink-dim">Analizá qué dicen los clientes en Google Maps, Mercado Libre o Amazon</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-ink-dim block mb-1.5">Marca (opcional)</label>
            <Select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              options={[
                { value: '', label: 'Sin marca' },
                ...brands.map(b => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-dim block mb-1.5">Plataforma</label>
            <Select
              value={platform}
              onChange={e => setPlatform(e.target.value as ReviewPlatform)}
              options={PLATFORMS}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-ink-dim block mb-1.5">Link de la página de reseñas</label>
          <Input
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="https://maps.google.com/... o https://www.mercadolibre.com.ar/..."
            icon={<Link size={14} />}
          />
          <p className="text-xs text-ink-dim mt-1">
            Pegá el link de Google Maps, la página de producto en MercadoLibre/Amazon, etc.
          </p>
        </div>

        <Button
          onClick={analyze}
          loading={loading}
          disabled={!sourceUrl.trim()}
          icon={<Sparkles size={15} />}
        >
          {loading ? 'Analizando reseñas...' : 'Analizar reseñas'}
        </Button>
      </div>

      {/* Resultados */}
      {analyses.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider mb-3">
            Análisis guardados ({analyses.length})
          </p>
          <div className="space-y-2">
            {analyses.map(a => (
              <AnalysisCard
                key={a.id}
                analysis={a}
                onDelete={() => { deleteReviewAnalysis(a.id); setAnalyses(getReviewAnalyses()); }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-ink-dim">
          <Star size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Ingresá el link de reseñas de tu marca y descubrí qué piensan realmente los clientes</p>
        </div>
      )}
    </div>
  );
}
