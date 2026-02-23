-- Feedback requests and admin access control

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug', 'feature', 'other')),
  title text not null,
  message text not null,
  contact text,
  is_public boolean not null default false,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_feedback_requests_updated_at on public.feedback_requests;
create trigger set_feedback_requests_updated_at
before update on public.feedback_requests
for each row execute function public.set_updated_at();

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_requests_created_at on public.feedback_requests (created_at desc);
create index if not exists idx_feedback_requests_status on public.feedback_requests (status);

alter table public.feedback_requests enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

drop policy if exists "feedback_requests_insert_anyone" on public.feedback_requests;
create policy "feedback_requests_insert_anyone"
on public.feedback_requests
for insert
to anon, authenticated
with check (
  user_id is null
  or user_id = auth.uid()
);

drop policy if exists "feedback_requests_select_admin_only" on public.feedback_requests;
create policy "feedback_requests_select_admin_only"
on public.feedback_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "feedback_requests_update_admin_only" on public.feedback_requests;
create policy "feedback_requests_update_admin_only"
on public.feedback_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "feedback_requests_delete_admin_only" on public.feedback_requests;
create policy "feedback_requests_delete_admin_only"
on public.feedback_requests
for delete
to authenticated
using (public.is_admin());

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

