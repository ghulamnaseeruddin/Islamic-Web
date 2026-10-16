-- Run once in Supabase SQL Editor if you already ran schema.sql before the new features.
-- Safe to run again.
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
