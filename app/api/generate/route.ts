import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SEASON_TIPS: Record<string, string> = {
  verano: 'verano, calor, vacaciones, playa, pileta, lifestyle veraniejo, Año Nuevo',
  otoño: 'otoño, vuelta al trabajo, clima fresco, colores tierra, layering',
  invierno: 'invierno, frío, abrigos, Fiestas, Navidad, Año Nuevo, temporada de descuentos de invierno',
  primavera: 'primavera, renovación, salidas, colores nuevos, vuelta al cole',
};

function getSeasonAR(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'otoño';
  if (m >= 6 && m <= 8) return 'invierno';
  if (m >= 9 && m <= 11) return 'primavera';
  return 'verano';
}

function buildSystemPrompt(brandContext: string, mode: string, language: string): string {
  const season = getSeasonAR();
  const seasonTips = SEASON_TIPS[season] ?? '';

  return `Sos un experto en marketing de contenidos para redes sociales, especializado en el mercado latinoamericano, especialmente Argentina.

Trabajás para una PM de marketing llamada María que maneja marcas de ecommerce.

CONTEXTO DE MARCA:
${brandContext}

TEMPORADA ACTUAL: ${season} (temas relevantes: ${seasonTips})

REGLAS GENERALES:
- Usá siempre el idioma/variante indicado de la marca (${language})
- Respetá estrictamente el perfil de voz: tono, frases características, palabras prohibidas
- El contenido tiene que ser específico para la marca, no genérico
- Sin frases corporativas vacías. Sin clichés de marketing
- Cada output tiene que poder usarse AHORA, sin edición
- Aplicá lo que Adam Mosseri dice sobre el algoritmo: el contenido que logra que la gente interactúe activamente gana distribución

${getModeInstructions(mode)}`;
}

function getModeInstructions(mode: string): string {
  switch (mode) {
    case 'hook':
      return `MODO: SOLO HOOK
Generá exactamente 3 hooks distintos para un video. Cada hook debe:
- Capturar atención en los primeros 3 segundos
- Ser 1-3 frases cortas con peso real
- Generar curiosidad, urgencia o identificación inmediata
- Variar el tipo: una pregunta directa, un contraste sorpresivo, y una afirmación que molesta o sorprende

Respondé SOLO con JSON válido, sin markdown:
{
  "hooks": [
    { "text": "...", "type": "pregunta|contraste|afirmacion|problema|estadistica", "why": "Por qué funciona" },
    { "text": "...", "type": "...", "why": "..." },
    { "text": "...", "type": "...", "why": "..." }
  ]
}`;

    case 'script':
      return `MODO: GUIÓN COMPLETO
Generá un guión completo de 30-60 segundos para un reel/video. Incluí:
- Hook de apertura (3 seg)
- Desarrollo (contenido/problema/solución)
- CTA claro al final

Respondé SOLO con JSON válido:
{
  "script": {
    "duration": "45 seg aproximadamente",
    "hook": "...",
    "body": "...",
    "cta": "...",
    "fullScript": "Texto completo corrido para leer/grabar",
    "tips": ["Tip de grabación 1", "Tip 2"]
  }
}`;

    case 'script_scene':
      return `MODO: GUIÓN + ESCENA
Generá un guión completo con descripción de cada escena visual. Para cada parte:
- El texto que se dice/escribe
- La descripción de qué se ve en pantalla
- Dirección de cámara/ángulo si aplica

Respondé SOLO con JSON válido:
{
  "scriptWithScenes": {
    "duration": "45 seg aproximadamente",
    "scenes": [
      {
        "number": 1,
        "duration": "3 seg",
        "text": "Lo que se dice/muestra",
        "visual": "Descripción de lo que se ve",
        "direction": "Ángulo de cámara o indicación técnica"
      }
    ],
    "totalText": "Guión completo corrido",
    "productionTips": ["Tip 1", "Tip 2"]
  }
}`;

    default:
      return '';
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'API key no configurada. Agregá ANTHROPIC_API_KEY en el archivo .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { mode, brandContext, language, topic, extraContext } = body;

    if (!mode || !brandContext) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const userMessage = `Generá contenido para el siguiente tema/producto: "${topic || 'la marca en general'}"${extraContext ? `\n\nContexto adicional: ${extraContext}` : ''}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: buildSystemPrompt(brandContext, mode, language || 'español'),
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      parsed = parseClaudeJSON(rawContent);
    } catch {
      parsed = { rawText: rawContent };
    }

    return NextResponse.json({ result: parsed, mode });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
