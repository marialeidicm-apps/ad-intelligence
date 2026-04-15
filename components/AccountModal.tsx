'use client';

import { useState, useEffect } from 'react';
import { Account, Objetivo } from '@/lib/types';

const RUBROS = [
  'Moda y ropa',
  'Calzado y accesorios',
  'Electrónica y tecnología',
  'Alimentos y bebidas',
  'Cosmética y belleza',
  'Hogar y decoración',
  'Deportes y fitness',
  'Juguetes e infantil',
  'Mascotas y veterinaria',
  'Ferretería y construcción',
  'Librería y papelería',
  'Joyería y bijouterie',
  'Farmacia y salud',
  'Otro',
];

const ACCOUNT_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#db2777', '#7c3aed', '#4f46e5', '#0d9488',
];

function randomColor() {
  return ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];
}

interface Props {
  account?: Account | null;
  onSave: (data: Omit<Account, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function AccountModal({ account, onSave, onClose }: Props) {
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('');
  const [rubroCustom, setRubroCustom] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo>('ventas_tienda');
  const [color] = useState(() => account?.color ?? randomColor());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setNombre(account.nombre);
      const isPreset = RUBROS.slice(0, -1).includes(account.rubro);
      setRubro(isPreset ? account.rubro : 'Otro');
      setRubroCustom(isPreset ? '' : account.rubro);
      setObjetivo(account.objetivo);
    }
  }, [account]);

  function validate() {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    const rubroFinal = rubro === 'Otro' ? rubroCustom.trim() : rubro;
    if (!rubroFinal) e.rubro = 'El rubro es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const rubroFinal = rubro === 'Otro' ? rubroCustom.trim() : rubro;
    onSave({ nombre: nombre.trim(), rubro: rubroFinal, objetivo, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="gradient-brand px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {account ? 'Editar cuenta' : 'Nueva cuenta'}
              </h2>
              <p className="text-violet-200 text-sm mt-0.5">
                {account ? 'Modificá los datos de la cuenta' : 'Agregá un nuevo cliente a tu cartera'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-violet-200 hover:text-white transition-colors p-1 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="label-base">Nombre de la cuenta</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tienda Don Pedro, Moda Luna, TechShop..."
              className={`input-base ${errors.nombre ? 'border-red-300 focus:ring-red-400' : ''}`}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          {/* Rubro */}
          <div>
            <label className="label-base">Rubro / Categoría</label>
            <select
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              className={`input-base ${errors.rubro ? 'border-red-300 focus:ring-red-400' : ''}`}
            >
              <option value="">Seleccioná un rubro...</option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {rubro === 'Otro' && (
              <input
                type="text"
                value={rubroCustom}
                onChange={(e) => setRubroCustom(e.target.value)}
                placeholder="Describí el rubro de la cuenta..."
                className={`input-base mt-2 ${errors.rubro ? 'border-red-300 focus:ring-red-400' : ''}`}
              />
            )}
            {errors.rubro && <p className="text-xs text-red-500 mt-1">{errors.rubro}</p>}
          </div>

          {/* Objetivo */}
          <div>
            <label className="label-base">Objetivo principal</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`relative flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  objetivo === 'ventas_tienda'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="objetivo"
                  value="ventas_tienda"
                  checked={objetivo === 'ventas_tienda'}
                  onChange={() => setObjetivo('ventas_tienda')}
                  className="sr-only"
                />
                <span className="text-2xl">🏪</span>
                <span className="text-sm font-semibold text-slate-800">Ventas en tienda</span>
                <span className="text-xs text-slate-500">Clientes retail que visitan el local</span>
                {objetivo === 'ventas_tienda' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label
                className={`relative flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  objetivo === 'mensajeria_mayorista'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="objetivo"
                  value="mensajeria_mayorista"
                  checked={objetivo === 'mensajeria_mayorista'}
                  onChange={() => setObjetivo('mensajeria_mayorista')}
                  className="sr-only"
                />
                <span className="text-2xl">📦</span>
                <span className="text-sm font-semibold text-slate-800">Mensajería mayorista</span>
                <span className="text-xs text-slate-500">Revendedores y compradores por mayor</span>
                {objetivo === 'mensajeria_mayorista' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              {account ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
