'use client';
import { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { getBrands, saveContent, generateId } from '@/lib/storage';
import { buildBrandContext } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Spinner';
import {
  FileText, Sparkles, Copy, Check, Download, AlertCircle,
  ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';

type BriefType = 'estrategia_contenido' | 'plan_redes' | 'campana_ads' | 'identidad_marca' | 'propuesta_agencia';

const BRIEF_TYPES: { value: BriefType; label: string; description: string }[] = [
  { value: 'estrategia_contenido', label: 'Estrategia de contenido', description: 'Qué publicar, cuándo y por qué' },
  { value: 'plan_redes', label: 'Plan de redes sociales', description: 'Gestión mensual de Instagram y más' },
  { value: 'campana_ads', label: 'Campaña de publicidad', description: 'Meta Ads o Google Ads en términos simples' },
  { value: 'identidad_marca', label: 'Identidad de marca', description: 'Voz, visual, propuesta de valor' },
  { value: 'propuesta_agencia', label: 'Propuesta de agencia', description: 'Documento completo para presentar al dueño' },
];

interface BriefResult {
  title: string;
  sections: {
    heading: string;
    content: string;
    examples?: string[];
  }[];
  keyMessages: string[];
  nextSteps: string[];
}

export default function BriefPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [briefType, setBriefType] = useState<BriefType>('estrategia_contenido');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length > 0) setSelectedBrandId(list[0].id);
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const selectedType = BRIEF_TYPES.find(t => t.value === briefType);

  const generateBrief = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hook',
          brandContext: buildBrandContext(selectedBrand),
          language: selectedBrand.language,
          topic: `brief de ${selectedType?.label}`,
          extraContext: `Generá un brief profesional de "${selectedType?.label}" para el dueño de la marca.

IMPORTANTE:
- Lenguaje simple, sin jerga de marketing
- Explicar cada concepto con ejemplos reales de otras marcas conocidas (Nike, Apple, Zara, etc.)
- El dueño de la marca NO es experto en marketing
- Cada punto tiene que poder ejecutarse o entenderse inmediatamente
- Vocabulario de dueño de negocio, no de agencia

Respondé SOLO con JSON:
{
  "hooks": [{"text": "placeholder", "type": "brief", "why": ""}],
  "brief": {
    "title": "<título del brief>",
    "sections": [
      {
        "heading": "<título de sección>",
        "content": "<explicación en lenguaje simple>",
        "examples": ["Ejemplo con marca real 1", "Ejemplo 2"]
      }
    ],
    "keyMessages": ["Mensaje clave 1 para que el dueño entienda", "Mensaje 2", "Mensaje 3"],
    "nextSteps": ["Paso concreto 1", "Paso 2", "Paso 3", "Paso 4"]
  }
}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const brief = data.result?.brief || data.result;
      setResult(brief);

      saveContent({
        id: generateId(),
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        type: 'brief',
        title: `Brief: ${selectedType?.label} — ${selectedBrand.name}`,
        content: JSON.stringify(brief),
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = async () => {
    if (!result) return;
    const text = `# ${result.title}\n\n${result.sections?.map(s =>
      `## ${s.heading}\n${s.content}${s.examples?.length ? '\n\nEjemplos:\n' + s.examples.join('\n') : ''}`
    ).join('\n\n')}\n\n## Mensajes clave\n${result.keyMessages?.join('\n')}\n\n## Próximos pasos\n${result.nextSteps?.join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Brief para Dueño de Marca</h1>
        <p className="text-sm text-ink-muted mt-1">Documentos en lenguaje simple, sin términos técnicos, para que el cliente lo entienda y ejecute</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {brands.length > 0 ? (
            <Select
              label="Marca"
              value={selectedBrandId}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              onChange={e => { setSelectedBrandId(e.target.value); setResult(null); }}
            />
          ) : (
            <p className="text-sm text-ink-muted"><a href="/marcas" className="text-violet-light hover:underline">Creá una marca primero</a></p>
          )}
          <Select
            label="Tipo de brief"
            value={briefType}
            options={BRIEF_TYPES.map(t => ({ value: t.value, label: t.label }))}
            onChange={e => { setBriefType(e.target.value as BriefType); setResult(null); }}
          />
        </div>

        {selectedType && (
          <p className="text-xs text-ink-dim mb-4">{selectedType.description}</p>
        )}

        <Button
          onClick={generateBrief}
          loading={loading}
          disabled={!selectedBrandId || loading}
          icon={<FileText size={16} />}
        >
          Generar brief
        </Button>

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
            <FileText size={28} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-ink">Escribiendo brief para {selectedBrand?.name}...</p>
          <p className="text-xs text-ink-muted">En lenguaje simple, listo para presentar</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-ink">{result.title}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={copyBrief}>
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Mensajes clave */}
          {result.keyMessages?.length > 0 && (
            <div className="bg-violet-dim border border-violet-600/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-violet-light mb-3">Lo más importante</p>
              <ul className="space-y-2">
                {result.keyMessages.map((msg, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5 text-xs">→</span>
                    <p className="text-sm text-ink leading-relaxed">{msg}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Secciones */}
          <div className="space-y-3 mb-5">
            {result.sections?.map((section, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-dim border border-violet-600/30 flex items-center justify-center text-[10px] font-bold text-violet-light">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-ink">{section.heading}</span>
                  </div>
                  {expandedSection === i ? <ChevronUp size={14} className="text-ink-dim" /> : <ChevronDown size={14} className="text-ink-dim" />}
                </button>
                {expandedSection === i && (
                  <div className="px-5 pb-4 animate-fade-in">
                    <p className="text-sm text-ink-muted leading-relaxed mb-3">{section.content}</p>
                    {section.examples?.length && (
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wide mb-2">Ejemplos reales</p>
                        <ul className="space-y-1.5">
                          {section.examples.map((ex, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-ink-muted">
                              <BookOpen size={11} className="text-violet-400 flex-shrink-0 mt-0.5" />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Próximos pasos */}
          {result.nextSteps?.length > 0 && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-5">
              <p className="text-xs font-semibold text-success mb-3">Próximos pasos</p>
              <ol className="space-y-2">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-[10px] font-bold text-success flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-ink-muted">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState
          icon={<FileText size={48} strokeWidth={1} />}
          title="Generá un brief en segundos"
          description="El brief usa lenguaje accesible con ejemplos de marcas conocidas. El dueño lo entiende y puede ejecutarlo."
        />
      )}
    </div>
  );
}
