-- The owner explicitly requested autonomous command execution without manual approval gates.
update public.command_catalog
set requires_approval = false,
    metadata = metadata || jsonb_build_object(
      'approval_policy','autonomous_execution',
      'approval_policy_version','3.0'
    );
