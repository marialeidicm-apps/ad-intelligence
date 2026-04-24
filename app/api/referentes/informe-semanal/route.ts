import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { posts, informesDiarios, weekStart, weekEnd } = await req.json();

    const postsResumen = posts?.slice(0, 50).map((p: { username: string; type: string; caption: string; likesCount: number; isViral: boolean }) =>
      `@${p.username} [${p.type}] ${p.isViral ? '🔥' : ''} | Likes: ${p.likesCount} | "${p.caption?.slice(0, 150) || ''}"`
    ).join('\n') || 'Sin posts esta semana';

    const informesResumen = informesDiarios?.slice(0, 7).map((inf: { date: string; trends: string[]; strategies: string[] }) =>
      `${inf.date}: ${[...(inf.trends || []), ...(inf.strategies || [])].join(' | ')}`
    ).join('\n') || 'Sin informes diarios';

    const prompt = `Sos una experta en análisis de tendencias de marketing digital para ecommerce latinoamericano. Rioplatense.

SEMANA: ${weekStart} al ${weekEnd}

POSTS DE LA SEMANA:
${postsResumen}

RESUMEN DE INFORMES DIARIOS:
${informesResumen}

Generá el informe semanal de referentes. Respondé SOLO con JSON válido (sin markdown):

{
  "topTrends": [
    "Tendencia top 1 que se vio varias veces esta semana — específica y accionable",
    "Tendencia 2",
    "Tendencia 3",
    "Tendencia 4",
    "Tendencia 5"
  ],
  "repeatedStrategies": [
    "Estrategia que se repitió 1 — qué hacen y por qué funciona",
    "Estrategia repetida 2",
    "Estrategia repetida 3"
  ],
  "topActions": [
    "Acción concreta que está funcionando en el mercado 1",
    "Acción 2",
    "Acción 3",
    "Acción 4"
  ],
  "marketInsights": [
    "Insight del mercado 1 — algo que aprendiste sobre cómo está comunicando el mercado",
    "Insight 2",
    "Insight 3"
  ],
  "fullReport": "Informe semanal completo. 4-5 párrafos. Resumen de la semana: qué tendencias dominaron, qué estrategias se repitieron, qué formatos funcionaron mejor, qué cambió respecto a semanas anteriores, y cuáles son las 3 cosas más importantes para implementar la semana que viene. Tono: analítico, directo, útil. Rioplatense."
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result: parseClaudeJSON(raw) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
