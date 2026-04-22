import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { brandContext, brandName, services, customNote } = await req.json();

    if (!brandName || !services?.length) {
      return NextResponse.json({ error: 'Faltan datos de la propuesta' }, { status: 400 });
    }

    const serviceList = services.map((s: { name: string; price: number }) => `- ${s.name}: $${s.price.toLocaleString()}`).join('\n');
    const total = services.reduce((sum: number, s: { price: number }) => sum + s.price, 0);

    const prompt = `Sos una experta en marketing digital y redacción de propuestas comerciales profesionales para agencias de ecommerce latinoamericanas. Hablás en español neutro-profesional pero accesible.

CLIENTE: ${brandName}
${brandContext ? `CONTEXTO DE LA MARCA:\n${brandContext}` : ''}

SERVICIOS A OFRECER:
${serviceList}
TOTAL: $${total.toLocaleString()} / mes

${customNote ? `NOTA ADICIONAL: ${customNote}` : ''}

Generá una propuesta comercial profesional y persuasiva. Respondé SOLO con JSON válido (sin markdown):

{
  "brandAnalysis": "Párrafo de análisis de la marca mostrando que la entendemos profundamente (2-3 oraciones específicas sobre su situación actual y oportunidades)",
  "objectives": [
    "Objetivo estratégico 1 con métrica posible",
    "Objetivo 2",
    "Objetivo 3",
    "Objetivo 4"
  ],
  "workPlan": [
    { "week": "Semana 1-2", "tasks": ["Tarea específica 1", "Tarea 2", "Tarea 3"] },
    { "week": "Semana 3-4", "tasks": ["Tarea 1", "Tarea 2", "Tarea 3"] },
    { "week": "Mes 2", "tasks": ["Tarea 1", "Tarea 2", "Tarea 3"] },
    { "week": "Mes 3+", "tasks": ["Tarea 1", "Tarea 2", "Tarea 3"] }
  ],
  "proposalText": "Texto completo de la propuesta listo para enviar. Debe incluir: saludo personalizado, análisis de la marca, por qué trabajar con nosotros, descripción de los servicios ofrecidos, el plan de trabajo resumido, los resultados esperados, y cierre con llamado a acción. Tono profesional pero cálido. Mínimo 300 palabras.",
  "whyUs": [
    "Diferenciador 1 de tu agencia",
    "Diferenciador 2",
    "Diferenciador 3"
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
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
