-- Keep the database allowlist aligned with the Android Companion command executor.
alter table public.companion_commands drop constraint if exists companion_commands_kind_check;
alter table public.companion_commands add constraint companion_commands_kind_check check (
  kind in (
    'open_chrome','open_url','open_app','open_settings','open_camera','download_file','speak','listen',
    'back','home','recents','tap_text','tap_id','tap_description','tap_coordinates','long_press','type_text','clear_text','swipe','scroll','wait','wait_for_text','screenshot','read_screen','stop',
    'press_back','press_home','open_notifications','quick_settings',
    'device_inventory','app_inventory','app_permissions','notification_inventory','screen_text','file_inventory','file_read','open_file','open_document','batch','workflow'
  )
);
