-- Goals are per-user records. Enforce ownership at the database boundary for every operation.
-- The live table had zero rows at inspection on 2026-11-22, so no existing rows are reclassified.
ALTER TABLE public.goals
  ALTER COLUMN owner_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS goals_read ON public.goals;
DROP POLICY IF EXISTS goals_insert ON public.goals;
DROP POLICY IF EXISTS goals_update ON public.goals;
DROP POLICY IF EXISTS goals_delete ON public.goals;

CREATE POLICY goals_read
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
  );

CREATE POLICY goals_insert
  ON public.goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
    AND (SELECT public.can_write((SELECT auth.uid())))
  );

CREATE POLICY goals_update
  ON public.goals
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
    AND (SELECT public.can_write((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
    AND (SELECT public.can_write((SELECT auth.uid())))
  );

CREATE POLICY goals_delete
  ON public.goals
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
    AND (SELECT public.has_role((SELECT auth.uid()), 'owner'::public.app_role))
  );
