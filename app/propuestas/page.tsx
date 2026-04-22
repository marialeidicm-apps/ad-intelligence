'use client';
import { useState, useEffect } from 'react';
import {
  Building2, Sparkles, Copy, Check, Trash2, ChevronDown, ChevronUp,
  Plus, Minus, DollarSign, Target, Calendar, FileText, Download
} from 'lucide-react';
import { Brand, CommercialProposal, ProposalService } from '@/lib/types';
import { getBrands, getProposals, saveProposal, deleteProposal, generateId } from '@/lib/storage';
import { buildBrandContext, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

const PRESET_SERVICES = [
  { name: 'Community Management Instagram', defaultPrice: 150000 },
  { name: 'Creación de contenido (fotos + reels)', defaultPrice: 120000 },
  { name: 'Estrategia de contenido mensual', defaultPrice: 80000 },
  { name: 'Gestión de publicidad paga (Meta Ads)', defaultPrice: 100000 },
  { name: 'Email marketing', defaultPrice: 70000 },
  { name: 'Análisis y reportes mensuales', defaultPrice: 50000 },
  { name: 'Auditoría de marca completa', defaultPrice: 90000 },
  { name: 'Gestión de TikTok', defaultPrice: 100000 },
  { name: 'Diseño gráfico (pack mensual)', defaultPrice: 80000 },
  { name: 'Consultoría estratégica', defaultPrice: 60000 },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-violet-400 transition-colors" title="Copiar">
      {copied ? <><Check size={12} className="text-success" /> Copiado</> : <><Copy size={12} /> Copiar</>}
    </button>
  );
}

