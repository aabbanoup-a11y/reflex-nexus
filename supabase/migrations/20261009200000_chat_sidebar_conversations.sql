create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  name text not null default 'فرع جديد',
  root_context text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.memory_branches enable row level security;
alter table public.conversation_messages enable row level security;

grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.memory_branches to authenticated;
grant select, insert, update, delete on public.conversation_messages to authenticated;

drop policy if exists conversations_owner on public.conversations;
drop policy if exists memory_branches_owner on public.memory_branches;
drop policy if exists conversation_messages_owner on public.conversation_messages;
create policy conversations_owner on public.conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy memory_branches_owner on public.memory_branches for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy conversation_messages_owner on public.conversation_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists conversation_messages_conversation_created_idx on public.conversation_messages(conversation_id, created_at asc);
create index if not exists memory_branches_user_created_idx on public.memory_branches(user_id, created_at desc);

alter table public.conversations replica identity full;
alter table public.conversation_messages replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversation_messages;
exception when duplicate_object then null;
end $$;
