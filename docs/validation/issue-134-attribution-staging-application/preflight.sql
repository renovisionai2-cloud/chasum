-- Issue #134 governed Staging attribution application gate.
-- READ ONLY. Execute each numbered chunk separately and retain its one JSON result.
-- Fixed target by plan: Supabase project wnfahklzaxirftyskctd.
-- Never treat a final-result-only adapter response as evidence for omitted chunks.

-- =============================================================================
-- CHUNK 01 OF 02 — context, history, catalogue, locks, size, and security.
-- Run immediately before apply and again after apply.
-- Before: candidate_state must be PRE_APPLY_ABSENT.
-- After:  candidate_state must be POST_APPLY_EXACT.
-- =============================================================================
begin read only;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local timezone = 'UTC';

with
history as (
  select
    version,
    name,
    array_length(statements, 1) as statement_count,
    octet_length(statements[1]) as statement_bytes,
    encode(sha256(convert_to(statements[1], 'UTF8')), 'hex') as statement_sha256
  from supabase_migrations.schema_migrations
),
history_summary as (
  select
    count(*) as row_count,
    encode(sha256(convert_to(coalesce(string_agg(
      version::text || '|' || name::text || '|' || statement_count::text || '|' ||
      statement_bytes::text || '|' || statement_sha256,
      E'\n' order by version, name
    ), ''), 'UTF8')), 'hex') as all_rows_sha256,
    encode(sha256(convert_to(coalesce(string_agg(
      version::text || '|' || name::text || '|' || statement_count::text || '|' ||
      statement_bytes::text || '|' || statement_sha256,
      E'\n' order by version, name
    ) filter (
      where name <> 'issue_134_appointment_financial_attribution'
        and statement_sha256 <>
          'fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524'
    ), ''), 'UTF8')), 'hex') as prior_rows_sha256
  from history
),
expected_columns(table_name, column_name, type_name, not_null) as (
  values
    ('appointments', 'id', 'uuid', true),
    ('appointments', 'business_id', 'uuid', true),
    ('appointments', 'customer_id', 'uuid', true),
    ('commerce_transactions', 'appointment_id', 'uuid', false),
    ('commerce_transactions', 'business_id', 'uuid', true),
    ('commerce_transactions', 'customer_id', 'uuid', true),
    ('commerce_transactions', 'payment_attempt_id', 'uuid', false)
),
column_contract as (
  select
    expected_columns.table_name,
    expected_columns.column_name,
    relation.oid is not null
      and attribute_row.attnum is not null
      and not attribute_row.attisdropped
      and type_row.typname = expected_columns.type_name
      and attribute_row.attnotnull = expected_columns.not_null as matches
  from expected_columns
  left join pg_catalog.pg_namespace namespace
    on namespace.nspname = 'public'
  left join pg_catalog.pg_class relation
    on relation.relnamespace = namespace.oid
   and relation.relname = expected_columns.table_name
   and relation.relkind in ('r', 'p')
  left join pg_catalog.pg_attribute attribute_row
    on attribute_row.attrelid = relation.oid
   and attribute_row.attname = expected_columns.column_name
  left join pg_catalog.pg_type type_row
    on type_row.oid = attribute_row.atttypid
),
candidate_constraints as (
  select
    constraint_row.oid,
    constraint_row.conname,
    constraint_row.conrelid::regclass::text as source_relation,
    constraint_row.confrelid::regclass::text as target_relation,
    constraint_row.contype,
    constraint_row.convalidated,
    constraint_row.condeferrable,
    constraint_row.condeferred,
    constraint_row.confmatchtype,
    constraint_row.confupdtype,
    constraint_row.confdeltype,
    constraint_row.conindid::regclass::text as backing_index,
    index_row.indisunique as backing_index_unique,
    index_row.indisvalid as backing_index_valid,
    index_row.indisready as backing_index_ready,
    array(
      select attribute_row.attname::text
      from unnest(constraint_row.conkey) with ordinality key_row(attnum, ordinal)
      join pg_catalog.pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = key_row.attnum
      order by key_row.ordinal
    ) as source_columns,
    array(
      select attribute_row.attname::text
      from unnest(constraint_row.confkey) with ordinality key_row(attnum, ordinal)
      join pg_catalog.pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.confrelid
       and attribute_row.attnum = key_row.attnum
      order by key_row.ordinal
    ) as target_columns,
    pg_catalog.pg_get_constraintdef(constraint_row.oid, false) as definition
  from pg_catalog.pg_constraint constraint_row
  left join pg_catalog.pg_index index_row
    on index_row.indexrelid = constraint_row.conindid
  where constraint_row.conname in (
    'appointments_id_business_customer_financial_key',
    'commerce_transactions_appt_business_customer_financial_fk'
  )
),
candidate_constraint_posture as (
  select
    count(*) = 2
    and bool_and(case
      when conname = 'appointments_id_business_customer_financial_key' then
        source_relation = 'appointments'
        and contype = 'u'
        and convalidated
        and not condeferrable
        and not condeferred
        and source_columns = array['id', 'business_id', 'customer_id']::text[]
        and backing_index = 'appointments_id_business_customer_financial_key'
        and backing_index_unique
        and backing_index_valid
        and backing_index_ready
      when conname =
        'commerce_transactions_appt_business_customer_financial_fk' then
        source_relation = 'commerce_transactions'
        and target_relation = 'appointments'
        and contype = 'f'
        and convalidated
        and not condeferrable
        and not condeferred
        and confmatchtype = 's'
        and confupdtype = 'r'
        and confdeltype = 'a'
        and source_columns =
          array['appointment_id', 'business_id', 'customer_id']::text[]
        and target_columns =
          array['id', 'business_id', 'customer_id']::text[]
        and backing_index = 'appointments_id_business_customer_financial_key'
        and backing_index_unique
        and backing_index_valid
        and backing_index_ready
      else false
    end) as exact
  from candidate_constraints
),
candidate_function as (
  select
    procedure_row.oid,
    procedure_row.oid::regprocedure::text as signature,
    procedure_row.proowner::regrole::text as owner,
    not procedure_row.prosecdef as security_invoker,
    procedure_row.proconfig,
    procedure_row.proacl::text as acl,
    exists (
      select 1
      from pg_catalog.aclexplode(coalesce(
        procedure_row.proacl,
        pg_catalog.acldefault('f', procedure_row.proowner)
      )) acl_row
      where acl_row.grantee = 0
        and acl_row.privilege_type = 'EXECUTE'
    ) as public_execute,
    encode(sha256(convert_to(procedure_row.prosrc, 'UTF8')), 'hex') as body_sha256
  from pg_catalog.pg_proc procedure_row
  where procedure_row.oid = to_regprocedure(
    'public.guard_legacy_commerce_transaction_appointment_attribution_v1()'
  )
),
candidate_function_posture as (
  select coalesce(bool_and(
    security_invoker
    and proconfig = array['search_path=pg_catalog, pg_temp']::text[]
    and body_sha256 =
      '3bfb91b068cc9422af4c17df1ed45a37119fe948be33a611e1d61cdf9aa2c2d2'
    and not public_execute
    and not has_function_privilege('anon', oid, 'EXECUTE')
    and not has_function_privilege('authenticated', oid, 'EXECUTE')
    and not has_function_privilege('service_role', oid, 'EXECUTE')
  ), false) as exact
  from candidate_function
),
candidate_triggers as (
  select
    trigger_row.tgrelid as relation_oid,
    trigger_row.tgfoid as function_oid,
    trigger_row.tgname::text as trigger_name,
    trigger_row.tgrelid::regclass::text as relation_name,
    trigger_row.tgenabled,
    trigger_row.tgtype::integer as trigger_type,
    trigger_row.tgisinternal as internal,
    trigger_row.tgfoid::regprocedure::text as function_name,
    pg_catalog.pg_get_triggerdef(trigger_row.oid, false) as definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname =
    'commerce_transactions_legacy_appointment_attribution_guard'
),
target_guard_order as (
  select array_agg(
    trigger_row.tgname::text order by trigger_row.tgname
  ) as trigger_names
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgrelid = 'public.commerce_transactions'::regclass
    and not trigger_row.tgisinternal
    and trigger_row.tgname in (
      'commerce_transactions_attempt_guard',
      'commerce_transactions_legacy_appointment_attribution_guard'
    )
),
candidate_trigger_posture as (
  select count(*) = 1
    and bool_and(
      relation_oid = 'public.commerce_transactions'::regclass
      and tgenabled = 'O'
      and trigger_type = 27
      and not internal
      and function_oid = to_regprocedure(
        'public.guard_legacy_commerce_transaction_appointment_attribution_v1()'
      )
    ) as exact
  from candidate_triggers
),
old_appointment_fk as (
  select
    count(*) = 1
    and bool_and(
      constraint_row.convalidated
      and not constraint_row.condeferrable
      and not constraint_row.condeferred
      and constraint_row.confmatchtype = 's'
      and constraint_row.confupdtype = 'a'
      and constraint_row.confdeltype = 'n'
    ) as exact,
    jsonb_agg(jsonb_build_object(
      'name', constraint_row.conname,
      'definition', pg_catalog.pg_get_constraintdef(constraint_row.oid, false),
      'validated', constraint_row.convalidated,
      'deferrable', constraint_row.condeferrable,
      'deferred', constraint_row.condeferred
    ) order by constraint_row.conname) as rows
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid = 'public.commerce_transactions'::regclass
    and constraint_row.contype = 'f'
    and constraint_row.confrelid = 'public.appointments'::regclass
    and constraint_row.conkey = array[
      (
        select attribute_row.attnum
        from pg_catalog.pg_attribute attribute_row
        where attribute_row.attrelid =
          'public.commerce_transactions'::regclass
          and attribute_row.attname = 'appointment_id'
          and not attribute_row.attisdropped
      )
    ]::smallint[]
    and constraint_row.confkey = array[
      (
        select attribute_row.attnum
        from pg_catalog.pg_attribute attribute_row
        where attribute_row.attrelid = 'public.appointments'::regclass
          and attribute_row.attname = 'id'
          and not attribute_row.attisdropped
      )
    ]::smallint[]
),
accepted_guard as (
  select
    procedure_row.oid::regprocedure::text as signature,
    procedure_row.proowner::regrole::text as owner,
    not procedure_row.prosecdef as security_invoker,
    procedure_row.proconfig,
    procedure_row.proacl::text as acl,
    encode(sha256(convert_to(procedure_row.prosrc, 'UTF8')), 'hex') as body_sha256
  from pg_catalog.pg_proc procedure_row
  where procedure_row.oid =
    'public.guard_commerce_attempt_ledger_link()'::regprocedure
),
accepted_guard_trigger as (
  select
    trigger_row.tgrelid as relation_oid,
    trigger_row.tgfoid as function_oid,
    trigger_row.tgname::text as trigger_name,
    trigger_row.tgrelid::regclass::text as relation_name,
    trigger_row.tgenabled::text as enabled,
    trigger_row.tgtype::integer as trigger_type,
    trigger_row.tgisinternal as internal,
    trigger_row.tgfoid::regprocedure::text as function_name,
    pg_catalog.pg_get_triggerdef(trigger_row.oid, false) as definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgrelid = 'public.commerce_transactions'::regclass
    and trigger_row.tgname = 'commerce_transactions_attempt_guard'
),
accepted_guard_trigger_posture as (
  select count(*) = 1
    and bool_and(
      relation_oid = 'public.commerce_transactions'::regclass
      and enabled = 'O'
      and trigger_type = 31
      and not internal
      and function_oid =
        'public.guard_commerce_attempt_ledger_link()'::regprocedure
    ) as exact
  from accepted_guard_trigger
),
prior_target_triggers as (
  select
    trigger_row.tgname::text as trigger_name,
    trigger_row.tgenabled::text as enabled,
    trigger_row.tgtype::integer as trigger_type,
    function_namespace.nspname::text as function_schema,
    procedure_row.proname::text as function_name,
    pg_catalog.pg_get_function_identity_arguments(procedure_row.oid)::text
      as function_arguments,
    encode(trigger_row.tgargs, 'hex') as trigger_arguments,
    trigger_row.tgattr::text as trigger_columns,
    coalesce(
      pg_catalog.pg_get_expr(trigger_row.tgqual, trigger_row.tgrelid),
      ''
    )::text as when_expression,
    pg_catalog.pg_get_triggerdef(trigger_row.oid, false) as definition
  from pg_catalog.pg_trigger trigger_row
  join pg_catalog.pg_proc procedure_row
    on procedure_row.oid = trigger_row.tgfoid
  join pg_catalog.pg_namespace function_namespace
    on function_namespace.oid = procedure_row.pronamespace
  where trigger_row.tgrelid = 'public.commerce_transactions'::regclass
    and not trigger_row.tgisinternal
    and trigger_row.tgname <>
      'commerce_transactions_legacy_appointment_attribution_guard'
),
prior_target_trigger_summary as (
  select
    count(*) as count,
    encode(sha256(convert_to(coalesce(string_agg(
      trigger_name::text || '|' || enabled::text || '|' ||
      trigger_type::text || '|' || function_schema::text || '|' ||
      function_name::text || '|' || function_arguments::text || '|' ||
      trigger_arguments::text || '|' || trigger_columns::text || '|' ||
      when_expression::text,
      E'\n' order by trigger_name
    ), ''), 'UTF8')), 'hex') as sha256,
    coalesce(
      jsonb_agg(to_jsonb(prior_target_triggers) order by trigger_name),
      '[]'::jsonb
    ) as rows
  from prior_target_triggers
),
target_locks as (
  select
    activity.pid,
    activity.usename,
    activity.application_name,
    activity.state,
    activity.xact_start,
    activity.wait_event_type,
    activity.wait_event,
    lock_row.relation::regclass::text as relation_name,
    lock_row.mode,
    lock_row.granted
  from pg_catalog.pg_locks lock_row
  join pg_catalog.pg_stat_activity activity
    on activity.pid = lock_row.pid
  where lock_row.locktype = 'relation'
    and lock_row.relation in (
      'public.appointments'::regclass,
      'public.commerce_transactions'::regclass
    )
    and activity.pid <> pg_backend_pid()
),
relation_security as (
  select
    relation.oid::regclass::text as relation_name,
    relation.relowner::regrole::text as owner,
    relation.relrowsecurity,
    relation.relforcerowsecurity,
    relation.relacl::text as acl,
    pg_catalog.pg_relation_size(relation.oid) as relation_bytes,
    pg_catalog.pg_indexes_size(relation.oid) as index_bytes,
    pg_catalog.pg_total_relation_size(relation.oid) as total_bytes
  from pg_catalog.pg_class relation
  where relation.oid in (
    'public.appointments'::regclass,
    'public.commerce_transactions'::regclass,
    'public.commerce_payment_attempts'::regclass,
    'public.commerce_payment_attempt_events'::regclass,
    'public.commerce_payment_reconciliation'::regclass
  )
),
index_posture as (
  select
    index_catalog.indrelid::regclass::text as relation_name,
    index_catalog.indexrelid::regclass::text as index_name,
    index_catalog.indisunique,
    index_catalog.indisvalid,
    index_catalog.indisready,
    pg_catalog.pg_relation_size(index_catalog.indexrelid) as bytes,
    pg_catalog.pg_get_indexdef(index_catalog.indexrelid) as definition
  from pg_catalog.pg_index index_catalog
  where index_catalog.indrelid in (
    'public.appointments'::regclass,
    'public.commerce_transactions'::regclass
  )
),
accepted_functions as (
  select
    procedure_row.oid::regprocedure::text as signature,
    procedure_row.proowner::regrole::text as owner,
    procedure_row.prosecdef,
    procedure_row.proconfig,
    procedure_row.proacl::text as acl,
    encode(sha256(convert_to(procedure_row.prosrc, 'UTF8')), 'hex') as body_sha256
  from pg_catalog.pg_proc procedure_row
  where procedure_row.oid in (
    'public.guard_commerce_payment_attempt()'::regprocedure,
    'public.guard_commerce_attempt_ledger_link()'::regprocedure,
    'public.reject_commerce_attempt_history_mutation()'::regprocedure,
    'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)'::regprocedure,
    'public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure
  )
),
policy_rows as (
  select
    policy_row.polrelid::regclass::text as relation_name,
    policy_row.polname::text as polname,
    policy_row.polcmd::text as polcmd,
    policy_row.polpermissive,
    policy_row.polroles::text as roles,
    coalesce(pg_catalog.pg_get_expr(
      policy_row.polqual,
      policy_row.polrelid
    ), '') as using_expression,
    coalesce(pg_catalog.pg_get_expr(
      policy_row.polwithcheck,
      policy_row.polrelid
    ), '') as check_expression
  from pg_catalog.pg_policy policy_row
  where policy_row.polrelid in (
    'public.appointments'::regclass,
    'public.commerce_transactions'::regclass,
    'public.commerce_payment_attempts'::regclass,
    'public.commerce_payment_attempt_events'::regclass,
    'public.commerce_payment_reconciliation'::regclass
  )
),
event_sequence as (
  select jsonb_build_object(
    'name', relation.oid::regclass::text,
    'owner', relation.relowner::regrole::text,
    'acl', relation.relacl::text,
    'anon_usage', has_sequence_privilege('anon', relation.oid, 'USAGE'),
    'anon_select', has_sequence_privilege('anon', relation.oid, 'SELECT'),
    'anon_update', has_sequence_privilege('anon', relation.oid, 'UPDATE'),
    'authenticated_usage',
      has_sequence_privilege('authenticated', relation.oid, 'USAGE'),
    'authenticated_select',
      has_sequence_privilege('authenticated', relation.oid, 'SELECT'),
    'authenticated_update',
      has_sequence_privilege('authenticated', relation.oid, 'UPDATE'),
    'service_role_usage',
      has_sequence_privilege('service_role', relation.oid, 'USAGE'),
    'service_role_select',
      has_sequence_privilege('service_role', relation.oid, 'SELECT'),
    'service_role_update',
      has_sequence_privilege('service_role', relation.oid, 'UPDATE')
  ) as snapshot
  from pg_catalog.pg_class relation
  where relation.oid =
    'public.commerce_payment_attempt_events_event_sequence_seq'::regclass
),
object_state as (
  select case
    when (select count(*) from candidate_constraints) = 0
      and (select count(*) from candidate_function) = 0
      and (select count(*) from candidate_triggers) = 0
      then 'PRE_APPLY_ABSENT'
    when (select exact from candidate_constraint_posture)
      and (select count(*) from candidate_function) = 1
      and (select exact from candidate_function_posture)
      and (select exact from candidate_trigger_posture)
      and (select trigger_names from target_guard_order) = array[
        'commerce_transactions_attempt_guard',
        'commerce_transactions_legacy_appointment_attribution_guard'
      ]::text[]
      then 'POST_APPLY_EXACT'
    else 'PARTIAL_OR_MISMATCH'
  end as state
)
select jsonb_build_object(
  'record', 'issue134_attribution_catalogue_gate_v1',
  'context', jsonb_build_object(
    'expected_project_ref', 'wnfahklzaxirftyskctd',
    'observed_at', current_timestamp,
    'database', current_database(),
    'server_version', current_setting('server_version'),
    'server17', current_setting('server_version_num')::integer
      between 170000 and 179999,
    'transaction_read_only', current_setting('transaction_read_only') = 'on',
    'lock_timeout', current_setting('lock_timeout'),
    'statement_timeout', current_setting('statement_timeout'),
    'session_user', session_user,
    'effective_role', current_user
  ),
  'history', jsonb_build_object(
    'foundation_exact', exists (
      select 1 from history
      where version = '20261005032107'
        and name = 'issue_134_payment_attempt_foundation'
        and statement_count = 1
        and statement_bytes = 15667
        and statement_sha256 =
          'dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47'
    ),
    'r1a_exact', exists (
      select 1 from history
      where version = '20261005170446'
        and name = 'issue_134_r1a_manual_payment_kernel'
        and statement_count = 1
        and statement_bytes = 16151
        and statement_sha256 =
          '4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7'
    ),
    'candidate_rows', coalesce((
      select jsonb_agg(to_jsonb(history) order by version)
      from history
      where name = 'issue_134_appointment_financial_attribution'
         or statement_sha256 =
           'fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524'
    ), '[]'::jsonb),
    'candidate_absent', (
      select count(*) = 0
      from history
      where name = 'issue_134_appointment_financial_attribution'
         or statement_sha256 =
           'fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524'
    ),
    'candidate_exact', (
      select count(*) = 1
        and bool_and(
          name = 'issue_134_appointment_financial_attribution'
          and statement_count = 1
          and statement_bytes = 6529
          and statement_sha256 =
            'fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524'
        )
      from history
      where name = 'issue_134_appointment_financial_attribution'
         or statement_sha256 =
           'fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524'
    ),
    'all_row_count', (select row_count from history_summary),
    'all_rows_sha256', (select all_rows_sha256 from history_summary),
    'prior_rows_sha256', (select prior_rows_sha256 from history_summary)
  ),
  'schema_columns', jsonb_build_object(
    'all_exact', (select bool_and(matches) from column_contract),
    'mismatches', coalesce((
      select jsonb_agg(
        table_name::text || '.' || column_name::text
          order by table_name, column_name
      )
      from column_contract where not matches
    ), '[]'::jsonb)
  ),
  'old_appointment_fk', (select to_jsonb(old_appointment_fk) from old_appointment_fk),
  'accepted_guard', (select to_jsonb(accepted_guard) from accepted_guard),
  'accepted_guard_exact', coalesce((
    select
      security_invoker
      and proconfig = array['search_path=pg_catalog, pg_temp']::text[]
      and body_sha256 =
        '20d443ae21823633aa97d9560b37a1816127e814da25d23e96412eb375b90e79'
    from accepted_guard
  ), false),
  'accepted_guard_trigger', coalesce((
    select to_jsonb(accepted_guard_trigger) - array[
      'relation_oid',
      'function_oid'
    ]::text[]
    from accepted_guard_trigger
  ), '{}'::jsonb),
  'accepted_guard_trigger_exact', (
    select exact from accepted_guard_trigger_posture
  ),
  'prior_target_triggers', (
    select to_jsonb(prior_target_trigger_summary)
    from prior_target_trigger_summary
  ),
  'candidate_state', (select state from object_state),
  'candidate_constraints', coalesce((
    select jsonb_agg(to_jsonb(candidate_constraints) - 'oid' order by conname)
    from candidate_constraints
  ), '[]'::jsonb),
  'candidate_function', (
    select to_jsonb(candidate_function) - 'oid' from candidate_function
  ),
  'candidate_execute', coalesce((
    select jsonb_build_object(
      'PUBLIC', public_execute,
      'anon', has_function_privilege('anon', oid, 'EXECUTE'),
      'authenticated', has_function_privilege('authenticated', oid, 'EXECUTE'),
      'service_role', has_function_privilege('service_role', oid, 'EXECUTE')
    )
    from candidate_function
  ), '{}'::jsonb),
  'candidate_triggers', coalesce((
    select jsonb_agg(
      to_jsonb(candidate_triggers) - array[
        'relation_oid',
        'function_oid'
      ]::text[]
      order by trigger_name
    )
    from candidate_triggers
  ), '[]'::jsonb),
  'target_guard_order', coalesce(
    to_jsonb((select trigger_names from target_guard_order)),
    '[]'::jsonb
  ),
  'target_locks', jsonb_build_object(
    'other_lock_count', (select count(*) from target_locks),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(target_locks) order by pid, relation_name, mode)
      from target_locks
    ), '[]'::jsonb)
  ),
  'relations', (
    select jsonb_agg(to_jsonb(relation_security) order by relation_name)
    from relation_security
  ),
  'indexes', (
    select jsonb_agg(to_jsonb(index_posture) order by relation_name, index_name)
    from index_posture
  ),
  'accepted_functions', (
    select jsonb_agg(to_jsonb(accepted_functions) order by signature)
    from accepted_functions
  ),
  'policies', jsonb_build_object(
    'count', (select count(*) from policy_rows),
    'sha256', (
      select encode(sha256(convert_to(coalesce(string_agg(
        relation_name::text || '|' || polname::text || '|' ||
        polcmd::text || '|' ||
        polpermissive::text || '|' || roles || '|' ||
        using_expression || '|' || check_expression,
        E'\n' order by relation_name, polname
      ), ''), 'UTF8')), 'hex')
      from policy_rows
    )
  ),
  'event_sequence', (select snapshot from event_sequence)
)::text;