function ProposalCard({ proposal, onDelete }: { proposal: CommercialProposal; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{proposal.brandName}</p>
          <p className="text-xs text-ink-dim mt-0.5">
            ${proposal.totalPrice.toLocaleString()}/mes · {proposal.services.length} servicios · {formatDate(proposal.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-ink-dim hover:text-danger p-1 transition-colors">
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-5 animate-fade-in">
          {/* Servicios */}
          <div>
            <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Servicios incluidos</p>
            <div className="space-y-1.5">
              {proposal.services.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                  <span className="text-sm text-ink">{s.name}</span>
                  <span className="text-sm font-semibold text-violet-light">${s.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-violet-dim border border-violet-600/30 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-ink">Total</span>
                <span className="text-sm font-bold text-violet-light">${proposal.totalPrice.toLocaleString()}/mes</span>
              </div>
            </div>
          </div>

          {/* Análisis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={13} className="text-violet-400" />
              <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Análisis de la marca</p>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed bg-surface rounded-lg p-3">{proposal.brandAnalysis}</p>
          </div>

          {/* Objetivos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={13} className="text-success" />
              <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Objetivos</p>
            </div>
            <ul className="space-y-1">
              {proposal.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 mt-1.5" />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          {/* Plan de trabajo */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} className="text-warning" />
              <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Plan de trabajo</p>
            </div>
            <div className="space-y-2">
              {proposal.workPlan.map((phase, i) => (
                <div key={i} className="bg-surface rounded-lg p-3">
                  <p className="text-xs font-semibold text-warning mb-1.5">{phase.week}</p>
                  <ul className="space-y-1">
                    {phase.tasks.map((t, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-ink-muted">
                        <div className="w-1 h-1 rounded-full bg-ink-dim flex-shrink-0 mt-1.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Propuesta completa */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-violet-400" />
                <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Texto de la propuesta</p>
              </div>
              <CopyButton text={proposal.proposalText} />
            </div>
            <div className="bg-surface rounded-lg p-4">
              <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{proposal.proposalText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropuestasPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [services, setServices] = useState<ProposalService[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);

  useEffect(() => {
    setBrands(getBrands());
    setProposals(getProposals());
  }, []);

  const toggleService = (name: string, defaultPrice: number) => {
    setServices(prev => {
      const exists = prev.find(s => s.name === name);
      if (exists) return prev.filter(s => s.name !== name);
      return [...prev, { id: generateId(), name, description: '', price: defaultPrice, included: true }];
    });
  };

  const updatePrice = (name: string, price: number) => {
    setServices(prev => prev.map(s => s.name === name ? { ...s, price } : s));
  };

  const total = services.reduce((sum, s) => sum + s.price, 0);

  const generate = async () => {
    if (!selectedBrand || services.length === 0) return;
    setLoading(true);
    try {
      const brand = brands.find(b => b.id === selectedBrand);
      const brandContext = brand ? buildBrandContext(brand) : '';

      const res = await fetch('/api/propuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand?.name,
          brandContext,
          services,
          customNote,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newProposal: CommercialProposal = {
        id: generateId(),
        brandId: selectedBrand,
        brandName: brand?.name || '',
        services,
        objectives: data.result.objectives,
        workPlan: data.result.workPlan,
        brandAnalysis: data.result.brandAnalysis,
        proposalText: data.result.proposalText,
        totalPrice: total,
        createdAt: new Date().toISOString(),
      };

      saveProposal(newProposal);
      setProposals(getProposals());
      setServices([]);
      setCustomNote('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-dim flex items-center justify-center">
            <Building2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Propuestas Comerciales</h1>
            <p className="text-sm text-ink-dim">Generá propuestas profesionales listas para enviar a tus clientes</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="mb-4">
          <label className="text-xs font-medium text-ink-dim block mb-1.5">Marca</label>
          <Select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            options={[
              { value: '', label: 'Seleccioná una marca' },
              ...brands.map(b => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>

        {/* Servicios */}
        <div className="mb-4">
          <p className="text-xs font-medium text-ink-dim mb-2">Servicios a ofrecer</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PRESET_SERVICES.map(preset => {
              const selected = services.find(s => s.name === preset.name);
              return (
                <div
                  key={preset.name}
                  className={`rounded-lg border transition-all ${
                    selected
                      ? 'bg-violet-dim border-violet-600/40'
                      : 'bg-surface border-border hover:border-violet-600/30'
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                    onClick={() => toggleService(preset.name, preset.defaultPrice)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'bg-violet-600 border-violet-600' : 'border-border'
                    }`}>
                      {selected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm text-ink flex-1 truncate">{preset.name}</span>
                  </button>
                  {selected && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <DollarSign size={11} className="text-ink-dim" />
                      <input
                        type="number"
                        value={selected.price}
                        onChange={e => updatePrice(preset.name, Number(e.target.value))}
                        className="w-24 bg-transparent text-sm text-violet-light font-semibold outline-none border-b border-violet-600/40"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-xs text-ink-dim">/mes</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {services.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">{services.length} servicios seleccionados</p>
              <p className="text-lg font-bold text-violet-light">${total.toLocaleString()}/mes</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-medium text-ink-dim block mb-1.5">Nota adicional (opcional)</label>
          <Textarea
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder="Ej: Esta propuesta incluye descuento por pago semestral, o mencioná que ya trabajaste con marcas del mismo rubro..."
            rows={2}
          />
        </div>

        <Button
          onClick={generate}
          loading={loading}
          disabled={!selectedBrand || services.length === 0}
          icon={<Sparkles size={15} />}
        >
          {loading ? 'Generando propuesta...' : 'Generar propuesta comercial'}
        </Button>
      </div>

      {/* Historial */}
      {proposals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-dim uppercase tracking-wider mb-3">
            Propuestas generadas ({proposals.length})
          </p>
          <div className="space-y-2">
            {proposals.map(p => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onDelete={() => { deleteProposal(p.id); setProposals(getProposals()); }}
              />
            ))}
          </div>
        </div>
      )}

      {proposals.length === 0 && (
        <div className="text-center py-12 text-ink-dim">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Seleccioná una marca, elegí los servicios y generá tu primera propuesta comercial</p>
        </div>
      )}
    </div>
  );
}
