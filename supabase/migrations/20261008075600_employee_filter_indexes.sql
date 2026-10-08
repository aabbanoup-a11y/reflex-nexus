create index if not exists employees_department_name_idx on public.employees(department_name);
create index if not exists employees_lifecycle_status_idx on public.employees(lifecycle_status);
create index if not exists employees_risk_level_idx on public.employees(risk_level);
create index if not exists employees_primary_model_idx on public.employees(primary_model);
create index if not exists tasks_employee_status_idx on public.tasks(employee_id, status);
