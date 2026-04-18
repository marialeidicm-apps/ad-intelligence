'use client';
import { useState, useEffect } from 'react';
import { Brand } from '@/lib/types';
import { getBrands, saveContent, generateId } from '@/lib/storage';
import { buildBrandContext, getCountryLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/Spinner';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, AlertCircle, Star } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

interface CalendarIdea {
  date: string;
  title: string;
  description: string;
  type: 'efemeride' | 'sugerido';
  country?: string;
  contentSuggestion?: string;
}

// Argentine holidays + key dates
const AR_EFEMERIDES: Record<string, { title: string; description: string }> = {
  '01-01': { title: 'Año Nuevo', description: 'Contenido de renovación y metas' },
  '14-02': { title: 'Día de los Enamorados', description: 'Campaña romántica o anti-San Valentín' },
  '08-03': { title: 'Día de la Mujer', description: 'Posicionamiento y valores de marca' },
  '24-03': { title: 'Día de la Memoria', description: 'Fecha a no usar para promociones' },
  '02-04': { title: 'Día del Veterano', description: 'Fecha a no usar para promociones' },
  '01-05': { title: 'Día del Trabajador', description: 'Reconocimiento al equipo' },
  '25-05': { title: 'Día de la Patria', description: 'Contenido patriótico o pausar' },
  '20-06': { title: 'Día de la Bandera', description: 'Pausar o contenido patriótico ligero' },
  '09-07': { title: 'Día de la Independencia', description: 'Contenido patriótico o pausar' },
  '17-08': { title: 'Día de San Martín', description: 'Pausar o contenido patriótico ligero' },
  '12-10': { title: 'Día del Respeto a la Diversidad', description: 'Contenido inclusivo' },
  '20-11': { title: 'Día de la Soberanía', description: 'Pausar o contenido patriótico ligero' },
  '25-12': { title: 'Navidad', description: 'Campaña navideña, regalos, cierre del año' },
};

const COMMERCIAL_DATES: Record<string, { title: string; description: string }> = {
  '21-03': { title: 'Día Mundial de la Poesía', description: 'Contenido creativo de marca' },
  '22-04': { title: 'Día de la Tierra', description: 'Sustentabilidad y valores' },
  '04-06': { title: 'Día de las Mascotas', description: 'Si el rubro aplica' },
  '21-06': { title: 'Inicio del Invierno (AR)', description: 'Lanzamiento de temporada invierno' },
  '21-09': { title: 'Inicio de la Primavera + Día del Estudiante', description: 'Campaña de primavera' },
  '31-10': { title: 'Halloween / Víspera de Todos los Santos', description: 'Contenido temático' },
  '11-11': { title: '11/11 Día de Solteros', description: 'Ventas flash, descuentos' },
  '29-11': { title: 'Black Friday', description: 'Campaña de descuentos principal' },
  '02-12': { title: 'Cyber Monday', description: 'Descuentos online' },
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(day: number, month: number): string {
  return `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}`;
}

export default function CalendarioPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [ideas, setIdeas] = useState<CalendarIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const list = getBrands();
    setBrands(list);
    if (list.length > 0) setSelectedBrandId(list[0].id);
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const getDateEvents = (day: number): CalendarIdea[] => {
    const key = formatDateKey(day, month);
    const results: CalendarIdea[] = [];

    // Argentine dates
    if (AR_EFEMERIDES[key]) {
      results.push({
        date: key,
        title: AR_EFEMERIDES[key].title,
        description: AR_EFEMERIDES[key].description,
        type: 'efemeride',
        country: 'AR',
      });
    }
    if (COMMERCIAL_DATES[key]) {
      results.push({
        date: key,
        title: COMMERCIAL_DATES[key].title,
        description: COMMERCIAL_DATES[key].description,
        type: 'efemeride',
      });
    }

    // AI-generated ideas for this date
    ideas.filter(i => i.date === key).forEach(i => results.push(i));

    return results;
  };

  const generateMonthIdeas = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    setError('');

    try {
      const monthName = MONTHS[month];
      const country = getCountryLabel(selectedBrand.country);
      const efemeridesThisMonth = Object.entries({ ...AR_EFEMERIDES, ...COMMERCIAL_DATES })
        .filter(([k]) => k.endsWith(`-${String(month + 1).padStart(2, '0')}`))
        .map(([k, v]) => `${k}: ${v.title}`)
        .join(', ');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hook',
          brandContext: buildBrandContext(selectedBrand),
          language: selectedBrand.language,
          topic: `ideas de contenido para ${monthName} ${year}`,
          extraContext: `Generá ideas de contenido para el mes de ${monthName} ${year} en ${country}.
Efemérides del mes: ${efemeridesThisMonth || 'No hay efemérides clave este mes'}.

Respondé SOLO con JSON:
{
  "hooks": [{"text": "placeholder", "type": "calendar", "why": ""}],
  "calendarIdeas": [
    {
      "date": "DD-MM",
      "title": "<título de la idea>",
      "description": "<descripción breve>",
      "type": "sugerido",
      "contentSuggestion": "<formato sugerido: reel/post/carrusel + tema>"
    }
  ]
}

Generá entre 6-8 ideas distribuidas en el mes. Las ideas deben ser específicas para el rubro y voz de la marca.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const calIdeas = data.result?.calendarIdeas || [];
      setIdeas(calIdeas);

      if (selectedBrand) {
        saveContent({
          id: generateId(),
          brandId: selectedBrand.id,
          brandName: selectedBrand.name,
          type: 'calendar_ideas',
          title: `Ideas Calendario: ${monthName} ${year}`,
          content: JSON.stringify(calIdeas),
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  };

  const selectedDayEvents = selectedDay ? getDateEvents(selectedDay) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Calendario de Contenido</h1>
        <p className="text-sm text-ink-muted mt-1">Efemérides + ideas generadas por IA para cada fecha</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {/* Controls */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              {brands.length > 0 && (
                <div className="flex-1">
                  <Select
                    label="Marca"
                    value={selectedBrandId}
                    options={brands.map(b => ({ value: b.id, label: b.name }))}
                    onChange={e => { setSelectedBrandId(e.target.value); setIdeas([]); }}
                  />
                </div>
              )}
              <Button
                size="sm"
                onClick={generateMonthIdeas}
                loading={loading}
                disabled={!selectedBrandId || loading}
                icon={<Sparkles size={13} />}
              >
                Ideas para {MONTHS[month]}
              </Button>
            </div>
            {error && (
              <div className="mt-3 bg-danger/10 border border-danger/30 rounded-lg p-2 flex items-center gap-2">
                <AlertCircle size={12} className="text-danger" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}
          </div>

          {/* Month navigation */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <button
                onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-semibold text-ink">{MONTHS[month]} {year}</h2>
              <button
                onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map(d => (
                <div key={d} className="text-center py-2 text-[10px] font-semibold text-ink-dim uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 border-b border-r border-border/30" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = getDateEvents(day);
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                const isSelected = selectedDay === day;
                const hasEfemeride = events.some(e => e.type === 'efemeride');
                const hasSuggested = events.some(e => e.type === 'sugerido');

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`h-16 border-b border-r border-border/30 p-1.5 cursor-pointer transition-colors
                      ${isSelected ? 'bg-violet-dim' : 'hover:bg-surface'}
                    `}
                  >
                    <div className={`text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center mb-1
                      ${isToday ? 'bg-violet-600 text-white' : 'text-ink-muted'}
                    `}>
                      {day}
                    </div>
                    <div className="flex gap-0.5 flex-wrap">
                      {hasEfemeride && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
                      {hasSuggested && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] text-ink-dim">Efeméride</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-[10px] text-ink-dim">Idea IA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: selected day */}
        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-4">
              <h3 className="text-sm font-semibold text-ink mb-4">
                {selectedDay} de {MONTHS[month]}
              </h3>
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-ink-dim">Sin fechas especiales ni ideas para este día.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((ev, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${ev.type === 'efemeride' ? 'bg-warning/5 border-warning/20' : 'bg-violet-dim border-violet-600/20'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {ev.type === 'efemeride' ? <Star size={12} className="text-warning" /> : <Sparkles size={12} className="text-violet-400" />}
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${ev.type === 'efemeride' ? 'text-warning' : 'text-violet-light'}`}>
                          {ev.type === 'efemeride' ? 'Efeméride' : 'Idea IA'}
                        </span>
                        {ev.country && <Badge variant="neutral" size="sm">🇦🇷</Badge>}
                      </div>
                      <p className="text-sm font-medium text-ink mb-1">{ev.title}</p>
                      <p className="text-xs text-ink-dim">{ev.description}</p>
                      {ev.contentSuggestion && (
                        <p className="text-xs text-violet-light mt-1.5 font-medium">→ {ev.contentSuggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5">
              <EmptyState
                icon={<CalendarDays size={32} strokeWidth={1} />}
                title="Seleccioná un día"
                description="Hacé clic en cualquier fecha para ver efemérides e ideas de contenido."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
