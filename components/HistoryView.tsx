'use client';

import { useState } from 'react';
import { Account, GeneratedSet } from '@/lib/types';
import IdeaCard from './IdeaCard';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  history: GeneratedSet[];
  onDeleteSet: (id: string) => void;
}

export default function HistoryView({ accounts, history, onDeleteSet }: Props) {
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const filtered = filterAccountId
    ? history.filter((s) => s.accountId === filterAccountId)
    : history;

  const totalIdeas = filtered.reduce((acc, s) => acc + s.ideas.length, 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Ideas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length === 0
              ? 'No hay ideas generadas todavía'
              : `${filtered.length} set${filtered.length !== 1 ? 's'  : ''} · ${totalIdeas} ideas en total`}
          </p>
        </div>

        {/* Filter */}
        {accounts.length > 0 && history.length > 0 && (
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="input-base w-auto min-w-[200px]"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {filterAccountId ? 'Esta cuenta no tiene ideas generadas' : 'Todavía no generaste ninguna idea'}
          </h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Andá al Generador, seleccioná una cuenta y creá tus primeras ideas de video ads.
          </p>
        </div>
      )}

      {/* Sets list */}
      <div className="space-y-4">
        {filtered.map((set) => {
          const account = accountMap[set.accountId];
          if (!account) return null;
          const isExpanded = expandedSetId === set.id;

          return (
            <div key={set.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Set header */}
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {getInitials(account.nombre)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm truncate">{account.nombre}</p>
                      <span className="text-xs text-slate-400">·</span>
                      <p className="text-xs text-slate-500">{account.rubro}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(set.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                    {set.ideas.length} ideas
                  </span>

                  <button
                    onClick={() => setExpandedSetId(isExpanded ? null : set.id)}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    {isExpanded ? 'Ocultar' : 'Ver ideas'}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este set de ideas?')) {
                        onDeleteSet(set.id);
                        if (expandedSetId === set.id) setExpandedSetId(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                    title="Eliminar set"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Ideas grid */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {set.ideas.map((idea, i) => (
                      <IdeaCard key={idea.id} idea={idea} account={account} index={i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
