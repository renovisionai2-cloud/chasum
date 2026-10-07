\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.expect_failure(
  p_sql text,
  p_contains text,
  p_sqlstate text
) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'expected failure but statement succeeded: %', p_sql;
  exception when others then
    if sqlerrm like 'expected failure%' then raise; end if;
    if sqlstate <> p_sqlstate then
      raise exception 'wrong SQLSTATE. expected %, got % (%)',
        p_sqlstate, sqlstate, sqlerrm;
    end if;
    if position(lower(p_contains) in lower(sqlerrm)) = 0 then
      raise exception 'wrong failure. expected %, got %', p_contains, sqlerrm;
    end if;
  end;
end $$;

create or replace function pg_temp.expect_integrity_failure(
  p_sql text
) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'expected failure but statement succeeded: %', p_sql;
  exception when others then
    if sqlerrm like 'expected failure%' then raise; end if;
    if sqlstate not in ('23503', '23514') then
      raise exception 'wrong integrity SQLSTATE: % (%)', sqlstate, sqlerrm;
    end if;
  end;
end $$;

do $$
declare
  unique_columns text[];
  foreign_columns text[];
  referenced_columns text[];
begin
  select array_agg(attribute_row.attname order by key_row.ordinality)
  into unique_columns
  from pg_catalog.pg_constraint constraint_row
  cross join lateral unnest(constraint_row.conkey)
    with ordinality key_row(attnum, ordinality)
  join pg_catalog.pg_attribute attribute_row
    on attribute_row.attrelid = constraint_row.conrelid
   and attribute_row.attnum = key_row.attnum
  where constraint_row.conname =
    'appointments_id_business_customer_financial_key'
    and constraint_row.conrelid = 'public.appointments'::regclass
    and constraint_row.contype = 'u'
    and constraint_row.convalidated;
  if unique_columns is distinct from array['id', 'business_id', 'customer_id'] then
    raise exception 'appointment financial unique-key mismatch: %', unique_columns;
  end if;

  select
    array_agg(source_attribute.attname order by key_row.ordinality),
    array_agg(target_attribute.attname order by key_row.ordinality)
  into foreign_columns, referenced_columns
  from pg_catalog.pg_constraint constraint_row
  cross join lateral unnest(constraint_row.conkey, constraint_row.confkey)
    with ordinality key_row(source_attnum, target_attnum, ordinality)
  join pg_catalog.pg_attribute source_attribute
    on source_attribute.attrelid = constraint_row.conrelid
   and source_attribute.attnum = key_row.source_attnum
  join pg_catalog.pg_attribute target_attribute
    on target_attribute.attrelid = constraint_row.confrelid
   and target_attribute.attnum = key_row.target_attnum
  where constraint_row.conname =
    'commerce_transactions_appt_business_customer_financial_fk'
    and constraint_row.conrelid = 'public.commerce_transactions'::regclass
    and constraint_row.confrelid = 'public.appointments'::regclass
    and constraint_row.contype = 'f'
    and constraint_row.confmatchtype = 's'
    and constraint_row.confupdtype = 'r'
    and constraint_row.confdeltype = 'a'
    and not constraint_row.condeferrable
    and not constraint_row.condeferred
    and constraint_row.convalidated;
  if foreign_columns is distinct from
       array['appointment_id', 'business_id', 'customer_id']
     or referenced_columns is distinct from
       array['id', 'business_id', 'customer_id'] then
    raise exception 'financial composite FK mismatch: % -> %',
      foreign_columns, referenced_columns;
  end if;
end $$;
\echo 'PASS 01 exact validated immediate MATCH SIMPLE / UPDATE RESTRICT / DELETE NO ACTION FK and unique key'

