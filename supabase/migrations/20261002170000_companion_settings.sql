create table if not exists public.companion_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'balanced' check (mode in ('economic','balanced','smart')),
  emergency_stopped boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.companion_settings enable row level security;
drop policy if exists companion_settings_owner on public.companion_settings;
create policy companion_settings_owner on public.companion_settings for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
