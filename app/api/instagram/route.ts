import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeWithApify(username: string): Promise<unknown | null> {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return null;

  try {
    // Start Apify actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [username.replace('@', '')],
          resultsLimit: 20,
        }),
      }
    );

    if (!runRes.ok) return null;
    const run = await runRes.json();
    const runId = run.data?.id;
    if (!runId) return null;

    // Wait for completion (max 30 seconds)
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
      );
      const status = await statusRes.json();
      if (status.data?.status === 'SUCCEEDED') {
        const dataRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`
        );
        return await dataRes.json();
      }
      if (status.data?.status === 'FAILED') return null;
    }
    return null;
  } catch {
    return null;
  }
}

function buildAnalysisPrompt(username: string, brandContext: string, apifyData: unknown | null): string {
  const dataSection = apifyData
    ? `DATOS REALES DEL PERFIL (Apify):\n${JSON.stringify(apifyData, null, 2).slice(0, 3000)}`
    : `No hay datos de scraping disponibles. Generá un análisis estratégico basado en el rubro y perfil de la marca.`;

  return `Sos una experta en estrategia de Instagram y crecimiento orgánico para marcas de ecommerce en Latinoamérica.

PERFIL A ANALIZAR: @${username.replace('@', '')}

CONTEXTO DE LA MARCA:
${brandContext}

${dataSection}

Generá un análisis estratégico completo. Respondé SOLO con JSON válido (sin markdown):

{
  "username": "${username.replace('@', '')}",
  "postsAnalyzed": <número o estimado>,
  "averageEngagement": "<porcentaje estimado>",
  "postingFrequency": "<descripción>",
  "tone": "<descripción del tono detectado>",
  "dataSource": "${apifyData ? 'apify' : 'ai_analysis'}",
  "contentMix": [
    { "type": "Reels", "percentage": 40 },
    { "type": "Carruseles", "percentage": 35 },
    { "type": "Posts estáticos", "percentage": 25 }
  ],
  "topFormats": ["Formato 1", "Formato 2", "Formato 3"],
  "strengths": [
    "Fortaleza específica 1",
    "Fortaleza específica 2",
    "Fortaleza específica 3"
  ],
  "weaknesses": [
    "Debilidad concreta 1",
    "Debilidad concreta 2",
    "Debilidad concreta 3"
  ],
  "opportunities": [
    "Oportunidad de crecimiento 1",
    "Oportunidad 2",
    "Oportunidad 3"
  ],
  "strategicPlan": [
    "Acción concreta 1 (qué hacer esta semana)",
    "Acción 2",
    "Acción 3",
    "Acción 4",
    "Acción 5"
  ],
  "contentIdeas": [
    "Idea de contenido específica 1",
    "Idea 2",
    "Idea 3",
    "Idea 4",
    "Idea 5"
  ],
  "followerGrowthTips": [
    "Táctica de crecimiento 1",
    "Táctica 2",
    "Táctica 3"
  ],
  "explorePageStrategy": [
    "Para aparecer en Explorar: acción 1",
    "Acción 2",
    "Acción 3"
  ]
}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'API key no configurada. Agregá ANTHROPIC_API_KEY en .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { username, brandContext } = body;

    if (!username) {
      return NextResponse.json({ error: 'Falta el usuario de Instagram' }, { status: 400 });
    }

    // Try Apify first
    const apifyData = await analyzeWithApify(username);

    // Always use Claude for analysis (with or without Apify data)
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: buildAnalysisPrompt(username, brandContext || '', apifyData),
      }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      const clean = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'Error al procesar la respuesta de IA' }, { status: 500 });
    }

    return NextResponse.json({ result: parsed, hasRealData: !!apifyData });
  } catch (error: unknown) {
    console.error('Instagram analysis error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al analizar: ${message}` }, { status: 500 });
  }
}
