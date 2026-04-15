'use client';

import { Account } from '@/lib/types';

const OBJETIVO_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  ventas_tienda: { label: 'Tienda', emoji: '🏪', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  mensajeria_mayorista: { label: 'Mayorista', emoji: '📦', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

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
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onGenerate: (account: Account) => void;
  historyCount: (accountId: string) => number;
}

export default function AccountsView({ accounts, onAdd, onEdit, onDelete, onGenerate, historyCount }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Cuentas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {accounts.length === 0
              ? 'Todavía no tenés cuentas cargadas'
              : `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} en tu cartera`}
          </p>
        </div>
        <button onClick={onAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva cuenta
        </button>
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center mb-5 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Empezá agregando tu primera cuenta</h2>
          <p className="text-slate-500 max-w-sm mb-6">
            Cargá los datos de tus clientes para empezar a generar ideas de video ads personalizadas.
          </p>
          <button onClick={onAdd} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar primera cuenta
          </button>
        </div>
      )}

      {/* Grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const obj = OBJETIVO_LABEL[account.objetivo];
            const count = historyCount(account.id);
            return (
              <div key={account.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-hover group">
                {/* Color strip */}
                <div className="h-1.5" style={{ backgroundColor: account.color }} />

                <div className="p-5">
                  {/* Avatar + info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                      style={{ backgroundColor: account.color }}
                    >
                      {getInitials(account.nombre)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{account.nombre}</h3>
                      <p className="text-sm text-slate-500 truncate">{account.rubro}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${obj.color}`}>
                      {obj.emoji} {obj.label}
                    </span>
                    {count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                        {count} set{count !== 1 ? 's' : ''} de ideas
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onGenerate(account)}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm py-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generar ideas
                    </button>
                    <button
                      onClick={() => onEdit(account)}
                      className="btn-secondary px-3 py-2 text-sm"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la cuenta "${account.nombre}" y todo su historial?`)) {
                          onDelete(account.id);
                        }
                      }}
                      className="btn-danger px-3 py-2 text-sm"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
