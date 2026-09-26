CREATE TABLE public.ai_models (
  id text PRIMARY KEY,
  label text NOT NULL,
  provider text NOT NULL,
  supports_images boolean NOT NULL DEFAULT false,
  supports_video boolean NOT NULL DEFAULT false,
  supports_files boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_models TO anon, authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models readable" ON public.ai_models FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.ai_models (id,label,provider,supports_images,supports_video,supports_files,priority) VALUES
('google/gemini-3.8-flash','جيميني 3.8 فلاش','google',true,true,true,10),
('google/gemini-3.7-flash','جيميني 3.7 فلاش','google',true,true,true,20),
('google/gemini-3.1-flash-lite','جيميني لايت','google',true,false,true,30),
('openai/gpt-6-astra','GPT-6 أسترا','openai',true,false,true,40);

CREATE TABLE public.memory_settings (
  user_id uuid PRIMARY KEY,
  consent boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_settings TO authenticated;
GRANT ALL ON public.memory_settings TO service_role;
ALTER TABLE public.memory_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.memory_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'preference',
  content_enc text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memories TO authenticated;
GRANT ALL ON public.user_memories TO service_role;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.user_memories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mood_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood int NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.mood_checkins TO authenticated;
GRANT ALL ON public.mood_checkins TO service_role;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own moods" ON public.mood_checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat uploads insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = 'u');
CREATE POLICY "chat uploads read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = 'u');