import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseClaudeJSON } from '@/lib/parseClaudeJSON';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 503 });
  }

  try {
    const { posts, informeDiario, referentes, count = 3 } = await req.json();

    const postsDestacados = posts?.filter((p: { isViral: boolean }) => p.isViral).slice(0, 10)
      .map((p: { username: string; type: string; caption: string; likesCount: number }) =>
        `@${p.username} [${p.type}] "${p.caption?.slice(0, 200) || ''}" (${p.likesCount} likes)`
      ).join('\n') || '';

    const trendsHoy = [
      ...(informeDiario?.trends || []),
      ...(informeDiario?.highlights || []),
    ].join('\n') || 'Tendencias generales de marketing y emprendimiento';

    const referentesActivos = referentes?.map((r: { username: string; category: string }) => `@${r.username} (${r.category})`).join(', ') || '';

    const prompt = `Sos una experta en creación de contenido para marca personal de marketing digital. Conocés bien a María (@marialeidi__).

SOBRE MARÍA:
- Community manager y estratega de marketing para marcas de ecommerce
- Argentina, habla rioplatense — directo, sin vueltas, auténtico
- Edad: 24 años. Enérgica, práctica, va al grano
- Voz: cercana pero profesional, sin jerga corporativa, comparte lo que sabe sin rodeos
- Audiencia: emprendedores, dueños de marcas, CMs que quieren aprender

REFERENTES QUE SIGUE: ${referentesActivos}

CONTENIDO VIRAL DE HOY EN REFERENTES:
${postsDestacados}

TENDENCIAS DEL DÍA:
${trendsHoy}

Generá ${count} ideas de contenido para que María publique HOY en su perfil personal, inspiradas en lo que vio en sus referentes pero adaptadas a su voz y audiencia.

Respondé SOLO con JSON válido (sin markdown):

{
  "contenidos": [
    {
      "inspiradoEn": "username del referente que inspiró esto",
      "formato": "historia|post|reel|tiktok|carrusel",
      "titulo": "Título o tema del contenido",
      "hook": "Primera oración o pantalla — tiene que parar el scroll. Máx 15 palabras. Directo, sin rodeos, rioplatense.",
      "guion": "Guión completo del contenido. Si es reel/tiktok: estructurado en escenas. Si es carrusel: slide por slide. Si es historia: qué va en cada story. Sé específico y práctico. Voz de María.",
      "copy": "El copy para el caption de Instagram/TikTok. Con emojis donde corresponda. En rioplatense. Cierra con pregunta o CTA.",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result: parseClaudeJSON(raw) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
