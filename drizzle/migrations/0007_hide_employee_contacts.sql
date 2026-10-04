REVOKE SELECT ON public.employees FROM authenticated;
GRANT SELECT (id, code, full_name, department, job_title, hired_at, status, created_at, ai_model) ON public.employees TO authenticated;