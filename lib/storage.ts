import {
  Brand, GeneratedContent, FeedItem,
  StoreAnalysis, FunnelAnalysis, MonthlyReport,
  ClientMemory, CommentAnalysis, MeetingBriefing,
} from './types';
import { supabase } from './supabase';

const KEYS = {
  brands: 'ai_brands',
  content: 'ai_content',
  feed: 'ai_feed',
  storeAnalyses: 'ai_store_analyses',
  funnelAnalyses: 'ai_funnel_analyses',
  monthlyReports: 'ai_monthly_reports',
  clientMemories: 'ai_client_memories',
  commentAnalyses: 'ai_comment_analyses',
  meetingBriefings: 'ai_meeting_briefings',
} as const;

function get<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- BRANDS ---
export function getBrands(): Brand[] {
  return get<Brand>(KEYS.brands);
}

export function saveBrand(brand: Brand): void {
  const brands = getBrands();
  const idx = brands.findIndex(b => b.id === brand.id);
  if (idx >= 0) {
    brands[idx] = brand;
  } else {
    brands.push(brand);
  }
  set(KEYS.brands, brands);
}

export function deleteBrand(id: string): void {
  set(KEYS.brands, getBrands().filter(b => b.id !== id));
}

export function getBrandById(id: string): Brand | undefined {
  return getBrands().find(b => b.id === id);
}

// --- GENERATED CONTENT ---
export function getContent(): GeneratedContent[] {
  return get<GeneratedContent>(KEYS.content);
}

export function saveContent(item: GeneratedContent): void {
  const all = getContent();
  all.unshift(item);
  set(KEYS.content, all.slice(0, 200));
}

export function getContentByBrand(brandId: string): GeneratedContent[] {
  return getContent().filter(c => c.brandId === brandId);
}

export function deleteContent(id: string): void {
  set(KEYS.content, getContent().filter(c => c.id !== id));
}

// --- FEED ITEMS ---
export function getFeedItems(brandId: string): FeedItem[] {
  return get<FeedItem>(KEYS.feed).filter(f => f.brandId === brandId).sort((a, b) => a.order - b.order);
}

export function saveFeedItem(item: FeedItem): void {
  const all = get<FeedItem>(KEYS.feed);
  const idx = all.findIndex(f => f.id === item.id);
  if (idx >= 0) {
    all[idx] = item;
  } else {
    all.push(item);
  }
  set(KEYS.feed, all);
}

export function deleteFeedItem(id: string): void {
  set(KEYS.feed, get<FeedItem>(KEYS.feed).filter(f => f.id !== id));
}

// --- STORE ANALYSES ---
export function getStoreAnalyses(brandId?: string): StoreAnalysis[] {
  const all = get<StoreAnalysis>(KEYS.storeAnalyses);
  return brandId ? all.filter(a => a.brandId === brandId) : all;
}

export async function saveStoreAnalysis(item: StoreAnalysis): Promise<void> {
  const all = get<StoreAnalysis>(KEYS.storeAnalyses);
  all.unshift(item);
  set(KEYS.storeAnalyses, all.slice(0, 50));
  if (supabase) {
    await supabase.from('store_analyses').upsert({
      id: item.id, brand_id: item.brandId, url: item.url,
      overall_score: item.overallScore, scores: item.scores,
      issues: item.issues, opportunities: item.opportunities,
      improvements: item.improvements, design_analysis: item.designAnalysis,
      navigation_analysis: item.navigationAnalysis,
      product_page_analysis: item.productPageAnalysis,
      checkout_analysis: item.checkoutAnalysis, cta_analysis: item.ctaAnalysis,
      funnel_analysis: item.funnelAnalysis, summary: item.summary,
      platform: item.platform, created_at: item.createdAt,
    });
  }
}

// --- FUNNEL ANALYSES ---
export function getFunnelAnalyses(brandId: string): FunnelAnalysis[] {
  return get<FunnelAnalysis>(KEYS.funnelAnalyses).filter(a => a.brandId === brandId);
}

