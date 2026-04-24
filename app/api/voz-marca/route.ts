import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { instagramData, brandName, industry } = await req.json();

    if (!instagramData) {
      return NextResponse.json({ error: 'Faltan datos de Instagram' }, { status: 400 });
    }

    const prompt = `Sos una experta en análisis de voz de marca y comunicación digital para ecommerce latinoamericano.

MARCA: ${brandName}
RUBRO: ${industry}

DATOS DEL ANÁLISIS DE INSTAGRAM:
${JSON.stringify(instagramData, null, 2).slice(0, 3000)}

Analizá en profundidad cómo habla esta marca. Detectá:
- Su tono y estilo comunicativo
- Las frases que usa repetidamente
- El nivel de formalidad
- Los emojis que usa más
- A quién le habla (su cliente ideal)
- Su personalidad de marca

Respondé SOLO con JSON válido (sin markdown):

{
  "tone": "Descripción detallada del tono (ej: 'Cercano, entusiasta y aspiracional. Habla como una amiga que sabe de moda, no como una marca fría.')",
  "formality": "<muy_formal|formal|neutro|informal|muy_informal>",
  "characteristicPhrases": [
    "Frase o expresión típica 1 que usaría esta marca",
    "Frase 2",
    "Frase 3",
    "Frase 4",
    "Frase 5"
  ],
  "bannedWords": [
    "Palabra o frase que NO usaría esta marca 1",
    "Palabra prohibida 2",
    "Palabra prohibida 3"
  ],
  "emojis": ["emoji1", "emoji2", "emoji3", "emoji4", "emoji5"],
  "idealCustomer": "Descripción del cliente ideal en 2-3 oraciones: quién es, qué le importa, por qué compraría esta marca",
  "brandPersonality": "La personalidad de la marca en 1-2 oraciones, como si fuera una persona",
  "communicationStyle": "Estilo de comunicación: cómo arma sus copies, qué estructura usa, si es más directa o narrativa"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result: parseClaudeJSON(rawContent) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
