-- Approval only for truly risky commands; everything else runs directly.
update public.command_catalog
set requires_approval = (
      action in ('delete','send','share')
   or (domain in ('finance','commerce') and action in ('create','edit','upload'))
   or (domain = 'security' and action in ('edit','organize'))
),
metadata = metadata || jsonb_build_object('approval_policy','conversational_risk_only','approval_policy_version','2.0');
