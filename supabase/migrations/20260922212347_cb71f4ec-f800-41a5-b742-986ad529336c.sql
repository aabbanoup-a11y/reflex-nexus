
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text NOT NULL,
  job_title text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  hired_at date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.employees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_public_read" ON public.employees FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "employees_auth_write" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_public_all" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.employees (code, full_name, department, job_title, email, phone, hired_at, status)
SELECT
  'EMP-' || lpad(g::text, 3, '0'),
  (ARRAY['أحمد','محمد','مصطفى','كريم','مينا','بيتر','يوسف','عمر','سارة','مريم','نورا','هبة','إسلام','طارق','رامي','ملك','جورج','شريف'])[1 + (g % 18)]
    || ' ' ||
  (ARRAY['عبد الله','السيد','فؤاد','حسن','عاطف','منير','صبحي','زكي','رمضان','فتحي','سمير','نبيل'])[1 + (g % 12)],
  (ARRAY['المبيعات','الموارد البشرية','المالية','التسويق','تكنولوجيا المعلومات','خدمة العملاء','العمليات','المشتريات','الجودة'])[1 + (g % 9)],
  (ARRAY['مدير','مشرف','أخصائي','منسق','محلل','فني'])[1 + (g % 6)],
  'emp' || g || '@company.com',
  '+2010' || lpad((10000000 + g * 137)::text, 8, '0'),
  (date '2019-01-01' + (g * 11) * interval '1 day')::date,
  CASE WHEN g % 17 = 0 THEN 'leave' ELSE 'active' END
FROM generate_series(1, 162) AS g;