do $$
declare
  function_oid oid :=
    'public.guard_legacy_commerce_transaction_appointment_attribution_v1()'::regprocedure;
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc function_row
    where function_row.oid = function_oid
      and not function_row.prosecdef
      and function_row.proconfig = array['search_path=pg_catalog, pg_temp']
  ) then
    raise exception 'legacy guard function security posture mismatch';
  end if;
  if exists (
       select 1
       from pg_catalog.pg_proc function_row
       cross join lateral pg_catalog.aclexplode(
         coalesce(
           function_row.proacl,
           pg_catalog.acldefault('f', function_row.proowner)
         )
       ) acl_row
       where function_row.oid = function_oid
         and acl_row.grantee = 0
         and acl_row.privilege_type = 'EXECUTE'
     )
     or has_function_privilege('anon', function_oid, 'EXECUTE')
     or has_function_privilege('authenticated', function_oid, 'EXECUTE')
     or has_function_privilege('service_role', function_oid, 'EXECUTE') then
    raise exception 'legacy guard has direct EXECUTE privilege';
  end if;
  if (
    select array_agg(trigger_row.tgname order by trigger_row.tgname)
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.commerce_transactions'::regclass
      and not trigger_row.tgisinternal
      and trigger_row.tgname in (
        'commerce_transactions_attempt_guard',
        'commerce_transactions_legacy_appointment_attribution_guard'
      )
  ) is distinct from array[
    'commerce_transactions_attempt_guard',
    'commerce_transactions_legacy_appointment_attribution_guard'
  ] then
    raise exception 'commerce guard trigger order/set mismatch';
  end if;
end $$;
\echo 'PASS 02 invoker/fixed-search-path/no-direct-EXECUTE guard and alphabetical trigger order'

-- Synthetic-local bootstrap only: model the representative baseline tenant
-- privileges and RLS behavior without claiming hosted policy equivalence.
alter table public.appointments
  add column status text not null default 'confirmed',
  add column start_time timestamptz,
  add column end_time timestamptz,
  add column notes text;
alter table public.appointments enable row level security;
create policy issue134_authenticated_appointments
  on public.appointments for all to authenticated
  using (
    business_id::text =
      current_setting('request.jwt.claim.business_id', true)
  )
  with check (
    business_id::text =
      current_setting('request.jwt.claim.business_id', true)
  );
drop policy "Disposable authenticated commerce access"
  on public.commerce_transactions;
create policy issue134_authenticated_transactions
  on public.commerce_transactions for all to authenticated
  using (
    business_id::text =
      current_setting('request.jwt.claim.business_id', true)
  )
  with check (
    business_id::text =
      current_setting('request.jwt.claim.business_id', true)
  );
grant select, update, delete on public.appointments
  to authenticated, service_role;

insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider, provider_reference
)
select
  pg_catalog.md5('issue134-legacy-' || ledger_status)::uuid,
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000031',
  'payment',
  ledger_status,
  'cash',
  100,
  'cad',
  'manual',
  'issue134-status-' || ledger_status
from unnest(array[
  'pending', 'refunded', 'partially_refunded', 'failed', 'canceled'
]) ledger_status;

do $$
declare
  ledger_row record;
begin
  for ledger_row in
    select id, status
    from public.commerce_transactions
    where provider_reference like 'issue134-status-%'
       or provider_reference = 'legacy-baseline'
  loop
    perform pg_temp.expect_failure(
      format(
        'update public.commerce_transactions set customer_id = %L where id = %L',
        '13410000-0000-4000-8000-000000000022',
        ledger_row.id
      ),
      'LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE',
      '23514'
    );
    perform pg_temp.expect_failure(
      format(
        'delete from public.commerce_transactions where id = %L',
        ledger_row.id
      ),
      'LEGACY_APPOINTMENT_LEDGER_DELETE_FORBIDDEN',
      '23514'
    );
  end loop;
  if (
    select count(*)
    from public.commerce_transactions
    where provider_reference like 'issue134-status-%'
       or provider_reference = 'legacy-baseline'
  ) <> 6 then
    raise exception 'legacy status matrix lost rows';
  end if;
end $$;

select pg_temp.expect_failure(
  $q$update public.commerce_transactions
     set business_id = '13410000-0000-4000-8000-000000000012'
     where id = '13410000-0000-4000-8000-000000000041'$q$,
  'LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
     set appointment_id = '13410000-0000-4000-8000-000000000032'
     where id = '13410000-0000-4000-8000-000000000041'$q$,
  'LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE',
  '23514'
);
update public.commerce_transactions
set description = 'ordinary ledger metadata remains mutable',
    updated_at = now()
