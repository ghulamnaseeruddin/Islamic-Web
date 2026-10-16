-- =====================================================================
-- Noor ul Ilm — database schema for Supabase (PostgreSQL)
-- Run this whole file once in:  Supabase Dashboard > SQL Editor > New query > Run
-- It is safe to run again later (it uses "if not exists" / "or replace").
-- After this, run supabase/seed_library.sql to fill the library.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- profiles (one row per user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up (email or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by the policies below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- A normal user can never make themselves admin.
-- (You make an admin from the SQL editor, where auth.uid() is null.)
create or replace function public.protect_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- ---------- user settings ----------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- bookmarks and notes ----------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('quran', 'hadith', 'book')),
  ref text not null,
  title text,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('quran', 'hadith', 'book')),
  ref text not null,
  title text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists notes_user_ref on public.notes (user_id, kind, ref);

-- ---------- reading progress ----------
create table if not exists public.reading_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  surah int not null check (surah between 1 and 114),
  ayah int not null check (ayah >= 1),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_log (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  ayahs int not null default 0,
  primary key (user_id, day)
);

-- ---------- library (managed by the admin) ----------
create table if not exists public.library_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  parent_id uuid references public.library_sections(id) on delete cascade,
  title text not null,
  title_ur text,
  sort_order int not null default 0,
  app_path text,
  note text,
  is_hidden boolean not null default false
);

create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.library_sections(id) on delete cascade,
  title text not null,
  title_ur text,
  author text,
  files jsonb not null default '[]'::jsonb,   -- [{ "label": "PDF", "url": "https://..." }]
  app_path text,                               -- opens inside the app, e.g. /hadith/bukhari
  sort_order int not null default 0,
  is_hidden boolean not null default false,
  unique (section_id, title)
);
create index if not exists library_books_section on public.library_books (section_id, sort_order);

-- ---------- reports ("wrong information", etc.) ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null,
  item_ref text not null,
  reason text not null,
  note text,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);

-- ---------- AI usage (daily limit per user) ----------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);

-- Adds one to today's count and says if the user is still within the limit.
create or replace function public.consume_ai_quota(daily_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used int;
begin
  if uid is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, count)
  values (uid, current_date, 0)
  on conflict (user_id, day) do nothing;

  update public.ai_usage
     set count = count + 1
   where user_id = uid and day = current_date and count < daily_limit
  returning count into used;

  return used is not null;
end;
$$;

-- =====================================================================
-- Row Level Security: every user sees only their own rows.
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_log enable row level security;
alter table public.library_sections enable row level security;
alter table public.library_books enable row level security;
alter table public.reports enable row level security;
alter table public.ai_usage enable row level security;

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user-owned tables
do $$
declare t text;
begin
  foreach t in array array['user_settings', 'bookmarks', 'notes', 'reading_progress', 'reading_log']
  loop
    execute format('drop policy if exists "%s own all" on public.%I', t, t);
    execute format(
      'create policy "%s own all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- library: signed-in users read visible items; admin does everything
drop policy if exists "library_sections read" on public.library_sections;
create policy "library_sections read" on public.library_sections
  for select to authenticated using (is_hidden = false or public.is_admin());
drop policy if exists "library_sections admin write" on public.library_sections;
create policy "library_sections admin write" on public.library_sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "library_books read" on public.library_books;
create policy "library_books read" on public.library_books
  for select to authenticated using (is_hidden = false or public.is_admin());
drop policy if exists "library_books admin write" on public.library_books;
create policy "library_books admin write" on public.library_books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- reports: anyone signed in can send; they read their own; admin reads/updates all
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reports read" on public.reports;
create policy "reports read" on public.reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "reports admin delete" on public.reports;
create policy "reports admin delete" on public.reports
  for delete to authenticated using (public.is_admin());

-- ai_usage: user may read own row; changes go through consume_ai_quota()
drop policy if exists "ai_usage read own" on public.ai_usage;
create policy "ai_usage read own" on public.ai_usage
  for select to authenticated using (user_id = auth.uid());

-- =====================================================================
-- Storage: profile pictures (public bucket, each user writes only to their own folder)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- hifz tracker ----------
create table if not exists public.hifz_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  surah int not null check (surah between 1 and 114),
  status text not null check (status in ('learning', 'memorised')),
  last_revised date,
  primary key (user_id, surah)
);
alter table public.hifz_progress enable row level security;
drop policy if exists "hifz_progress own all" on public.hifz_progress;
create policy "hifz_progress own all" on public.hifz_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- To make yourself an admin (replace the email), run this once:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- =====================================================================
