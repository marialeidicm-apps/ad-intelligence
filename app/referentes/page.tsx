'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Telescope, Plus, Trash2, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Copy, Check, Play, AlertTriangle, TrendingUp, Lightbulb, Zap,
  User, Tag, MessageCircle, BarChart2, Calendar, Star, ArrowRight,
  CheckCheck, BookOpen, Target, Mic2
} from 'lucide-react';
import {
  Referente, ReferenteCategory, ReferentePost, InformeDiario,
  InformeSemanal, TendenciaAplicada, ContenidoMaria,
} from '@/lib/types';
import {
  getReferentes, saveReferente, deleteReferente,
  getReferentePosts, saveReferentePosts, updateReferenteLastScraped,
  getInformesDiarios, saveInformeDiario,
  getInformesSemanales, saveInformeSemanal,
  getTendenciasAplicadas, saveTendenciaAplicada,
  getContenidoMaria, saveContenidoMaria, deleteContenidoMaria,
  getBrands, getSettings, generateId,
} from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CATEGORIES: { value: ReferenteCategory; label: string; color: string }[] = [
  { value: 'estrategia', label: 'Estrategia', color: 'text-violet-400 bg-violet-dim border-violet-600/30' },
  { value: 'contenido', label: 'Contenido', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  { value: 'tendencias', label: 'Tendencias', color: 'text-warning bg-warning/10 border-warning/30' },
  { value: 'industria', label: 'Industria', color: 'text-success bg-success/10 border-success/30' },
  { value: 'marketing', label: 'Marketing', color: 'text-pink-400 bg-pink-900/20 border-pink-700/30' },
  { value: 'comunidad', label: 'Comunidad', color: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { value: 'otro', label: 'Otro', color: 'text-ink-dim bg-card border-border' },
];

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  historia: <span className="text-xs">📱</span>,
  post: <span className="text-xs">🖼️</span>,
  reel: <span className="text-xs">🎬</span>,
  tiktok: <span className="text-xs">🎵</span>,
  carrusel: <span className="text-xs">🃏</span>,
};

type TabId = 'referentes' | 'diario' | 'semanal' | 'marcas' | 'maria';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: ReferenteCategory }) {
  const c = CATEGORIES.find(c => c.value === cat) || CATEGORIES[6];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.color}`}>
      {c.label}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-ink-dim hover:text-violet-400 transition-colors p-1"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
    </button>
  );
}

function Section({ title, icon, items, dotColor = 'bg-violet-400' }: {
  title: string; icon: React.ReactNode; items: string[]; dotColor?: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0 mt-1.5`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── TAB: REFERENTES ─────────────────────────────────────────────────────────

