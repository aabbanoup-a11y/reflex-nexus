create table if not exists public.agent_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  entry_point text not null default 'local',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid references public.agent_paths(id) on delete set null,
  name text not null,
  description text not null default '',
  command text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cron text not null default '* * * * *',
  command text not null,
  status text not null default 'active',
  last_run_at timestamptz,
  next_run_at timestamptz not null default now(),
  last_result text,
  created_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mime text not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  summary text not null,
  files jsonb not null default '[]'::jsonb,
  status text not null default 'applied',
  rollback_of uuid references public.agent_updates(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('artifacts', 'artifacts', false)
on conflict (id) do nothing;

alter table public.agent_paths enable row level security;
alter table public.agent_commands enable row level security;
alter table public.scheduled_jobs enable row level security;
alter table public.artifacts enable row level security;
alter table public.agent_updates enable row level security;

do $$ declare t text; begin
  foreach t in array array['agent_paths','agent_commands','scheduled_jobs','artifacts','agent_updates'] loop
    execute format('drop policy if exists %I_owner on public.%I', t, t);
    execute format('create policy %I_owner on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

drop policy if exists artifacts_storage_owner on storage.objects;
create policy artifacts_storage_owner on storage.objects for all to authenticated
using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text);

create index if not exists scheduled_jobs_due_idx on public.scheduled_jobs(status, next_run_at);
create index if not exists artifacts_user_created_idx on public.artifacts(user_id, created_at desc);
create index if not exists agent_updates_user_created_idx on public.agent_updates(user_id, created_at desc);
