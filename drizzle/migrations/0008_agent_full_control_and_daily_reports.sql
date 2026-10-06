alter table public.companion_commands drop constraint if exists companion_commands_kind_check;
alter table public.companion_commands add constraint companion_commands_kind_check check (
  kind in (
    'open_chrome','open_url','open_app','open_settings','open_camera','download_file','speak','listen',
    'back','home','recents','tap_text','tap_coordinates','long_press','type_text','swipe','screenshot','stop',
    'device_inventory','app_inventory','notification_inventory','read_screen','scroll'
  )
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  report_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, report_date)
);
grant select, delete on public.daily_reports to authenticated;
grant all on public.daily_reports to service_role;
alter table public.daily_reports enable row level security;
create policy "own reports read" on public.daily_reports for select to authenticated using (auth.uid() = user_id);
create policy "own reports delete" on public.daily_reports for delete to authenticated using (auth.uid() = user_id);