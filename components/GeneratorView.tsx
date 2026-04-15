'use client';

import { useState } from 'react';
import { Account, AdIdea, GeneratedSet } from '@/lib/types';
import IdeaCard from './IdeaCard';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface Props {
  accounts: Account[];
  onGenerate: (account: Account) => GeneratedSet;
  preselectedAccount?: Account | null;
}

export default function GeneratorView({ accounts, onGenerate, preselectedAccount }: Props) {
  const [selectedId, setSelectedId] = useState<string>(preselectedAccount?.id ?? '');
  const [generatedSet, setGeneratedSet] = useState<GeneratedSet | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;

  async function handleGenerate() {
    if (!selectedAccount) return;
    setLoading(true);
    setGeneratedSet(null);
    // Simulate AI "thinking" for UX
    await new Promise((r) => setTimeout(r, 1400));
    const set = onGenerate(selectedAccount);
    setGeneratedSet(set);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Generador de Ideas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Seleccioná una cuenta y generá 5 ideas ganadoras de video ads
        </p>
      </div>

      {/* Account selector card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="label-base">¿Para qué cuenta querés generar ideas?</label>
            {accounts.length === 0 ? (
              <div className="input-base flex items-center text-slate-400 cursor-not-allowed bg-slate-50">
                No tenés cuentas cargadas aún
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setGeneratedSet(null);
                }}
                className="input-base"
              >
                <option value="">Seleccioná una cuenta...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.rubro}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedAccount || loading}
            className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 shadow-sm ${
              !selectedAccount || loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'btn-primary hover:shadow-md active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar 5 ideas
              </>
            )}
          </button>
        </div>

        {/* Selected account preview */}
        {selectedAccount && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: selectedAccount.color }}
            >
              {getInitials(selectedAccount.nombre)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedAccount.nombre}</p>
              <p className="text-xs text-slate-500">
                {selectedAccount.rubro} ·{' '}
                {selectedAccount.objetivo === 'ventas_tienda' ? '🏪 Ventas en tienda' : '📦 Mensajería mayorista'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full gradient-brand animate-ping opacity-20" />
            <div className="relative w-16 h-16 rounded-full gradient-brand flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Creando tus ideas ganadoras...</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Analizando el rubro y objetivo de <strong>{selectedAccount?.nombre}</strong> para generar los mejores
            conceptos de video ads
          </p>
        </div>
      )}

      {/* Empty state (no account selected) */}
      {!loading && !generatedSet && accounts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Seleccioná una cuenta y generá ideas</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Vas a recibir 5 ideas de video ads con hook, formato, script de 30s, caption y CTA listos para usar.
          </p>
        </div>
      )}

      {/* No accounts */}
      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Primero cargá tus cuentas</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Andá a "Cuentas" y agregá tus clientes para poder generar ideas personalizadas.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && generatedSet && selectedAccount && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                5 ideas para <span className="text-gradient">{selectedAccount.nombre}</span>
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Hacé clic en cada idea para ver el script completo. Copiá el brief con un clic.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedSet.ideas.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} account={selectedAccount} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
