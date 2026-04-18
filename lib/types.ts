export type SocialNetwork = 'instagram' | 'tiktok' | 'facebook' | 'pinterest' | 'x' | 'linkedin' | 'youtube';
export type EcommercePlatform = 'tiendanube' | 'shopify' | 'woocommerce' | 'mercadoshops' | 'otro';
export type Objective = 'ventas_tienda' | 'mensajeria_mayorista';
export type ContentType = 'hook' | 'script' | 'script_scene' | 'audit' | 'brief' | 'feed_copy' | 'instagram_analysis' | 'calendar_ideas';

export interface VoiceProfile {
  tone: string;
  characteristicPhrases: string;
  bannedWords: string;
  emojis: string;
  idealCustomer: string;
}

export interface Brand {
  id: string;
  name: string;
  industry: string;
  country: string;
  language: string;
  regionalVariant: string;
  socialNetworks: SocialNetwork[];
  ecommercePlatform: EcommercePlatform;
  objective: Objective;
  voiceProfile: VoiceProfile;
  instagramUsername?: string;
  logoColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedContent {
  id: string;
  brandId: string;
  brandName: string;
  type: ContentType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InstagramPost {
  type: string;
  engagement: string;
  description: string;
}

export interface InstagramAnalysisData {
  username: string;
  postsAnalyzed: number;
  averageEngagement: string;
  postingFrequency: string;
  tone: string;
  contentMix: { type: string; percentage: number }[];
  topFormats: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  strategicPlan: string[];
  contentIdeas: string[];
  followerGrowthTips: string[];
  explorePageStrategy: string[];
  dataSource: 'apify' | 'ai_analysis';
}

export interface CalendarEvent {
  id: string;
  brandId: string;
  date: string;
  title: string;
  description: string;
  type: 'efemeride' | 'sugerido' | 'publicado';
  contentType?: string;
  country?: string;
}

export interface FeedItem {
  id: string;
  brandId: string;
  name: string;
  type: 'foto' | 'video' | 'carrusel';
  url?: string;
  suggestedType?: string;
  copy?: string;
  order: number;
}
