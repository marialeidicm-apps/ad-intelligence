'use client';
import { useState, useEffect } from 'react';
import { Palette, Download, Copy, CheckCircle, FileJson, Layers } from 'lucide-react';
import { Brand, GeneratedContent } from '@/lib/types';
import { getBrands, getContent } from '@/lib/storage';

type ExportSource = 'brief' | 'audit' | 'instagram_analysis' | 'calendar_ideas';

const SOURCE_LABELS: Record<ExportSource, string> = {
  brief: 'Brief',
  audit: 'Auditoría de marca',
  instagram_analysis: 'Análisis de Instagram',
  calendar_ideas: 'Ideas de calendario',
};

const CANVA_TEMPLATES: Record<ExportSource, { slides: string[]; colors: string[] }> = {
  brief: {
    slides: ['Portada - Nombre de marca + fecha', 'Perfil de la marca', 'Voz y tono', 'Objetivos', 'Estrategia de contenidos', 'Próximos pasos'],
    colors: ['#7C3AED', '#1E1B2E', '#F3F0FF', '#A78BFA'],
  },
  audit: {
    slides: ['Portada - Auditoría', 'Score general', 'Puntos fuertes', 'Áreas de mejora', 'Quick wins', 'Plan de acción'],
    colors: ['#7C3AED', '#1E1B2E', '#F3F0FF', '#34D399'],
  },
  instagram_analysis: {
    slides: ['Portada - Instagram', 'Métricas clave', 'Mix de contenido', 'Fortalezas y debilidades', 'Plan de contenidos', 'Ideas para la semana'],
    colors: ['#E1306C', '#1E1B2E', '#FFF0F7', '#F77737'],
  },
  calendar_ideas: {
    slides: ['Portada - Calendario', 'Ideas del mes', 'Efemérides clave', 'Contenidos sugeridos', 'Cronograma'],
    colors: ['#7C3AED', '#1E1B2E', '#F3F0FF', '#FCD34D'],
  },
};

function buildCanvaJson(brand: Brand, content: GeneratedContent, source: ExportSource) {
  const template = CANVA_TEMPLATES[source];
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(content.content); } catch { parsed = { content: content.content }; }

  return {
    meta: {
      brand: brand.name,
      type: SOURCE_LABELS[source],
      date: new Date().toLocaleDateString('es-AR'),
      generatedBy: 'Ad Intelligence',
    },
    design: {
      colors: template.colors,
      font: 'Inter',
      style: 'professional-dark',
    },
    slides: template.slides.map((title, i) => ({
      slideNumber: i + 1,
      title,
      content: i === 0 ? `${brand.name} — ${SOURCE_LABELS[source]}` : `[Completar con datos de la sección: ${title}]`,
    })),
    rawData: parsed,
    instructions: [
      '1. Abrí Canva y creá una presentación nueva (16:9)',
      `2. Usá los colores: ${template.colors.join(', ')}`,
      '3. Fuente recomendada: Inter o DM Sans',
      `4. La presentación tiene ${template.slides.length} slides`,
      '5. El campo "rawData" contiene todo el contenido para copiar en cada slide',
    ],
  };
}

export default function CanvaPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [source, setSource] = useState<ExportSource>('brief');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [availableContent, setAvailableContent] = useState<GeneratedContent[]>([]);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setBrands(getBrands());
  }, []);

  useEffect(() => {
    if (selectedBrandId && source) {
      const content = getContent().filter(c => c.brandId === selectedBrandId && c.type === source);
      setAvailableContent(content);
      setSelectedContentId(content[0]?.id || '');
    }
  }, [selectedBrandId, source]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const selectedContent = availableContent.find(c => c.id === selectedContentId);

  const getJson = () => {
    if (!selectedBrand || !selectedContent) return null;
    return buildCanvaJson(selectedBrand, selectedContent, source);
  };

  const handleDownload = () => {
    const json = getJson();
    if (!json) return;
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrand!.name}-${source}-canva.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleCopy = async () => {
    const json = getJson();
    if (!json) return;
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(selectedContent!.content); } catch { parsed = {}; }
    const text = `=== ${selectedBrand!.name} — ${SOURCE_LABELS[source]} ===\n\n${JSON.stringify(parsed, null, 2)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const template = CANVA_TEMPLATES[source];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Palette size={24} className="text-violet-400" />Export a Canva
        </h1>
        <p className="text-ink-dim mt-1">Exportá los briefs y reportes en JSON estructurado listo para armar en Canva.</p>
      </div>

      {/* Config */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Marca</label>
            <select
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              <option value="">Elegí una marca...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Tipo de contenido</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value as ExportSource)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
            >
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-dim mb-1.5">Item generado</label>
            <select
              value={selectedContentId}
              onChange={e => setSelectedContentId(e.target.value)}
              disabled={availableContent.length === 0}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500 disabled:opacity-50"
            >
              {availableContent.length === 0
                ? <option>Sin contenido guardado</option>
                : availableContent.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {new Date(c.createdAt).toLocaleDateString('es-AR')}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Template info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-ink-dim uppercase">Estructura de slides</p>
          <div className="space-y-2">
            {template.slides.map((slide, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded bg-violet-dim text-violet-400 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-ink-muted">{slide}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-dim uppercase mb-2">Paleta de colores</p>
            <div className="flex gap-2">
              {template.colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg border border-border" style={{ background: color }} />
                  <span className="text-[10px] text-ink-dim">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-ink-dim uppercase">Cómo usar en Canva</p>
          <ol className="space-y-3">
            {[
              { step: 1, text: 'Descargá el JSON con el botón de abajo' },
              { step: 2, text: 'Abrí Canva y creá una presentación nueva (16:9)' },
              { step: 3, text: `Usá los colores de la paleta` },
              { step: 4, text: 'Creá una slide por cada sección del JSON' },
              { step: 5, text: 'Copiá el contenido de "rawData" en cada slide' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-2 text-sm text-ink-muted">
                <span className="w-5 h-5 rounded-full bg-violet-dim border border-violet-600/30 text-violet-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
                {text}
              </li>
            ))}
          </ol>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDownload}
              disabled={!selectedContent}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {downloaded ? <><CheckCircle size={14} />¡Descargado!</> : <><FileJson size={14} />Descargar JSON</>}
            </button>
            <button
              onClick={handleCopy}
              disabled={!selectedContent}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-ink rounded-lg hover:bg-white/[0.04] disabled:opacity-50 text-sm transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* JSON preview */}
      {selectedContent && selectedBrand && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-ink-dim uppercase mb-3 flex items-center gap-2">
            <Layers size={12} />Preview del JSON exportado
          </p>
          <pre className="text-xs text-ink-dim overflow-auto max-h-64 bg-surface rounded-lg p-3 leading-relaxed">
            {JSON.stringify(buildCanvaJson(selectedBrand, selectedContent, source), null, 2)}
          </pre>
        </div>
      )}

      {!selectedBrand && (
        <div className="text-center py-12 text-ink-dim">
          <Palette size={40} className="mx-auto mb-3 text-violet-400/40" />
          <p>Seleccioná una marca y un tipo de contenido para exportar</p>
        </div>
      )}
    </div>
  );
}
