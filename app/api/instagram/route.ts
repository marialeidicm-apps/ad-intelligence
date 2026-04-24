import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeWithApify(username: string): Promise<unknown | null> {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return null;

  try {
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

function countApifyPosts(apifyData: unknown): number {
  if (!apifyData) return 0;
  if (Array.isArray(apifyData)) return apifyData.length;
  // Some scraper responses wrap posts inside a data array
  if (typeof apifyData === 'object' && apifyData !== null) {
    const obj = apifyData as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data.length;
    if (Array.isArray(obj.posts)) return obj.posts.length;
    if (Array.isArray(obj.items)) return obj.items.length;
  }
  return 0;
}

function buildAnalysisPrompt(
  username: string,
  brandContext: string,
  apifyData: unknown | null,
  storeUrl?: string
): string {
  const postCount = countApifyPosts(apifyData);

  const dataSection = apifyData && postCount > 0
    ? `DATOS REALES DEL PERFIL (${postCount} posts obtenidos via Apify):\n${JSON.stringify(apifyData, null, 2).slice(0, 3000)}`
    : `No hay datos de scraping disponibles. Generá un análisis estratégico basado en el rubro y perfil de la marca.`;

  const storeSection = storeUrl
    ? `\nTIENDA ONLINE DE LA MARCA: ${storeUrl}
Analizá qué tipos de productos de esta tienda tienen más potencial para mostrar en Instagram.
Incluí recomendaciones específicas de producto en el plan de acción.`
    : '';

  const postsAnalyzedValue = postCount > 0
    ? postCount
    : '<estimá un número entre 12 y 20 basado en el rubro, NUNCA pongas 0>';

  return `Sos una experta en estrategia de Instagram y crecimiento orgánico para marcas de ecommerce en Latinoamérica. Hablás en español rioplatense, lenguaje simple para dueños de marca.

PERFIL A ANALIZAR: @${username.replace('@', '')}

CONTEXTO DE LA MARCA:
${brandContext}
${storeSection}

${dataSection}

Generá un análisis estratégico completo. Respondé SOLO con JSON válido (sin markdown, sin texto extra):

{
  "username": "${username.replace('@', '')}",
  "postsAnalyzed": ${postsAnalyzedValue},
  "averageEngagement": "<porcentaje estimado, ej: 3.2%>",
  "postingFrequency": "<descripción corta, ej: 2-3 veces por semana>",
  "tone": "<tono detectado en 3 palabras max, ej: Cercano y aspiracional>",
  "dataSource": "${apifyData && postCount > 0 ? 'apify' : 'ai_analysis'}",
  "contentMix": [
    { "type": "Reels", "percentage": 40 },
    { "type": "Carruseles", "percentage": 35 },
    { "type": "Posts estáticos", "percentage": 25 }
  ],
  "topFormats": ["Formato 1", "Formato 2", "Formato 3"],
  "strengths": [
    "Fortaleza específica y concreta 1",
    "Fortaleza 2",
    "Fortaleza 3"
  ],
  "weaknesses": [
    "Debilidad concreta 1",
    "Debilidad 2",
    "Debilidad 3"
  ],
  "opportunities": [
    "Oportunidad de crecimiento 1",
    "Oportunidad 2",
    "Oportunidad 3"
  ],
  "strategicPlan": [
    {
      "action": "Acción concreta con verbo de acción (máx 15 palabras)",
      "audit": [
        { "label": "Aspecto que se evalúa", "status": "bien", "note": "Explicación de por qué está bien" },
        { "label": "Otro aspecto", "status": "mejorar", "note": "Qué hay que cambiar específicamente" },
        { "label": "Tercer aspecto", "status": "mejorar", "note": "Cómo mejorarlo" }
      ],
      "productFocus": "Si aplica: qué producto o categoría específica mostrar en este contenido y por qué tiene potencial",
      "inspirationSearch": "Buscá en Instagram el hashtag #ejemplo o la cuenta @cuentareferente para ver el estilo que querés lograr",
      "script": "HOOK (primeros 2 segundos):\\n\\"Texto del hook que para el scroll\\"\\n\\nDESARROLLO (20 segundos):\\nDescripción de qué mostrar visualmente, cómo moverse, qué decir...\\n\\nCIERRE (3 segundos):\\n\\"Call to action concreto\\"",
      "checklist": [
        "Paso 1: acción específica que puede hacer el dueño solo",
        "Paso 2: otra acción concreta",
        "Paso 3",
        "Paso 4",
        "Paso 5: cuándo publicarlo y a qué hora"
      ],
      "realBrandExamples": [
        "Marca real latinoamericana que ya lo hace bien y qué pueden ver específicamente",
        "Segunda marca de referencia con detalle de qué imitar"
      ]
    },
    {
      "action": "Segunda acción del plan",
      "audit": [
        { "label": "Aspecto 1", "status": "bien", "note": "Detalle" },
        { "label": "Aspecto 2", "status": "mejorar", "note": "Detalle" }
      ],
      "productFocus": "Producto o categoría específica a mostrar",
      "inspirationSearch": "Referencia de búsqueda en redes",
      "script": "HOOK:\\n\\"...\\"\\n\\nDESARROLLO:\\n...\\n\\nCIERRE:\\n\\"...\\"",
      "checklist": ["Paso 1", "Paso 2", "Paso 3", "Paso 4", "Paso 5"],
      "realBrandExamples": ["Marca ejemplo 1", "Marca ejemplo 2"]
    },
    {
      "action": "Tercera acción del plan",
      "audit": [
        { "label": "Aspecto 1", "status": "mejorar", "note": "Detalle" },
        { "label": "Aspecto 2", "status": "bien", "note": "Detalle" }
      ],
      "productFocus": "Producto a destacar",
      "inspirationSearch": "Referencia de búsqueda",
      "script": "HOOK:\\n\\"...\\"\\n\\nDESARROLLO:\\n...\\n\\nCIERRE:\\n\\"...\\"",
      "checklist": ["Paso 1", "Paso 2", "Paso 3", "Paso 4", "Paso 5"],
      "realBrandExamples": ["Marca ejemplo 1", "Marca ejemplo 2"]
    },
    {
      "action": "Cuarta acción del plan",
      "audit": [
        { "label": "Aspecto 1", "status": "mejorar", "note": "Detalle" },
        { "label": "Aspecto 2", "status": "bien", "note": "Detalle" }
      ],
      "productFocus": "Producto a destacar si aplica",
      "inspirationSearch": "Referencia de búsqueda",
      "script": "HOOK:\\n\\"...\\"\\n\\nDESARROLLO:\\n...\\n\\nCIERRE:\\n\\"...\\"",
      "checklist": ["Paso 1", "Paso 2", "Paso 3", "Paso 4", "Paso 5"],
      "realBrandExamples": ["Marca ejemplo 1", "Marca ejemplo 2"]
    },
    {
      "action": "Quinta acción del plan",
      "audit": [
        { "label": "Aspecto 1", "status": "bien", "note": "Detalle" },
        { "label": "Aspecto 2", "status": "mejorar", "note": "Detalle" }
      ],
      "productFocus": "Producto a destacar si aplica",
      "inspirationSearch": "Referencia de búsqueda",
      "script": "HOOK:\\n\\"...\\"\\n\\nDESARROLLO:\\n...\\n\\nCIERRE:\\n\\"...\\"",
      "checklist": ["Paso 1", "Paso 2", "Paso 3", "Paso 4", "Paso 5"],
      "realBrandExamples": ["Marca ejemplo 1", "Marca ejemplo 2"]
    }
  ],
  "storeProductInsights": {
    "topProducts": [
      "Producto/categoría 1 con mayor potencial para redes y por qué",
      "Producto/categoría 2",
      "Producto/categoría 3"
    ],
    "contentOpportunities": [
      "Oportunidad de contenido específica cruzando tienda + redes 1",
      "Oportunidad 2",
      "Oportunidad 3"
    ],
    "crossSellStrategy": "Estrategia concreta de cómo usar el catálogo de la tienda para generar contenido que venda"
  },
  "contentIdeas": [
    "Idea de contenido específica 1 con formato y tema",
    "Idea 2",
    "Idea 3",
    "Idea 4",
    "Idea 5"
  ],
  "followerGrowthTips": [
    "Táctica concreta de crecimiento 1",
    "Táctica 2",
    "Táctica 3"
  ],
  "explorePageStrategy": [
    "Para aparecer en Explorar: acción específica 1",
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
    const { username, brandContext, storeUrl } = body;

    if (!username) {
      return NextResponse.json({ error: 'Falta el usuario de Instagram' }, { status: 400 });
    }

    const apifyData = await analyzeWithApify(username);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{
        role: 'user',
        content: buildAnalysisPrompt(username, brandContext || '', apifyData, storeUrl || ''),
      }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('=== CLAUDE RAW RESPONSE (instagram) ===');
    console.log('stop_reason:', message.stop_reason);
    console.log('usage:', JSON.stringify(message.usage));
    console.log('content length:', rawContent.length);
    console.log('--- FULL TEXT ---');
    console.log(rawContent);
    console.log('=== END CLAUDE RESPONSE ===');

    let parsed;
    try {
      parsed = parseClaudeJSON(rawContent);
    } catch (parseError) {
      const err = parseError instanceof Error ? parseError : new Error(String(parseError));
      return NextResponse.json({ error: err.message, stack: err.stack, detail: String(parseError), rawResponse: rawContent.slice(0, 3000) }, { status: 500 });
    }

    return NextResponse.json({ result: parsed, hasRealData: !!apifyData });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
