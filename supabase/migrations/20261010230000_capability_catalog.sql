create table if not exists public.command_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null,
  action text not null,
  description text not null,
  execution_mode text not null check (execution_mode in ('local','cloud','hybrid')),
  capability_status text not null default 'cataloged' check (capability_status in ('implemented','cataloged','planned')),
  handler text not null,
  safety_class text not null default 'safe' check (safety_class in ('safe','sensitive','destructive')),
  requires_approval boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null,
  description text not null,
  execution_mode text not null check (execution_mode in ('local','cloud','hybrid')),
  capability_status text not null default 'planned' check (capability_status in ('implemented','cataloged','planned')),
  command_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.path_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null,
  description text not null,
  entrypoint text not null,
  execution_mode text not null check (execution_mode in ('local','cloud','hybrid')),
  capability_status text not null default 'planned' check (capability_status in ('implemented','cataloged','planned')),
  step_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select on public.command_catalog, public.skill_catalog, public.path_catalog to authenticated;
alter table public.command_catalog enable row level security;
alter table public.skill_catalog enable row level security;
alter table public.path_catalog enable row level security;
drop policy if exists command_catalog_read on public.command_catalog;
drop policy if exists skill_catalog_read on public.skill_catalog;
drop policy if exists path_catalog_read on public.path_catalog;
create policy command_catalog_read on public.command_catalog for select to authenticated using (true);
create policy skill_catalog_read on public.skill_catalog for select to authenticated using (true);
create policy path_catalog_read on public.path_catalog for select to authenticated using (true);

with domains(domain, mode) as (
  values
    ('phone','local'), ('apps','hybrid'), ('browser','cloud'), ('files','local'), ('media','hybrid'),
    ('documents','hybrid'), ('communication','hybrid'), ('productivity','hybrid'), ('system','local'), ('security','hybrid'),
    ('research','cloud'), ('planning','hybrid'), ('memory','local'), ('knowledge','hybrid'), ('calendar','hybrid'),
    ('travel','cloud'), ('finance','cloud'), ('commerce','cloud'), ('education','hybrid'), ('health','hybrid'),
    ('development','hybrid'), ('deployment','cloud'), ('monitoring','hybrid'), ('automation','hybrid'), ('accessibility','local')
), actions(action, description, safety) as (
  values
    ('open','فتح أو تشغيل المورد المطلوب','safe'),
    ('close','إغلاق المورد أو الشاشة الحالية','safe'),
    ('search','البحث داخل المجال المحدد','safe'),
    ('read','قراءة المحتوى المتاح للمستخدم','safe'),
    ('write','كتابة المحتوى الذي حدده المستخدم','safe'),
    ('edit','تعديل محتوى موجود','sensitive'),
    ('create','إنشاء عنصر أو ملف جديد','safe'),
    ('list','عرض قائمة العناصر','safe'),
    ('find','العثور على عنصر يطابق الوصف','safe'),
    ('summarize','تلخيص المحتوى دون تغييره','safe'),
    ('translate','ترجمة المحتوى','safe'),
    ('classify','تصنيف المحتوى','safe'),
    ('extract','استخراج بيانات منظمة','safe'),
    ('convert','تحويل الصيغة أو الشكل','safe'),
    ('organize','ترتيب العناصر أو الملفات','sensitive'),
    ('share','مشاركة المحتوى مع جهة خارجية','sensitive'),
    ('send','إرسال محتوى أو رسالة','sensitive'),
    ('download','تنزيل محتوى من الشبكة','sensitive'),
    ('upload','رفع محتوى إلى خدمة','sensitive'),
    ('delete','حذف محتوى أو عنصر','destructive')
)
insert into public.command_catalog(slug,name,domain,action,description,execution_mode,capability_status,handler,safety_class,requires_approval,metadata)
select
  d.domain || '.' || a.action,
  a.action || ' — ' || d.domain,
  d.domain,
  a.action,
  a.description || ' ضمن مجال ' || d.domain,
  d.mode,
  case when d.domain in ('phone','files','system','accessibility') and a.action in ('open','close','read','write','list','find','search') then 'cataloged' else 'planned' end,
  case when d.domain = 'phone' then 'android-companion' when d.mode = 'cloud' then 'cloud-agent' else 'capability-router' end,
  a.safety,
  a.safety <> 'safe',
  jsonb_build_object('catalog_version','1.0','generated',true)
from domains d cross join actions a
on conflict (slug) do nothing;

with domains(domain, mode) as (
  values
    ('phone','local'), ('apps','hybrid'), ('browser','cloud'), ('files','local'), ('media','hybrid'),
    ('documents','hybrid'), ('communication','hybrid'), ('productivity','hybrid'), ('system','local'), ('security','hybrid')
), skills(skill, description) as (
  values
    ('navigation','التنقل بين الشاشات والعناصر'), ('search','العثور على المعلومات'), ('reading','قراءة المحتوى'),
    ('writing','كتابة المحتوى'), ('editing','تعديل المحتوى'), ('planning','تخطيط مهمة متعددة الخطوات'),
    ('verification','التحقق من نتيجة خطوة'), ('recovery','التعافي من فشل خطوة'), ('privacy','تقليل البيانات المرسلة'),
    ('reporting','إعداد ملخص ونتيجة قابلة للمراجعة')
)
insert into public.skill_catalog(slug,name,domain,description,execution_mode,capability_status,command_count,metadata)
select d.domain || '.' || s.skill, s.skill || ' — ' || d.domain, d.domain,
  s.description || ' في مجال ' || d.domain, d.mode,
  case when d.domain = 'phone' and s.skill in ('navigation','writing','verification') then 'cataloged' else 'planned' end,
  5, jsonb_build_object('catalog_version','1.0','generated',true)
from domains d cross join skills s
on conflict (slug) do nothing;

with domains(domain, mode) as (
  values
    ('phone','local'), ('apps','hybrid'), ('browser','cloud'), ('files','local'), ('media','hybrid'),
    ('documents','hybrid'), ('communication','hybrid'), ('productivity','hybrid'), ('system','local'), ('development','hybrid')
), flows(flow, description) as (
  values
    ('intake','استقبال الطلب وفهم الهدف'), ('plan','تكوين خطة خطوات'), ('execute','تنفيذ الخطوات المسموحة'),
    ('verify','فحص النتيجة وتسجيلها'), ('recover','إعادة المحاولة أو التسليم للمستخدم')
)
insert into public.path_catalog(slug,name,domain,description,entrypoint,execution_mode,capability_status,step_count,metadata)
select d.domain || '.' || f.flow, f.flow || ' — ' || d.domain, d.domain,
  f.description || ' لمسار ' || d.domain, 'agent-router', d.mode,
  case when d.domain = 'phone' and f.flow in ('intake','plan','execute','verify') then 'cataloged' else 'planned' end,
  5, jsonb_build_object('catalog_version','1.0','generated',true)
from domains d cross join flows f
on conflict (slug) do nothing;