where id = '13410000-0000-4000-8000-000000000041';
\echo 'PASS 03 pending/succeeded/refunded/partially-refunded/failed/canceled legacy rows freeze only attribution and DELETE'

insert into public.commerce_transactions(
  id, business_id, customer_id, kind, status, method, amount_cents,
  currency, provider, provider_reference
) values (
  '13420000-0000-4000-8000-000000000101',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000021',
  'payment', 'pending', 'cash', 101, 'cad', 'manual',
  'issue134-null-attachment'
);
update public.commerce_transactions
set appointment_id = '13410000-0000-4000-8000-000000000031'
where id = '13420000-0000-4000-8000-000000000101';
select pg_temp.expect_failure(
  $q$update public.commerce_transactions set appointment_id = null
     where id = '13420000-0000-4000-8000-000000000101'$q$,
  'LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE',
  '23514'
);
select pg_temp.expect_failure(
  $q$delete from public.commerce_transactions
     where id = '13420000-0000-4000-8000-000000000101'$q$,
  'LEGACY_APPOINTMENT_LEDGER_DELETE_FORBIDDEN',
  '23514'
);
\echo 'PASS 04 matching legacy NULL appointment attachment is allowed and then permanently frozen'

insert into public.customers(id, business_id, name) values
  ('13420000-0000-4000-8000-000000000111',
   '13410000-0000-4000-8000-000000000011',
   'Issue 134 residual customer');
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider, provider_reference
) values (
  '13420000-0000-4000-8000-000000000112',
  '13410000-0000-4000-8000-000000000011',
  '13420000-0000-4000-8000-000000000111',
  null, 'payment', 'failed', 'cash', 102, 'cad', 'manual',
  'issue134-null-null-residual'
);
delete from public.customers
where id = '13420000-0000-4000-8000-000000000111';
do $$
begin
  if exists (
    select 1 from public.commerce_transactions
    where id = '13420000-0000-4000-8000-000000000112'
  ) then
    raise exception 'legacy customer-only #153 residual unexpectedly protected';
  end if;
end $$;
\echo 'PASS 05 legacy NULL-attempt/NULL-appointment customer cascade remains the explicit #153 residual'

insert into public.appointments(
  id, business_id, customer_id, status, start_time, end_time
) values
  ('13420000-0000-4000-8000-000000000201',
   '13410000-0000-4000-8000-000000000011',
   '13410000-0000-4000-8000-000000000021',
   'confirmed', '2026-10-07T14:00:00Z', '2026-10-07T14:30:00Z'),
  ('13420000-0000-4000-8000-000000000202',
   '13410000-0000-4000-8000-000000000011',
   '13410000-0000-4000-8000-000000000021',
   'confirmed', '2026-10-07T15:00:00Z', '2026-10-07T15:30:00Z'),
  ('13420000-0000-4000-8000-000000000203',
   '13410000-0000-4000-8000-000000000011',
   '13410000-0000-4000-8000-000000000021',
   'confirmed', '2026-10-07T16:00:00Z', '2026-10-07T16:30:00Z');

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, payment_kind, amount_cents, currency, method,
  provider_route, execution_state, recovery_disposition,
  failure_class, failure_code
) values
  ('13420000-0000-4000-8000-000000000211',
   '13410000-0000-4000-8000-000000000011',
   '13420000-0000-4000-8000-000000000221',
   'v1:' || repeat('1', 64), 'collect_payment',
   '13410000-0000-4000-8000-000000000021',
   '13420000-0000-4000-8000-000000000201',
   'payment', 201, 'cad', 'cash', 'manual', 'REQUESTED', 'RECOVER',
   null, null),
  ('13420000-0000-4000-8000-000000000212',
   '13410000-0000-4000-8000-000000000011',
   '13420000-0000-4000-8000-000000000222',
   'v1:' || repeat('2', 64), 'collect_payment',
   '13410000-0000-4000-8000-000000000021',
   '13420000-0000-4000-8000-000000000202',
   'payment', 202, 'cad', 'cash', 'manual', 'FAILED', 'RECOVER',
   'LEDGER', 'LEDGER_FAILED'),
  ('13420000-0000-4000-8000-000000000213',
   '13410000-0000-4000-8000-000000000011',
   '13420000-0000-4000-8000-000000000223',
   'v1:' || repeat('3', 64), 'collect_payment',
   '13410000-0000-4000-8000-000000000021',
   '13420000-0000-4000-8000-000000000203',
   'none', 0, 'cad', null, null, 'SKIPPED', 'DO_NOT_RETRY',
   null, null);

