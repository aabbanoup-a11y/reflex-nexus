-- Explicit, user-approved inventory commands. Existing RLS remains the ownership boundary.
alter table public.companion_commands drop constraint if exists companion_commands_kind_check;
alter table public.companion_commands add constraint companion_commands_kind_check check (
  kind in (
    'open_chrome','open_url','back','tap_text','type_text','screenshot','stop',
    'device_inventory','app_inventory','notification_inventory'
  )
);
