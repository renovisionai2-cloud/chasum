-- Issue #73 Package B1 / LEVEL 3 / CODE ONLY. Apply only after a separate gate.
-- Execute this entire file in ONE transaction. No historical migration replay.
-- No operational writer, API policy, payment change, or dependency on 034-036.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare relation_name text;
begin
  foreach relation_name in array array['data_import_runs','data_import_entity_refs','data_import_row_outcomes'] loop
    if pg_catalog.to_regclass('public.' || relation_name) is not null then
      raise exception 'B1 target already exists: %', relation_name;
    end if;
  end loop;
  foreach relation_name in array array['public.businesses','public.locations','public.services','public.staff','public.customers','public.appointments','auth.users'] loop
    if not exists (select 1 from pg_catalog.pg_class where oid = pg_catalog.to_regclass(relation_name) and relkind in ('r','p'))
      or not exists (select 1 from pg_catalog.pg_attribute where attrelid = pg_catalog.to_regclass(relation_name)
        and attname = 'id' and atttypid = 'uuid'::regtype and not attisdropped) then
      raise exception 'B1 prerequisite missing or incompatible: %', relation_name;
    end if;
    if relation_name not in ('public.businesses','auth.users') and not exists (
      select 1 from pg_catalog.pg_attribute where attrelid = pg_catalog.to_regclass(relation_name)
        and attname = 'business_id' and atttypid = 'uuid'::regtype and not attisdropped) then
      raise exception 'B1 tenant prerequisite missing: %', relation_name;
    end if;
  end loop;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role' and rolbypassrls) then
    raise exception 'B1 requires the existing service_role BYPASSRLS posture for private reads';
  end if;
end $$;

create table public.data_import_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  source_system text not null check (source_system = btrim(source_system) and length(source_system) between 1 and 200),
  source_account_key text not null check (source_account_key = btrim(source_account_key) and length(source_account_key) between 1 and 200),
  schema_version text not null check (schema_version = btrim(schema_version) and length(schema_version) between 1 and 200),
  input_checksum text not null check (input_checksum ~ '^[a-f0-9]{64}$'),
  source_timezone text not null check (source_timezone = btrim(source_timezone) and length(source_timezone) between 1 and 100),
  source_currency text not null check (source_currency ~ '^[A-Z]{3}$'),
  state text not null default 'uploaded' check (state in ('uploaded','previewed','committing','completed','completed_with_errors','failed','cancelled')),
  preview_hash text check (preview_hash ~ '^[a-f0-9]{64}$'),
  snapshot_hash text check (snapshot_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default transaction_timestamp() check (isfinite(created_at)),
  previewed_at timestamptz check (isfinite(previewed_at) and previewed_at >= created_at),
  commit_started_at timestamptz check (isfinite(commit_started_at) and commit_started_at >= previewed_at),
  finished_at timestamptz check (isfinite(finished_at) and finished_at >= coalesce(commit_started_at, previewed_at, created_at)),
  unique (id, business_id, source_system, source_account_key),
  constraint data_import_runs_preview_shape check (
    (preview_hash is null and snapshot_hash is null and previewed_at is null and commit_started_at is null)
    or (preview_hash is not null and snapshot_hash is not null and previewed_at is not null)),
  constraint data_import_runs_state_shape check (
    (state = 'uploaded' and previewed_at is null and commit_started_at is null and finished_at is null)
    or (state = 'previewed' and previewed_at is not null and commit_started_at is null and finished_at is null)
    or (state = 'committing' and previewed_at is not null and commit_started_at is not null and finished_at is null)
    or (state in ('completed','completed_with_errors') and previewed_at is not null and commit_started_at is not null and finished_at is not null)
    or (state = 'failed' and finished_at is not null)
    or (state = 'cancelled' and commit_started_at is null and finished_at is not null))
);
create index data_import_runs_business_created_idx on public.data_import_runs (business_id, created_at desc);
create index data_import_runs_created_by_idx on public.data_import_runs (created_by);