update public.appointments
set customer_id = '13410000-0000-4000-8000-000000000022'
where id in (
  '13420000-0000-4000-8000-000000000201',
  '13420000-0000-4000-8000-000000000202',
  '13420000-0000-4000-8000-000000000203'
);
\echo 'PASS 06 REQUESTED/FAILED/SKIPPED attempts without ledger do not freeze reassignment'

set local role service_role;
do $$
declare
  admission record;
  committed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13420000-0000-4000-8000-000000000301',
    'v1:' || repeat('4', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000022',
    '13410000-0000-4000-8000-000000000032',
    '13410000-0000-4000-8000-000000000001',
    'payment', 301, 'cad', 'cash', 'manual'
  );
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if committed.outcome <> 'RECORDED' then
    raise exception 'canonical appointment-linked fixture failed';
  end if;
end $$;
reset role;

select pg_temp.expect_failure(
  $q$update public.commerce_transactions
     set customer_id = '13410000-0000-4000-8000-000000000021'
     where payment_attempt_id = (
       select id from public.commerce_payment_attempts
       where attempt_key = '13420000-0000-4000-8000-000000000301'
     )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$delete from public.commerce_transactions
     where payment_attempt_id = (
       select id from public.commerce_payment_attempts
       where attempt_key = '13420000-0000-4000-8000-000000000301'
     )$q$,
  'PAYMENT_ATTEMPT_LEDGER_DELETE_FORBIDDEN',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.appointments
     set customer_id = '13410000-0000-4000-8000-000000000021'
     where id = '13410000-0000-4000-8000-000000000032'$q$,
  'commerce_transactions_appt_business_customer_financial_fk',
  '23503'
);
\echo 'PASS 07 canonical guard remains sole ledger owner; composite FK blocks appointment reassignment'

update public.appointments
set start_time = '2026-10-08T14:00:00Z',
    end_time = '2026-10-08T14:30:00Z',
    status = 'cancelled',
    notes = 'ordinary non-attribution edit'
where id = '13410000-0000-4000-8000-000000000032';
do $$
begin
  if (
    select row(status, start_time, end_time, notes)
    from public.appointments
    where id = '13410000-0000-4000-8000-000000000032'
  ) is distinct from row(
    'cancelled'::text,
    '2026-10-08T14:00:00Z'::timestamptz,
    '2026-10-08T14:30:00Z'::timestamptz,
    'ordinary non-attribution edit'::text
  ) then
    raise exception 'ordinary appointment edit did not persist';
  end if;
end $$;
\echo 'PASS 08 reschedule/cancel/notes and non-attribution ledger fields remain mutable'

select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, appointment_id, kind, status, method,
    amount_cents, currency, provider
  ) values (
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000032',
    'payment', 'pending', 'cash', 1, 'cad', 'manual'
  )$q$,
  'commerce_transactions_appt_business_customer_financial_fk',
  '23503'
);
\echo 'PASS 09 mismatched and cross-customer tuples never commit'

set local role authenticated;
set local request.jwt.claim.business_id =
  '13410000-0000-4000-8000-000000000011';
