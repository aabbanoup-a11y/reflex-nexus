ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS ai_model text;
WITH r AS (SELECT id, row_number() OVER (ORDER BY code) - 1 AS n FROM public.employees)
UPDATE public.employees e SET ai_model = (ARRAY['google/gemini-3.8-flash','google/gemini-3.7-flash','google/gemini-3.1-flash-lite','openai/gpt-6-astra'])[(r.n % 4) + 1]
FROM r WHERE r.id = e.id;

CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_kind text NOT NULL,
  agent_key text NOT NULL,
  agent_name text NOT NULL,
  model text,
  prompt text NOT NULL,
  reply text,
  status text NOT NULL DEFAULT 'done',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_runs TO anon, authenticated;
GRANT ALL ON public.ai_runs TO service_role;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read runs" ON public.ai_runs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can log runs" ON public.ai_runs FOR INSERT TO anon, authenticated WITH CHECK (length(prompt) < 20000 AND length(coalesce(reply,'')) < 60000);