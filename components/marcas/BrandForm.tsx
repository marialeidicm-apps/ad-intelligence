'use client';
import { useState } from 'react';
import { Brand, SocialNetwork } from '@/lib/types';
import { generateId } from '@/lib/storage';
import {
  COUNTRIES, LANGUAGES, SOCIAL_NETWORKS, ECOMMERCE_PLATFORMS,
  OBJECTIVES, INDUSTRIES, BRAND_COLORS
} from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface BrandFormProps {
  initial?: Brand;
  onSave: (brand: Brand) => void;
  onCancel: () => void;
}

const DEFAULT_VOICE: Brand['voiceProfile'] = {
  tone: '',
  characteristicPhrases: '',
  bannedWords: '',
  emojis: '',
  idealCustomer: '',
};

export function BrandForm({ initial, onSave, onCancel }: BrandFormProps) {
  const [form, setForm] = useState<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initial?.name ?? '',
    industry: initial?.industry ?? '',
    country: initial?.country ?? 'AR',
    language: initial?.language ?? 'es_rioplatense',
    regionalVariant: initial?.regionalVariant ?? '',
    socialNetworks: initial?.socialNetworks ?? ['instagram'],
    ecommercePlatform: initial?.ecommercePlatform ?? 'tiendanube',
    objective: initial?.objective ?? 'ventas_tienda',
    voiceProfile: initial?.voiceProfile ?? DEFAULT_VOICE,
    instagramUsername: initial?.instagramUsername ?? '',
    storeUrl: initial?.storeUrl ?? '',
    logoColor: initial?.logoColor ?? BRAND_COLORS[0],
  });

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));
  const setVoice = (key: string, value: string) => setForm(f => ({
    ...f,
    voiceProfile: { ...f.voiceProfile, [key]: value }
  }));

  const toggleNetwork = (net: SocialNetwork) => {
    set('socialNetworks', form.socialNetworks.includes(net)
      ? form.socialNetworks.filter(n => n !== net)
      : [...form.socialNetworks, net]
    );
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.industry) return;
    const now = new Date().toISOString();
    onSave({
      ...form,
      id: initial?.id ?? generateId(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const valid = form.name.trim() && form.industry;

  return (
    <div className="p-6 space-y-8">
      {/* Identidad */}
      <section>
        <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-widest mb-4">Identidad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de la marca"
            placeholder="Ej: Lola Indumentaria"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
          <Select
            label="Rubro"
            value={form.industry}
            options={INDUSTRIES.map(i => ({ value: i, label: i }))}
            placeholder="Seleccioná un rubro"
            onChange={e => set('industry', e.target.value)}
          />
          <Select
            label="País"
            value={form.country}
            options={COUNTRIES}
            onChange={e => set('country', e.target.value)}
          />
          <Select
            label="Idioma / variante"
            value={form.language}
            options={LANGUAGES}
            onChange={e => set('language', e.target.value)}
          />
          <Input
            label="Instagram"
            placeholder="@nombre_marca"
            value={form.instagramUsername}
            onChange={e => set('instagramUsername', e.target.value)}
          />
          <Select
            label="Plataforma de ecommerce"
            value={form.ecommercePlatform}
            options={ECOMMERCE_PLATFORMS}
            onChange={e => set('ecommercePlatform', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label="URL de la tienda"
              placeholder="Ej: mitienda.mitiendanube.com o mitienda.myshopify.com"
              value={form.storeUrl}
              onChange={e => set('storeUrl', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Color */}
      <section>
        <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-widest mb-3">Color de la marca</h3>
        <div className="flex gap-2 flex-wrap">
          {BRAND_COLORS.map(color => (
            <button
              key={color}
              onClick={() => set('logoColor', color)}
              className={`w-8 h-8 rounded-full transition-all ${form.logoColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={form.logoColor}
            onChange={e => set('logoColor', e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0"
            title="Color personalizado"
          />
        </div>
      </section>

      {/* Objetivo */}
      <section>
        <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-widest mb-3">Objetivo principal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OBJECTIVES.map(obj => (
            <button
              key={obj.value}
              onClick={() => set('objective', obj.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                form.objective === obj.value
                  ? 'border-violet-600 bg-violet-dim'
                  : 'border-border hover:border-border bg-surface'
              }`}
            >
              <p className={`text-sm font-semibold ${form.objective === obj.value ? 'text-violet-light' : 'text-ink'}`}>
                {obj.label}
              </p>
              <p className="text-xs text-ink-dim mt-0.5">{obj.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Redes sociales */}
      <section>
        <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-widest mb-3">Redes sociales</h3>
        <div className="flex gap-2 flex-wrap">
          {SOCIAL_NETWORKS.map(net => (
            <button
              key={net.value}
              onClick={() => toggleNetwork(net.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                form.socialNetworks.includes(net.value)
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-border text-ink-muted hover:border-violet-600/50 hover:text-ink'
              }`}
            >
              {net.label}
            </button>
          ))}
        </div>
      </section>

      {/* Voz de marca */}
      <section>
        <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-widest mb-4">Perfil de voz</h3>
        <div className="space-y-4">
          <Textarea
            label="Tono general"
            placeholder="Ej: Cercano, divertido, con autoridad en moda pero sin dársela de experto"
            rows={2}
            value={form.voiceProfile.tone}
            onChange={e => setVoice('tone', e.target.value)}
          />
          <Textarea
            label="Frases características"
            placeholder="Ej: 'Esto es para vos', 'Lo que siempre quisiste', frases que la marca repite"
            rows={2}
            value={form.voiceProfile.characteristicPhrases}
            onChange={e => setVoice('characteristicPhrases', e.target.value)}
          />
          <Input
            label="Palabras que NUNCA usa"
            placeholder="Ej: barato, económico, oferta, descuentazo"
            value={form.voiceProfile.bannedWords}
            onChange={e => setVoice('bannedWords', e.target.value)}
          />
          <Input
            label="Emojis que usa (o ninguno)"
            placeholder="Ej: ✨ 🖤 💜 — o 'ninguno'"
            value={form.voiceProfile.emojis}
            onChange={e => setVoice('emojis', e.target.value)}
          />
          <Textarea
            label="Cliente ideal"
            placeholder="Ej: Mujer de 25-35 años, trabaja, tiene poder adquisitivo medio-alto, le importa la estética"
            rows={2}
            value={form.voiceProfile.idealCustomer}
            onChange={e => setVoice('idealCustomer', e.target.value)}
          />
        </div>
      </section>

      {/* Acciones */}
      <div className="flex gap-3 pt-2 pb-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!valid} className="flex-1">
          {initial ? 'Guardar cambios' : 'Agregar marca'}
        </Button>
      </div>
    </div>
  );
}
