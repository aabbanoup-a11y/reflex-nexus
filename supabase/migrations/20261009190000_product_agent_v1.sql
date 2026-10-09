create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, name text not null, mime text not null, url text, preview text,
  status text not null default 'queued' check (status in ('queued','ready','blocked','failed')),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
grant select, insert, update on public.artifacts to authenticated;
alter table public.artifacts enable row level security;
drop policy if exists artifacts_owner on public.artifacts;
create policy artifacts_owner on public.artifacts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, path text not null, source text not null, status text not null default 'proposed', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.agent_tools to authenticated;
alter table public.agent_tools enable row level security;
create policy agent_tools_owner on public.agent_tools for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.integration_registry (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  name text not null, kind text not null, source text not null, command jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(), unique(user_id, kind, source)
);
grant select, insert, update on public.integration_registry to authenticated;
alter table public.integration_registry enable row level security;
create policy integration_registry_owner on public.integration_registry for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, phone text not null, message text not null, source text not null default 'secretary-path', created_at timestamptz not null default now()
);
grant select, insert on public.orders to authenticated;
alter table public.orders enable row level security;
create policy orders_owner on public.orders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
