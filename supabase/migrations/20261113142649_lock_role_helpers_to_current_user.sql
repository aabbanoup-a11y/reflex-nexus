-- Keep role helper functions scoped to the authenticated caller.
-- Applied to Supabase as migration 20261113142649; this file keeps Git history in sync.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role = _role
     );
$function$;

CREATE OR REPLACE FUNCTION public.can_review(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role IN ('owner','manager','reviewer')
     );
$function$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role IN ('owner','manager')
     );
$function$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_review(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write(uuid) TO authenticated;
