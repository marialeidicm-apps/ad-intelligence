'use client';
import { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { getBrands } from '@/lib/storage';
import { getCountryLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Spinner';
import { Users, Search, ExternalLink, Facebook, AlertCircle, Info, Sparkles } from 'lucide-react';

const META_ADS_URL = 'https://www.facebook.com/ads/library/';

interface CompetitorAd {
  id: string;
  brand: string;
  type: 'imagen' | 'video' | 'carrusel';
  daysRunning: string;
  platforms: string[];
  description: string;
  url: string;
}

export default function CompetenciaPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CompetitorAd[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length > 0) setSelectedBrandId(list[0].id);
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const openMetaLibrary = () => {
    const params = new URLSearchParams({
      active_status: 'active',
      ad_type: 'all',
      country: selectedBrand?.country || 'AR',
      q: searchTerm || selectedBrand?.industry || '',
      search_type: 'keyword_unordered',
    });
    window.open(`${META_ADS_URL}?${params}`, '_blank');
  };

  const searchAds = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const query = searchTerm.trim() || selectedBrand.industry;
      const country = selectedBrand.country;

      // Use Claude to generate realistic mock competitor analysis
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hook',
          brandContext: `Marca: ${selectedBrand.name}, Rubro: ${selectedBrand.industry}, País: ${getCountryLabel(country)}`,
          language: selectedBrand.language,
          topic: 'análisis de competidores en Meta Ads',
          extraContext: `Generá un análisis de 5 marcas competidoras del rubro "${selectedBrand.industry}" en ${getCountryLabel(country)} que probablemente estén pautando en Meta Ads.

Respondé SOLO con JSON:
{
  "hooks": [
    {
      "text": "JSON con array competitors",
      "type": "analysis",
      "why": "..."
    }
  ],
  "competitors": [
    {
      "id": "1",
      "brand": "<nombre de marca>",
      "type": "imagen|video|carrusel",
      "daysRunning": "<número> días",
      "platforms": ["Facebook", "Instagram"],
      "description": "<descripción breve del tipo de anuncio que probablemente usan>",
      "url": "https://www.facebook.com/ads/library/"
    }
  ]
}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const parsed = data.result;
      if (parsed.competitors) {
        setResults(parsed.competitors);
      } else if (parsed.hooks?.[0]) {
        setResults([]);
      }
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Competencia</h1>
        <p className="text-sm text-ink-muted mt-1">Marcas activas en Meta Ads del mismo rubro</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-ink mb-1">Cómo funciona</p>
          <p className="text-xs text-ink-muted leading-relaxed">
            La búsqueda abre la <strong className="text-ink">Meta Ads Library</strong> directamente con el rubro y país de la marca. Podés ver anuncios activos en tiempo real.
            El análisis generado por IA muestra qué marcas típicas del rubro probablemente están pautando.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {brands.length > 0 && (
            <Select
              label="Marca de referencia"
              value={selectedBrandId}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              onChange={e => { setSelectedBrandId(e.target.value); setResults([]); setSearched(false); }}
            />
          )}
          <div className="sm:col-span-2">
            <Input
              label="Palabra clave (opcional)"
              placeholder={selectedBrand ? `Ej: ${selectedBrand.industry}` : 'Rubro o nombre de marca...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={openMetaLibrary}
            variant="secondary"
            icon={<ExternalLink size={14} />}
            disabled={!selectedBrand}
          >
            Abrir Meta Ads Library
          </Button>
          <Button
            onClick={searchAds}
            loading={loading}
            disabled={!selectedBrandId || loading}
            icon={<Sparkles size={14} />}
          >
            Analizar competencia
          </Button>
        </div>
        {error && (
          <div className="mt-3 bg-danger/10 border border-danger/30 rounded-lg p-2.5 flex items-center gap-2">
            <AlertCircle size={13} className="text-danger" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Marcas activas estimadas — {selectedBrand?.industry} en {getCountryLabel(selectedBrand?.country || 'AR')}</h2>
            <Badge variant="warning" size="sm">
              <Sparkles size={10} className="mr-1" />
              Análisis IA
            </Badge>
          </div>
          {results.map(ad => (
            <div key={ad.id} className="bg-card border border-border rounded-2xl p-5 hover:border-violet-600/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-dim border border-violet-600/30 flex items-center justify-center">
                      <Facebook size={14} className="text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink">{ad.brand}</h3>
                  </div>
                  <p className="text-sm text-ink-muted mb-3 leading-relaxed">{ad.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="neutral" size="sm">{ad.type}</Badge>
                    <Badge variant="success" size="sm">{ad.daysRunning}</Badge>
                    {ad.platforms.map(p => (
                      <Badge key={p} variant="outline" size="sm">{p}</Badge>
                    ))}
                  </div>
                </div>
                <a
                  href={META_ADS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-violet-light hover:text-violet-400 border border-violet-600/30 hover:border-violet-600 rounded-lg px-3 py-2 transition-all"
                >
                  <ExternalLink size={12} />
                  Ver en Meta
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <EmptyState
          icon={<Users size={40} strokeWidth={1} />}
          title="Sin resultados"
          description="Usá la Meta Ads Library directamente para ver anuncios en tiempo real."
          action={
            <Button icon={<ExternalLink size={14} />} onClick={openMetaLibrary}>
              Abrir Meta Ads Library
            </Button>
          }
        />
      )}

      {!searched && !loading && (
        <EmptyState
          icon={<Users size={48} strokeWidth={1} />}
          title="Analizá a tu competencia"
          description="Mirá qué están pautando las marcas del mismo rubro. Cuánto tiempo llevan corriendo los anuncios y en qué formatos."
        />
      )}
    </div>
  );
}
