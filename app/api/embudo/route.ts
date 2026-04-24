import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand } = await req.json();
  if (!brand) return NextResponse.json({ error: 'Marca requerida' }, { status: 400 });

  const prompt = `Sos una estratega de marketing digital. Analizá el embudo de conversión de esta marca y generá un diagnóstico completo.

MARCA: ${brand.name}
INDUSTRIA: ${brand.industry}
PAÍS: ${brand.country}
PLATAFORMA ECOMMERCE: ${brand.ecommercePlatform}
REDES SOCIALES: ${brand.socialNetworks?.join(', ')}
OBJETIVO: ${brand.objective}
PERFIL DE VOZ: ${brand.voiceProfile?.tone || 'No especificado'}
CLIENTE IDEAL: ${brand.voiceProfile?.idealCustomer || 'No especificado'}

Generá el análisis del embudo en JSON con esta estructura exacta:
{
  "stages": {
    "awareness": {
      "name": "Awareness",
      "score": número 0-100,
      "status": "bien" | "regular" | "mal",
      "whyFailing": "explicación concreta de por qué falla o está bien",
      "improvements": ["mejora 1", "mejora 2", "mejora 3"]
    },
    "consideration": {
      "name": "Consideración",
      "score": número 0-100,
      "status": "bien" | "regular" | "mal",
      "whyFailing": "explicación",
      "improvements": ["mejora 1", "mejora 2", "mejora 3"]
    },
    "decision": {
      "name": "Decisión",
      "score": número 0-100,
      "status": "bien" | "regular" | "mal",
      "whyFailing": "explicación",
      "improvements": ["mejora 1", "mejora 2", "mejora 3"]
    },
    "purchase": {
      "name": "Compra",
      "score": número 0-100,
      "status": "bien" | "regular" | "mal",
      "whyFailing": "explicación",
      "improvements": ["mejora 1", "mejora 2", "mejora 3"]
    },
    "retention": {
      "name": "Retención",
      "score": número 0-100,
      "status": "bien" | "regular" | "mal",
      "whyFailing": "explicación",
      "improvements": ["mejora 1", "mejora 2", "mejora 3"]
    }
  },
  "weakestStage": "nombre de la etapa más débil",
  "strategicPlan": [
    "paso 1 del plan estratégico concreto",
    "paso 2",
    "paso 3",
    "paso 4",
    "paso 5",
    "paso 6"
  ],
  "summary": "resumen del estado del embudo en 3-4 oraciones, qué falla y por qué"
}

Sé específica basándote en el tipo de marca e industria. Respondé en español rioplatense. Solo el JSON.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return NextResponse.json(parseClaudeJSON(text));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