export async function saveFunnelAnalysis(item: FunnelAnalysis): Promise<void> {
  const all = get<FunnelAnalysis>(KEYS.funnelAnalyses);
  all.unshift(item);
  set(KEYS.funnelAnalyses, all.slice(0, 50));
  if (supabase) {
    await supabase.from('funnel_analyses').upsert({
      id: item.id, brand_id: item.brandId, stages: item.stages,
      weakest_stage: item.weakestStage, strategic_plan: item.strategicPlan,
      summary: item.summary, created_at: item.createdAt,
    });
  }
}

// --- MONTHLY REPORTS ---
export function getMonthlyReports(brandId: string): MonthlyReport[] {
  return get<MonthlyReport>(KEYS.monthlyReports).filter(r => r.brandId === brandId);
}

export async function saveMonthlyReport(item: MonthlyReport): Promise<void> {
  const all = get<MonthlyReport>(KEYS.monthlyReports);
  all.unshift(item);
  set(KEYS.monthlyReports, all.slice(0, 100));
  if (supabase) {
    await supabase.from('monthly_reports').upsert({
      id: item.id, brand_id: item.brandId, brand_name: item.brandName,
      month: item.month, year: item.year, improvements: item.improvements,
      pending: item.pending, estimated_metrics: item.estimatedMetrics,
      next_steps: item.nextSteps, achievements: item.achievements,
      summary: item.summary, created_at: item.createdAt,
    });
  }
}

// --- CLIENT MEMORIES ---
export function getClientMemories(brandId: string): ClientMemory[] {
  return get<ClientMemory>(KEYS.clientMemories)
    .filter(m => m.brandId === brandId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveClientMemory(item: ClientMemory): Promise<void> {
  const all = get<ClientMemory>(KEYS.clientMemories);
  const idx = all.findIndex(m => m.id === item.id);
  if (idx >= 0) {
    all[idx] = item;
  } else {
    all.push(item);
  }
  set(KEYS.clientMemories, all);
  if (supabase) {
    await supabase.from('client_memories').upsert({
      id: item.id, brand_id: item.brandId, category: item.category,
      content: item.content, created_at: item.createdAt,
    });
  }
}

export async function deleteClientMemory(id: string): Promise<void> {
  set(KEYS.clientMemories, get<ClientMemory>(KEYS.clientMemories).filter(m => m.id !== id));
  if (supabase) {
    await supabase.from('client_memories').delete().eq('id', id);
  }
}

// --- COMMENT ANALYSES ---
export function getCommentAnalyses(brandId?: string): CommentAnalysis[] {
  const all = get<CommentAnalysis>(KEYS.commentAnalyses);
  return brandId ? all.filter(a => a.brandId === brandId) : all;
}

export async function saveCommentAnalysis(item: CommentAnalysis): Promise<void> {
  const all = get<CommentAnalysis>(KEYS.commentAnalyses);
  all.unshift(item);
  set(KEYS.commentAnalyses, all.slice(0, 50));
  if (supabase) {
    await supabase.from('comment_analyses').upsert({
      id: item.id, brand_id: item.brandId, instagram_username: item.instagramUsername,
      faqs: item.faqs, objections: item.objections, positive: item.positive,
      requests: item.requests, content_ideas: item.contentIdeas,
      product_improvements: item.productImprovements, summary: item.summary,
      created_at: item.createdAt,
    });
  }
}

// --- MEETING BRIEFINGS ---
export function getMeetingBriefings(brandId: string): MeetingBriefing[] {
  return get<MeetingBriefing>(KEYS.meetingBriefings).filter(b => b.brandId === brandId);
}

export async function saveMeetingBriefing(item: MeetingBriefing): Promise<void> {
  const all = get<MeetingBriefing>(KEYS.meetingBriefings);
  all.unshift(item);
  set(KEYS.meetingBriefings, all.slice(0, 50));
  if (supabase) {
    await supabase.from('meeting_briefings').upsert({
      id: item.id, brand_id: item.brandId, current_state: item.currentState,
      pending: item.pending, proposals: item.proposals,
      questions_to_ask: item.questionsToAsk, opportunities: item.opportunities,
      created_at: item.createdAt,
    });
  }
}

// --- UTILS ---
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