select pg_temp.expect_failure(
  $q$update public.appointments
     set customer_id = '13410000-0000-4000-8000-000000000021'
     where id = '13410000-0000-4000-8000-000000000032'$q$,
  'commerce_transactions_appt_business_customer_financial_fk',
  '23503'
);
update public.appointments
set notes = 'authenticated ordinary edit'
where id = '13410000-0000-4000-8000-000000000032';
do $$
begin
  if exists (
    select 1 from public.appointments
    where business_id = '13410000-0000-4000-8000-000000000012'
  ) then
    raise exception 'authenticated role observed another tenant';
  end if;
end $$;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, appointment_id, kind, status, method,
    amount_cents, currency, provider
  ) values (
    '13410000-0000-4000-8000-000000000012',
    '13410000-0000-4000-8000-000000000023',
    '13410000-0000-4000-8000-000000000033',
    'payment', 'pending', 'cash', 1, 'usd', 'manual'
  )$q$,
  'row-level security',
  '42501'
);
reset role;

set local role service_role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, appointment_id, kind, status, method,
    amount_cents, currency, provider
  ) values (
    '13410000-0000-4000-8000-000000000012',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000033',
    'payment', 'pending', 'cash', 1, 'usd', 'manual'
  )$q$,
  'commerce_transactions_appt_business_customer_financial_fk',
  '23503'
);
reset role;
\echo 'PASS 10 representative authenticated RLS and service_role BYPASSRLS paths retain tenant/FK enforcement'

select pg_temp.expect_integrity_failure(
  $q$delete from public.appointments
     where id = '13410000-0000-4000-8000-000000000031'$q$
);
select pg_temp.expect_integrity_failure(
  $q$delete from public.appointments
     where id = '13410000-0000-4000-8000-000000000032'$q$
);
select pg_temp.expect_integrity_failure(
  $q$delete from public.customers
     where id = '13410000-0000-4000-8000-000000000021'$q$
);

insert into public.customers(id, business_id, name) values (
  '13420000-0000-4000-8000-000000000401',
  '13410000-0000-4000-8000-000000000011',
  'Canonical customer-only delete protection'
);
set local role service_role;
do $$
declare
  admission record;
  committed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13420000-0000-4000-8000-000000000402',
    'v1:' || repeat('5', 64),
    'customer_billing',
    '13420000-0000-4000-8000-000000000401',
    null,
    '13410000-0000-4000-8000-000000000001',
    'payment', 402, 'cad', 'cash', 'manual'
  );
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if committed.outcome <> 'RECORDED' then
    raise exception 'canonical customer-only fixture failed';
  end if;
end $$;
reset role;
select pg_temp.expect_integrity_failure(
  $q$delete from public.customers
     where id = '13420000-0000-4000-8000-000000000401'$q$
);

insert into public.businesses(id, name, currency) values (
  '13420000-0000-4000-8000-000000000501',
  'Issue 134 teardown Business',
  'cad'
);
insert into public.customers(id, business_id, name) values (
  '13420000-0000-4000-8000-000000000502',
  '13420000-0000-4000-8000-000000000501',
  'Issue 134 teardown customer'
);
insert into public.appointments(id, business_id, customer_id) values (
  '13420000-0000-4000-8000-000000000503',
  '13420000-0000-4000-8000-000000000501',
  '13420000-0000-4000-8000-000000000502'
);
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider
) values (
  '13420000-0000-4000-8000-000000000504',
  '13420000-0000-4000-8000-000000000501',
  '13420000-0000-4000-8000-000000000502',
  '13420000-0000-4000-8000-000000000503',
  'payment', 'failed', 'cash', 504, 'cad', 'manual'
);
select pg_temp.expect_integrity_failure(
  $q$delete from public.businesses
     where id = '13420000-0000-4000-8000-000000000501'$q$
);
do $$
begin
  if not exists (
    select 1 from public.businesses
    where id = '13420000-0000-4000-8000-000000000501'
  ) or not exists (
    select 1 from public.commerce_transactions
    where id = '13420000-0000-4000-8000-000000000504'
  ) then
    raise exception 'failed Business teardown was not atomic';
  end if;
end $$;
\echo 'PASS 11 canonical/legacy appointment, customer, and Business hard-delete outcomes preserve protected history'

rollback;
