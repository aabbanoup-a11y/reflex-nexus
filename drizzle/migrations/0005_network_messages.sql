CREATE TABLE public.network_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  who text NOT NULL,
  content text NOT NULL,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_error boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.network_messages TO authenticated;
GRANT ALL ON public.network_messages TO service_role;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own network messages" ON public.network_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND length(content) < 60000);
CREATE INDEX network_messages_user_created ON public.network_messages(user_id, created_at);