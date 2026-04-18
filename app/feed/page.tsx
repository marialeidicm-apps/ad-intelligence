'use client';
import { useState, useEffect, useRef } from 'react';
import { Brand, FeedItem } from '@/lib/types';
import { getBrands, getFeedItems, saveFeedItem, deleteFeedItem, saveContent, generateId } from '@/lib/storage';
import { buildBrandContext } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Spinner';
import {
  LayoutGrid, Plus, Trash2, MoveUp, MoveDown, Sparkles,
  Image, Video, Layers, Copy, Check, AlertCircle, GripVertical
} from 'lucide-react';

const TYPE_ICONS = {
  foto: <Image size={14} />,
  video: <Video size={14} />,
  carrusel: <Layers size={14} />,
};

const TYPE_COLORS = {
  foto: 'violet',
  video: 'success',
  carrusel: 'warning',
} as const;

export default function FeedPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length > 0) {
      setSelectedBrandId(list[0].id);
      setItems(getFeedItems(list[0].id));
    }
  }, []);

  const handleBrandChange = (id: string) => {
    setSelectedBrandId(id);
    setItems(getFeedItems(id));
  };

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const addItem = (type: FeedItem['type'], name?: string) => {
    if (!selectedBrandId) return;
    const item: FeedItem = {
      id: generateId(),
      brandId: selectedBrandId,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${items.length + 1}`,
      type,
      order: items.length,
    };
    saveFeedItem(item);
    setItems(getFeedItems(selectedBrandId));
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedBrandId) return;
    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      const item: FeedItem = {
        id: generateId(),
        brandId: selectedBrandId,
        name: file.name,
        type: isVideo ? 'video' : 'foto',
        url,
        order: items.length,
      };
      saveFeedItem(item);
    });
    setItems(getFeedItems(selectedBrandId));
    e.target.value = '';
  };

  const moveItem = (id: string, dir: 'up' | 'down') => {
    const newItems = [...items];
    const idx = newItems.findIndex(i => i.id === id);
    if (dir === 'up' && idx > 0) {
      [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    } else if (dir === 'down' && idx < newItems.length - 1) {
      [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    }
    newItems.forEach((item, i) => {
      item.order = i;
      saveFeedItem(item);
    });
    setItems([...newItems]);
  };

  const removeItem = (id: string) => {
    deleteFeedItem(id);
    setItems(getFeedItems(selectedBrandId));
  };

  const generateCopy = async (item: FeedItem) => {
    if (!selectedBrand) return;
    setGeneratingCopy(item.id);
    setError('');

    try {
      const objective = item.type === 'video' ? 'venta con urgencia' : item.type === 'carrusel' ? 'educativo o storytelling' : 'visual con call to action';
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hook',
          brandContext: buildBrandContext(selectedBrand),
          language: selectedBrand.language,
          topic: `copy para ${item.type} de feed llamado "${item.name}"`,
          extraContext: `Generá un copy para publicar en Instagram como ${item.type}. Objetivo: ${objective}.
Respondé con JSON: { "hooks": [{ "text": "<copy completo listo para publicar>", "type": "caption", "why": "..." }] }`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const copy = data.result?.hooks?.[0]?.text || data.result?.rawText || 'Sin copy generado';
      const updatedItem = { ...item, copy };
      saveFeedItem(updatedItem);
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setGeneratingCopy(null);
    }
  };

  const copyCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSuggestedType = (index: number, total: number): string => {
    if (index === 0) return 'Post de impacto — la primera foto define el feed';
    if (index % 4 === 0) return 'Ancla de feed — post estático de alto impacto visual';
    if (index % 3 === 0) return 'Carrusel educativo o storytelling';
    if (index % 2 === 0) return 'Reel corto — prioridad algoritmo';
    return 'Post estático o carrusel';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Armado de Feed</h1>
        <p className="text-sm text-ink-muted mt-1">Organizá el orden, elegí el formato y generá copys para cada pieza</p>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {brands.length > 0 ? (
            <div className="flex-1">
              <Select
                label="Marca"
                value={selectedBrandId}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                onChange={e => handleBrandChange(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm text-ink-muted"><a href="/marcas" className="text-violet-light hover:underline">Creá una marca primero</a></p>
          )}
          <div className="flex gap-2 flex-wrap">
            <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileAdd} />
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => fileRef.current?.click()}>
              Subir archivos
            </Button>
            <Button size="sm" variant="secondary" icon={<Image size={14} />} onClick={() => addItem('foto')}>Foto</Button>
            <Button size="sm" variant="secondary" icon={<Video size={14} />} onClick={() => addItem('video')}>Video</Button>
            <Button size="sm" variant="secondary" icon={<Layers size={14} />} onClick={() => addItem('carrusel')}>Carrusel</Button>
          </div>
        </div>
        {error && (
          <div className="mt-3 bg-danger/10 border border-danger/30 rounded-lg p-2.5 flex items-center gap-2">
            <AlertCircle size={13} className="text-danger" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={48} strokeWidth={1} />}
          title="Feed vacío"
          description="Subí fotos y videos o agregá piezas manualmente. Después generá copys para cada una."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 hover:border-violet-600/20 transition-colors">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {item.url ? (
                    item.type === 'video' ? (
                      <video src={item.url} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <img src={item.url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                    )
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface border border-border flex items-center justify-center text-ink-dim">
                      {TYPE_ICONS[item.type]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-ink-dim">#{idx + 1}</span>
                    <Badge variant={TYPE_COLORS[item.type]} size="sm">{item.type}</Badge>
                    <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                  </div>
                  <p className="text-xs text-ink-dim mb-3">{getSuggestedType(idx, items.length)}</p>

                  {item.copy ? (
                    <div className="bg-surface border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-ink-muted leading-relaxed flex-1">{item.copy}</p>
                        <button
                          onClick={() => copyCopy(item.id, item.copy!)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg bg-card hover:bg-violet-dim border border-border hover:border-violet-600/40 flex items-center justify-center transition-all"
                        >
                          {copiedId === item.id ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-ink-dim" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={generatingCopy === item.id ? undefined : <Sparkles size={13} />}
                      loading={generatingCopy === item.id}
                      onClick={() => generateCopy(item)}
                      disabled={!selectedBrand}
                    >
                      {generatingCopy === item.id ? 'Generando copy...' : 'Generar copy'}
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => moveItem(item.id, 'up')} disabled={idx === 0} className="w-7 h-7 rounded-lg hover:bg-surface flex items-center justify-center text-ink-dim hover:text-ink disabled:opacity-30 transition-colors">
                    <MoveUp size={13} />
                  </button>
                  <button onClick={() => moveItem(item.id, 'down')} disabled={idx === items.length - 1} className="w-7 h-7 rounded-lg hover:bg-surface flex items-center justify-center text-ink-dim hover:text-ink disabled:opacity-30 transition-colors">
                    <MoveDown size={13} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg hover:bg-danger/10 flex items-center justify-center text-ink-dim hover:text-danger transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
