'use client';

import { useState } from 'react';
import { AdIdea, Account } from '@/lib/types';

const FORMATO_COLORS: Record<string, string> = {
  Reel: 'bg-pink-100 text-pink-700 border-pink-200',
  Story: 'bg-amber-100 text-amber-700 border-amber-200',
  Carrusel: 'bg-blue-100 text-blue-700 border-blue-200',
};

const FORMATO_EMOJI: Record<string, string> = {
  Reel: '🎬',
  Story: '📱',
  Carrusel: '🎠',
};

interface Props {
  idea: AdIdea;
  account: Account;
  index: number;
}

function buildBrief(idea: AdIdea, account: Account): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BRIEF DE AD — ${idea.titulo.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Cuenta: ${account.nombre}
📂 Rubro: ${account.rubro}
🎯 Objetivo: ${account.objetivo === 'ventas_tienda' ? 'Ventas en tienda' : 'Mensajería mayorista'}
📱 Formato: ${idea.formato}

🪝 HOOK (apertura del video)
${idea.hook}

🎬 SCRIPT — 30 SEGUNDOS
${idea.script}

✍️ CAPTION / COPY
${idea.caption}

📢 CTA
${idea.cta}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generado con Ad Intelligence`;
}

export default function IdeaCard({ idea, account, index }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildBrief(idea, account));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-hover">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {index}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{idea.titulo}</h3>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                    FORMATO_COLORS[idea.formato]
                  }`}
                >
                  {FORMATO_EMOJI[idea.formato]} {idea.formato}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
              copied
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ¡Copiado!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar brief
              </>
            )}
          </button>
        </div>

        {/* Hook */}
        <div className="mt-3.5 bg-violet-50 rounded-xl px-3.5 py-2.5">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">🪝 Hook</p>
          <p className="text-sm text-slate-700 leading-relaxed">{idea.hook}</p>
        </div>
      </div>

      {/* Expandable content */}
      <div className="px-5 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-violet-600 transition-colors duration-150 py-1"
        >
          <span className="font-medium">{expanded ? 'Ocultar detalles' : 'Ver script, caption y CTA'}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-3 space-y-4 pb-2">
            {/* Script */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">🎬 Script — 30 segundos</p>
              <div className="bg-slate-50 rounded-xl p-3.5">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{idea.script}</pre>
              </div>
            </div>

            {/* Caption */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">✍️ Caption / Copy</p>
              <div className="bg-slate-50 rounded-xl p-3.5">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{idea.caption}</pre>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-3.5 py-2.5">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide shrink-0">📢 CTA</p>
              <p className="text-sm text-slate-700 font-medium">{idea.cta}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
