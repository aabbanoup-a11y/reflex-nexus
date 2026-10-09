create table if not exists public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, instruction text not null, cron text not null, timezone text not null default 'Africa/Cairo',
  enabled boolean not null default true, next_run_at timestamptz, last_run_at timestamptz, last_status text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update on public.scheduled_jobs to authenticated;
alter table public.scheduled_jobs enable row level security;
drop policy if exists scheduled_jobs_owner on public.scheduled_jobs;
create policy scheduled_jobs_owner on public.scheduled_jobs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists scheduled_jobs_due_idx on public.scheduled_jobs(enabled, next_run_at);