create table public.data_import_entity_refs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_system text not null,
  source_account_key text not null,
  entity_type text not null check (entity_type in ('location','service','staff','customer','appointment')),
  source_external_id text not null check (source_external_id = btrim(source_external_id) and length(source_external_id) between 1 and 200),
  source_row_hash text not null check (source_row_hash ~ '^[a-f0-9]{64}$'),
  chasum_entity_id uuid not null,
  first_import_run_id uuid not null,
  last_import_run_id uuid not null,
  created_at timestamptz not null default transaction_timestamp() check (isfinite(created_at)),
  updated_at timestamptz not null default transaction_timestamp() check (isfinite(updated_at) and updated_at >= created_at),
  unique (business_id, source_system, source_account_key, entity_type, source_external_id),
  -- NO ACTION protects normal run history. Deferred checking allows Business
  -- offboarding to cascade both runs and refs without depending on trigger order.
  foreign key (first_import_run_id, business_id, source_system, source_account_key)
    references public.data_import_runs (id, business_id, source_system, source_account_key)
    on delete no action deferrable initially deferred,
  foreign key (last_import_run_id, business_id, source_system, source_account_key)
    references public.data_import_runs (id, business_id, source_system, source_account_key)
    on delete no action deferrable initially deferred
);
create index data_import_refs_first_run_idx on public.data_import_entity_refs (first_import_run_id);
create index data_import_refs_last_run_idx on public.data_import_entity_refs (last_import_run_id);
create index data_import_refs_target_idx on public.data_import_entity_refs (business_id, entity_type, chasum_entity_id);

