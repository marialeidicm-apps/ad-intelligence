'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brand, GeneratedContent } from '@/lib/types';
import { getBrands, saveBrand, deleteBrand, getContentByBrand } from '@/lib/storage';
import { formatRelative } from '@/lib/utils';
import { BrandCard } from '@/components/marcas/BrandCard';
import { BrandForm } from '@/components/marcas/BrandForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Plus, Store, Trash2, Clock, Sparkles, BarChart2, Search, X } from 'lucide-react';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  hook: 'Hook',
  script: 'Guión',
  script_scene: 'Guión + Escena',
  audit: 'Auditoría',
  brief: 'Brief',
  feed_copy: 'Copy de Feed',
  instagram_analysis: 'Análisis IG',
  calendar_ideas: 'Ideas Calendario',
};

export default function MarcasPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | undefined>();
  const [historyBrand, setHistoryBrand] = useState<Brand | undefined>();
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    const counts: Record<string, number> = {};
    list.forEach(b => { counts[b.id] = getContentByBrand(b.id).length; });
    setContentCounts(counts);
    setLoaded(true);
  }, []);

  const handleSave = (brand: Brand) => {
    saveBrand(brand);
    const list = getBrands();
    setBrands(list);
    const counts: Record<string, number> = { ...contentCounts };
    counts[brand.id] = getContentByBrand(brand.id).length;
    setContentCounts(counts);
    setFormOpen(false);
    setEditBrand(undefined);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteBrand(id);
      setBrands(getBrands());
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleViewHistory = (brand: Brand) => {
    setHistoryBrand(brand);
    setHistory(getContentByBrand(brand.id));
  };

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.industry.toLowerCase().includes(search.toLowerCase())
  );

  if (!loaded) return (
    <div className="flex items-center justify-center h-96">
      <Spinner text="Cargando marcas..." />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Marcas</h1>
          <p className="text-sm text-ink-muted mt-1">
            {brands.length === 0 ? 'Todavía no hay ninguna' : `${brands.length} marca${brands.length > 1 ? 's' : ''} activa${brands.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => { setEditBrand(undefined); setFormOpen(true); }}
          className="self-start sm:self-auto"
        >
          Nueva marca
        </Button>
      </div>

      {/* Search */}
      {brands.length > 3 && (
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            type="text"
            placeholder="Buscar marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface border border-border text-ink text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-violet-600/40 focus:border-violet-600 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Grid de marcas */}
      {filtered.length === 0 ? (
        brands.length === 0 ? (
          <EmptyState
            icon={<Store size={48} strokeWidth={1} />}
            title="Agregá tu primera marca"
            description="Toda la inteligencia de contenido arranca acá. Cargá la marca con su voz, rubro y objetivo."
            action={
              <Button icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
                Agregar marca
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Search size={32} strokeWidth={1} />}
            title="Sin resultados"
            description={`No encontré ninguna marca que coincida con "${search}"`}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(brand => (
            <div key={brand.id} className="relative">
              {deleteConfirm === brand.id && (
                <div className="absolute -top-2 left-0 right-0 z-10 bg-danger/10 border border-danger/30 rounded-xl p-3 text-center animate-fade-in">
                  <p className="text-xs text-danger mb-2">¿Segura? Se borra todo.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs text-ink-muted hover:text-ink px-2 py-1 rounded">Cancelar</button>
                    <button onClick={() => handleDelete(brand.id)} className="text-xs bg-danger text-white px-3 py-1 rounded-lg">Borrar</button>
                  </div>
                </div>
              )}
              <BrandCard
                brand={brand}
                contentCount={contentCounts[brand.id] ?? 0}
                onEdit={b => { setEditBrand(b); setFormOpen(true); }}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                onAnalyze={b => router.push(`/instagram?brand=${b.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal: formulario */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditBrand(undefined); }}
        title={editBrand ? `Editando: ${editBrand.name}` : 'Nueva marca'}
        subtitle={editBrand ? undefined : 'Completá el perfil para generar contenido en su voz'}
        size="lg"
      >
        <BrandForm
          initial={editBrand}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditBrand(undefined); }}
        />
      </Modal>

      {/* Modal: historial */}
      <Modal
        open={!!historyBrand}
        onClose={() => { setHistoryBrand(undefined); setHistory([]); }}
        title={`Historial: ${historyBrand?.name}`}
        subtitle={`${history.length} contenido${history.length !== 1 ? 's' : ''} generado${history.length !== 1 ? 's' : ''}`}
        size="lg"
      >
        <div className="p-6">
          {history.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={32} strokeWidth={1} />}
              title="Todavía no hay nada generado"
              description="Usá el Generador para crear hooks, guiones o auditorías para esta marca."
              action={
                <Button size="sm" variant="outline" onClick={() => {
                  setHistoryBrand(undefined);
                  router.push(`/generator?brand=${historyBrand?.id}`);
                }}>
                  Ir al Generador
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="bg-surface border border-border rounded-xl p-4 hover:border-violet-600/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="violet" size="sm">{CONTENT_TYPE_LABELS[item.type] ?? item.type}</Badge>
                      <span className="text-xs text-ink-dim">{formatRelative(item.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-ink mb-1">{item.title}</p>
                  <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed">{item.content.slice(0, 200)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
