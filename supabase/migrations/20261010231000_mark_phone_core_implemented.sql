update public.command_catalog
set capability_status = 'implemented',
    handler = 'android-companion-local-planner',
    metadata = metadata || jsonb_build_object('verified_in_source', true, 'release', '0.8.0')
where slug in (
  'phone.open', 'phone.close', 'phone.search', 'phone.read', 'phone.write',
  'phone.list', 'phone.find'
);

update public.skill_catalog
set capability_status = 'implemented',
    metadata = metadata || jsonb_build_object('verified_in_source', true, 'release', '0.8.0')
where slug in ('phone.navigation', 'phone.writing', 'phone.verification');

update public.path_catalog
set capability_status = 'implemented',
    metadata = metadata || jsonb_build_object('verified_in_source', true, 'release', '0.8.0')
where slug in ('phone.intake', 'phone.plan', 'phone.execute', 'phone.verify');