function TabReferentes() {
  const [referentes, setReferentes] = useState<Referente[]>([]);
  const [posts, setPosts] = useState<ReferentePost[]>([]);
  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState<ReferenteCategory>('estrategia');
  const [notes, setNotes] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string>('');

  const load = useCallback(() => {
    setReferentes(getReferentes());
    setPosts(getReferentePosts());
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = () => {
    if (!username.trim()) return;
    const r: Referente = {
      id: generateId(),
      username: username.trim().replace('@', ''),
      category,
      notes: notes.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    saveReferente(r);
    setUsername(''); setNotes(''); setAdding(false);
    load();
  };

  const scrapeAll = async () => {
    const active = referentes.filter(r => r.isActive);
    if (!active.length) return;
    setScraping(true);
    setScrapeResult('');
    try {
      const settings = getSettings();
      const res = await fetch('/api/referentes/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referentes: active,
          apifyToken: settings.apiKeys.apify,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const allPosts: ReferentePost[] = data.results.flatMap((r: { posts: ReferentePost[] }) => r.posts);
      saveReferentePosts(allPosts);

      for (const r of data.results) {
        if (r.posts.length > 0) {
          updateReferenteLastScraped(r.referenteId, new Date().toISOString());
        }
      }

      // WhatsApp alert for viral
      if (data.viralCount > 0) {
        const settings2 = getSettings();
        if (settings2.whatsappNumber && settings2.apiKeys.twilioSid && settings2.whatsappNotifications.criticalAnalysis) {
          const viralPosts = allPosts.filter(p => p.isViral);
          const msg = `🔥 *Ad Intelligence — Contenido viral en referentes*\n\n${viralPosts.map(p => `@${p.username}: "${p.caption?.slice(0, 80) || ''}..." (${p.likesCount} likes)`).join('\n\n')}\n\nRevisá la sección Referentes para más detalles.`;
          fetch('/api/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: settings2.whatsappNumber, message: msg,
              twilioSid: settings2.apiKeys.twilioSid,
              twilioToken: settings2.apiKeys.twilioToken,
              twilioWhatsapp: settings2.apiKeys.twilioWhatsapp,
            }),
          }).catch(() => {});
        }
      }

      setScrapeResult(`✓ ${data.totalPosts} posts scrapeados, ${data.viralCount} virales${data.viralCount > 0 ? ' — alerta WhatsApp enviada' : ''}`);
      load();
    } catch (err) {
      setScrapeResult(`✗ ${err instanceof Error ? err.message : 'Error al scrapear'}`);
    } finally {
      setScraping(false);
    }
  };

  const postsByRef = referentes.reduce((acc, r) => {
    acc[r.id] = posts.filter(p => p.referenteId === r.id);
    return acc;
  }, {} as Record<string, ReferentePost[]>);

  return (
    <div className="space-y-5">
      {/* Acciones */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setAdding(!adding)} icon={<Plus size={14} />} variant="outline">
          Agregar referente
        </Button>
        <Button
          onClick={scrapeAll}
          loading={scraping}
          disabled={!referentes.filter(r => r.isActive).length}
          icon={<RefreshCw size={14} />}
        >
          {scraping ? 'Scrapeando...' : 'Monitorear ahora'}
        </Button>
        {scrapeResult && (
          <span className={`text-xs ${scrapeResult.startsWith('✓') ? 'text-success' : 'text-danger'}`}>
            {scrapeResult}
          </span>
        )}
      </div>

      {/* Formulario nuevo referente */}
      {adding && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <p className="text-sm font-semibold text-ink">Nuevo referente</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="@username o username"
              icon={<User size={13} />}
            />
            <Select
              value={category}
              onChange={e => setCategory(e.target.value as ReferenteCategory)}
              options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            />
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Nota (opcional)"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={add} disabled={!username.trim()}>Agregar</Button>
            <Button onClick={() => setAdding(false)} variant="ghost">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {referentes.length === 0 ? (
        <div className="text-center py-12">
          <Telescope size={32} className="mx-auto mb-3 text-ink-dim opacity-30" />
          <p className="text-sm text-ink-dim">Agregá referentes para empezar a monitorearlos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {referentes.map(ref => {
            const refPosts = postsByRef[ref.id] || [];
            const viralCount = refPosts.filter(p => p.isViral).length;
            return (
              <div key={ref.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-dim flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
                      {ref.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink">@{ref.username}</p>
                        <CategoryBadge cat={ref.category} />
                        {viralCount > 0 && (
                          <span className="text-[10px] bg-danger/20 text-danger border border-danger/30 px-1.5 py-0.5 rounded-full">
                            🔥 {viralCount} viral{viralCount > 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      {ref.notes && <p className="text-xs text-ink-dim mt-0.5">{ref.notes}</p>}
                      <p className="text-xs text-ink-dim mt-0.5">
                        {refPosts.length} posts guardados
                        {ref.lastScraped ? ` · Últ. monitoreo: ${formatDate(ref.lastScraped)}` : ' · Sin monitorear'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        saveReferente({ ...ref, isActive: !ref.isActive });
                        load();
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        ref.isActive
                          ? 'text-success bg-success/10 border-success/30 hover:bg-success/20'
                          : 'text-ink-dim bg-card border-border hover:border-ink-dim'
                      }`}
                    >
                      {ref.isActive ? 'Activo' : 'Pausado'}
                    </button>
                    <button
                      onClick={() => { deleteReferente(ref.id); load(); }}
                      className="text-ink-dim hover:text-danger transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Últimos posts */}
                {refPosts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] text-ink-dim mb-2 uppercase tracking-wide">Últimos posts</p>
                    <div className="space-y-1">
                      {refPosts.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-start gap-2 text-xs text-ink-muted bg-surface rounded-lg px-2.5 py-1.5">
                          <span className={`px-1 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
                            p.type === 'reel' ? 'bg-purple-900/40 text-purple-300' :
                            p.type === 'carrusel' ? 'bg-blue-900/40 text-blue-300' :
                            'bg-card text-ink-dim'
                          }`}>{p.type}</span>
                          {p.isViral && <span className="text-danger flex-shrink-0">🔥</span>}
                          <span className="truncate">{p.caption?.slice(0, 80) || 'Sin caption'}</span>
                          <span className="text-ink-dim flex-shrink-0 ml-auto">{p.likesCount}❤️</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TAB: INFORME DIARIO ─────────────────────────────────────────────────────

function TabInformeDiario() {
  const [loading, setLoading] = useState(false);
  const [informes, setInformes] = useState<InformeDiario[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setInformes(getInformesDiarios()); }, []);

  const generate = async () => {
    const referentes = getReferentes().filter(r => r.isActive);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const posts = getReferentePosts().filter(p => {
      const postDate = p.scrapedAt.split('T')[0];
      return postDate >= todayStr || p.publishedAt.split('T')[0] >= todayStr;
    });

    if (!posts.length) {
      alert('No hay posts del día. Hacé un monitoreo primero desde la pestaña Referentes.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referentes/informe-diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts,
          referentes,
          date: today.toLocaleDateString('es-AR'),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const informe: InformeDiario = {
        id: generateId(),
        date: todayStr,
        postsAnalyzed: posts.length,
        referentesAnalyzed: referentes.length,
        ...data.result,
        createdAt: new Date().toISOString(),
      };
      saveInformeDiario(informe);
      setInformes(getInformesDiarios());
      setExpanded(informe.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button onClick={generate} loading={loading} icon={<Sparkles size={14} />}>
          {loading ? 'Generando informe...' : 'Generar informe de hoy'}
        </Button>
        <p className="text-xs text-ink-dim">Analiza los posts scrapeados del día</p>
      </div>

      {informes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={32} className="mx-auto mb-3 text-ink-dim opacity-30" />
          <p className="text-sm text-ink-dim">Todavía no generaste ningún informe diario</p>
        </div>
      ) : (
        <div className="space-y-3">
          {informes.map(inf => (
            <div key={inf.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => setExpanded(expanded === inf.id ? null : inf.id)}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{formatDate(inf.date)} — Informe diario</p>
                  <p className="text-xs text-ink-dim">{inf.postsAnalyzed} posts · {inf.referentesAnalyzed} referentes · {inf.trends?.length || 0} tendencias</p>
                </div>
                {expanded === inf.id ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
              </div>

              {expanded === inf.id && (
                <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
                  <Section title="Highlights del día" icon={<Star size={13} className="text-warning" />} items={inf.highlights} dotColor="bg-warning" />
                  <Section title="Estrategias detectadas" icon={<Target size={13} className="text-violet-400" />} items={inf.strategies} dotColor="bg-violet-400" />
                  <Section title="Tendencias" icon={<TrendingUp size={13} className="text-success" />} items={inf.trends} dotColor="bg-success" />
                  {inf.viralContent?.length > 0 && (
                    <Section title="Contenido viral" icon={<Zap size={13} className="text-danger" />} items={inf.viralContent} dotColor="bg-danger" />
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Informe completo</p>
                      <CopyBtn text={inf.fullReport} />
                    </div>
                    <p className="text-sm text-ink-muted leading-relaxed bg-surface rounded-lg p-3">{inf.fullReport}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: INFORME SEMANAL ────────────────────────────────────────────────────

function TabInformeSemanal() {
  const [loading, setLoading] = useState(false);
  const [informes, setInformes] = useState<InformeSemanal[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setInformes(getInformesSemanales()); }, []);

  const generate = async () => {
    const posts = getReferentePosts();
    const informesDiarios = getInformesDiarios().slice(0, 7);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    if (!posts.length && !informesDiarios.length) {
      alert('No hay datos de la semana. Monitoreá referentes y generá informes diarios primero.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referentes/informe-semanal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: posts.slice(0, 100),
          informesDiarios,
          weekStart: weekStart.toLocaleDateString('es-AR'),
          weekEnd: weekEnd.toLocaleDateString('es-AR'),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const informe: InformeSemanal = {
        id: generateId(),
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        ...data.result,
        createdAt: new Date().toISOString(),
      };
      saveInformeSemanal(informe);
      setInformes(getInformesSemanales());
      setExpanded(informe.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button onClick={generate} loading={loading} icon={<Sparkles size={14} />}>
          {loading ? 'Generando...' : 'Generar informe semanal'}
        </Button>
        <p className="text-xs text-ink-dim">Consolida los informes de la semana</p>
      </div>

      {informes.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={32} className="mx-auto mb-3 text-ink-dim opacity-30" />
          <p className="text-sm text-ink-dim">Todavía no generaste ningún informe semanal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {informes.map(inf => (
            <div key={inf.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => setExpanded(expanded === inf.id ? null : inf.id)}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Semana {formatDate(inf.weekStart)} — {formatDate(inf.weekEnd)}
                  </p>
                  <p className="text-xs text-ink-dim">{inf.topTrends?.length || 0} tendencias · {inf.repeatedStrategies?.length || 0} estrategias repetidas</p>
                </div>
                {expanded === inf.id ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
              </div>

              {expanded === inf.id && (
                <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
                  <Section title="Tendencias top de la semana" icon={<TrendingUp size={13} className="text-violet-400" />} items={inf.topTrends} dotColor="bg-violet-400" />
                  <Section title="Estrategias que se repitieron" icon={<Target size={13} className="text-success" />} items={inf.repeatedStrategies} dotColor="bg-success" />
                  <Section title="Acciones que están funcionando" icon={<Zap size={13} className="text-warning" />} items={inf.topActions} dotColor="bg-warning" />
                  <Section title="Insights del mercado" icon={<Lightbulb size={13} className="text-blue-400" />} items={inf.marketInsights} dotColor="bg-blue-400" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Informe completo</p>
                      <CopyBtn text={inf.fullReport} />
                    </div>
                    <p className="text-sm text-ink-muted leading-relaxed bg-surface rounded-lg p-3">{inf.fullReport}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: APLICAR A MARCAS ───────────────────────────────────────────────────

function TabAplicarMarcas() {
  const [loading, setLoading] = useState(false);
  const [tendencias, setTendencias] = useState<TendenciaAplicada[]>([]);

  useEffect(() => { setTendencias(getTendenciasAplicadas()); }, []);

  const generate = async () => {
    const brands = getBrands();
    if (!brands.length) {
      alert('No tenés marcas cargadas. Creá marcas primero en la sección Mis Marcas.');
      return;
    }

    const informesDiarios = getInformesDiarios();
    const informesSemanales = getInformesSemanales();

    if (!informesDiarios.length && !informesSemanales.length) {
      alert('Generá al menos un informe diario o semanal primero.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referentes/aplicar-marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          informeDiario: informesDiarios[0],
          informeSemanal: informesSemanales[0],
          brands: brands.map(b => ({
            name: b.name,
            industry: b.industry,
            objective: b.objective,
            voiceProfile: b.voiceProfile,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const now = new Date().toISOString();
      const nuevas: TendenciaAplicada[] = data.result.aplicaciones.map((a: {
        brandName: string; referenteUsername: string; strategy: string;
        howToApply: string; suggestedFormat: string; priority: 'alta' | 'media' | 'baja';
      }) => {
        const brand = brands.find(b => b.name === a.brandName);
        return {
          id: generateId(),
          informeId: informesDiarios[0]?.id || informesSemanales[0]?.id || '',
          brandId: brand?.id || '',
          brandName: a.brandName,
          referenteUsername: a.referenteUsername,
          strategy: a.strategy,
          howToApply: a.howToApply,
          suggestedFormat: a.suggestedFormat,
          priority: a.priority,
          createdAt: now,
        };
      });

      nuevas.forEach(t => saveTendenciaAplicada(t));
      setTendencias(getTendenciasAplicadas());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig: Record<string, { label: string; color: string }> = {
    alta: { label: 'Alta', color: 'text-danger bg-danger/10 border-danger/30' },
    media: { label: 'Media', color: 'text-warning bg-warning/10 border-warning/30' },
    baja: { label: 'Baja', color: 'text-success bg-success/10 border-success/30' },
  };

  const groupedByBrand = tendencias.reduce((acc, t) => {
    if (!acc[t.brandName]) acc[t.brandName] = [];
    acc[t.brandName].push(t);
    return acc;
  }, {} as Record<string, TendenciaAplicada[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button onClick={generate} loading={loading} icon={<Sparkles size={14} />}>
          {loading ? 'Analizando...' : 'Aplicar tendencias a mis marcas'}
        </Button>
        <p className="text-xs text-ink-dim">Basado en los últimos informes</p>
      </div>

      {Object.keys(groupedByBrand).length === 0 ? (
        <div className="text-center py-12">
          <Target size={32} className="mx-auto mb-3 text-ink-dim opacity-30" />
          <p className="text-sm text-ink-dim">Generá informes y luego aplicá las tendencias a tus marcas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByBrand).map(([brand, items]) => (
            <div key={brand}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <h3 className="text-sm font-bold text-ink">{brand}</h3>
                <span className="text-xs text-ink-dim">({items.length} sugerencias)</span>
              </div>
              <div className="space-y-2">
                {items.map(t => {
                  const p = priorityConfig[t.priority] || priorityConfig.media;
                  return (
                    <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-ink-dim">@{t.referenteUsername}</span>
                          <ArrowRight size={10} className="text-ink-dim" />
                          <span className="text-sm font-medium text-ink">{t.strategy}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${p.color}`}>{p.label}</span>
                          <span className="text-xs text-ink-dim bg-surface border border-border px-2 py-0.5 rounded-full">{t.suggestedFormat}</span>
                        </div>
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed">{t.howToApply}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: CONTENIDO PARA MARÍA ───────────────────────────────────────────────

function TabContenidoMaria() {
  const [loading, setLoading] = useState(false);
  const [contenidos, setContenidos] = useState<ContenidoMaria[]>([]);
  const [count, setCount] = useState(3);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setContenidos(getContenidoMaria()); }, []);

  const generate = async () => {
    const posts = getReferentePosts();
    const informesDiarios = getInformesDiarios();
    const referentes = getReferentes().filter(r => r.isActive);

    if (!posts.length && !informesDiarios.length) {
      alert('Monitoreá referentes primero para tener contenido de inspiración.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referentes/contenido-maria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: posts.slice(0, 30),
          informeDiario: informesDiarios[0],
          referentes,
          count,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const now = new Date();
      const nuevos: ContenidoMaria[] = data.result.contenidos.map((c: {
        inspiradoEn: string; formato: ContenidoMaria['formato'];
        titulo: string; hook: string; guion: string; copy: string; hashtags: string[];
      }) => ({
        id: generateId(),
        date: now.toISOString().split('T')[0],
        ...c,
        createdAt: now.toISOString(),
      }));

      nuevos.forEach(c => saveContenidoMaria(c));
      setContenidos(getContenidoMaria());
      if (nuevos[0]) setExpanded(nuevos[0].id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header especial */}
      <div className="bg-gradient-to-r from-violet-900/30 to-pink-900/20 border border-violet-600/30 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
            <Mic2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Contenido para @marialeidi__</p>
            <p className="text-xs text-ink-dim">Generado desde lo que publican tus referentes hoy</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={generate} loading={loading} icon={<Sparkles size={14} />}>
            {loading ? 'Generando ideas...' : `Generar ${count} ideas para hoy`}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-dim">Cantidad:</span>
            {[1, 2, 3, 5].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  count === n ? 'bg-violet-600 text-white' : 'bg-card border border-border text-ink-dim hover:text-ink'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {contenidos.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto mb-3 text-ink-dim opacity-30" />
          <p className="text-sm text-ink-dim">Generá ideas de contenido basadas en tus referentes del día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contenidos.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{FORMAT_ICONS[c.formato] || '📝'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{c.titulo}</p>
                    <p className="text-xs text-ink-dim">
                      {c.formato} · Inspirado en @{c.inspiradoEn} · {formatDate(c.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button onClick={e => { e.stopPropagation(); deleteContenidoMaria(c.id); setContenidos(getContenidoMaria()); }}
                    className="text-ink-dim hover:text-danger p-1 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  {expanded === c.id ? <ChevronUp size={15} className="text-ink-dim" /> : <ChevronDown size={15} className="text-ink-dim" />}
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
                  {/* Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Hook (para el scroll)</p>
                      <CopyBtn text={c.hook} />
                    </div>
                    <div className="bg-violet-dim border border-violet-600/30 rounded-xl px-4 py-3">
                      <p className="text-base font-bold text-violet-light leading-snug">{c.hook}</p>
                    </div>
                  </div>

                  {/* Guion */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Guión completo</p>
                      <CopyBtn text={c.guion} />
                    </div>
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{c.guion}</p>
                    </div>
                  </div>

                  {/* Copy */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Copy para el caption</p>
                      <CopyBtn text={c.copy} />
                    </div>
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{c.copy}</p>
                    </div>
                  </div>

                  {/* Hashtags */}
                  {c.hashtags?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide">Hashtags</p>
                        <CopyBtn text={c.hashtags.join(' ')} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.hashtags.map((h, i) => (
                          <span key={i} className="text-xs bg-card border border-border rounded-full px-2.5 py-1 text-violet-400">
                            {h.startsWith('#') ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'referentes', label: 'Referentes', icon: <User size={13} /> },
  { id: 'diario', label: 'Informe Diario', icon: <BookOpen size={13} /> },
  { id: 'semanal', label: 'Semanal', icon: <Calendar size={13} /> },
  { id: 'marcas', label: 'Mis Marcas', icon: <Target size={13} /> },
  { id: 'maria', label: '@marialeidi__', icon: <Mic2 size={13} /> },
];

export default function ReferentesPage() {
  const [tab, setTab] = useState<TabId>('referentes');
  const [referenteCount, setReferenteCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    setReferenteCount(getReferentes().filter(r => r.isActive).length);
    setPostCount(getReferentePosts().length);
  }, [tab]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-dim flex items-center justify-center">
            <Telescope size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Referentes</h1>
            <p className="text-sm text-ink-dim">Monitoreá lo que publican y transformalo en estrategia para tus marcas</p>
          </div>
        </div>

        {/* Stats rápidas */}
        {(referenteCount > 0 || postCount > 0) && (
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-ink-dim bg-card border border-border rounded-full px-3 py-1">
              {referenteCount} referentes activos
            </span>
            <span className="text-xs text-ink-dim bg-card border border-border rounded-full px-3 py-1">
              {postCount} posts guardados
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              tab === t.id
                ? 'bg-violet-dim text-violet-light border border-violet-600/30'
                : 'text-ink-dim hover:text-ink'
            } ${t.id === 'maria' ? 'bg-gradient-to-r from-violet-900/0 to-pink-900/0' : ''}`}
          >
            {t.icon}
            {t.id === 'maria' ? (
              <span className={tab === 'maria' ? 'text-violet-light' : 'text-pink-400'}>{t.label}</span>
            ) : t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'referentes' && <TabReferentes />}
      {tab === 'diario' && <TabInformeDiario />}
      {tab === 'semanal' && <TabInformeSemanal />}
      {tab === 'marcas' && <TabAplicarMarcas />}
      {tab === 'maria' && <TabContenidoMaria />}
    </div>
  );
}
