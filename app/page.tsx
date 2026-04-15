'use client';

import { useState, useEffect } from 'react';
import { Account, ActiveView, GeneratedSet } from '@/lib/types';
import {
  getAccounts,
  saveAccount,
  updateAccount,
  deleteAccount,
  getHistory,
  saveGeneratedSet,
  deleteGeneratedSet,
} from '@/lib/storage';
import { generateIdeas } from '@/lib/ideaGenerator';
import AccountsView from '@/components/AccountsView';
import GeneratorView from '@/components/GeneratorView';
import HistoryView from '@/components/HistoryView';
import AccountModal from '@/components/AccountModal';

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

const NAV_ITEMS: { id: ActiveView; label: string; emoji: string; desc: string }[] = [
  { id: 'cuentas', label: 'Cuentas', emoji: '🏢', desc: 'Gestioná tu cartera' },
  { id: 'generador', label: 'Generador', emoji: '⚡', desc: 'Creá ideas de ads' },
  { id: 'historial', label: 'Historial', emoji: '📋', desc: 'Ideas guardadas' },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('cuentas');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<GeneratedSet[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Preselected account for generator
  const [preselectedAccount, setPreselectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    setMounted(true);
    setAccounts(getAccounts());
    setHistory(getHistory());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand animate-pulse" />
          <p className="text-slate-500 text-sm">Cargando Ad Intelligence...</p>
        </div>
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleAddAccount() {
    setEditingAccount(null);
    setModalOpen(true);
  }

  function handleEditAccount(account: Account) {
    setEditingAccount(account);
    setModalOpen(true);
  }

  function handleSaveAccount(data: Omit<Account, 'id' | 'createdAt'>) {
    if (editingAccount) {
      const updated = { ...editingAccount, ...data };
      updateAccount(updated);
      setAccounts(getAccounts());
    } else {
      const newAccount: Account = {
        id: uid(),
        createdAt: new Date().toISOString(),
        ...data,
      };
      saveAccount(newAccount);
      setAccounts(getAccounts());
    }
    setModalOpen(false);
    setEditingAccount(null);
  }

  function handleDeleteAccount(id: string) {
    deleteAccount(id);
    setAccounts(getAccounts());
    setHistory(getHistory());
  }

  function handleGoToGenerator(account: Account) {
    setPreselectedAccount(account);
    setActiveView('generador');
    setSidebarOpen(false);
  }

  function handleGenerate(account: Account): GeneratedSet {
    const ideas = generateIdeas(account);
    const set: GeneratedSet = {
      id: uid(),
      accountId: account.id,
      ideas,
      createdAt: new Date().toISOString(),
    };
    saveGeneratedSet(set);
    setHistory(getHistory());
    return set;
  }

  function handleDeleteSet(id: string) {
    deleteGeneratedSet(id);
    setHistory(getHistory());
  }

  function historyCount(accountId: string) {
    return history.filter((s) => s.accountId === accountId).length;
  }

  const totalIdeas = history.reduce((acc, s) => acc + s.ideas.length, 0);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 gradient-brand flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Ad Intelligence</h1>
              <p className="text-violet-300 text-xs mt-0.5">Marketing · Ecommerce</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-white text-lg font-bold leading-none">{accounts.length}</p>
              <p className="text-violet-300 text-xs mt-0.5">cuentas</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className="text-white text-lg font-bold leading-none">{totalIdeas}</p>
              <p className="text-violet-300 text-xs mt-0.5">ideas</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 ${
                activeView === item.id
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-violet-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold leading-none">{item.label}</p>
                <p className={`text-xs mt-0.5 ${activeView === item.id ? 'text-violet-200' : 'text-violet-400'}`}>
                  {item.desc}
                </p>
              </div>
              {activeView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-violet-400 text-xs">
            Tus datos se guardan localmente en este dispositivo.
          </p>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-white border-b border-slate-100 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm">Ad Intelligence</span>
          </div>
          {activeView === 'cuentas' && (
            <button onClick={handleAddAccount} className="p-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {activeView !== 'cuentas' && <div className="w-9" />}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {activeView === 'cuentas' && (
            <AccountsView
              accounts={accounts}
              onAdd={handleAddAccount}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
              onGenerate={handleGoToGenerator}
              historyCount={historyCount}
            />
          )}
          {activeView === 'generador' && (
            <GeneratorView
              accounts={accounts}
              onGenerate={handleGenerate}
              preselectedAccount={preselectedAccount}
            />
          )}
          {activeView === 'historial' && (
            <HistoryView
              accounts={accounts}
              history={history}
              onDeleteSet={handleDeleteSet}
            />
          )}
        </main>
      </div>

      {/* Account Modal */}
      {modalOpen && (
        <AccountModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onClose={() => {
            setModalOpen(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
}
