import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { informeDiario, informeSemanal, brands } = await req.json();

    if (!brands?.length) {
      return NextResponse.json({ error: 'No hay marcas para analizar' }, { status: 400 });
    }

    const trendsContext = [
      ...(informeDiario?.trends || []),
      ...(informeDiario?.strategies || []),
      ...(informeSemanal?.topTrends || []),
      ...(informeSemanal?.repeatedStrategies || []),
      ...(informeSemanal?.topActions || []),
    ].slice(0, 10).join('\n');

    const brandsContext = brands.map((b: { name: string; industry: string; objective: string; voiceProfile?: { tone?: string } }) =>
      `- ${b.name}: rubro ${b.industry}, objetivo ${b.objective}, tono ${b.voiceProfile?.tone || 'sin definir'}`
    ).join('\n');

    const prompt = `Sos una experta en marketing digital y estrategia de contenido para ecommerce latinoamericano. Rioplatense.

TENDENCIAS Y ESTRATEGIAS DETECTADAS EN REFERENTES:
${trendsContext}

MARCAS DE LA AGENCIA:
${brandsContext}

Para cada tendencia/estrategia, analizá cómo aplicarla a cada marca relevante. Solo sugerí aplicaciones donde tenga sentido real. No fuerces aplicaciones genéricas.

Respondé SOLO con JSON válido (sin markdown):

{
  "aplicaciones": [
    {
      "brandName": "Nombre de la marca exactamente como está arriba",
      "referenteUsername": "username del referente que usó esta estrategia (si sabés, sino ponele 'referente')",
      "strategy": "La estrategia o tendencia específica que detectaste",
      "howToApply": "Cómo aplicarla concretamente a esta marca — quién, qué, cuándo, en qué formato. Muy específico y accionable.",
      "suggestedFormat": "El formato recomendado: reel, carrusel, historia, post estático, etc.",
      "priority": "alta|media|baja",
      "why": "Por qué funciona para esta marca en particular"
    }
  ]
}

Generá entre 3 y 8 aplicaciones concretas. Priorizá las más impactantes.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
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
