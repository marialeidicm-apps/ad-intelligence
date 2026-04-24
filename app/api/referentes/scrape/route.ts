import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/storage';
import { ReferentePost } from '@/lib/types';

async function scrapeInstagramProfile(username: string, apifyToken: string): Promise<ReferentePost[] | null> {
  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username.replace('@', '')], resultsLimit: 12 }),
      }
    );
    if (!runRes.ok) return null;
    const run = await runRes.json();
    const runId = run.data?.id;
    if (!runId) return null;

    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const status = await statusRes.json();
      if (status.data?.status === 'SUCCEEDED') {
        const dataRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`
        );
        const items = await dataRes.json();
        return mapApifyToPosts(username, items);
      }
      if (status.data?.status === 'FAILED') return null;
    }
    return null;
  } catch {
    return null;
  }
}

function mapApifyToPosts(username: string, items: unknown[]): ReferentePost[] {
  if (!Array.isArray(items)) return [];
  const posts: ReferentePost[] = [];
  for (const item of items.slice(0, 15)) {
    const i = item as Record<string, unknown>;
    const likes = Number(i.likesCount || i.likes || 0);
    const comments = Number(i.commentsCount || i.comments || 0);
    const views = Number(i.videoViewCount || i.viewsCount || 0);
    const followers = Number(i.followersCount || 10000);
    const engagement = followers > 0 ? ((likes + comments) / followers) * 100 : 0;
    const viralScore = Math.min(100, Math.round(engagement * 5));

    posts.push({
      id: generateId(),
      referenteId: '',
      username: username.replace('@', ''),
      postUrl: String(i.url || i.postUrl || ''),
      type: String(i.type || '').toLowerCase().includes('video') ? 'reel'
        : String(i.type || '').toLowerCase().includes('sidecar') ? 'carrusel'
        : 'post',
      caption: String(i.caption || i.text || '').slice(0, 500),
      likesCount: likes,
      commentsCount: comments,
      viewsCount: views || undefined,
      publishedAt: String(i.timestamp || i.takenAt || new Date().toISOString()),
      scrapedAt: new Date().toISOString(),
      isViral: viralScore >= 70,
      viralScore,
    });
  }
  return posts;
}

export async function POST(req: NextRequest) {
  try {
    const { referentes, apifyToken: clientToken } = await req.json();
    const apifyToken = clientToken || process.env.APIFY_TOKEN;

    if (!apifyToken) {
      return NextResponse.json({ error: 'Configurá el token de Apify en Settings' }, { status: 400 });
    }
    if (!referentes?.length) {
      return NextResponse.json({ error: 'No hay referentes configurados' }, { status: 400 });
    }

    const results: { referenteId: string; username: string; posts: ReferentePost[]; error?: string }[] = [];

    // Scrape up to 5 at a time to avoid timeout
    const batch = referentes.slice(0, 5);
    for (const ref of batch) {
      const posts = await scrapeInstagramProfile(ref.username, apifyToken);
      if (posts) {
        const withId = posts.map(p => ({ ...p, referenteId: ref.id }));
        results.push({ referenteId: ref.id, username: ref.username, posts: withId });
      } else {
        results.push({ referenteId: ref.id, username: ref.username, posts: [], error: 'Sin datos' });
      }
    }

    const allPosts = results.flatMap(r => r.posts);
    const viralPosts = allPosts.filter(p => p.isViral);

    return NextResponse.json({
      results,
      totalPosts: allPosts.length,
      viralCount: viralPosts.length,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
