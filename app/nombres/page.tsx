'use client';
import { useState, useEffect } from 'react';
import { Package, Sparkles, Copy, Check, Trash2, ChevronDown, ChevronUp, Instagram, Play } from 'lucide-react';
import { Brand, ProductCopyResult } from '@/lib/types';
import { getBrands, getProductCopys, saveProductCopy, deleteProductCopy, generateId } from '@/lib/storage';
import { buildBrandContext } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-ink-dim hover:text-violet-400 transition-colors p-1" title="Copiar">
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

function ResultCard({ result, onDelete }: { result: ProductCopyResult; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{result.names[0] || 'Sin nombre'}</p>
          <p className="text-xs text-ink-dim truncate mt-0.5">{result.productDescription.slice(0, 60)}...</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="text-ink-dim hover:text-danger p-1 transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-5 animate-fade-in">
          {/* Nombres */}
          <Section title="Nombres del producto" icon={<Package size={14} className="text-violet-400" />}>
            <div className="grid grid-cols-1 gap-2">
              {result.names.map((n, i) => (
                <div key={i} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                  <span className="text-sm text-ink font-medium">{n}</span>
                  <CopyButton text={n} />
                </div>
              ))}
            </div>
          </Section>

          {/* Fichas */}
          <Section title="Descripciones para ficha" icon={<Package size={14} className="text-success" />}>
            {result.productDescriptions.map((d, i) => (
              <div key={i} className="bg-surface rounded-lg p-3 relative group">
                <p className="text-sm text-ink-muted leading-relaxed pr-6">{d}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={d} />
                </div>
              </div>
            ))}
          </Section>

          {/* Instagram */}
          <Section title="Copys para Instagram" icon={<Instagram size={14} className="text-pink-400" />}>
            {result.instagramCopys.map((c, i) => (
              <div key={i} className="bg-surface rounded-lg p-3 relative group">
                <p className="text-sm text-ink-muted leading-relaxed pr-6 whitespace-pre-wrap">{c}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={c} />
                </div>
              </div>
            ))}
          </Section>

          {/* Hooks */}
          <Section title="Hooks para video" icon={<Play size={14} className="text-warning" />}>
            {result.videoHooks.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2.5">
                <p className="text-sm font-medium text-ink">{h}</p>
                <CopyButton text={h} />
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function NombresPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductCopyResult[]>([]);

  useEffect(() => {
    setBrands(getBrands());
    setResults(getProductCopys());
  }, []);

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const brand = brands.find(b => b.id === selectedBrand);
      const brandContext = brand ? buildBrandContext(brand) : '';

      const res = await fetch('/api/nombres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription: description, brandContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newResult: ProductCopyResult = {
        id: generateId(),
        productDescription: description,
        brandId: selectedBrand || undefined,
        brandName: brand?.name,
        ...data.result,
        createdAt: new Date().toISOString(),
      };

      saveProductCopy(newResult);
      setResults(getProductCopys());
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteProductCopy(id);
    setResults(getProductCopys());
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-dim flex items-center justify-center">
            <Package size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Nombres y Copys de Producto</h1>
            <p className="text-sm text-ink-dim">Generá nombres, fichas, copys de Instagram y hooks para tus productos</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
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
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-ink-dim block mb-1.5">Descripción del producto</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Serum facial hidratante con ácido hialurónico, vitamina C y colágeno marino. Para piel seca y madura. Textura gel ligera, absorción rápida. No comedogénico, testeado dermatológicamente..."
            rows={4}
          />
          <p className="text-xs text-ink-dim mt-1">Cuanto más detallada la descripción, mejores los resultados</p>
        </div>

        <Button
          onClick={generate}
          loading={loading}
          disabled={!description.trim()}
          icon={<Sparkles size={15} />}
        >
          {loading ? 'Generando...' : 'Generar nombres y copys'}
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider mb-3">
            Generaciones anteriores ({results.length})
          </p>
          <div className="space-y-2">
            {results.map(r => (
              <ResultCard key={r.id} result={r} onDelete={() => handleDelete(r.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-ink-dim">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Describí tu producto y generá nombres, fichas y copys en segundos</p>
        </div>
      )}
    </div>
  );
}
