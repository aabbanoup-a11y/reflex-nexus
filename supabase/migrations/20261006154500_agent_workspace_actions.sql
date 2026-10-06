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
create index if not exists agent_workspace_actions_user_idx on public.agent_workspace_actions(user_id, created_at desc);
