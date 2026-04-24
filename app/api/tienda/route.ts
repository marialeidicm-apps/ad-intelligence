import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { url, brand } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  const platform =
    url.includes('tiendanube') || url.includes('mitienda.ar') ? 'Tienda Nube' :
    url.includes('myshopify') || url.includes('shopify') ? 'Shopify' :
    url.includes('woocommerce') || url.includes('wp-content') ? 'WooCommerce' :
    'Tienda online';

  let siteContext = `URL: ${url}\nPlataforma detectada: ${platform}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const strip = (s: string) => s.replace(/<[^>]*>/g, '').trim();
    const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    const meta = html.match(/name="description"[^>]*content="([^"]*)"/i)?.[1] || '';
    const h1s = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map(m => strip(m[1])).filter(Boolean).slice(0, 5);
    const h2s = Array.from(html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)).map(m => strip(m[1])).filter(Boolean).slice(0, 8);
    const btns = Array.from(html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)).map(m => strip(m[1])).filter(Boolean).slice(0, 15);
    const anchors = Array.from(html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)).map(m => strip(m[1])).filter(t => t.length > 2 && t.length < 50).slice(0, 20);
    siteContext = `
URL: ${url}
Plataforma: ${platform}
Título: ${title}
Meta descripción: ${meta}
H1s: ${h1s.join(' | ')}
H2s: ${h2s.join(' | ')}
Botones y CTAs: ${btns.join(' | ')}
Links de navegación: ${anchors.join(' | ')}
    `.trim();
  } catch {
    // fallback to URL-only analysis
  }

  const brandCtx = brand ? `\nMarca analizada: ${brand.name} (${brand.industry}, ${brand.country})` : '';

  const prompt = `Sos una experta en UX/UI y conversión de ecommerce. Analizá esta tienda y generá un reporte completo.
${brandCtx}

Información extraída de la tienda:
${siteContext}

Generá el análisis en JSON con esta estructura exacta:
{
  "overallScore": número 0-100,
  "platform": "${platform}",
  "scores": {
    "design": número 0-100,
    "navigation": número 0-100,
    "productPages": número 0-100,
    "checkout": número 0-100,
    "speed": número 0-100,
    "ctas": número 0-100,
    "funnel": número 0-100
  },
  "issues": ["al menos 6 problemas concretos detectados"],
  "opportunities": ["al menos 6 oportunidades de mejora"],
  "improvements": [
    {"priority": "alta", "action": "acción concreta", "impact": "qué mejora y cuánto"},
    ... al menos 8 mejoras ordenadas por prioridad
  ],
  "designAnalysis": "análisis detallado del diseño y estética visual",
  "navigationAnalysis": "análisis de la estructura de navegación y UX",
  "productPageAnalysis": "análisis de las fichas de producto",
  "checkoutAnalysis": "análisis del proceso de compra y conversión",
  "ctaAnalysis": "análisis de los llamados a la acción",
  "funnelAnalysis": "análisis del embudo de venta completo",
  "summary": "resumen ejecutivo del estado de la tienda en 3-4 oraciones"
}

Respondé en español rioplatense, sé específica y actionable. Solo el JSON, sin texto adicional.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return NextResponse.json(parseClaudeJSON(text));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
