-- Per-user quest tracking (save + completion check)

create table if not exists public.quest_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id bigint not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quest_id)
);

drop trigger if exists set_quest_trackers_updated_at on public.quest_trackers;
create trigger set_quest_trackers_updated_at
before update on public.quest_trackers
for each row execute function public.set_updated_at();

create index if not exists idx_quest_trackers_user_id on public.quest_trackers (user_id);
create index if not exists idx_quest_trackers_user_completed on public.quest_trackers (user_id, is_completed);
create index if not exists idx_quest_trackers_quest_id on public.quest_trackers (quest_id);

alter table public.quest_trackers enable row level security;

drop policy if exists "quest_trackers_select_self" on public.quest_trackers;
create policy "quest_trackers_select_self"
on public.quest_trackers
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "quest_trackers_insert_self" on public.quest_trackers;
create policy "quest_trackers_insert_self"
on public.quest_trackers
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "quest_trackers_update_self" on public.quest_trackers;
create policy "quest_trackers_update_self"
on public.quest_trackers
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "quest_trackers_delete_self" on public.quest_trackers;
create policy "quest_trackers_delete_self"
on public.quest_trackers
for delete
to authenticated
using (user_id = auth.uid());
