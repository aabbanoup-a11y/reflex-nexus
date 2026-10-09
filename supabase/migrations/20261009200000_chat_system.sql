create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists conversations_owner on public.conversations;
create policy conversations_owner on public.conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists messages_owner on public.messages;
create policy messages_owner on public.messages for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create index if not exists conversations_user_created_idx
  on public.conversations(user_id, created_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at asc);
