alter table public.companion_commands drop constraint if exists companion_commands_kind_check;
alter table public.companion_commands add constraint companion_commands_kind_check check (
  kind in (
    'open_chrome','open_url','open_app','open_settings','open_camera','download_file','speak','listen','back','home','recents',
    'tap_text','tap_coordinates','long_press','type_text','swipe','scroll','wait','screenshot','read_screen','screen_text','stop',
    'device_inventory','app_inventory','app_permissions','notification_inventory','file_inventory','file_read','open_file','open_document','batch'
  )
);
