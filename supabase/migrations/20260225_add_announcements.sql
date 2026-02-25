-- Announcements / updates
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('notice', 'update')),
  is_pinned boolean default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create index if not exists idx_announcements_published on public.announcements (published_at desc);
create index if not exists idx_announcements_pinned on public.announcements (is_pinned desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements_select_all" on public.announcements;
create policy "announcements_select_all"
on public.announcements
for select
using (true);

drop policy if exists "announcements_admin_insert" on public.announcements;
create policy "announcements_admin_insert"
on public.announcements
for insert
to authenticated
with check (exists (
  select 1 from public.admin_users au where au.user_id = auth.uid()
));

drop policy if exists "announcements_admin_update" on public.announcements;
create policy "announcements_admin_update"
on public.announcements
for update
to authenticated
using (exists (
  select 1 from public.admin_users au where au.user_id = auth.uid()
))
with check (exists (
  select 1 from public.admin_users au where au.user_id = auth.uid()
));

drop policy if exists "announcements_admin_delete" on public.announcements;
create policy "announcements_admin_delete"
on public.announcements
for delete
to authenticated
using (exists (
  select 1 from public.admin_users au where au.user_id = auth.uid()
));
