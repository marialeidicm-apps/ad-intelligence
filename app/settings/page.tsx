'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Settings, Bell, Key, Palette, Save, Check, Eye, EyeOff,
  Smartphone, Wifi, WifiOff, Upload, X, Sun, Moon, TestTube2, Send
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types';
import { getSettings, saveSettings } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/lib/theme-context';

type TabId = 'agencia' | 'notificaciones' | 'apis' | 'apariencia';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'agencia', label: 'Mi Agencia', icon: <Palette size={14} /> },
  { id: 'notificaciones', label: 'WhatsApp', icon: <Bell size={14} /> },
  { id: 'apis', label: 'APIs', icon: <Key size={14} /> },
  { id: 'apariencia', label: 'Apariencia', icon: <Sun size={14} /> },
];

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
      ok
        ? 'text-success bg-success/10 border-success/30'
        : 'text-ink-dim bg-card border-border'
    }`}>
      {ok ? <Wifi size={10} /> : <WifiOff size={10} />}
      {label}
    </span>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••••••••••'}
        className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-dim outline-none focus:border-violet-600/60 pr-10 font-mono"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabId>('agencia');
  const [saved, setSaved] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNested = <K extends keyof AppSettings>(parent: K, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] as Record<string, unknown>), [key]: value },
    }));
  };

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => update('agencyLogo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const testWhatsApp = async () => {
    setTestingWa(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.whatsappNumber,
          message: '✅ Ad Intelligence: Test de conexión exitoso. Tu configuración de WhatsApp está funcionando correctamente.',
          twilioSid: settings.apiKeys.twilioSid,
          twilioToken: settings.apiKeys.twilioToken,
          twilioWhatsapp: settings.apiKeys.twilioWhatsapp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ ok: true, msg: 'Mensaje enviado correctamente' });
      } else {
        setTestResult({ ok: false, msg: data.error || 'Error al enviar' });
      }
    } catch {
      setTestResult({ ok: false, msg: 'Error de conexión' });
    } finally {
      setTestingWa(false);
    }
  };

  const hasAnthropicKey = !!settings.apiKeys.anthropic || !!process.env.NEXT_PUBLIC_HAS_ANTHROPIC;
  const hasApifyKey = !!settings.apiKeys.apify;
  const hasTwilioKeys = !!settings.apiKeys.twilioSid && !!settings.apiKeys.twilioToken;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-dim flex items-center justify-center">
            <Settings size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Configuración</h1>
            <p className="text-sm text-ink-dim">Personalizá Ad Intelligence para tu agencia</p>
          </div>
        </div>
        <Button onClick={save} icon={saved ? <Check size={15} /> : <Save size={15} />} variant={saved ? 'secondary' : 'primary'}>
          {saved ? 'Guardado' : 'Guardar'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-dim text-violet-light border border-violet-600/30'
                : 'text-ink-dim hover:text-ink'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Mi Agencia */}
      {activeTab === 'agencia' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Datos de tu agencia</h2>

            <div className="mb-4">
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Nombre de la agencia</label>
              <Input
                value={settings.agencyName}
                onChange={e => update('agencyName', e.target.value)}
                placeholder="Ej: Marketing Studio, tu nombre, etc."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Logo de la agencia</label>
              <div className="flex items-center gap-4">
                {settings.agencyLogo ? (
                  <div className="relative">
                    <img
                      src={settings.agencyLogo}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-cover border border-border"
                    />
                    <button
                      onClick={() => update('agencyLogo', null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-violet-600/40 transition-colors"
                  >
                    <Upload size={20} className="text-ink-dim" />
                  </div>
                )}
                <div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm text-violet-400 hover:text-violet-light"
                  >
                    {settings.agencyLogo ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p className="text-xs text-ink-dim mt-0.5">PNG, JPG o SVG. Máximo 2MB.</p>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {activeTab === 'notificaciones' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-1">Notificaciones por WhatsApp</h2>
            <p className="text-xs text-ink-dim mb-4">Recibí alertas importantes de tu agencia directo en WhatsApp</p>

            <div className="mb-4">
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Tu número de WhatsApp</label>
              <Input
                value={settings.whatsappNumber}
                onChange={e => update('whatsappNumber', e.target.value)}
                placeholder="+54 9 11 1234 5678"
                icon={<Smartphone size={14} />}
              />
              <p className="text-xs text-ink-dim mt-1">Incluí el código de país (ej: +54 para Argentina)</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-ink-dim">¿Qué alertas querés recibir?</p>
              {[
                { key: 'urgentBrands', label: 'Marcas que necesitan atención urgente', desc: 'Cuando una marca tiene score bajo o sin actividad reciente' },
                { key: 'upcomingDates', label: 'Fechas clave próximas', desc: 'Efemérides y eventos importantes en los próximos 3 días' },
                { key: 'criticalAnalysis', label: 'Análisis con problemas críticos', desc: 'Cuando una auditoría detecta problemas de alta prioridad' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border cursor-pointer hover:border-violet-600/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={(settings.whatsappNotifications as Record<string, boolean>)[item.key]}
                    onChange={e => updateNested('whatsappNotifications', item.key, e.target.checked)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm text-ink">{item.label}</p>
                    <p className="text-xs text-ink-dim mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {settings.whatsappNumber && hasTwilioKeys && (
              <div className="mt-4">
                <Button
                  onClick={testWhatsApp}
                  loading={testingWa}
                  variant="outline"
                  icon={<Send size={14} />}
                >
                  Enviar mensaje de prueba
                </Button>
                {testResult && (
                  <p className={`text-xs mt-2 ${testResult.ok ? 'text-success' : 'text-danger'}`}>
                    {testResult.ok ? '✓' : '✗'} {testResult.msg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: APIs */}
      {activeTab === 'apis' && (
        <div className="space-y-5 animate-fade-in">
          {/* Estado de integraciones */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-3">Estado de integraciones</h2>
            <div className="flex flex-wrap gap-2">
              <StatusBadge ok={!!process.env.ANTHROPIC_API_KEY || !!settings.apiKeys.anthropic} label="Anthropic Claude" />
              <StatusBadge ok={hasApifyKey} label="Apify (Instagram)" />
              <StatusBadge ok={hasTwilioKeys} label="Twilio (WhatsApp)" />
            </div>
          </div>

          {/* Anthropic */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Anthropic (Claude AI)</h3>
                <p className="text-xs text-ink-dim">Para toda la generación de contenido con IA</p>
              </div>
              <StatusBadge ok={!!settings.apiKeys.anthropic} label={settings.apiKeys.anthropic ? 'Configurado' : 'Sin configurar'} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">API Key</label>
              <SecretInput
                value={settings.apiKeys.anthropic}
                onChange={v => updateNested('apiKeys', 'anthropic', v)}
                placeholder="sk-ant-..."
              />
              <p className="text-xs text-ink-dim mt-1">Obtené tu key en console.anthropic.com</p>
            </div>
          </div>

          {/* Apify */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Apify</h3>
                <p className="text-xs text-ink-dim">Para scraping real de Instagram</p>
              </div>
              <StatusBadge ok={hasApifyKey} label={hasApifyKey ? 'Configurado' : 'Sin configurar'} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-dim block mb-1.5">Token de Apify</label>
              <SecretInput
                value={settings.apiKeys.apify}
                onChange={v => updateNested('apiKeys', 'apify', v)}
                placeholder="apify_api_..."
              />
              <p className="text-xs text-ink-dim mt-1">Obtené tu token en console.apify.com</p>
            </div>
          </div>

          {/* Twilio */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Twilio (WhatsApp)</h3>
                <p className="text-xs text-ink-dim">Para enviar notificaciones por WhatsApp</p>
              </div>
              <StatusBadge ok={hasTwilioKeys} label={hasTwilioKeys ? 'Configurado' : 'Sin configurar'} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-dim block mb-1.5">Account SID</label>
                <SecretInput
                  value={settings.apiKeys.twilioSid}
                  onChange={v => updateNested('apiKeys', 'twilioSid', v)}
                  placeholder="AC..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-dim block mb-1.5">Auth Token</label>
                <SecretInput
                  value={settings.apiKeys.twilioToken}
                  onChange={v => updateNested('apiKeys', 'twilioToken', v)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-dim block mb-1.5">Número WhatsApp de Twilio</label>
                <Input
                  value={settings.apiKeys.twilioWhatsapp}
                  onChange={e => updateNested('apiKeys', 'twilioWhatsapp', e.target.value)}
                  placeholder="+14155238886"
                />
                <p className="text-xs text-ink-dim mt-1">El número sandbox de Twilio para WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Apariencia */}
      {activeTab === 'apariencia' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Tema de la aplicación</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (theme === 'light') toggle(); update('theme', 'dark'); }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-violet-600 bg-violet-dim'
                    : 'border-border hover:border-violet-600/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#070711] border border-[#1E1E38] flex items-center justify-center mb-2">
                  <Moon size={14} className="text-violet-400" />
                </div>
                <p className="text-sm font-medium text-ink">Modo oscuro</p>
                <p className="text-xs text-ink-dim mt-0.5">Fondo negro, acentos violeta</p>
                {theme === 'dark' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-violet-400">
                    <Check size={11} /> Activo
                  </div>
                )}
              </button>

              <button
                onClick={() => { if (theme === 'dark') toggle(); update('theme', 'light'); }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-violet-600 bg-violet-dim'
                    : 'border-border hover:border-violet-600/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] border border-[#DDD8FA] flex items-center justify-center mb-2">
                  <Sun size={14} className="text-violet-600" />
                </div>
                <p className="text-sm font-medium text-ink">Modo claro</p>
                <p className="text-xs text-ink-dim mt-0.5">Fondo claro, acentos violeta</p>
                {theme === 'light' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-violet-400">
                    <Check size={11} /> Activo
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-2">Información de la app</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-dim">Versión</span>
                <span className="text-ink font-medium">3.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-dim">Etapa</span>
                <span className="text-ink font-medium">Etapa 3 completa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-dim">Almacenamiento</span>
                <span className="text-ink font-medium">Local (navegador)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