create table public.data_import_row_outcomes (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.data_import_runs(id) on delete cascade,
  phase text not null check (phase in ('preview','commit')),
  entity_type text not null check (entity_type in ('location','service','staff','serviceLocation','staffLocation','staffService','customer','appointment')),
  -- Package A trims ECMAScript whitespace. Reject untrimmed input without
  -- coercion; btrim's default space-only set would miss tabs/Unicode whitespace.
  source_row_key text not null check (
    source_row_key = btrim(source_row_key, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
    and length(source_row_key) between 1 and 200),
  source_row_hash text not null check (source_row_hash ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('READY','WARNING','DUPLICATE_EXISTING','DUPLICATE_IN_FILE','INVALID','UNRESOLVED_REFERENCE','SKIPPED')),
  planned_action text not null check (planned_action in ('CREATE','LINK_EXISTING','SKIP','BLOCK','REVIEW')),
  reason_codes text[] not null default '{}' check (
    coalesce(array_ndims(reason_codes), 1) = 1 and cardinality(reason_codes) <= 40
    and array_position(reason_codes, null) is null
    and reason_codes <@ array[
      'INVALID_ROOT','INVALID_ROW','INVALID_SNAPSHOT','TARGET_MISMATCH','NAME_REQUIRED',
      'CUSTOMER_EMAIL_UNSUPPORTED','INVALID_EMAIL','INVALID_DURATION','INVALID_MONEY',
      'INVALID_CURRENCY','CURRENCY_MISMATCH','INVALID_TIMEZONE','INVALID_TIMESTAMP',
      'DST_NONEXISTENT','DST_AMBIGUOUS','NOT_FUTURE','INVALID_RANGE','UNMAPPED_STATUS',
      'FINANCIAL_RECONCILIATION_REQUIRED','DUPLICATE_ROW_KEY','DUPLICATE_SOURCE_ID',
      'DUPLICATE_EMAIL','DUPLICATE_LOCATION_SLUG','DUPLICATE_ASSIGNMENT','MISSING_REFERENCE',
      'BLOCKED_PARENT','SOURCE_REF_MATCH','SOURCE_ID_CHANGED','EXPLICIT_LINK',
      'CUSTOMER_EMAIL_MATCH','IDENTITY_CONFLICT','EXISTING_CANDIDATE','AMBIGUOUS_MATCH',
      'ASSIGNMENT_EXISTS','ASSIGNMENT_REQUIRED','APPOINTMENT_OVERLAP']::text[]),
  target_entity_id uuid,
  created_at timestamptz not null default transaction_timestamp() check (isfinite(created_at)),
  unique (import_run_id, phase, entity_type, source_row_key),
  check (entity_type in ('location','service','staff','customer','appointment') or target_entity_id is null),
  check (planned_action <> 'LINK_EXISTING' or target_entity_id is not null),
  check (
    (status = 'READY' and planned_action = 'CREATE')
    or (status = 'WARNING' and planned_action = 'REVIEW')
    or (status = 'DUPLICATE_EXISTING' and planned_action in ('LINK_EXISTING','SKIP'))
    or (status in ('DUPLICATE_IN_FILE','INVALID','UNRESOLVED_REFERENCE') and planned_action = 'BLOCK')
    or (status = 'SKIPPED' and planned_action = 'SKIP')),
  -- Revised D3: an audit can record reconciliation, never label it commit-ready.
  check (not ('FINANCIAL_RECONCILIATION_REQUIRED' = any(reason_codes)) or planned_action in ('REVIEW','BLOCK'))
);

-- All helpers are invoker-only, use qualified relations, and have no client/API
-- EXECUTE grants. Future B2's separately audited writer must supply authority.
create function public.data_import_guard_run() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.state <> 'uploaded' then
      raise exception 'Import run must start uploaded' using errcode = '23514';
    end if;
    return new;
  end if;
  if old.state in ('completed','completed_with_errors','failed','cancelled') then
    raise exception 'Terminal import run is immutable; retry requires a new run' using errcode = '23514';
  end if;
  if row(new.id,new.business_id,new.created_by,new.source_system,new.source_account_key,new.schema_version,
      new.input_checksum,new.source_timezone,new.source_currency,new.created_at)
    is distinct from row(old.id,old.business_id,old.created_by,old.source_system,old.source_account_key,old.schema_version,
      old.input_checksum,old.source_timezone,old.source_currency,old.created_at) then
    raise exception 'Import run identity is immutable' using errcode = '23514';
  end if;
  if not ((old.state = 'uploaded' and new.state in ('previewed','failed','cancelled'))
    or (old.state = 'previewed' and new.state in ('committing','failed','cancelled'))
    or (old.state = 'committing' and new.state in ('completed','completed_with_errors','failed'))) then
    raise exception 'Illegal import run transition' using errcode = '23514';
  end if;
  if old.state <> 'uploaded' or new.state <> 'previewed' then
    if row(new.preview_hash,new.snapshot_hash,new.previewed_at) is distinct from row(old.preview_hash,old.snapshot_hash,old.previewed_at) then
      raise exception 'Reviewed import preview is immutable' using errcode = '23514';
    end if;
  end if;
  if new.state <> 'committing' and new.commit_started_at is distinct from old.commit_started_at then
    raise exception 'Import commit timestamp is immutable outside entry' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger data_import_runs_guard before insert or update on public.data_import_runs
for each row execute function public.data_import_guard_run();

-- Locks the target against deletion and business_id changes until this transaction
-- finishes. This is insert/update-time validation, not a reverse FK on operational
-- tables. Future B2 must revalidate stale mappings after later operational deletion.
create function public.data_import_assert_target(p_type text, p_id uuid, p_business uuid) returns void
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  case p_type
    when 'location' then perform 1 from public.locations where id = p_id and business_id = p_business for share;
    when 'service' then perform 1 from public.services where id = p_id and business_id = p_business for share;
    when 'staff' then perform 1 from public.staff where id = p_id and business_id = p_business for share;
    when 'customer' then perform 1 from public.customers where id = p_id and business_id = p_business for share;
    when 'appointment' then perform 1 from public.appointments where id = p_id and business_id = p_business for share;
    else raise exception 'Invalid import target type' using errcode = '23514';
  end case;
  if not found then
    raise exception 'Import target missing or outside run tenant/type' using errcode = '23503';
  end if;
end $$;

create function public.data_import_guard_ref() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if row(new.id,new.business_id,new.source_system,new.source_account_key,new.entity_type,new.source_external_id,
        new.chasum_entity_id,new.first_import_run_id,new.created_at)
      is distinct from row(old.id,old.business_id,old.source_system,old.source_account_key,old.entity_type,old.source_external_id,
        old.chasum_entity_id,old.first_import_run_id,old.created_at) then
      raise exception 'Import source identity is immutable' using errcode = '23514';
    end if;
    if new.updated_at < old.updated_at then
      raise exception 'Import last-seen timestamp cannot move backward' using errcode = '23514';
    end if;
  elsif new.first_import_run_id <> new.last_import_run_id then
    raise exception 'New import reference must start in one run' using errcode = '23514';
  end if;
  -- SHARE serializes child insertion with lifecycle updates, including finalization.
  perform 1 from public.data_import_runs where id = new.last_import_run_id
    and business_id = new.business_id and source_system = new.source_system
    and source_account_key = new.source_account_key and state = 'committing' for share;
  if not found then
    raise exception 'Import reference requires its namespace committing run' using errcode = '23514';
  end if;
  perform public.data_import_assert_target(new.entity_type,new.chasum_entity_id,new.business_id);
  return new;
end $$;
create trigger data_import_refs_guard before insert or update on public.data_import_entity_refs
for each row execute function public.data_import_guard_ref();

create function public.data_import_guard_outcome() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
declare run_business uuid; run_state text;
begin
  if tg_op = 'UPDATE' then
    raise exception 'Import outcome is immutable; insert a separate phase' using errcode = '23514';
  end if;
  select business_id,state into run_business,run_state from public.data_import_runs
    where id = new.import_run_id for share;
  if not found then
    raise exception 'Import outcome run missing' using errcode = '23503';
  end if;
  if not ((new.phase = 'preview' and run_state = 'uploaded') or (new.phase = 'commit' and run_state = 'committing')) then
    raise exception 'Import outcome phase is closed or incompatible with run' using errcode = '23514';
  end if;
  if new.target_entity_id is not null then
    perform public.data_import_assert_target(new.entity_type,new.target_entity_id,run_business);
  end if;
  return new;
end $$;
create trigger data_import_outcomes_guard before insert or update on public.data_import_row_outcomes
for each row execute function public.data_import_guard_outcome();

alter table public.data_import_runs enable row level security;
alter table public.data_import_runs force row level security;
alter table public.data_import_entity_refs enable row level security;
alter table public.data_import_entity_refs force row level security;
alter table public.data_import_row_outcomes enable row level security;
alter table public.data_import_row_outcomes force row level security;
-- No policies. No generic mutation API, including service_role writes/TRUNCATE.
revoke all on public.data_import_runs, public.data_import_entity_refs, public.data_import_row_outcomes
  from public, anon, authenticated, service_role;
grant select on public.data_import_runs, public.data_import_entity_refs, public.data_import_row_outcomes to service_role;
revoke all on function public.data_import_guard_run(), public.data_import_assert_target(text,uuid,uuid),
  public.data_import_guard_ref(), public.data_import_guard_outcome() from public, anon, authenticated, service_role;

-- REVOKE cannot remove privileges inherited through an unexpected role. Detect
-- that drift instead of broadening this migration into role-membership changes.
do $$
declare role_name text; relation_name text; privilege_name text; function_name text;
begin
  foreach role_name in array array['anon','authenticated','service_role'] loop
    foreach relation_name in array array['data_import_runs','data_import_entity_refs','data_import_row_outcomes'] loop
      if pg_catalog.has_table_privilege(role_name, 'public.' || relation_name, 'SELECT') <> (role_name = 'service_role') then
        raise exception 'Unexpected effective B1 SELECT privilege';
      end if;
      foreach privilege_name in array array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        if pg_catalog.has_table_privilege(role_name, 'public.' || relation_name, privilege_name) then
          raise exception 'Unexpected effective B1 mutation privilege';
        end if;
      end loop;
    end loop;
    foreach function_name in array array['public.data_import_guard_run()', 'public.data_import_assert_target(text,uuid,uuid)',
        'public.data_import_guard_ref()', 'public.data_import_guard_outcome()'] loop
      if pg_catalog.has_function_privilege(role_name, function_name, 'EXECUTE') then
        raise exception 'Unexpected effective B1 helper execution privilege';
      end if;
    end loop;
  end loop;
end $$;
