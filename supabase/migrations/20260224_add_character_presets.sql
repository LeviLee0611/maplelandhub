-- Character presets for calculator save/load per user

create table if not exists public.character_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calculator text not null check (calculator in ('onehit', 'taken-damage')),
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, calculator, name)
);

drop trigger if exists set_character_presets_updated_at on public.character_presets;
create trigger set_character_presets_updated_at
before update on public.character_presets
for each row execute function public.set_updated_at();

create index if not exists idx_character_presets_user_calc on public.character_presets (user_id, calculator);

alter table public.character_presets enable row level security;

drop policy if exists "character_presets_select_self" on public.character_presets;
create policy "character_presets_select_self"
on public.character_presets
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "character_presets_insert_self" on public.character_presets;
create policy "character_presets_insert_self"
on public.character_presets
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "character_presets_update_self" on public.character_presets;
create policy "character_presets_update_self"
on public.character_presets
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "character_presets_delete_self" on public.character_presets;
create policy "character_presets_delete_self"
on public.character_presets
for delete
to authenticated
using (user_id = auth.uid());

