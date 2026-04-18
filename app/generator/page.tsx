'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brand, GeneratedContent } from '@/lib/types';
import { getBrands, getContent, saveContent, deleteContent, generateId } from '@/lib/storage';
import { buildBrandContext, formatRelative } from '@/lib/utils';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import {
  Sparkles, Copy, Check, Trash2, Zap, FileText, Film,
  ChevronDown, ChevronUp, Store, AlertCircle, RefreshCw
} from 'lucide-react';

type Mode = 'hook' | 'script' | 'script_scene';

const TABS = [
  { id: 'hook', label: 'Solo Hook', icon: <Zap size={14} /> },
  { id: 'script', label: 'Guión', icon: <FileText size={14} /> },
  { id: 'script_scene', label: 'Guión + Escena', icon: <Film size={14} /> },
];

// Hook result component
function HookResult({ hooks }: { hooks: { text: string; type: string; why: string }[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <div className="space-y-3">
      {hooks.map((hook, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4 hover:border-violet-600/40 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-violet-light">#{i + 1}</span>
                <Badge variant="neutral" size="sm">{hook.type}</Badge>
              </div>
              <p className="text-sm text-ink font-medium leading-relaxed mb-2">"{hook.text}"</p>
              <p className="text-xs text-ink-dim">↳ {hook.why}</p>
            </div>
            <button
              onClick={() => copy(hook.text, i)}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-card hover:bg-violet-dim border border-border hover:border-violet-600/40 flex items-center justify-center transition-all"
            >
              {copied === i ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-ink-dim" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Script result component
function ScriptResult({ script }: { script: { duration: string; hook: string; body: string; cta: string; fullScript: string; tips: string[] } }) {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(script.fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <Badge variant="violet">{script.duration}</Badge>
        <Button size="sm" variant="secondary" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={copy}>
          {copied ? 'Copiado' : 'Copiar todo'}
        </Button>
      </div>
      {[
        { label: 'Hook de apertura', content: script.hook, color: 'border-l-violet-600' },
        { label: 'Desarrollo', content: script.body, color: 'border-l-border' },
        { label: 'CTA', content: script.cta, color: 'border-l-success' },
      ].map(s => (
        <div key={s.label} className={`bg-surface border-l-2 ${s.color} pl-4 pr-4 py-3 rounded-r-xl border border-border border-l-0`}>
          <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wider mb-1.5">{s.label}</p>
          <p className="text-sm text-ink leading-relaxed">{s.content}</p>
        </div>
      ))}
      {script.tips?.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-warning mb-2">Tips de grabación</p>
          <ul className="space-y-1">
            {script.tips.map((tip, i) => (
              <li key={i} className="text-xs text-ink-muted flex items-start gap-2">
                <span className="text-warning mt-0.5">→</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Script + Scene result component
function ScriptSceneResult({ data }: { data: { duration: string; scenes: { number: number; duration: string; text: string; visual: string; direction?: string }[]; totalText: string; productionTips: string[] } }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(data.totalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <Badge variant="violet">{data.duration}</Badge>
        <Button size="sm" variant="secondary" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={copy}>
          {copied ? 'Copiado' : 'Copiar guión'}
        </Button>
      </div>
      <div className="space-y-2">
        {data.scenes?.map(scene => (
          <div key={scene.number} className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50">
              <span className="text-xs font-bold text-violet-light">ESCENA {scene.number}</span>
              <Badge variant="neutral" size="sm">{scene.duration}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wider mb-1.5">📝 Texto / Audio</p>
                <p className="text-sm text-ink leading-relaxed">{scene.text}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wider mb-1.5">🎬 Visual</p>
                <p className="text-sm text-ink-muted leading-relaxed">{scene.visual}</p>
                {scene.direction && (
                  <p className="text-xs text-ink-dim mt-1 italic">{scene.direction}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {data.productionTips?.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-warning mb-2">Producción</p>
          <ul className="space-y-1">
            {data.productionTips.map((tip, i) => (
              <li key={i} className="text-xs text-ink-muted flex items-start gap-2">
                <span className="text-warning mt-0.5">→</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GeneratorContent() {
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [mode, setMode] = useState<Mode>('hook');
  const [topic, setTopic] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    const brandParam = searchParams.get('brand');
    if (brandParam && list.find(b => b.id === brandParam)) {
      setSelectedBrandId(brandParam);
    } else if (list.length > 0) {
      setSelectedBrandId(list[0].id);
    }
    setHistory(getContent().filter(c => ['hook', 'script', 'script_scene'].includes(c.type)).slice(0, 20));
  }, [searchParams]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const generate = async () => {
    if (!selectedBrand || !topic.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          brandContext: buildBrandContext(selectedBrand),
          language: selectedBrand.language,
          topic: topic.trim(),
          extraContext: extraContext.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar');

      const modeLabels: Record<Mode, string> = {
        hook: 'Hook',
        script: 'Guión',
        script_scene: 'Guión + Escena',
      };

      const content: GeneratedContent = {
        id: generateId(),
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        type: mode,
        title: `${modeLabels[mode]}: ${topic}`,
        content: JSON.stringify(data.result),
        metadata: { mode },
        createdAt: new Date().toISOString(),
      };

      saveContent(content);
      setResult(content);
      setHistory(getContent().filter(c => ['hook', 'script', 'script_scene'].includes(c.type)).slice(0, 20));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    deleteContent(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const parseResult = (item: GeneratedContent) => {
    try {
      return JSON.parse(item.content);
    } catch {
      return { rawText: item.content };
    }
  };

  const renderResult = (item: GeneratedContent) => {
    const parsed = parseResult(item);
    if (parsed.rawText) {
      return (
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{parsed.rawText}</p>
        </div>
      );
    }
    if (item.type === 'hook' && parsed.hooks) return <HookResult hooks={parsed.hooks} />;
    if (item.type === 'script' && parsed.script) return <ScriptResult script={parsed.script} />;
    if (item.type === 'script_scene' && parsed.scriptWithScenes) return <ScriptSceneResult data={parsed.scriptWithScenes} />;
    return <pre className="text-xs text-ink-muted overflow-auto">{JSON.stringify(parsed, null, 2)}</pre>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Generador de Ideas</h1>
        <p className="text-sm text-ink-muted mt-1">Hooks, guiones y escenas en la voz exacta de cada marca</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel izquierdo: formulario */}
        <div className="lg:col-span-2 space-y-5">
          {/* Modo */}
          <Tabs
            tabs={TABS}
            active={mode}
            onChange={id => setMode(id as Mode)}
          />

          {/* Marca */}
          {brands.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
              <Store size={18} className="text-ink-dim flex-shrink-0" />
              <div>
                <p className="text-sm text-ink">Primero creá una marca</p>
                <a href="/marcas" className="text-xs text-violet-light hover:underline">Ir a Marcas →</a>
              </div>
            </div>
          ) : (
            <Select
              label="Marca"
              value={selectedBrandId}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              onChange={e => setSelectedBrandId(e.target.value)}
            />
          )}

          {/* Tema */}
          <Input
            label="Sobre qué querés generar"
            placeholder={mode === 'hook' ? 'Ej: vestido de verano nueva colección' : 'Ej: cómo usar el producto, promoción, nueva llegada'}
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />

          {/* Contexto extra (colapsable) */}
          <div>
            <button
              onClick={() => setExtraContext(prev => prev === '__show__' ? '' : '__show__')}
              className="text-xs text-ink-dim hover:text-ink-muted flex items-center gap-1 mb-2"
            >
              Contexto adicional (opcional)
              {extraContext === '__show__' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {extraContext !== '__show__' && (
              <Textarea
                placeholder="Precio, temporada, campaña específica, restricciones..."
                rows={3}
                value={extraContext === '__show__' ? '' : extraContext}
                onChange={e => setExtraContext(e.target.value)}
              />
            )}
          </div>

          {/* Perfil de voz preview */}
          {selectedBrand?.voiceProfile.tone && (
            <div className="bg-violet-dim border border-violet-600/20 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-violet-light uppercase tracking-wider mb-1">Voz activa</p>
              <p className="text-xs text-ink-muted line-clamp-2">{selectedBrand.voiceProfile.tone}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={generate}
            loading={loading}
            disabled={!selectedBrandId || !topic.trim() || loading}
            icon={<Sparkles size={16} />}
            size="lg"
            className="w-full"
          >
            {loading ? 'Generando...' : 'Generar'}
          </Button>
        </div>

        {/* Panel derecho: resultado */}
        <div className="lg:col-span-3 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-dim border border-violet-600/30 flex items-center justify-center animate-pulse-violet">
                <Sparkles size={28} className="text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink">Generando en la voz de {selectedBrand?.name}...</p>
                <p className="text-xs text-ink-muted mt-1">Esto tarda unos segundos</p>
              </div>
            </div>
          ) : result ? (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{result.title}</h3>
                  <p className="text-xs text-ink-dim mt-0.5">{result.brandName} · {formatRelative(result.createdAt)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RefreshCw size={13} />}
                  onClick={generate}
                  loading={loading}
                >
                  Regenerar
                </Button>
              </div>
              {renderResult(result)}
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles size={40} strokeWidth={1} />}
              title="Listo para generar"
              description="Elegí el modo, la marca y el tema. En segundos tenés contenido listo para publicar."
            />
          )}

          {/* Historial */}
          {history.length > 0 && (
            <div>
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors mb-3"
              >
                {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Generados recientes ({history.length})
              </button>
              {historyOpen && (
                <div className="space-y-2 animate-fade-in">
                  {history.map(item => (
                    <div key={item.id} className="bg-surface border border-border rounded-xl p-3 flex items-start justify-between gap-3 hover:border-violet-600/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="violet" size="sm">{item.type === 'hook' ? 'Hook' : item.type === 'script' ? 'Guión' : 'G+E'}</Badge>
                          <span className="text-[10px] text-ink-dim">{item.brandName} · {formatRelative(item.createdAt)}</span>
                        </div>
                        <p className="text-xs text-ink truncate">{item.title}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setResult(item)}
                          className="text-[10px] text-violet-light hover:text-violet-400 px-2 py-1 rounded transition-colors"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="w-6 h-6 rounded hover:bg-danger/10 flex items-center justify-center text-ink-dim hover:text-danger transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-ink-muted text-sm">Cargando...</div></div>}>
      <GeneratorContent />
    </Suspense>
  );
}
