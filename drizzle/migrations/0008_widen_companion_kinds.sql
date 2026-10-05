ALTER TABLE public.companion_commands DROP CONSTRAINT companion_commands_kind_check;
ALTER TABLE public.companion_commands ADD CONSTRAINT companion_commands_kind_check CHECK (kind ~ '^[a-z_]{2,40}$');
ALTER TABLE public.companion_commands ALTER COLUMN status SET DEFAULT 'approved';