/*
  SETUP SUPABASE:
  1. Crear proyecto en supabase.com
  2. Copiar la URL y la anon key
  3. Agregar al .env.local:
     NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

  SQL para crear las tablas (ejecutar en Supabase SQL Editor):

  create table if not exists store_analyses (
    id text primary key, brand_id text, url text, overall_score int,
    scores jsonb, issues text[], opportunities text[], improvements jsonb,
    design_analysis text, navigation_analysis text, product_page_analysis text,
    checkout_analysis text, cta_analysis text, funnel_analysis text,
    summary text, platform text, created_at timestamptz default now()
  );
  create table if not exists funnel_analyses (
    id text primary key, brand_id text, stages jsonb, weakest_stage text,
    strategic_plan text[], summary text, created_at timestamptz default now()
  );
  create table if not exists monthly_reports (
    id text primary key, brand_id text, brand_name text, month int, year int,
    improvements text[], pending text[], estimated_metrics jsonb,
    next_steps text[], achievements text[], summary text,
    created_at timestamptz default now()
  );
  create table if not exists client_memories (
    id text primary key, brand_id text, category text,
    content text, created_at timestamptz default now()
  );
  create table if not exists comment_analyses (
    id text primary key, brand_id text, instagram_username text,
    faqs text[], objections text[], positive text[], requests text[],
    content_ideas text[], product_improvements text[], summary text,
    created_at timestamptz default now()
  );
  create table if not exists meeting_briefings (
    id text primary key, brand_id text, current_state text,
    pending text[], proposals text[], questions_to_ask text[],
    opportunities text[], created_at timestamptz default now()
  );

  -- Módulo Referentes (Etapa 3)
  create table if not exists referentes (
    id text primary key, username text not null, display_name text,
    category text, notes text, follower_count text,
    last_scraped timestamptz, is_active boolean default true,
    created_at timestamptz default now()
  );
  create table if not exists referente_posts (
    id text primary key, referente_id text references referentes(id),
    username text, post_url text, type text, caption text,
    likes_count int default 0, comments_count int default 0,
    views_count int, published_at timestamptz, scraped_at timestamptz,
    is_viral boolean default false, viral_score int default 0
  );
  create index if not exists referente_posts_referente_id on referente_posts(referente_id);
  create index if not exists referente_posts_scraped_at on referente_posts(scraped_at desc);
  create table if not exists informes_diarios (
    id text primary key, date text, posts_analyzed int,
    referentes_analyzed int, highlights text[], strategies text[],
    trends text[], viral_content text[], full_report text,
    created_at timestamptz default now()
  );
  create table if not exists informes_semanales (
    id text primary key, week_start text, week_end text,
    top_trends text[], repeated_strategies text[], top_actions text[],
    market_insights text[], full_report text,
    created_at timestamptz default now()
  );
*/

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = Boolean(supabase);
