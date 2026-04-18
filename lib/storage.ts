import { Brand, GeneratedContent, FeedItem } from './types';

const KEYS = {
  brands: 'ai_brands',
  content: 'ai_content',
  feed: 'ai_feed',
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
  // Keep last 200 items
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

// --- UTILS ---
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
