\set ON_ERROR_STOP on

CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;

CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'reviewer', 'viewer');
CREATE TYPE public.work_status AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'CANCELLED');

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority integer NOT NULL DEFAULT 3,
  status public.work_status NOT NULL DEFAULT 'TODO',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  acceptance_criteria text
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT USAGE ON TYPE public.app_role TO authenticated;

CREATE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
     );
$$;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role = _role
     );
$$;

GRANT EXECUTE ON FUNCTION public.can_write(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Reproduce the current unsafe policy shape before applying the migration.
CREATE POLICY goals_read
  ON public.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY goals_insert
  ON public.goals FOR INSERT TO authenticated
  WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY goals_update
  ON public.goals FOR UPDATE TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY goals_delete
  ON public.goals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));
