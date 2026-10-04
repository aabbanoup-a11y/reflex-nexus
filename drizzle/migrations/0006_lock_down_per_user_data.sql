ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "Anyone can log runs" ON public.ai_runs;
DROP POLICY IF EXISTS "Anyone can read runs" ON public.ai_runs;
REVOKE ALL ON public.ai_runs FROM anon;
GRANT SELECT, INSERT, DELETE ON public.ai_runs TO authenticated;
GRANT ALL ON public.ai_runs TO service_role;
CREATE POLICY "own runs read" ON public.ai_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.ai_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND length(prompt) < 20000 AND length(coalesce(reply,'')) < 60000);
CREATE POLICY "own runs delete" ON public.ai_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DELETE FROM public.tasks WHERE user_id IS NULL;
DROP POLICY IF EXISTS tasks_public_all ON public.tasks;
REVOKE ALL ON public.tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS employees_auth_write ON public.employees;
DROP POLICY IF EXISTS employees_public_read ON public.employees;
REVOKE ALL ON public.employees FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.employees FROM authenticated;
GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
CREATE POLICY employees_signed_in_read ON public.employees FOR SELECT TO authenticated USING (true);

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
    AND (coalesce(qual,'') || coalesce(with_check,'')) ILIKE '%chat-uploads%'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "chat uploads own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat uploads own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat uploads own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);