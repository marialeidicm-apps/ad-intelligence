import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { brand, recentContent, memories } = await req.json();
  if (!brand) return NextResponse.json({ error: 'Marca requerida' }, { status: 400 });

  const contentCtx = recentContent?.length
    ? `\nContenido generado recientemente (${recentContent.length} items): ${recentContent.slice(0, 5).map((c: { type: string; title: string }) => `${c.type}: ${c.title}`).join(', ')}`
    : '\nNo hay contenido previo registrado.';

  const memoriesCtx = memories?.length
    ? `\nMemoria del cliente:\n${memories.map((m: { category: string; content: string }) => `- [${m.category}] ${m.content}`).join('\n')}`
    : '';

  const prompt = `Sos asistente de marketing de una agencia. Preparás el briefing previo a reuniones con clientes. Generá el material de preparación para la reunión con este cliente.

MARCA: ${brand.name}
INDUSTRIA: ${brand.industry}
PAÍS: ${brand.country}
PLATAFORMA: ${brand.ecommercePlatform}
OBJETIVO: ${brand.objective}
PERFIL DE VOZ: ${brand.voiceProfile?.tone || 'No especificado'}
CLIENTE IDEAL: ${brand.voiceProfile?.idealCustomer || 'No especificado'}
${contentCtx}
${memoriesCtx}

Generá el briefing de reunión en JSON con esta estructura exacta:
{
  "currentState": "resumen del estado actual de la marca en 3-4 oraciones concretas, qué está bien, qué falta",
  "pending": [
    "Pendiente o tarea sin resolver 1",
    "Pendiente 2",
    "Pendiente 3",
    "Pendiente 4",
    "Pendiente 5"
  ],
  "proposals": [
    "Propuesta concreta para presentar hoy 1",
    "Propuesta 2",
    "Propuesta 3",
    "Propuesta 4"
  ],
  "questionsToAsk": [
    "¿Pregunta importante para hacerle al cliente 1?",
    "¿Pregunta 2?",
    "¿Pregunta 3?",
    "¿Pregunta 4?",
    "¿Pregunta 5?"
  ],
  "opportunities": [
    "Oportunidad detectada que el cliente debería saber 1",
    "Oportunidad 2",
    "Oportunidad 3",
    "Oportunidad 4"
  ]
}

Respondé en español rioplatense, con tono profesional pero cercano. Solo el JSON.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON en respuesta de Claude');
    return NextResponse.json(JSON.parse(match[0]));
  } catch (error) {
    console.error('reunion route error:', error);
    return NextResponse.json({ error: 'No se pudo generar el briefing' }, { status: 500 });
  }
}
