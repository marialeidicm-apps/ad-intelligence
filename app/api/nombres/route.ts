import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { productDescription, brandContext } = await req.json();

    if (!productDescription) {
      return NextResponse.json({ error: 'Falta la descripción del producto' }, { status: 400 });
    }

    const prompt = `Sos una experta en branding, copywriting y marketing para ecommerce latinoamericano. Hablás en español rioplatense.

DESCRIPCIÓN DEL PRODUCTO:
${productDescription}

${brandContext ? `CONTEXTO DE LA MARCA:\n${brandContext}` : ''}

Generá opciones creativas y comerciales para este producto. Respondé SOLO con JSON válido (sin markdown):

{
  "names": [
    "Nombre creativo 1",
    "Nombre creativo 2",
    "Nombre creativo 3",
    "Nombre creativo 4",
    "Nombre creativo 5"
  ],
  "productDescriptions": [
    "Descripción completa para ficha de producto 1 (3-4 oraciones, beneficios + características + llamado a acción)",
    "Descripción alternativa 2 más emotiva y storytelling",
    "Descripción 3 más técnica y detallada"
  ],
  "instagramCopys": [
    "Copy para Instagram 1 con emojis relevantes y hashtags al final",
    "Copy 2 más conversacional y que genere engagement",
    "Copy 3 tipo historia o behind the scenes"
  ],
  "videoHooks": [
    "Hook para video 1 (primera oración que detiene el scroll, máx 10 palabras)",
    "Hook 2 tipo pregunta o dato sorprendente",
    "Hook 3 tipo desafío o transformación"
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ result: parsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
