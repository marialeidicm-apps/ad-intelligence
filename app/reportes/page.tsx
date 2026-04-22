'use client';
import { useState, useEffect, useRef } from 'react';
import { FileBarChart, RefreshCw, Printer, CheckCircle, TrendingUp, TrendingDown, Minus, Save } from 'lucide-react';
import { Brand, MonthlyReport } from '@/lib/types';
import { getBrands, getContent, getMonthlyReports, saveMonthlyReport, generateId } from '@/lib/storage';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'subió') return <TrendingUp size={12} className="text-emerald-400" />;
  if (trend === 'bajó') return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-amber-400" />;
}

export default function ReportesPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [history, setHistory] = useState<MonthlyReport[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBrands(getBrands());
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleGenerate = async () => {
    if (!selectedBrand) { setError('Seleccioná una marca'); return; }
    setError('');
    setLoading(true);
    setSaved(false);
    try {
      const content = getContent().filter(c =>
        c.brandId === selectedBrandId &&
        new Date(c.createdAt).getMonth() + 1 === month &&
        new Date(c.createdAt).getFullYear() === year
      );
      const res = await fetch('/api/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand, month, year, recentContent: content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const result: MonthlyReport = {
        id: generateId(),
        brandId: selectedBrandId,
        brandName: selectedBrand.name,
        month,
        year,
        improvements: data.improvements,
        pending: data.pending,
        estimatedMetrics: data.estimatedMetrics,
        nextSteps: data.nextSteps,
        achievements: data.achievements,
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    await saveMonthlyReport(report);
    setHistory(getMonthlyReports(selectedBrandId));
    setSaved(true);
  };

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-report { display: block !important; position: fixed; top: 0; left: 0; width: 100%; background: white; color: black; padding: 40px; }
          #print-report * { color: black !important; border-color: #ddd !important; background: transparent !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="no-print">
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <FileBarChart size={24} className="text-violet-400" />Reportes Mensuales
          </h1>
          <p className="text-ink-dim mt-1">Generá el reporte mensual de cada marca. Exportable como PDF.</p>
        </div>

        {/* Formulario */}
        <div className="bg-card border border-border rounded-xl p-5 no-print">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-dim mb-1.5">Marca</label>
              <select
                value={selectedBrandId}
                onChange={e => {
                  setSelectedBrandId(e.target.value);
                  setReport(null);
                  if (e.target.value) setHistory(getMonthlyReports(e.target.value));
                }}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
              >
                <option value="">Elegí una marca...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-dim mb-1.5">Mes</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-dim mb-1.5">Año</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet-500"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedBrandId}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? <><RefreshCw size={14} className="animate-spin" />Generando...</> : 'Generar reporte'}
            </button>
          </div>
        </div>

        {/* Reporte */}
        {report && (
          <div ref={printRef} id="print-report">
            {/* Header del reporte */}
            <div className="bg-violet-950/30 border border-violet-600/30 rounded-xl p-6 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{report.brandName[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-ink">{report.brandName}</p>
                      <p className="text-xs text-ink-dim">Reporte mensual</p>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-violet-300 mt-2">{MONTHS[report.month - 1]} {report.year}</h2>
                  <p className="text-sm text-ink-muted mt-2 leading-relaxed max-w-2xl">{report.summary}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-ink-dim">Generado por</p>
                  <p className="text-sm font-semibold text-violet-400">Ad Intelligence</p>
                  <p className="text-xs text-ink-dim mt-1">{new Date(report.createdAt).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {report.estimatedMetrics.map((m, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendIcon trend={m.trend} />
                    <span className="text-xs text-ink-dim capitalize">{m.trend}</span>
                  </div>
                  <p className="font-bold text-ink text-sm">{m.value}</p>
                  <p className="text-xs text-ink-dim mt-0.5">{m.metric}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Logros */}
              <div className="bg-card border border-emerald-800/30 rounded-xl p-5">
                <p className="text-xs font-semibold text-emerald-400 uppercase mb-3">🏆 Logros del mes</p>
                <ul className="space-y-2">
                  {report.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />{a}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mejoras */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs font-semibold text-ink-dim uppercase mb-3">📈 Qué mejoró</p>
                <ul className="space-y-2">
                  {report.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="text-violet-400 mt-0.5">↑</span>{imp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pendientes */}
              <div className="bg-card border border-amber-800/30 rounded-xl p-5">
                <p className="text-xs font-semibold text-amber-400 uppercase mb-3">⏳ Qué falta</p>
                <ul className="space-y-2">
                  {report.pending.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="text-amber-400 mt-0.5">·</span>{p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Próximos pasos */}
              <div className="bg-card border border-violet-800/30 rounded-xl p-5">
                <p className="text-xs font-semibold text-violet-400 uppercase mb-3">🚀 Próximos pasos</p>
                <ol className="space-y-2">
                  {report.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="w-4 h-4 rounded-full bg-violet-dim text-violet-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 no-print">
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 disabled:opacity-50 text-sm"
              >
                {saved ? <><CheckCircle size={14} />Guardado</> : <><Save size={14} />Guardar</>}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm"
              >
                <Printer size={14} />Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {history.length > 0 && !report && (
          <div className="no-print">
            <h2 className="text-sm font-semibold text-ink-dim mb-3">Reportes anteriores</h2>
            <div className="space-y-2">
              {history.slice(0, 6).map(h => (
                <button
                  key={h.id}
                  onClick={() => setReport(h)}
                  className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-violet-600/30 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{MONTHS[h.month - 1]} {h.year}</p>
                    <p className="text-xs text-ink-dim truncate max-w-md">{h.summary.slice(0, 80)}...</p>
                  </div>
                  <span className="text-xs text-violet-400">Ver →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
