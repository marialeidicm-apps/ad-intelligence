'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brand, VoiceAutoAnalysis } from '@/lib/types';
import { getBrands, saveBrand, saveContent, generateId } from '@/lib/storage';
import { buildBrandContext } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import {
  BarChart2, Instagram, TrendingUp, AlertTriangle, Lightbulb,
  Target, Users, Sparkles, CheckCircle2, AlertCircle, Info,
  ChevronRight, ArrowUp, Mic2, Save, CheckCheck
} from 'lucide-react';

interface AnalysisData {
  username: string;
  postsAnalyzed: number;
  averageEngagement: string;
  postingFrequency: string;
  tone: string;
  dataSource: 'apify' | 'ai_analysis';
  contentMix: { type: string; percentage: number }[];
  topFormats: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  strategicPlan: string[];
  contentIdeas: string[];
  followerGrowthTips: string[];
  explorePageStrategy: string[];
}

function MetricCard({ label, value, sub, color = 'violet' }: { label: string; value: string; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    violet: 'text-violet-light',
    success: 'text-success',
    warning: 'text-warning',
    blue: 'text-blue-400',
  };
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-ink-dim mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color] || colorMap.violet}`}>{value}</p>
      {sub && <p className="text-xs text-ink-dim mt-0.5">{sub}</p>}
    </div>
  );
}

function ListSection({ title, icon, items, variant = 'default' }: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant?: 'success' | 'danger' | 'violet' | 'warning' | 'default';
}) {
  const variantStyles: Record<string, { dot: string; text: string }> = {
    success: { dot: 'bg-success', text: 'text-ink-muted' },
    danger: { dot: 'bg-danger', text: 'text-ink-muted' },
    violet: { dot: 'bg-violet-400', text: 'text-ink-muted' },
    warning: { dot: 'bg-warning', text: 'text-ink-muted' },
    default: { dot: 'bg-ink-dim', text: 'text-ink-muted' },
  };
  const s = variantStyles[variant];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0 mt-1.5`} />
            <p className={`text-sm ${s.text} leading-relaxed`}>{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InstagramContent() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [error, setError] = useState('');
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAutoAnalysis | null>(null);
  const [voiceSaved, setVoiceSaved] = useState(false);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      const brand = list.find(b => b.id === brandParam);
      if (brand) {
        setSelectedBrandId(brand.id);
        if (brand.instagramUsername) setUsername(brand.instagramUsername);
      }
    } else if (list.length > 0) {
      setSelectedBrandId(list[0].id);
      if (list[0].instagramUsername) setUsername(list[0].instagramUsername);
    }
  }, [searchParams]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleBrandChange = (id: string) => {
    setSelectedBrandId(id);
    const brand = brands.find(b => b.id === id);
    if (brand?.instagramUsername) setUsername(brand.instagramUsername);
    setAnalysis(null);
    setVoiceAnalysis(null);
    setVoiceSaved(false);
  };

  const analyze = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    setVoiceAnalysis(null);
    setVoiceSaved(false);

    try {
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().replace('@', ''),
          brandContext: selectedBrand ? buildBrandContext(selectedBrand) : '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al analizar');

      setAnalysis(data.result);
      setHasRealData(data.hasRealData);

      // Save to history
      if (selectedBrand) {
        saveContent({
          id: generateId(),
          brandId: selectedBrand.id,
          brandName: selectedBrand.name,
          type: 'instagram_analysis',
          title: `Análisis Instagram: @${username.trim().replace('@', '')}`,
          content: JSON.stringify(data.result),
          createdAt: new Date().toISOString(),
        });
      }

      // Auto voice analysis
      try {
        const voiceRes = await fetch('/api/voz-marca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instagramData: data.result,
            brandName: selectedBrand?.name || username,
            industry: selectedBrand?.industry || '',
          }),
        });
        if (voiceRes.ok) {
          const voiceData = await voiceRes.json();
          if (voiceData.result) setVoiceAnalysis(voiceData.result);
        }
      } catch {
        // Voice analysis is optional, don't fail
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al analizar');
    } finally {
      setLoading(false);
    }
  };

  const saveVoiceToProfile = () => {
    if (!voiceAnalysis || !selectedBrandId) return;
    const brand = brands.find(b => b.id === selectedBrandId);
    if (!brand) return;
    const updated: Brand = {
      ...brand,
      voiceProfile: {
        tone: voiceAnalysis.tone,
        characteristicPhrases: voiceAnalysis.characteristicPhrases.join(', '),
        bannedWords: voiceAnalysis.bannedWords.join(', '),
        emojis: voiceAnalysis.emojis.join(' '),
        idealCustomer: voiceAnalysis.idealCustomer,
      },
      updatedAt: new Date().toISOString(),
    };
    saveBrand(updated);
    setBrands(getBrands());
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Análisis de Instagram</h1>
        <p className="text-sm text-ink-muted mt-1">Estrategia, engagement, crecimiento y explorar</p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {brands.length > 0 && (
            <Select
              label="Marca"
              value={selectedBrandId}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              onChange={e => handleBrandChange(e.target.value)}
            />
          )}
          <div className="sm:col-span-2">
            <Input
              label="Usuario de Instagram"
              placeholder="@marca o marca"
              value={username}
              onChange={e => setUsername(e.target.value)}
              icon={<Instagram size={14} />}
            />
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <Button
            onClick={analyze}
            loading={loading}
            disabled={!username.trim() || loading}
            icon={<BarChart2 size={16} />}
          >
            {loading ? 'Analizando...' : 'Analizar perfil'}
          </Button>
          <div className="flex items-start gap-2 text-xs text-ink-dim bg-surface border border-border rounded-lg px-3 py-2">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>Si no tenés Apify configurado, el análisis es generado por IA basado en el perfil de la marca</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-danger/10 border border-danger/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-dim border border-violet-600/30 flex items-center justify-center animate-pulse-violet">
            <Instagram size={28} className="text-violet-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink">Analizando @{username.replace('@', '')}...</p>
            <p className="text-xs text-ink-muted mt-1">Puede tardar hasta 30 segundos con datos reales</p>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-6 animate-slide-up">
          {/* Source indicator */}
          <div className="flex items-center gap-2">
            {hasRealData ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={11} className="mr-1" />
                Datos reales via Apify
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <Sparkles size={11} className="mr-1" />
                Análisis IA — sin Apify
              </Badge>
            )}
            <span className="text-xs text-ink-dim">@{analysis.username}</span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Posts analizados" value={String(analysis.postsAnalyzed)} color="violet" />
            <MetricCard label="Engagement promedio" value={analysis.averageEngagement} color="success" />
            <MetricCard label="Frecuencia" value={analysis.postingFrequency} color="blue" />
            <MetricCard label="Tono detectado" value={analysis.tone} color="warning" />
          </div>

          {/* Mix de contenido */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-ink mb-4">Mix de contenido</h3>
            <div className="space-y-3">
              {analysis.contentMix?.map(item => (
                <div key={item.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-ink-muted">{item.type}</span>
                    <span className="text-xs font-medium text-ink">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {analysis.topFormats?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-ink-dim mb-2">Formatos que más funcionan</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.topFormats.map((f, i) => (
                    <Badge key={i} variant="violet" size="sm">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grid de análisis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ListSection
              title="Fortalezas"
              icon={<CheckCircle2 size={16} className="text-success" />}
              items={analysis.strengths}
              variant="success"
            />
            <ListSection
              title="Debilidades"
              icon={<AlertTriangle size={16} className="text-danger" />}
              items={analysis.weaknesses}
              variant="danger"
            />
            <ListSection
              title="Oportunidades"
              icon={<TrendingUp size={16} className="text-violet-400" />}
              items={analysis.opportunities}
              variant="violet"
            />
          </div>

          {/* Plan estratégico */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-ink">Plan de acción</h3>
            </div>
            <ol className="space-y-3">
              {analysis.strategicPlan?.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-violet-dim border border-violet-600/30 flex items-center justify-center text-[10px] font-bold text-violet-light flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-ink-muted leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Ideas de contenido */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-warning" />
              <h3 className="text-sm font-semibold text-ink">Ideas de contenido</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.contentIdeas?.map((idea, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-start gap-2">
                  <Sparkles size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-muted leading-relaxed">{idea}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Voz de marca automática */}
          {voiceAnalysis && (
            <div className="bg-surface border border-violet-600/30 rounded-xl p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-dim flex items-center justify-center">
                    <Mic2 size={14} className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Voz de marca detectada automáticamente</h3>
                    <p className="text-xs text-ink-dim">Basado en el análisis de Instagram</p>
                  </div>
                </div>
                {selectedBrandId && (
                  <Button
                    onClick={saveVoiceToProfile}
                    variant={voiceSaved ? 'secondary' : 'outline'}
                    icon={voiceSaved ? <CheckCheck size={13} /> : <Save size={13} />}
                  >
                    {voiceSaved ? 'Guardado en perfil' : 'Guardar en perfil'}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Tono</p>
                  <p className="text-sm text-ink-muted bg-card rounded-lg p-3">{voiceAnalysis.tone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Cliente ideal</p>
                  <p className="text-sm text-ink-muted bg-card rounded-lg p-3">{voiceAnalysis.idealCustomer}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Frases características</p>
                  <div className="flex flex-wrap gap-1.5">
                    {voiceAnalysis.characteristicPhrases.map((p, i) => (
                      <span key={i} className="text-xs bg-card border border-border rounded-full px-2.5 py-1 text-ink-muted">{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Emojis típicos</p>
                  <p className="text-2xl tracking-widest">{voiceAnalysis.emojis.join(' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Palabras a evitar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {voiceAnalysis.bannedWords.map((w, i) => (
                      <span key={i} className="text-xs bg-danger/10 border border-danger/30 rounded-full px-2.5 py-1 text-danger">{w}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Personalidad</p>
                  <p className="text-sm text-ink-muted bg-card rounded-lg p-3">{voiceAnalysis.brandPersonality}</p>
                </div>
              </div>
            </div>
          )}

          {/* Crecimiento + Explorar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ListSection
              title="Crecer seguidores"
              icon={<Users size={16} className="text-blue-400" />}
              items={analysis.followerGrowthTips}
              variant="default"
            />
            <ListSection
              title="Aparecer en Explorar"
              icon={<ArrowUp size={16} className="text-success" />}
              items={analysis.explorePageStrategy}
              variant="success"
            />
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <EmptyState
          icon={<Instagram size={48} strokeWidth={1} />}
          title="Ingresá un usuario para analizar"
          description="El análisis incluye estrategia, engagement, plan de acción e ideas de contenido adaptadas a la voz de la marca."
        />
      )}
    </div>
  );
}

export default function InstagramPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-ink-muted text-sm">Cargando...</div></div>}>
      <InstagramContent />
    </Suspense>
  );
}
