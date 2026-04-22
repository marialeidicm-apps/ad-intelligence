import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { posts, referentes, date } = await req.json();

    if (!posts?.length) {
      return NextResponse.json({ error: 'No hay posts para analizar' }, { status: 400 });
    }

    const postsResumen = posts.slice(0, 30).map((p: { username: string; type: string; caption: string; likesCount: number; commentsCount: number; isViral: boolean }) =>
      `@${p.username} [${p.type}] ${p.isViral ? '🔥 VIRAL' : ''}\nCaption: ${p.caption?.slice(0, 200) || 'Sin caption'}\nLikes: ${p.likesCount} | Comments: ${p.commentsCount}`
    ).join('\n\n---\n\n');

    const referentesInfo = referentes.map((r: { username: string; category: string }) => `@${r.username} (${r.category})`).join(', ');

    const prompt = `Sos una experta en tendencias de marketing digital y redes sociales para Latinoamérica. Hablás en español rioplatense.

FECHA: ${date || new Date().toLocaleDateString('es-AR')}
REFERENTES MONITOREADOS: ${referentesInfo}

POSTS PUBLICADOS HOY:
${postsResumen}

Analizá qué publicaron estos referentes hoy y generá un informe diario. Respondé SOLO con JSON válido (sin markdown):

{
  "highlights": [
    "Highlight importante del día 1 — qué publicó quién y por qué importa",
    "Highlight 2",
    "Highlight 3",
    "Highlight 4",
    "Highlight 5"
  ],
  "strategies": [
    "Estrategia detectada 1 — qué técnica de contenido o comunicación se vio",
    "Estrategia 2",
    "Estrategia 3"
  ],
  "trends": [
    "Tendencia detectada hoy 1",
    "Tendencia 2",
    "Tendencia 3"
  ],
  "viralContent": [
    "Descripción del contenido viral más relevante del día",
    "Segundo contenido viral si hay"
  ],
  "fullReport": "Informe completo del día en texto corrido. 3-4 párrafos. Explicá qué pasó hoy en el mundo de los referentes, qué fue lo más llamativo, qué estrategias emergieron, qué deberías tener en cuenta para tus marcas. Tono analítico pero accesible, en rioplatense."
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ result: parsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
