\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-111111111111', 'rls-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'rls-b@example.invalid');

INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-4111-8111-111111111111', 'owner'),
  ('22222222-2222-4222-8222-222222222222', 'owner');

INSERT INTO public.goals (id, title, owner_id) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'goal A', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'goal B', '22222222-2222-4222-8222-222222222222');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

DO $goals_rls$
DECLARE
  user_a constant uuid := '11111111-1111-4111-8111-111111111111';
  user_b constant uuid := '22222222-2222-4222-8222-222222222222';
  visible_count integer;
  affected_rows integer;
  actual_owner uuid;
BEGIN
  SELECT count(*) INTO visible_count FROM public.goals;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'User A must read exactly one owned goal; got %', visible_count;
  END IF;

  BEGIN
    INSERT INTO public.goals (title, owner_id) VALUES ('forged owner', user_b);
    RAISE EXCEPTION 'Cross-user INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.goals (title, owner_id) VALUES ('null owner', NULL);
    RAISE EXCEPTION 'NULL owner INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  INSERT INTO public.goals (title) VALUES ('default owner');
  SELECT owner_id INTO actual_owner
  FROM public.goals
  WHERE title = 'default owner';
  IF actual_owner IS DISTINCT FROM user_a THEN
    RAISE EXCEPTION 'owner_id default must be auth.uid(); got %', actual_owner;
  END IF;

  UPDATE public.goals
  SET title = 'cross-user update'
  WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 0 THEN
    RAISE EXCEPTION 'Cross-user UPDATE unexpectedly affected % rows', affected_rows;
  END IF;

  DELETE FROM public.goals
  WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 0 THEN
    RAISE EXCEPTION 'Cross-user DELETE unexpectedly affected % rows', affected_rows;
  END IF;

  BEGIN
    UPDATE public.goals
    SET owner_id = user_b
    WHERE title = 'default owner';
    RAISE EXCEPTION 'Changing a goal owner unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  UPDATE public.goals
  SET title = 'owned update'
  WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Owner UPDATE should affect exactly one row; got %', affected_rows;
  END IF;

  DELETE FROM public.goals
  WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Owner DELETE should affect exactly one row; got %', affected_rows;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  SELECT count(*) INTO visible_count FROM public.goals;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'User B must read exactly one owned goal; got %', visible_count;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '', true);
  SELECT count(*) INTO visible_count FROM public.goals;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'A request without an authenticated subject must read zero goals; got %', visible_count;
  END IF;
END
$goals_rls$;

ROLLBACK;
\echo 'Goals RLS owner-isolation tests passed.'
