import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export async function POST(req: NextRequest) {
  const { brand, month, year, recentContent } = await req.json();
  if (!brand || !month || !year) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const monthName = MONTHS[month - 1];
  const contentCtx = recentContent?.length
    ? `Contenido generado este mes (${recentContent.length} piezas): ${recentContent.map((c: { type: string; title: string }) => `${c.type}`).join(', ')}`
    : 'No se registró contenido generado este mes.';

  const prompt = `Sos una account manager de agencia de marketing. Generá el reporte mensual de ${monthName} ${year} para esta marca.

MARCA: ${brand.name}
INDUSTRIA: ${brand.industry}
PAÍS: ${brand.country}
PLATAFORMA ECOMMERCE: ${brand.ecommercePlatform}
OBJETIVO: ${brand.objective}
${contentCtx}

Generá el reporte mensual en JSON con esta estructura exacta:
{
  "improvements": [
    "Qué mejoró este mes 1 (concreto y específico)",
    "Mejora 2",
    "Mejora 3",
    "Mejora 4",
    "Mejora 5"
  ],
  "pending": [
    "Qué falta o sigue pendiente 1",
    "Pendiente 2",
    "Pendiente 3",
    "Pendiente 4"
  ],
  "estimatedMetrics": [
    {"metric": "Nombre de métrica", "value": "valor estimado", "trend": "subió" | "bajó" | "estable"},
    {"metric": "Alcance orgánico", "value": "estimado", "trend": "subió"},
    {"metric": "Engagement rate", "value": "estimado %", "trend": "estable"},
    {"metric": "Tráfico a la tienda", "value": "estimado", "trend": "subió"},
    {"metric": "Conversión", "value": "estimado %", "trend": "estable"}
  ],
  "nextSteps": [
    "Próximo paso para el mes que viene 1",
    "Próximo paso 2",
    "Próximo paso 3",
    "Próximo paso 4",
    "Próximo paso 5"
  ],
  "achievements": [
    "Logro destacado del mes 1",
    "Logro 2",
    "Logro 3"
  ],
  "summary": "resumen ejecutivo del mes en 4-5 oraciones, tono profesional pero cercano, para mostrarle al cliente"
}

Respondé en español rioplatense, tono profesional. Solo el JSON.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: 'No se pudo generar el reporte' }, { status: 500 });
  }
}
