-- ============================================================
-- AD INTELLIGENCE — Setup completo de Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── ETAPA 2 ─────────────────────────────────────────────────

create table if not exists store_analyses (
  id text primary key,
  brand_id text,
  url text,
  overall_score int,
  scores jsonb,
  issues text[],
  opportunities text[],
  improvements jsonb,
  design_analysis text,
  navigation_analysis text,
  product_page_analysis text,
  checkout_analysis text,
  cta_analysis text,
  funnel_analysis text,
  summary text,
  platform text,
  created_at timestamptz default now()
);

create table if not exists funnel_analyses (
  id text primary key,
  brand_id text,
  stages jsonb,
  weakest_stage text,
  strategic_plan text[],
  summary text,
  created_at timestamptz default now()
);

create table if not exists monthly_reports (
  id text primary key,
  brand_id text,
  brand_name text,
  month int,
  year int,
  improvements text[],
  pending text[],
  estimated_metrics jsonb,
  next_steps text[],
  achievements text[],
  summary text,
  created_at timestamptz default now()
);

create table if not exists client_memories (
  id text primary key,
  brand_id text,
  category text,
  content text,
  created_at timestamptz default now()
);

create table if not exists comment_analyses (
  id text primary key,
  brand_id text,
  instagram_username text,
  faqs text[],
  objections text[],
  positive text[],
  requests text[],
  content_ideas text[],
  product_improvements text[],
  summary text,
  created_at timestamptz default now()
);

create table if not exists meeting_briefings (
  id text primary key,
  brand_id text,
  current_state text,
  pending text[],
  proposals text[],
  questions_to_ask text[],
  opportunities text[],
  created_at timestamptz default now()
);

-- ─── MÓDULO REFERENTES ───────────────────────────────────────

create table if not exists referentes (
  id text primary key,
  username text not null,
  display_name text,
  category text,
  notes text,
  follower_count text,
  last_scraped timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists referente_posts (
  id text primary key,
  referente_id text references referentes(id) on delete cascade,
  username text,
  post_url text,
  type text,
  caption text,
  likes_count int default 0,
  comments_count int default 0,
  views_count int,
  published_at timestamptz,
  scraped_at timestamptz,
  is_viral boolean default false,
  viral_score int default 0
);

create index if not exists referente_posts_referente_id on referente_posts(referente_id);
create index if not exists referente_posts_scraped_at on referente_posts(scraped_at desc);
create index if not exists referente_posts_is_viral on referente_posts(is_viral) where is_viral = true;

create table if not exists informes_diarios (
  id text primary key,
  date text,
  posts_analyzed int,
  referentes_analyzed int,
  highlights text[],
  strategies text[],
  trends text[],
  viral_content text[],
  full_report text,
  created_at timestamptz default now()
);

create table if not exists informes_semanales (
  id text primary key,
  week_start text,
  week_end text,
  top_trends text[],
  repeated_strategies text[],
  top_actions text[],
  market_insights text[],
  full_report text,
  created_at timestamptz default now()
);

-- ─── ÍNDICES GENERALES ───────────────────────────────────────

create index if not exists store_analyses_brand_id on store_analyses(brand_id);
create index if not exists funnel_analyses_brand_id on funnel_analyses(brand_id);
create index if not exists monthly_reports_brand_id on monthly_reports(brand_id);
create index if not exists client_memories_brand_id on client_memories(brand_id);
create index if not exists comment_analyses_brand_id on comment_analyses(brand_id);
create index if not exists meeting_briefings_brand_id on meeting_briefings(brand_id);
create index if not exists informes_diarios_date on informes_diarios(date desc);
create index if not exists informes_semanales_week_start on informes_semanales(week_start desc);

-- ─── RLS (Row Level Security) — desactivado para uso personal ─

alter table store_analyses disable row level security;
alter table funnel_analyses disable row level security;
alter table monthly_reports disable row level security;
alter table client_memories disable row level security;
alter table comment_analyses disable row level security;
alter table meeting_briefings disable row level security;
alter table referentes disable row level security;
alter table referente_posts disable row level security;
alter table informes_diarios disable row level security;
alter table informes_semanales disable row level security;

-- ─── VERIFICACIÓN ────────────────────────────────────────────
-- Después de ejecutar, verificá que aparezcan estas tablas:
-- store_analyses, funnel_analyses, monthly_reports,
-- client_memories, comment_analyses, meeting_briefings,
-- referentes, referente_posts, informes_diarios, informes_semanales
