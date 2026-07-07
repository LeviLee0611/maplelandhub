-- Add server dimension to character_presets so presets with the same name
-- don't collide across Mapleland and Planet servers.

alter table public.character_presets
  add column if not exists server text not null default 'mapleland' check (server in ('mapleland', 'planet'));

alter table public.character_presets
  drop constraint if exists character_presets_user_id_calculator_name_key;

alter table public.character_presets
  drop constraint if exists character_presets_user_id_calculator_server_name_key;

alter table public.character_presets
  add constraint character_presets_user_id_calculator_server_name_key
  unique (user_id, calculator, server, name);

drop index if exists idx_character_presets_user_calc;

create index if not exists idx_character_presets_user_calc_server
  on public.character_presets (user_id, calculator, server);
