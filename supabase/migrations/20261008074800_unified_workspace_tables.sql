create table if not exists public.network_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  who text not null,
  content text not null,
  tools jsonb not null default '[]'::jsonb,
  is_error boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, delete on public.network_messages to authenticated;
alter table public.network_messages enable row level security;
drop policy if exists network_messages_owner on public.network_messages;
create policy network_messages_owner on public.network_messages
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists network_messages_user_created_idx
  on public.network_messages(user_id, created_at asc);

do $$ begin
  alter publication supabase_realtime add table public.network_messages;
exception when duplicate_object then null;
end $$;

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.daily_reports to authenticated;
alter table public.daily_reports enable row level security;
drop policy if exists daily_reports_owner on public.daily_reports;
create policy daily_reports_owner on public.daily_reports
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists daily_reports_user_date_idx
  on public.daily_reports(user_id, report_date desc, created_at desc);

create table if not exists public.agent_workspace_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('note','task','proposal')),
  title text not null,
  content text not null,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.agent_workspace_actions to authenticated;
alter table public.agent_workspace_actions enable row level security;
drop policy if exists agent_workspace_actions_owner on public.agent_workspace_actions;
create policy agent_workspace_actions_owner on public.agent_workspace_actions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists agent_workspace_actions_user_idx
  on public.agent_workspace_actions(user_id, created_at desc);
