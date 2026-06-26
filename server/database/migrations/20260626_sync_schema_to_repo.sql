-- Migration: sync live Supabase schema to match server/database/supabase_schema.sql
-- Applied via Supabase MCP on 2026-06-26

-- 1) profiles: add moderation and audit columns
alter table public.profiles
  add column if not exists ip_hash text,
  add column if not exists status text,
  add column if not exists last_login_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.profiles set status = 'active' where status is null;
update public.profiles set updated_at = coalesce(updated_at, created_at, now());
update public.profiles set nickname = '匿名用户' where nickname is null;

-- 2) confessions: rename likes/views -> like_count/play_count, add moderation fields
alter table public.confessions
  add column if not exists title text,
  add column if not exists audio_path text,
  add column if not exists like_count int,
  add column if not exists comment_count int,
  add column if not exists play_count int,
  add column if not exists reported_count int,
  add column if not exists is_featured boolean,
  add column if not exists status text,
  add column if not exists updated_at timestamptz;

-- migrate legacy column names when present
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'confessions' and column_name = 'likes'
  ) then
    execute 'update public.confessions set like_count = coalesce(like_count, likes, 0)';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'confessions' and column_name = 'views'
  ) then
    execute 'update public.confessions set play_count = coalesce(play_count, views, 0)';
  end if;
end $$;

alter table public.confessions drop column if exists likes;
alter table public.confessions drop column if exists views;

-- 3) comments + sms_codes: add missing columns
alter table public.comments
  add column if not exists status text default 'visible',
  add column if not exists updated_at timestamptz default now();

alter table public.sms_codes
  add column if not exists type text default 'login',
  add column if not exists used boolean default false,
  add column if not exists expired_at timestamptz;

-- 4) create reports and play_history if missing
-- (see supabase_schema.sql for full definitions)

-- 5) indexes, triggers, RLS read policies, storage bucket
-- (see supabase_schema.sql lines 120-204)
