-- Keep the database allowlist aligned with the Android Companion command executor.
alter table public.companion_commands drop constraint if exists companion_commands_kind_check;
alter table public.companion_commands add constraint companion_commands_kind_check check (
  kind in (
    'open_chrome','open_url','open_app','open_settings','open_camera','download_file','speak','listen',
    'back','home','recents','tap_text','tap_coordinates','long_press','type_text','swipe','screenshot','stop',
    'device_inventory','app_inventory','notification_inventory'
  )
);
