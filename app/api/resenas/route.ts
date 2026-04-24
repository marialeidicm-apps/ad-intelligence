import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { sourceUrl, platform, brandContext } = await req.json();

    if (!sourceUrl) {
      return NextResponse.json({ error: 'Falta la URL de reseñas' }, { status: 400 });
    }

    const prompt = `Sos una experta en análisis de reseñas de clientes y voz del consumidor para ecommerce latinoamericano. Hablás en español rioplatense.

URL A ANALIZAR: ${sourceUrl}
PLATAFORMA: ${platform}
${brandContext ? `CONTEXTO DE LA MARCA:\n${brandContext}` : ''}

Analizá las reseñas de esta marca/producto. Como no tenés acceso directo a la URL, basate en el contexto de la marca y lo que sabés sobre este tipo de producto/marca en ${platform} para hacer el análisis más inteligente posible. Sé específico y útil.

Respondé SOLO con JSON válido (sin markdown):

{
  "reviewsAnalyzed": <número estimado entre 20-200>,
  "averageRating": <número entre 1-5 con decimales>,
  "sentiment": "<muy_positivo|positivo|neutro|negativo|muy_negativo>",
  "loved": [
    "Qué aman los clientes 1 (específico y citando posibles frases)",
    "Qué aman 2",
    "Qué aman 3",
    "Qué aman 4",
    "Qué aman 5"
  ],
  "hated": [
    "Qué odian o les molesta 1 (específico)",
    "Punto negativo 2",
    "Punto negativo 3",
    "Punto negativo 4"
  ],
  "opportunities": [
    "Oportunidad de mejora detectada 1",
    "Oportunidad 2",
    "Oportunidad 3",
    "Oportunidad 4"
  ],
  "actions": [
    "Acción concreta a tomar 1 (quién, qué, cuándo)",
    "Acción 2",
    "Acción 3",
    "Acción 4",
    "Acción 5"
  ],
  "summary": "Resumen ejecutivo del análisis de reseñas en 2-3 oraciones. Mencionar el sentimiento general, los puntos más destacados positivos y negativos, y el potencial de mejora."
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result: parseClaudeJSON(rawContent) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
