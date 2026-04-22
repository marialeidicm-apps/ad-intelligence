'use client';
import { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, CheckCircle, X } from 'lucide-react';
import { Brand, ClientMemory, MemoryCategory } from '@/lib/types';
import { getBrands, getClientMemories, saveClientMemory, deleteClientMemory, generateId } from '@/lib/storage';
import { formatRelative } from '@/lib/utils';

const CATEGORIES: { key: MemoryCategory; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { key: 'decision', label: 'Decisiones tomadas', emoji: '✅', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' },
  { key: 'no_gusta', label: 'No le gusta', emoji: '🚫', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-800/30' },
  { key: 'preferencia', label: 'Preferencias', emoji: '⭐', color: 'text-amber-400', bg: 'bg-amber-950/20', border: 'border-amber-800/30' },
  { key: 'acuerdo', label: 'Acuerdos', emoji: '🤝', color: 'text-violet-400', bg: 'bg-violet-dim', border: 'border-violet-600/20' },
];

function MemoryCard({ memory, onDelete }: { memory: ClientMemory; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const cat = CATEGORIES.find(c => c.key === memory.category)!;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cat.border} ${cat.bg} group`}>
      <span className="text-lg flex-shrink-0">{cat.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-muted leading-snug">{memory.content}</p>
        <p className="text-xs text-ink-dim mt-1">{formatRelative(memory.createdAt)}</p>
      </div>
      <div className="flex-shrink-0">
        {confirming ? (
          <div className="flex gap-1">
            <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-300">
              <CheckCircle size={14} />
            </button>
            <button onClick={() => setConfirming(false)} className="p-1 text-ink-dim hover:text-ink">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="p-1 text-ink-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function MemoriaPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [memories, setMemories] = useState<ClientMemory[]>([]);
  const [filterCategory, setFilterCategory] = useState<MemoryCategory | 'all'>('all');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('decision');
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBrands(getBrands());
  }, []);

  useEffect(() => {
    if (selectedBrandId) setMemories(getClientMemories(selectedBrandId));
    else setMemories([]);
  }, [selectedBrandId]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleAdd = async () => {
    if (!newContent.trim() || !selectedBrandId) return;
    const memory: ClientMemory = {
      id: generateId(),
      brandId: selectedBrandId,
      category: newCategory,
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveClientMemory(memory);
    setMemories(getClientMemories(selectedBrandId));
    setNewContent('');
    setAdding(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async (id: string) => {
    await deleteClientMemory(id);
    setMemories(getClientMemories(selectedBrandId));
  };

  const filtered = filterCategory === 'all' ? memories : memories.filter(m => m.category === filterCategory);

  const lastAgreement = memories.find(m => m.category === 'acuerdo');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Brain size={24} className="text-violet-400" />Memoria de Cliente
        </h1>
        <p className="text-ink-dim mt-1">Guardá decisiones, acuerdos y preferencias de cada marca. Para que nada se pierda entre reuniones.</p>
      </div>

      {/* Brand selector */}
      <div className="bg-card border border-border rounded-xl p-5">
        <label className="block text-xs font-medium text-ink-dim mb-1.5">Seleccioná la marca</label>
        <select
          value={selectedBrandId}
          onChange={e => setSelectedBrandId(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
        >
          <option value="">Elegí una marca...</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {selectedBrand && (
        <>
          {/* Último acuerdo */}
          {lastAgreement && (
            <div className="bg-violet-950/30 border border-violet-600/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl">🤝</span>
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase mb-1">Último acuerdo con {selectedBrand.name}</p>
                <p className="text-sm text-ink-muted">{lastAgreement.content}</p>
                <p className="text-xs text-ink-dim mt-1">{formatRelative(lastAgreement.createdAt)}</p>
              </div>
            </div>
          )}

          {/* Stats por categoría */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => {
              const count = memories.filter(m => m.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilterCategory(filterCategory === cat.key ? 'all' : cat.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    filterCategory === cat.key
                      ? `${cat.bg} ${cat.border}`
                      : 'bg-card border-border hover:border-violet-600/20'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.emoji}</span>
                  <p className={`text-lg font-bold ${cat.color}`}>{count}</p>
                  <p className="text-xs text-ink-dim leading-tight">{cat.label}</p>
                </button>
              );
            })}
          </div>

          {/* Add memory */}
          {adding ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-ink">Agregar memoria</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-dim mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-ink-dim mb-1">¿Qué querés recordar?</label>
                  <input
                    type="text"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Ej: Le aprobó el presupuesto para reels en mayo"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-dim focus:outline-none focus:border-violet-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm"
                >
                  {saved ? <><CheckCircle size={14} />Guardado</> : 'Guardar'}
                </button>
                <button
                  onClick={() => { setAdding(false); setNewContent(''); }}
                  className="px-4 py-2 text-ink-dim hover:text-ink text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/20 border border-violet-600/30 text-violet-300 rounded-xl hover:bg-violet-600/30 text-sm font-medium transition-colors w-full justify-center"
            >
              <Plus size={16} />Agregar memoria
            </button>
          )}

          {/* Memories list */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-dim">
              <Brain size={36} className="mx-auto mb-3 text-violet-400/30" />
              <p>{filterCategory === 'all' ? 'Todavía no hay memorias para esta marca.' : 'No hay memorias en esta categoría.'}</p>
              {filterCategory !== 'all' && (
                <button onClick={() => setFilterCategory('all')} className="text-violet-400 text-sm mt-2 hover:text-violet-300">Ver todas</button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filterCategory !== 'all' && (
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-ink-dim">Filtrando por:</p>
                  <button
                    onClick={() => setFilterCategory('all')}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    {CATEGORIES.find(c => c.key === filterCategory)?.label} <X size={10} />
                  </button>
                </div>
              )}
              {CATEGORIES.map(cat => {
                const catMemories = filtered.filter(m => m.category === cat.key);
                if (catMemories.length === 0) return null;
                return (
                  <div key={cat.key} className="space-y-2">
                    <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider flex items-center gap-1.5">
                      {cat.emoji} {cat.label}
                    </p>
                    {catMemories.map(m => (
                      <MemoryCard key={m.id} memory={m} onDelete={() => handleDelete(m.id)} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!selectedBrand && (
        <div className="text-center py-16">
          <Brain size={48} className="text-violet-400/30 mx-auto mb-3" />
          <p className="text-ink-dim">Seleccioná una marca para ver y gestionar sus memorias.</p>
        </div>
      )}
    </div>
  );
}
