import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, instagramUsername, manualComments } = await req.json();

  const username = instagramUsername || brand?.instagramUsername || 'cuenta';
  const brandCtx = brand
    ? `Marca: ${brand.name}, Industria: ${brand.industry}, País: ${brand.country}, Cliente ideal: ${brand.voiceProfile?.idealCustomer || 'No especificado'}`
    : 'Marca no especificada';

  const commentsCtx = manualComments
    ? `\nCOMENTARIOS REALES PEGADOS:\n${manualComments}`
    : `\nNo se pegaron comentarios reales. Generá un análisis basado en el perfil de la marca y los patrones típicos de comentarios en cuentas de ${brand?.industry || 'ecommerce'}.`;

  const prompt = `Sos una analista de comunidades y social media. Analizá los comentarios de Instagram de esta marca.

${brandCtx}
Username de Instagram: @${username}
${commentsCtx}

Generá un análisis detallado de los comentarios en JSON con esta estructura exacta:
{
  "faqs": [
    "¿Pregunta frecuente 1?",
    "¿Pregunta frecuente 2?",
    "¿Pregunta frecuente 3?",
    "¿Pregunta frecuente 4?",
    "¿Pregunta frecuente 5?"
  ],
  "objections": [
    "Objeción o queja detectada 1",
    "Objeción 2",
    "Objeción 3",
    "Objeción 4"
  ],
  "positive": [
    "Cosa positiva que rescatan 1",
    "Cosa positiva 2",
    "Cosa positiva 3",
    "Cosa positiva 4"
  ],
  "requests": [
    "Cosa que piden o desean 1",
    "Pedido 2",
    "Pedido 3",
    "Pedido 4"
  ],
  "contentIdeas": [
    "Idea de contenido derivada de los comentarios 1",
    "Idea 2",
    "Idea 3",
    "Idea 4",
    "Idea 5",
    "Idea 6"
  ],
  "productImprovements": [
    "Mejora de producto/comunicación sugerida por los comentarios 1",
    "Mejora 2",
    "Mejora 3",
    "Mejora 4"
  ],
  "summary": "resumen de lo que revelan los comentarios sobre la comunidad y oportunidades clave"
}

Respondé en español rioplatense. Solo el JSON, sin texto extra.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return NextResponse.json(parseClaudeJSON(text));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
