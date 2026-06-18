-- Supabase PostgreSQL schema for Taking Voice Confession Wall
-- Run this script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  nickname text not null,
  avatar_url text,
  anonymous_id text not null unique,
  ip_hash text,
  status text not null default 'active' check (status in ('active', 'muted', 'banned')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  icon text,
  sort_order int not null default 0,
  status text not null default 'enabled' check (status in ('enabled', 'disabled')),
  created_at timestamptz not null default now()
);

insert into public.categories (id, name, icon, sort_order, status) values
  (1, '暗恋', '💕', 1, 'enabled'),
  (2, '失恋', '💔', 2, 'enabled'),
  (3, '感谢', '🙏', 3, 'enabled'),
  (4, '道歉', '😔', 4, 'enabled'),
  (5, '吐槽', '😤', 5, 'enabled'),
  (6, '其他', '💭', 6, 'enabled')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  status = excluded.status;

select setval(pg_get_serial_sequence('public.categories', 'id'), greatest((select max(id) from public.categories), 1), true);

create table if not exists public.confessions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id) on delete restrict,
  title text,
  content text,
  audio_url text not null,
  audio_path text,
  audio_duration int not null default 0 check (audio_duration >= 0),
  audio_size int not null default 0 check (audio_size >= 0),
  status text not null default 'published' check (status in ('published', 'hidden', 'pending_review', 'deleted')),
  like_count int not null default 0 check (like_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  play_count int not null default 0 check (play_count >= 0),
  reported_count int not null default 0 check (reported_count >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigserial primary key,
  confession_id bigint not null references public.confessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id bigserial primary key,
  confession_id bigint not null references public.confessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (confession_id, user_id)
);

create table if not exists public.reports (
  id bigserial primary key,
  target_type text not null check (target_type in ('confession', 'comment')),
  target_id bigint not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'handled', 'rejected')),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.play_history (
  id bigserial primary key,
  confession_id bigint not null references public.confessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.sms_codes (
  id bigserial primary key,
  phone text not null,
  code text not null,
  type text not null default 'login',
  used boolean not null default false,
  expired_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 上传文件记录表（替代内存中的 uploadOwnership）
create table if not exists public.uploaded_files (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_profiles_anonymous_id on public.profiles(anonymous_id);
create index if not exists idx_profiles_status on public.profiles(status);

create index if not exists idx_confessions_user_id on public.confessions(user_id);
create index if not exists idx_confessions_category_id on public.confessions(category_id);
create index if not exists idx_confessions_status on public.confessions(status);
create index if not exists idx_confessions_created_at on public.confessions(created_at desc);
create index if not exists idx_confessions_hot on public.confessions(like_count desc, comment_count desc, play_count desc);

create index if not exists idx_comments_confession_id on public.comments(confession_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_comments_status on public.comments(status);
create index if not exists idx_comments_created_at on public.comments(created_at desc);

create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_reports_target on public.reports(target_type, target_id);
create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_play_history_confession_id on public.play_history(confession_id);
create index if not exists idx_sms_codes_phone on public.sms_codes(phone);
create index if not exists idx_sms_codes_expired_at on public.sms_codes(expired_at);
create index if not exists idx_uploaded_files_user_id on public.uploaded_files(user_id);
create index if not exists idx_uploaded_files_filename on public.uploaded_files(filename);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_confessions_updated_at on public.confessions;
create trigger set_confessions_updated_at
before update on public.confessions
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.confessions enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;
alter table public.play_history enable row level security;
alter table public.sms_codes enable row level security;
alter table public.uploaded_files enable row level security;

drop policy if exists "Public categories are readable" on public.categories;
create policy "Public categories are readable"
on public.categories for select
using (status = 'enabled');

drop policy if exists "Published confessions are readable" on public.confessions;
create policy "Published confessions are readable"
on public.confessions for select
using (status = 'published');

drop policy if exists "Visible comments are readable" on public.comments;
create policy "Visible comments are readable"
on public.comments for select
using (status = 'visible');

-- Express backend should use SUPABASE_SERVICE_ROLE_KEY for trusted writes.
-- Keep service role key only on the server side.