rollback;

-- =============================================================================
-- CHUNK 02 OF 02 — tuple compatibility and data-preservation fingerprints.
-- Run immediately before apply and again after apply. Every before/post value must
-- match. Accepted historical fingerprints remain separate from new gate snapshots.
-- =============================================================================
begin read only;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local timezone = 'UTC';

with
scope as (
  select
    array[
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid,
      'd8e40f1b-fcd1-4161-841e-a16956faeb2e'::uuid
    ] as businesses,
    array[
      '54198e77-156c-4add-9b25-7c06acfdb3f8'::uuid,
      '0b1e93fc-3e93-4e81-ad60-e51eb8c38302'::uuid
    ] as actors,
    array[
      '41d1f31b-d762-47da-8235-b0c2ca97cdd8'::uuid,
      'c4d18eab-0079-4af1-82a5-494d26980cb5'::uuid
    ] as locations,
    array[
      '64793504-1304-498b-90a2-1ea5cc92bbf4'::uuid,
      'acc8c6b0-18d6-4747-a0bb-27228bb66347'::uuid,
      '6312bb17-5cc7-4ce6-bbf5-472965255ffd'::uuid
    ] as customers,
    array[
      'd6b08433-95d0-44c9-a101-e61bc281632e'::uuid,
      '95e396c6-ed39-4cd2-b333-317d9550c7e8'::uuid
    ] as appointments,
    array[
      '13400000-0000-4000-8000-000000000001'::uuid,
      '13400000-0000-4000-8000-000000000002'::uuid,
      '13400000-0000-4000-8000-000000000003'::uuid,
      '13400000-0000-4000-8000-000000000005'::uuid
    ] as old_attempt_keys,
    array[
      '13400000-0000-4000-8000-000000000001'::uuid,
      '13400000-0000-4000-8000-000000000002'::uuid,
      '13400000-0000-4000-8000-000000000003'::uuid,
      '13400000-0000-4000-8000-000000000004'::uuid,
      '13400000-0000-4000-8000-000000000005'::uuid,
      '13400000-0000-4000-8000-000000000006'::uuid
    ] as current_attempt_keys
),
linked as (
  select
    transaction_row.id as transaction_id,
    transaction_row.appointment_id,
    appointment_row.id is null as missing_appointment,
    transaction_row.business_id is distinct from appointment_row.business_id
      as business_mismatch,
    transaction_row.customer_id is distinct from appointment_row.customer_id
      as customer_mismatch
  from public.commerce_transactions transaction_row
  left join public.appointments appointment_row
    on appointment_row.id = transaction_row.appointment_id
  where transaction_row.appointment_id is not null
),
duplicate_parent_triples as (
  select id, business_id, customer_id
  from public.appointments
  group by id, business_id, customer_id
  having count(*) > 1
),
parent_rows(label, row_json_text) as (
  select 'businesses', row_to_json(row_value)::text
  from public.businesses row_value, scope
  where row_value.id = any(scope.businesses)
  union all
  select 'business_hours', row_to_json(row_value)::text
  from public.business_hours row_value, scope
  where row_value.business_id = any(scope.businesses)
  union all
  select 'locations', row_to_json(row_value)::text
  from public.locations row_value, scope
  where row_value.id = any(scope.locations)
  union all
  select 'location_settings', row_to_json(row_value)::text
  from public.location_settings row_value, scope
  where row_value.location_id = any(scope.locations)
  union all
  select 'location_hours', row_to_json(row_value)::text
  from public.location_hours row_value, scope
  where row_value.location_id = any(scope.locations)
  union all
  select 'identity_decisions', row_to_json(row_value)::text
  from public.tenant_identity_decisions row_value, scope
  where row_value.actor_user_id = any(scope.actors)
  union all
  select 'customers', row_to_json(row_value)::text
  from public.customers row_value, scope
  where row_value.id = any(scope.customers)
  union all
  select 'services', row_to_json(row_value)::text
  from public.services row_value
  where row_value.id = 'ad9e38f1-e540-495b-8de8-c1f205d9b9b2'::uuid
  union all
  select 'staff', row_to_json(row_value)::text
  from public.staff row_value
  where row_value.id = 'f3dcd1eb-da90-4874-8e57-b7e531599f88'::uuid
  union all
  select 'staff_working_hours', row_to_json(row_value)::text
  from public.staff_working_hours row_value
  where row_value.staff_id =
    'f3dcd1eb-da90-4874-8e57-b7e531599f88'::uuid
  union all
  select 'service_locations', row_to_json(row_value)::text
  from public.service_locations row_value
  where row_value.service_id =
    'ad9e38f1-e540-495b-8de8-c1f205d9b9b2'::uuid
  union all
  select 'staff_locations', row_to_json(row_value)::text
  from public.staff_locations row_value
  where row_value.staff_id =
    'f3dcd1eb-da90-4874-8e57-b7e531599f88'::uuid
  union all
  select 'staff_services', row_to_json(row_value)::text
  from public.staff_services row_value
  where row_value.staff_id =
    'f3dcd1eb-da90-4874-8e57-b7e531599f88'::uuid
  union all
  select 'appointments', row_to_json(row_value)::text
  from public.appointments row_value, scope
  where row_value.id = any(scope.appointments)
),
old_financial_rows(label, aggregate_label, row_json_text, row_jsonb) as (
  select 'attempts', 'attempts', row_to_json(attempt)::text, to_jsonb(attempt)
  from public.commerce_payment_attempts attempt, scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.old_attempt_keys)
  union all
  select 'events', 'events', row_to_json(event_row)::text, to_jsonb(event_row)
  from public.commerce_payment_attempt_events event_row
  join public.commerce_payment_attempts attempt
    on attempt.id = event_row.attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.old_attempt_keys)
  union all
  select 'ledgers', 'ledger',
    row_to_json(transaction_row)::text, to_jsonb(transaction_row)
  from public.commerce_transactions transaction_row
  join public.commerce_payment_attempts attempt
    on attempt.id = transaction_row.payment_attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.old_attempt_keys)
  union all
  select 'obligations', 'obligations',
    row_to_json(obligation)::text, to_jsonb(obligation)
  from public.commerce_payment_reconciliation obligation
  join public.commerce_payment_attempts attempt
    on attempt.id = obligation.attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.old_attempt_keys)
),
current_financial_rows(label, row_json_text) as (
  select 'attempts', row_to_json(attempt)::text
  from public.commerce_payment_attempts attempt, scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.current_attempt_keys)
  union all
  select 'events', row_to_json(event_row)::text
  from public.commerce_payment_attempt_events event_row
  join public.commerce_payment_attempts attempt
    on attempt.id = event_row.attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.current_attempt_keys)
  union all
  select 'ledgers', row_to_json(transaction_row)::text
  from public.commerce_transactions transaction_row
  join public.commerce_payment_attempts attempt
    on attempt.id = transaction_row.payment_attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.current_attempt_keys)
  union all
  select 'obligations', row_to_json(obligation)::text
  from public.commerce_payment_reconciliation obligation
  join public.commerce_payment_attempts attempt
    on attempt.id = obligation.attempt_id
  cross join scope
  where attempt.business_id =
      'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
    and attempt.attempt_key = any(scope.current_attempt_keys)
),
accepted_old_snapshot as (
  select jsonb_object_agg(label, snapshot) as snapshot
  from (
    select label, jsonb_build_array(
      count(*)::text,
      md5(coalesce(string_agg(
        row_json_text, '|' order by row_json_text
      ), ''))
    ) as snapshot
    from (
      select label, row_json_text from parent_rows
      union all
      select label, row_json_text from old_financial_rows
    ) rows_for_snapshot
    group by label
  ) snapshots
),
expected_old_snapshot as (
  select '{
    "appointments":["2","95e2f7fff22758e75e50909ed7b6a343"],
    "attempts":["4","14dda80b0d393466e819b98f3c72fa72"],
    "business_hours":["14","54535609cfa897f2132f251083820333"],
    "businesses":["2","9c75a3a5d3fc4cd546842873000518bc"],
    "customers":["3","6557acd3b0619b3b2dc76212f735b2cf"],
    "events":["8","bc0850d0156f77e25b3e79e46a9984b6"],
    "identity_decisions":["2","f5e382af33a8388174f74a59c1655516"],
    "ledgers":["3","7e3a5f103e5b1667c941f56a72ca7cd6"],
    "location_hours":["14","23e4fbab15d9984ae2187cd86821254b"],
    "location_settings":["2","beab34100a5fc6c98f4218b78b59969a"],
    "locations":["2","5979447d5f0998e1675088e347afe105"],
    "obligations":["12","a50194725f7313e9545865ef45ab53e4"],
    "service_locations":["1","0308e2b30e084c43a6a3b011f1959883"],
    "services":["1","50d42738673d929759d303342e566fc7"],
    "staff":["1","baeaa9d2c2284edf486be656041c5801"],
    "staff_locations":["1","2a91095bdcad127ae565c821a7513842"],
    "staff_services":["1","74750d8d3fad7d0baecfcabc064712b5"],
    "staff_working_hours":["7","fde9bfce95004008956fe63212072f5f"]
  }'::jsonb as snapshot
),
current_retained_snapshot as (
  select jsonb_object_agg(label, snapshot) as snapshot
  from (
    select label, jsonb_build_array(
      count(*)::text,
      md5(coalesce(string_agg(
        row_json_text, '|' order by row_json_text
      ), ''))
    ) as snapshot
    from (
      select label, row_json_text from parent_rows
      union all
      select label, row_json_text from current_financial_rows
    ) rows_for_snapshot
    group by label
  ) snapshots
),
noncohort_observed as (
  select jsonb_build_object(
    'businesses', (
      select jsonb_build_array(count(*)::text, md5(coalesce(string_agg(
        row_to_json(row_value)::text, '|' order by row_value.id
      ), '')))
      from public.businesses row_value, scope
      where not row_value.id = any(scope.businesses)
    ),
    'customers', (
      select jsonb_build_array(count(*)::text, md5(coalesce(string_agg(
        row_to_json(row_value)::text, '|' order by row_value.id
      ), '')))
      from public.customers row_value, scope
      where not row_value.id = any(scope.customers)
    ),
    'appointments', (
      select jsonb_build_array(count(*)::text, md5(coalesce(string_agg(
        row_to_json(row_value)::text, '|' order by row_value.id
      ), '')))
      from public.appointments row_value, scope
      where not row_value.id = any(scope.appointments)
    ),
    'commerce_transactions', (
      select jsonb_build_array(count(*)::text, md5(coalesce(string_agg(
        row_to_json(transaction_row)::text, '|' order by transaction_row.id
      ), '')))
      from public.commerce_transactions transaction_row, scope
      where not exists (
        select 1
        from public.commerce_payment_attempts attempt
        where attempt.id = transaction_row.payment_attempt_id
          and attempt.business_id =
            'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid
          and attempt.attempt_key = any(scope.current_attempt_keys)
      )
    )
  ) as snapshot
),
noncohort_expected as (
  select '{
    "appointments":["11","2fc6bcb1fb8600261ed23ee6fb992f74"],
    "businesses":["4","7fc3e1697a000ca2620ecc661e151073"],
    "commerce_transactions":["2","411372ed782289a869775cd2f87dd94c"],
    "customers":["3","35d24c7d31b9ff7c098653ff5c9ec84e"]
  }'::jsonb as snapshot
),
expected_attempts(
  attempt_id,
  attempt_key,
  source,
  appointment_id,
  payment_kind,
  amount_cents,
  method,
  execution_state,
  ledger_id
) as (
  values
    (
      'c49d40f5-dfa6-417c-b1cf-25712e5b58d6'::uuid,
      '13400000-0000-4000-8000-000000000001'::uuid,
      'quick_appointment',
      'd6b08433-95d0-44c9-a101-e61bc281632e'::uuid,
      'deposit', 5000, 'e_transfer', 'ACCEPTED',
      '84eb8017-b1e4-49d6-9c47-ef7084cbc163'::uuid
    ),
    (
      'b5451223-c034-4efa-ac2d-47442cdadea1'::uuid,
      '13400000-0000-4000-8000-000000000002'::uuid,
      'collect_payment',
      'd6b08433-95d0-44c9-a101-e61bc281632e'::uuid,
      'payment', 5000, 'cash', 'ACCEPTED',
      '04048de5-a9bb-4772-897b-73027366d893'::uuid
    ),
    (
      '869de0be-05fa-45b6-85cc-2e57dfc41840'::uuid,
      '13400000-0000-4000-8000-000000000003'::uuid,
      'payments_dashboard',
      '95e396c6-ed39-4cd2-b333-317d9550c7e8'::uuid,
      'payment', 8000, 'debit_card', 'ACCEPTED',
      '1a0a40f1-7b77-4fb4-9266-004da77c5676'::uuid
    ),
    (
      '652cfd32-b42c-49a4-b4ff-ce4df47c1891'::uuid,
      '13400000-0000-4000-8000-000000000005'::uuid,
      'collect_payment',
      '95e396c6-ed39-4cd2-b333-317d9550c7e8'::uuid,
      'payment', 1300, 'cash', 'REQUESTED', null::uuid
    ),
    (
      'd211130f-02a9-47c5-a14a-6f91e7c08480'::uuid,
      '13400000-0000-4000-8000-000000000006'::uuid,
      'customer_billing', null::uuid,
      'payment', 100, 'cash', 'ACCEPTED',
      '4c2dd317-f6e0-418a-bda1-ff13250ae712'::uuid
    ),
    (
      'f3dd7583-b63c-49d4-b9a8-dd30a0bc5aaa'::uuid,
      '13400000-0000-4000-8000-000000000004'::uuid,
      'customer_billing', null::uuid,
      'payment', 2500, 'other', 'REQUESTED', null::uuid
    )
),
identity_mismatches as (
  select expected_attempts.attempt_key
  from expected_attempts
  left join public.commerce_payment_attempts attempt
    on attempt.id = expected_attempts.attempt_id
  left join public.commerce_transactions transaction_row
    on transaction_row.id = expected_attempts.ledger_id
  where attempt.id is null
     or row(
       attempt.business_id,
       attempt.attempt_key,
       attempt.source,
       attempt.customer_id,
       attempt.appointment_id,
       attempt.actor_id,
       attempt.payment_kind,
       attempt.amount_cents,
       attempt.currency,
       attempt.method,
       attempt.provider_route,
       attempt.execution_state
     ) is distinct from row(
       'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid,
       expected_attempts.attempt_key,
       expected_attempts.source,
       '64793504-1304-498b-90a2-1ea5cc92bbf4'::uuid,
       expected_attempts.appointment_id,
       '54198e77-156c-4add-9b25-7c06acfdb3f8'::uuid,
       expected_attempts.payment_kind,
       expected_attempts.amount_cents,
       'cad'::text,
       expected_attempts.method,
       'manual'::text,
       expected_attempts.execution_state
     )
     or (
       select count(*)
       from public.commerce_transactions linked_row
       where linked_row.payment_attempt_id = expected_attempts.attempt_id
     ) <> case when expected_attempts.ledger_id is null then 0 else 1 end
     or (
       expected_attempts.ledger_id is not null
       and (
         transaction_row.id is null
         or row(
           transaction_row.business_id,
           transaction_row.customer_id,
           transaction_row.appointment_id,
           transaction_row.kind,
           transaction_row.status,
           transaction_row.method,
           transaction_row.amount_cents,
           transaction_row.currency,
           transaction_row.provider,
           transaction_row.payment_attempt_id
         ) is distinct from row(
           'b09a3b19-dcd3-4156-9c93-ace2e31e1aa7'::uuid,
           '64793504-1304-498b-90a2-1ea5cc92bbf4'::uuid,
           expected_attempts.appointment_id,
           expected_attempts.payment_kind,
           'succeeded'::text,
           expected_attempts.method,
           expected_attempts.amount_cents,
           'cad'::text,
           'manual'::text,
           expected_attempts.attempt_id
         )
       )
     )
),
cohort_attempts as (
  select attempt.*
  from public.commerce_payment_attempts attempt
  join expected_attempts on expected_attempts.attempt_id = attempt.id
),
cohort_events as (
  select event_row.*
  from public.commerce_payment_attempt_events event_row
  join expected_attempts on expected_attempts.attempt_id = event_row.attempt_id
),
cohort_ledgers as (
  select transaction_row.*
  from public.commerce_transactions transaction_row
  join expected_attempts
    on expected_attempts.attempt_id = transaction_row.payment_attempt_id
),
cohort_obligations as (
  select obligation.*
  from public.commerce_payment_reconciliation obligation
  join expected_attempts on expected_attempts.attempt_id = obligation.attempt_id
),
relevant_rows(label, row_json_text) as (
  select 'businesses', row_to_json(row_value)::text
  from public.businesses row_value
  union all
  select 'business_hours', row_to_json(row_value)::text
  from public.business_hours row_value
  union all
  select 'locations', row_to_json(row_value)::text
  from public.locations row_value
  union all
  select 'location_settings', row_to_json(row_value)::text
  from public.location_settings row_value
  union all
  select 'location_hours', row_to_json(row_value)::text
  from public.location_hours row_value
  union all
  select 'identity_decisions', row_to_json(row_value)::text
  from public.tenant_identity_decisions row_value
  union all
  select 'customers', row_to_json(row_value)::text
  from public.customers row_value
  union all
  select 'services', row_to_json(row_value)::text
  from public.services row_value
  union all
  select 'staff', row_to_json(row_value)::text
  from public.staff row_value
  union all
  select 'staff_working_hours', row_to_json(row_value)::text
  from public.staff_working_hours row_value
  union all
  select 'service_locations', row_to_json(row_value)::text
  from public.service_locations row_value
  union all
  select 'staff_locations', row_to_json(row_value)::text
  from public.staff_locations row_value
  union all
  select 'staff_services', row_to_json(row_value)::text
  from public.staff_services row_value
  union all
  select 'appointments', row_to_json(row_value)::text
  from public.appointments row_value
  union all
  select 'attempts', row_to_json(row_value)::text
  from public.commerce_payment_attempts row_value
  union all
  select 'events', row_to_json(row_value)::text
  from public.commerce_payment_attempt_events row_value
  union all
  select 'ledgers', row_to_json(row_value)::text
  from public.commerce_transactions row_value
  union all
  select 'obligations', row_to_json(row_value)::text
  from public.commerce_payment_reconciliation row_value
  union all
  select 'invoices', row_to_json(row_value)::text
  from public.commerce_invoices row_value
  union all
  select 'customer_payment_events', row_to_json(row_value)::text
  from public.customer_payment_events row_value
),
relevant_table_snapshots as (
  select jsonb_object_agg(label, snapshot) as snapshot
  from (
    select label, jsonb_build_object(
      'count', count(*),
      'sha256', encode(sha256(convert_to(coalesce(string_agg(
        row_json_text, '|' order by row_json_text
      ), ''), 'UTF8')), 'hex')
    ) as snapshot
    from relevant_rows
    group by label
  ) snapshots
)
select jsonb_build_object(
  'record', 'issue134_attribution_data_gate_v1',
  'context', jsonb_build_object(
    'expected_project_ref', 'wnfahklzaxirftyskctd',
    'observed_at', current_timestamp,
    'database', current_database(),
    'server_version', current_setting('server_version'),
    'transaction_read_only', current_setting('transaction_read_only') = 'on',
    'lock_timeout', current_setting('lock_timeout'),
    'statement_timeout', current_setting('statement_timeout')
  ),
  'tuple_compatibility', jsonb_build_object(
    'appointment_linked_rows', (select count(*) from linked),
    'mismatch_count', (
      select count(*) from linked
      where missing_appointment or business_mismatch or customer_mismatch
    ),
    'business_mismatch_count', (
      select count(*) from linked where business_mismatch
    ),
    'customer_mismatch_count', (
      select count(*) from linked where customer_mismatch
    ),
    'duplicate_parent_triple_count', (
      select count(*) from duplicate_parent_triples
    ),
    'mismatch_identifiers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'transaction_id', transaction_id,
        'appointment_id', appointment_id,
        'missing_appointment', missing_appointment,
        'business_mismatch', business_mismatch,
        'customer_mismatch', customer_mismatch
      ) order by transaction_id)
      from linked
      where missing_appointment or business_mismatch or customer_mismatch
    ), '[]'::jsonb)
  ),
  'accepted_old_cohort', jsonb_build_object(
    'observed', (select snapshot from accepted_old_snapshot),
    'expected', (select snapshot from expected_old_snapshot),
    'matches', (
      select accepted_old_snapshot.snapshot = expected_old_snapshot.snapshot
      from accepted_old_snapshot, expected_old_snapshot
    ),
    'run02_financial_rows', (select count(*) from old_financial_rows),
    'run02_financial_sha256', (
      select encode(sha256(convert_to(coalesce(string_agg(
        aggregate_label || ':' || row_jsonb::text,
        E'\n' order by aggregate_label, row_jsonb::text
      ), ''), 'UTF8')), 'hex')
      from old_financial_rows
    ),
    'run02_financial_matches', (
      select count(*) = 27
        and encode(sha256(convert_to(coalesce(string_agg(
          aggregate_label || ':' || row_jsonb::text,
          E'\n' order by aggregate_label, row_jsonb::text
        ), ''), 'UTF8')), 'hex') =
          '42ed8dfff1dd81c807168b652f7d4bb5a736664f63b48fb261b9b8b94a0dd0de'
      from old_financial_rows
    )
  ),
  'noncohort', jsonb_build_object(
    'observed', (select snapshot from noncohort_observed),
    'expected', (select snapshot from noncohort_expected),
    'matches', (
      select noncohort_observed.snapshot = noncohort_expected.snapshot
      from noncohort_observed, noncohort_expected
    )
  ),
  'current_retained', jsonb_build_object(
    'snapshot', (select snapshot from current_retained_snapshot),
    'parent_rows', (select count(*) from parent_rows),
    'financial_rows', (select count(*) from current_financial_rows),
    'public_rows', (
      (select count(*) from parent_rows) +
      (select count(*) from current_financial_rows)
    ),
    'identity_mismatch_count', (select count(*) from identity_mismatches),
    'identity_mismatch_keys', coalesce((
      select jsonb_agg(attempt_key order by attempt_key)
      from identity_mismatches
    ), '[]'::jsonb),
    'attempts', (select count(*) from cohort_attempts),
    'accepted_attempts', (
      select count(*) from cohort_attempts where execution_state = 'ACCEPTED'
    ),
    'requested_attempts', (
      select count(*) from cohort_attempts where execution_state = 'REQUESTED'
    ),
    'events', (select count(*) from cohort_events),
    'requested_events', (
      select count(*) from cohort_events where event_type = 'REQUESTED'
    ),
    'accepted_events', (
      select count(*) from cohort_events where event_type = 'ACCEPTED'
    ),
    'conflict_events', (
      select count(*) from cohort_events where event_type = 'KEY_CONFLICT'
    ),
    'linked_ledgers', (select count(*) from cohort_ledgers),
    'ledger_total_cents', (
      select coalesce(sum(amount_cents), 0) from cohort_ledgers
    ),
    'all_ledger_currency_cad', coalesce((
      select min(currency) = 'cad' and max(currency) = 'cad'
      from cohort_ledgers
    ), false),
    'obligations', (select count(*) from cohort_obligations),
    'pending_obligations', (
      select count(*) from cohort_obligations where state = 'PENDING'
    ),
    'not_required_obligations', (
      select count(*) from cohort_obligations where state = 'NOT_REQUIRED'
    ),
    'c1_not_required_appointment_cache', (
      select count(*) = 1
      from cohort_obligations
      where attempt_id = 'd211130f-02a9-47c5-a14a-6f91e7c08480'::uuid
        and projection_kind = 'appointment_cache'
        and state = 'NOT_REQUIRED'
        and completed_at is not null
    ),
    'counts_match_expected',
      (select count(*) from parent_rows) = 53
      and (select count(*) from current_financial_rows) = 37
      and (select count(*) from cohort_attempts) = 6
      and (
        select count(*) from cohort_attempts
        where execution_state = 'ACCEPTED'
      ) = 4
      and (
        select count(*) from cohort_attempts
        where execution_state = 'REQUESTED'
      ) = 2
      and (select count(*) from cohort_events) = 11
      and (
        select count(*) from cohort_events where event_type = 'REQUESTED'
      ) = 6
      and (
        select count(*) from cohort_events where event_type = 'ACCEPTED'
      ) = 4
      and (
        select count(*) from cohort_events where event_type = 'KEY_CONFLICT'
      ) = 1
      and (select count(*) from cohort_ledgers) = 4
      and (
        select coalesce(sum(amount_cents), 0) from cohort_ledgers
      ) = 18100
      and (select count(*) from cohort_obligations) = 16
      and (
        select count(*) from cohort_obligations where state = 'PENDING'
      ) = 15
      and (
        select count(*) from cohort_obligations where state = 'NOT_REQUIRED'
      ) = 1
      and (select last_value = 14 and is_called
        from public.commerce_payment_attempt_events_event_sequence_seq),
    'sequence', (
      select jsonb_build_object(
        'last_value', last_value::text,
        'is_called', is_called
      )
      from public.commerce_payment_attempt_events_event_sequence_seq
    )
  ),
  'full_relevant_table_snapshots', (
    select snapshot from relevant_table_snapshots
  )
)::text;

rollback;
