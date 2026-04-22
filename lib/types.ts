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
  storeUrl?: string;
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

// ─── ETAPA 2: NUEVOS TIPOS ───────────────────────────────────────────────────

export interface StoreAnalysis {
  id: string;
  brandId?: string;
  url: string;
  platform: string;
  overallScore: number;
  scores: {
    design: number;
    navigation: number;
    productPages: number;
    checkout: number;
    speed: number;
    ctas: number;
    funnel: number;
  };
  issues: string[];
  opportunities: string[];
  improvements: { priority: 'alta' | 'media' | 'baja'; action: string; impact: string }[];
  designAnalysis: string;
  navigationAnalysis: string;
  productPageAnalysis: string;
  checkoutAnalysis: string;
  ctaAnalysis: string;
  funnelAnalysis: string;
  summary: string;
  createdAt: string;
}

export interface FunnelStage {
  name: string;
  score: number;
  status: 'bien' | 'regular' | 'mal';
  whyFailing: string;
  improvements: string[];
}

export interface FunnelAnalysis {
  id: string;
  brandId: string;
  stages: {
    awareness: FunnelStage;
    consideration: FunnelStage;
    decision: FunnelStage;
    purchase: FunnelStage;
    retention: FunnelStage;
  };
  weakestStage: string;
  strategicPlan: string[];
  summary: string;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  brandId: string;
  brandName: string;
  month: number;
  year: number;
  improvements: string[];
  pending: string[];
  estimatedMetrics: { metric: string; value: string; trend: string }[];
  nextSteps: string[];
  achievements: string[];
  summary: string;
  createdAt: string;
}

export type MemoryCategory = 'decision' | 'no_gusta' | 'preferencia' | 'acuerdo';

export interface ClientMemory {
  id: string;
  brandId: string;
  category: MemoryCategory;
  content: string;
  createdAt: string;
}

export interface CommentAnalysis {
  id: string;
  brandId?: string;
  instagramUsername: string;
  faqs: string[];
  objections: string[];
  positive: string[];
  requests: string[];
  contentIdeas: string[];
  productImprovements: string[];
  summary: string;
  createdAt: string;
}

export interface MeetingBriefing {
  id: string;
  brandId: string;
  currentState: string;
  pending: string[];
  proposals: string[];
  questionsToAsk: string[];
  opportunities: string[];
  createdAt: string;
}

// ─── ETAPA 3: NUEVOS TIPOS ───────────────────────────────────────────────────

export interface AppSettings {
  agencyName: string;
  agencyLogo: string | null;
  whatsappNumber: string;
  whatsappNotifications: {
    urgentBrands: boolean;
    upcomingDates: boolean;
    criticalAnalysis: boolean;
  };
  apiKeys: {
    anthropic: string;
    apify: string;
    twilioSid: string;
    twilioToken: string;
    twilioWhatsapp: string;
  };
  theme: 'dark' | 'light';
  accentColor: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  agencyName: 'Ad Intelligence',
  agencyLogo: null,
  whatsappNumber: '',
  whatsappNotifications: {
    urgentBrands: true,
    upcomingDates: true,
    criticalAnalysis: true,
  },
  apiKeys: {
    anthropic: '',
    apify: '',
    twilioSid: '',
    twilioToken: '',
    twilioWhatsapp: '',
  },
  theme: 'dark',
  accentColor: '#7C3AED',
};

export interface ProductCopyResult {
  id: string;
  productDescription: string;
  brandId?: string;
  brandName?: string;
  names: string[];
  productDescriptions: string[];
  instagramCopys: string[];
  videoHooks: string[];
  createdAt: string;
}

export type ProposalService = {
  id: string;
  name: string;
  description: string;
  price: number;
  included: boolean;
};

export interface CommercialProposal {
  id: string;
  brandId: string;
  brandName: string;
  services: ProposalService[];
  objectives: string[];
  workPlan: { week: string; tasks: string[] }[];
  brandAnalysis: string;
  proposalText: string;
  totalPrice: number;
  createdAt: string;
}

export type ReviewPlatform = 'google_maps' | 'mercadolibre' | 'amazon' | 'otro';

export interface ReviewAnalysis {
  id: string;
  brandId?: string;
  sourceUrl: string;
  platform: ReviewPlatform;
  reviewsAnalyzed: number;
  loved: string[];
  hated: string[];
  opportunities: string[];
  actions: string[];
  sentiment: 'muy_positivo' | 'positivo' | 'neutro' | 'negativo' | 'muy_negativo';
  averageRating?: number;
  summary: string;
  createdAt: string;
}

export interface VoiceAutoAnalysis {
  tone: string;
  formality: 'muy_formal' | 'formal' | 'neutro' | 'informal' | 'muy_informal';
  characteristicPhrases: string[];
  bannedWords: string[];
  emojis: string[];
  idealCustomer: string;
  brandPersonality: string;
  communicationStyle: string;
}
