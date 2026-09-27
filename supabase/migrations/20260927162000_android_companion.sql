create table if not exists public.companion_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null,
  platform text not null default 'android',
  device_public_key text,
  status text not null default 'offline' check (status in ('offline','online','revoked')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companion_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.companion_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('open_chrome','open_url','back','tap_text','type_text','screenshot','stop')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','approved','running','succeeded','failed','cancelled')),
  requires_approval boolean not null default false,
  approved_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.companion_events (
  id uuid primary key default gen_random_uuid(),
  command_id uuid references public.companion_commands(id) on delete cascade,
  device_id uuid not null references public.companion_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  message text,
  screenshot_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists companion_devices_user_idx on public.companion_devices(user_id);
create index if not exists companion_commands_device_status_idx on public.companion_commands(device_id, status, created_at);
create index if not exists companion_events_device_idx on public.companion_events(device_id, created_at desc);

alter table public.companion_devices enable row level security;
alter table public.companion_commands enable row level security;
alter table public.companion_events enable row level security;

drop policy if exists companion_devices_owner on public.companion_devices;
create policy companion_devices_owner on public.companion_devices for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists companion_commands_owner on public.companion_commands;
create policy companion_commands_owner on public.companion_commands for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists companion_events_owner on public.companion_events;
create policy companion_events_owner on public.companion_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$ begin alter publication supabase_realtime add table public.companion_devices; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.companion_commands; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.companion_events; exception when duplicate_object then null; end $$;
