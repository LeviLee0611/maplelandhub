-- Extensions
create extension if not exists "pgcrypto";

-- Timestamp trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  server text,
  job text,
  level int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  server text not null,
  purpose text not null,
  hunt_area text not null,
  level_min int not null,
  level_max int not null,
  slots_total int not null check (slots_total > 1),
  slots_filled int not null default 1 check (slots_filled >= 1),
  status text not null default 'open' check (status in ('open', 'closed')),
  bump_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(post_id, applicant_id)
);

create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- Useful indexes
create index if not exists idx_posts_bump_at on public.posts (bump_at desc);
create index if not exists idx_posts_server on public.posts (server);
create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_applications_post_id on public.applications (post_id);
create index if not exists idx_applications_applicant_id on public.applications (applicant_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.applications enable row level security;

-- profiles RLS
create policy "profiles_select_self"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- posts RLS
create policy "posts_select_public"
on public.posts
for select
using (true);

create policy "posts_insert_authenticated_self"
on public.posts
for insert
to authenticated
with check (author_id = auth.uid());

create policy "posts_update_author_only"
on public.posts
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "posts_delete_author_only"
on public.posts
for delete
to authenticated
using (author_id = auth.uid());

-- applications RLS
create policy "applications_select_applicant_or_post_author"
on public.applications
for select
to authenticated
using (
  applicant_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = applications.post_id
      and p.author_id = auth.uid()
  )
);

create policy "applications_insert_self"
on public.applications
for insert
to authenticated
with check (applicant_id = auth.uid());

create policy "applications_update_post_author_only"
on public.applications
for update
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = applications.post_id
      and p.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.posts p
    where p.id = applications.post_id
      and p.author_id = auth.uid()
  )
);

create policy "applications_delete_applicant_or_author"
on public.applications
for delete
to authenticated
using (
  applicant_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = applications.post_id
      and p.author_id = auth.uid()
  )
);
