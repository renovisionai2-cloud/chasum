\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.expect_failure(
  p_sql text,
  p_contains text,
  p_sqlstate text default null
) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'expected failure but statement succeeded: %', p_sql;
  exception when others then
    if sqlerrm like 'expected failure%' then raise; end if;
    if position(lower(p_contains) in lower(sqlerrm)) = 0 then
      raise exception 'wrong failure. expected message %, got %', p_contains, sqlerrm;
    end if;
    if p_sqlstate is not null and sqlstate <> p_sqlstate then
      raise exception 'wrong SQLSTATE. expected %, got % (%)', p_sqlstate, sqlstate, sqlerrm;
    end if;
  end;
end $$;

do $$
declare
  object_name text;
begin
  if current_setting('lock_timeout') <> '5s'
     or current_setting('statement_timeout') <> '30s' then
    raise exception 'migration session timeouts are ineffective: lock=%, statement=%',
      current_setting('lock_timeout'), current_setting('statement_timeout');
  end if;
  if (
    select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'commerce_payment_attempts',
        'commerce_payment_attempt_events',
        'commerce_payment_reconciliation'
      )
      and c.relkind = 'r'
  ) <> 3 then
    raise exception 'Issue #134 table set is incomplete';
  end if;
  if (
    select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'guard_commerce_payment_attempt',
        'guard_commerce_attempt_ledger_link',
        'reject_commerce_attempt_history_mutation'
      )
  ) <> 3 then
    raise exception 'Issue #134 function set is incomplete';
  end if;
  if (
    select count(*) from pg_trigger
    where not tgisinternal
      and tgname in (
        'commerce_payment_attempts_immutable_request',
        'commerce_payment_attempts_no_delete',
        'commerce_transactions_attempt_guard',
        'commerce_payment_attempt_events_append_only'
      )
  ) <> 4 then
    raise exception 'Issue #134 trigger set is incomplete';
  end if;
  foreach object_name in array array[
    'customers_id_business_attempt_key',
    'appointments_id_business_attempt_key',
    'gift_cards_id_business_attempt_key',
    'commerce_payment_attempts_pkey',
    'commerce_payment_attempts_business_id_fkey',
    'commerce_payment_attempts_business_key',
    'commerce_payment_attempts_id_business_key',
    'commerce_payment_attempts_request_fingerprint_check',
    'commerce_payment_attempts_source_check',
    'commerce_payment_attempts_payment_kind_check',
    'commerce_payment_attempts_currency_check',
    'commerce_payment_attempts_method_check',
    'commerce_payment_attempts_provider_route_check',
    'commerce_payment_attempts_execution_state_check',
    'commerce_payment_attempts_recovery_disposition_check',
    'commerce_payment_attempts_failure_class_check',
    'commerce_payment_attempts_failure_code_check',
    'commerce_payment_attempts_created_at_check',
    'commerce_payment_attempts_updated_at_check',
    'commerce_payment_attempts_resolved_at_check',
    'commerce_payment_attempts_customer_fk',
    'commerce_payment_attempts_appointment_fk',
    'commerce_payment_attempts_gift_card_fk',
    'commerce_payment_attempts_request_check',
    'commerce_payment_attempts_gift_card_check',
    'commerce_payment_attempts_skip_check',
    'commerce_payment_attempts_accept_check',
    'commerce_payment_attempts_failure_check',
    'commerce_payment_attempts_retry_check',
    'commerce_transactions_payment_attempt_key',
    'commerce_transactions_attempt_business_key',
    'commerce_transactions_attempt_business_fk',
    'commerce_payment_attempt_events_pkey',
    'commerce_payment_attempt_events_event_sequence_key',
    'commerce_payment_attempt_events_event_type_check',
    'commerce_payment_attempt_events_money_state_check',
    'commerce_payment_attempt_events_projection_kind_check',
    'commerce_payment_attempt_events_reconciliation_state_check',
    'commerce_payment_attempt_events_failure_class_check',
    'commerce_payment_attempt_events_failure_code_check',
    'commerce_payment_attempt_events_occurred_at_check',
    'commerce_payment_attempt_events_attempt_fk',
    'commerce_payment_attempt_events_projection_check',
    'commerce_payment_attempt_events_failure_check',
    'commerce_payment_reconciliation_pkey',
    'commerce_payment_reconciliation_projection_kind_check',
    'commerce_payment_reconciliation_state_check',
    'commerce_payment_reconciliation_failure_code_check',
    'commerce_payment_reconciliation_created_at_check',
    'commerce_payment_reconciliation_updated_at_check',
    'commerce_payment_reconciliation_completed_at_check',
    'commerce_payment_reconciliation_ledger_fk',
    'commerce_payment_reconciliation_completion_check',
    'commerce_payment_reconciliation_failure_check'
  ] loop
    if not exists (select 1 from pg_constraint where conname = object_name) then
      raise exception 'Issue #134 constraint missing: %', object_name;
    end if;
  end loop;
  foreach object_name in array array[
    'commerce_payment_attempts_pkey',
    'commerce_payment_attempts_business_key',
    'commerce_payment_attempts_id_business_key',
    'commerce_payment_attempts_customer_idx',
    'commerce_payment_attempts_appointment_idx',
    'commerce_payment_attempts_booking_idx',
    'commerce_payment_attempts_gift_card_idx',
    'commerce_transactions_payment_attempt_key',
    'commerce_transactions_attempt_business_key',
    'commerce_payment_attempt_events_pkey',
    'commerce_payment_attempt_events_event_sequence_key',
    'commerce_payment_attempt_events_history_idx',
    'commerce_payment_reconciliation_pkey',
    'commerce_payment_reconciliation_pending_idx'
  ] loop
    if to_regclass('public.' || object_name) is null then
      raise exception 'Issue #134 index missing: %', object_name;
    end if;
  end loop;
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.commerce_payment_attempt_events'::regclass
      and attname = 'event_sequence'
      and attidentity = 'a'
  ) then
    raise exception 'event_sequence is not GENERATED ALWAYS AS IDENTITY';
  end if;
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.commerce_payment_reconciliation'::regclass
      and attname = 'is_financial'
      and attgenerated = 's'
  ) then
    raise exception 'is_financial is not a stored generated column';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'commerce_payment_attempt_events_history_idx'
      and indexdef like '%(attempt_id, business_id, event_sequence)%'
  ) then
    raise exception 'event history index does not use event_sequence';
  end if;
end $$;
\echo 'PASS 01 exact migration applied; effective 5s/30s timeouts and expected objects exist'

insert into public.businesses(id, name) values
  ('13400000-0000-0000-0000-000000000001', 'Issue 134 A'),
  ('13400000-0000-0000-0000-000000000002', 'Issue 134 B');
insert into public.customers(id, business_id, name) values
  ('13400000-0000-0000-0000-000000000011', '13400000-0000-0000-0000-000000000001', 'Customer A'),
  ('13400000-0000-0000-0000-000000000012', '13400000-0000-0000-0000-000000000002', 'Customer B');
insert into public.appointments(id, business_id, customer_id) values
  ('13400000-0000-0000-0000-000000000021', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000011'),
  ('13400000-0000-0000-0000-000000000022', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000011'),
  ('13400000-0000-0000-0000-000000000023', '13400000-0000-0000-0000-000000000002', '13400000-0000-0000-0000-000000000012');
insert into public.gift_cards(id, business_id, code) values
  ('13400000-0000-0000-0000-000000000031', '13400000-0000-0000-0000-000000000001', 'A-CARD'),
  ('13400000-0000-0000-0000-000000000032', '13400000-0000-0000-0000-000000000002', 'B-CARD');

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, payment_kind, amount_cents, currency, method, provider_route,
  execution_state
) values
  ('13400000-0000-0000-0000-000000000101', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000201', 'v1:'||repeat('a',64), 'booking_sheet', '13400000-0000-0000-0000-000000000011', '13400000-0000-0000-0000-000000000021', 'payment', 1000, 'cad', 'cash', 'manual', 'ACCEPTED'),
  ('13400000-0000-0000-0000-000000000102', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000202', 'v1:'||repeat('b',64), 'booking_sheet', '13400000-0000-0000-0000-000000000011', '13400000-0000-0000-0000-000000000021', 'payment', 1000, 'cad', 'cash', 'manual', 'ACCEPTED');

set local role service_role;
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider, payment_attempt_id
) values
  ('13400000-0000-0000-0000-000000000301', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000011', '13400000-0000-0000-0000-000000000021', 'payment', 'succeeded', 'cash', 1000, 'cad', 'manual', '13400000-0000-0000-0000-000000000101'),
  ('13400000-0000-0000-0000-000000000302', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000011', '13400000-0000-0000-0000-000000000021', 'payment', 'succeeded', 'cash', 1000, 'cad', 'manual', '13400000-0000-0000-0000-000000000102');
reset role;
do $$
begin
  if (select count(*) from public.commerce_transactions where amount_cents = 1000 and payment_attempt_id is not null) <> 2 then
    raise exception 'equal-value distinct attempts did not each link a ledger row';
  end if;
end $$;
\echo 'PASS 02 equal-value second payment with a different attempt key and separate ledger row'

select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_attempts(
    business_id, attempt_key, request_fingerprint, source, customer_id,
    appointment_id, payment_kind, amount_cents, currency, method, provider_route
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000201',
    'v1:'||repeat('c',64), 'booking_sheet',
    '13400000-0000-0000-0000-000000000011',
    '13400000-0000-0000-0000-000000000021',
    'payment', 1000, 'cad', 'cash', 'manual'
  )$q$,
  'commerce_payment_attempts_business_key',
  '23505'
);
\echo 'PASS 03 duplicate (business_id, attempt_key) rejected'

set local role service_role;
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set payment_attempt_id = '13400000-0000-0000-0000-000000000102'
      where id = '13400000-0000-0000-0000-000000000301'$q$,
  'PAYMENT_ATTEMPT_LEDGER_LINK_IMMUTABLE',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set payment_attempt_id = null
      where id = '13400000-0000-0000-0000-000000000301'$q$,
  'PAYMENT_ATTEMPT_LEDGER_LINK_IMMUTABLE',
  '23514'
);
reset role;
\echo 'PASS 04 ledger payment_attempt_id updates are rejected'

set local role service_role;
select pg_temp.expect_failure(
  $q$delete from public.commerce_transactions
      where id = '13400000-0000-0000-0000-000000000301'$q$,
  'PAYMENT_ATTEMPT_LEDGER_DELETE_FORBIDDEN',
  '23514'
);
reset role;
\echo 'PASS 05 linked ledger deletion rejected'

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, payment_kind, amount_cents, currency, method, provider_route,
  execution_state
) values (
  '13400000-0000-0000-0000-000000000103',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000203',
  'v1:'||repeat('c',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000021',
  'payment', 2500, 'cad', 'cash', 'manual', 'ACCEPTED'
);
set local role service_role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, appointment_id, kind, status, method,
    amount_cents, currency, provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    '13400000-0000-0000-0000-000000000021',
    'payment', 'succeeded', 'cash', 2499, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000103'
  )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
reset role;
\echo 'PASS 06 ledger INSERT tuple mismatch rejected'

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, method, provider_route, execution_state,
  recovery_disposition
) values
  ('13400000-0000-0000-0000-000000000104', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000204', 'v1:'||repeat('d',64), 'collect_payment', '13400000-0000-0000-0000-000000000011', 'payment', 500, 'cad', 'cash', 'manual', 'REQUESTED', 'RECOVER'),
  ('13400000-0000-0000-0000-000000000105', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000205', 'v1:'||repeat('e',64), 'collect_payment', '13400000-0000-0000-0000-000000000011', 'payment', 501, 'cad', 'cash', 'manual', 'FAILED', 'RECOVER'),
  ('13400000-0000-0000-0000-000000000106', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000206', 'v1:'||repeat('f',64), 'collect_payment', '13400000-0000-0000-0000-000000000011', 'none', 0, 'cad', null, null, 'SKIPPED', 'DO_NOT_RETRY');

set local role service_role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    'payment', 'succeeded', 'cash', 500, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000104'
  )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    'payment', 'succeeded', 'cash', 501, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000105'
  )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    'payment', 'succeeded', 'cash', 1, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000106'
  )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
reset role;
\echo 'PASS 07 REQUESTED, FAILED, and SKIPPED ledger inserts rejected; ACCEPTED already proved'

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  booking_operation_id, payment_kind, amount_cents, currency, method,
  provider_route, execution_state
) values (
  '13400000-0000-0000-0000-000000000107',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000207',
  'v1:'||repeat('1',64), 'booking_sheet',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000401',
  'deposit', 700, 'cad', 'cash', 'manual', 'ACCEPTED'
);
set local role service_role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    'deposit', 'succeeded', 'cash', 700, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000107'
  )$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
update public.commerce_payment_attempts
set appointment_id = '13400000-0000-0000-0000-000000000021'
where id = '13400000-0000-0000-0000-000000000107';
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts
      set appointment_id = '13400000-0000-0000-0000-000000000022'
      where id = '13400000-0000-0000-0000-000000000107'$q$,
  'PAYMENT_ATTEMPT_APPOINTMENT_IMMUTABLE',
  '23514'
);
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider, payment_attempt_id
) values (
  '13400000-0000-0000-0000-000000000307',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000021',
  'deposit', 'succeeded', 'cash', 700, 'cad', 'manual',
  '13400000-0000-0000-0000-000000000107'
);
reset role;
\echo 'PASS 08 booking-operation binding is required, one-time, then linkable'

set local role service_role;
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set execution_state = 'REQUESTED'
      where id = '13400000-0000-0000-0000-000000000101'$q$,
  'PAYMENT_ATTEMPT_STATE_TERMINAL', '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set execution_state = 'FAILED'
      where id = '13400000-0000-0000-0000-000000000101'$q$,
  'PAYMENT_ATTEMPT_STATE_TERMINAL', '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set execution_state = 'REQUESTED'
      where id = '13400000-0000-0000-0000-000000000106'$q$,
  'PAYMENT_ATTEMPT_STATE_TERMINAL', '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set execution_state = 'FAILED'
      where id = '13400000-0000-0000-0000-000000000106'$q$,
  'PAYMENT_ATTEMPT_STATE_TERMINAL', '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set execution_state = 'ACCEPTED'
      where id = '13400000-0000-0000-0000-000000000106'$q$,
  'PAYMENT_ATTEMPT_STATE_TERMINAL', '23514'
);
update public.commerce_payment_attempts set execution_state = 'ACCEPTED'
where id = '13400000-0000-0000-0000-000000000104';
update public.commerce_payment_attempts set execution_state = 'ACCEPTED'
where id = '13400000-0000-0000-0000-000000000105';
reset role;

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, execution_state
) values (
  '13400000-0000-0000-0000-000000000108',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000208',
  'v1:'||repeat('2',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  'none', 0, 'cad', 'REQUESTED'
);
set local role service_role;
update public.commerce_payment_attempts
set execution_state = 'SKIPPED', recovery_disposition = 'DO_NOT_RETRY'
where id = '13400000-0000-0000-0000-000000000108';
reset role;
insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, method, provider_route, execution_state
) values (
  '13400000-0000-0000-0000-000000000113',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000223',
  'v1:'||repeat('d',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  'payment', 513, 'cad', 'cash', 'manual', 'REQUESTED'
);
set local role service_role;
update public.commerce_payment_attempts set execution_state = 'FAILED'
where id = '13400000-0000-0000-0000-000000000113';
reset role;
\echo 'PASS 09 ACCEPTED/SKIPPED terminality; REQUESTED transitions and FAILED -> ACCEPTED allowed'

select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempts set amount_cents = 1001
      where id = '13400000-0000-0000-0000-000000000101'$q$,
  'PAYMENT_ATTEMPT_REQUEST_IMMUTABLE',
  '23514'
);
insert into public.commerce_payment_attempt_events(
  id, business_id, attempt_id, event_type, money_state, occurred_at
) values
  ('13400000-0000-0000-0000-000000000501', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'ACCEPTED', 'RECORDED', '2030-01-02T00:00:00Z'),
  ('13400000-0000-0000-0000-000000000502', '13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'REPLAYED', 'RECORDED', '2020-01-01T00:00:00Z');
select pg_temp.expect_failure(
  $q$update public.commerce_payment_attempt_events set money_state = 'UNKNOWN'
      where id = '13400000-0000-0000-0000-000000000501'$q$,
  'PAYMENT_ATTEMPT_HISTORY_IMMUTABLE',
  '23514'
);
select pg_temp.expect_failure(
  $q$delete from public.commerce_payment_attempt_events
      where id = '13400000-0000-0000-0000-000000000501'$q$,
  'PAYMENT_ATTEMPT_HISTORY_IMMUTABLE',
  '23514'
);
do $$
declare first_sequence bigint; second_sequence bigint;
begin
  select event_sequence into first_sequence
  from public.commerce_payment_attempt_events
  where id = '13400000-0000-0000-0000-000000000501';
  select event_sequence into second_sequence
  from public.commerce_payment_attempt_events
  where id = '13400000-0000-0000-0000-000000000502';
  if second_sequence <= first_sequence then
    raise exception 'event identity sequence is not monotonic';
  end if;
end $$;
\echo 'PASS 10 request immutable; events append-only and monotonically ordered independently of display time'

select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_attempts(
    business_id, attempt_key, request_fingerprint, source, customer_id,
    payment_kind, amount_cents, currency, method, provider_route
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000211',
    'v1:'||repeat('3',64), 'collect_payment',
    '13400000-0000-0000-0000-000000000012',
    'payment', 100, 'cad', 'cash', 'manual'
  )$q$,
  'commerce_payment_attempts_customer_fk',
  '23503'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_attempts(
    business_id, attempt_key, request_fingerprint, source, customer_id,
    appointment_id, payment_kind, amount_cents, currency, method, provider_route
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000212',
    'v1:'||repeat('4',64), 'collect_payment',
    '13400000-0000-0000-0000-000000000011',
    '13400000-0000-0000-0000-000000000023',
    'payment', 100, 'cad', 'cash', 'manual'
  )$q$,
  'commerce_payment_attempts_appointment_fk',
  '23503'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_attempts(
    business_id, attempt_key, request_fingerprint, source, customer_id,
    payment_kind, amount_cents, currency, method, provider_route, gift_card_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000213',
    'v1:'||repeat('5',64), 'collect_payment',
    '13400000-0000-0000-0000-000000000011',
    'payment', 100, 'cad', 'gift_card', 'manual',
    '13400000-0000-0000-0000-000000000032'
  )$q$,
  'commerce_payment_attempts_gift_card_fk',
  '23503'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_attempt_events(
    business_id, attempt_id, event_type, money_state
  ) values (
    '13400000-0000-0000-0000-000000000002',
    '13400000-0000-0000-0000-000000000101',
    'REPLAYED', 'RECORDED'
  )$q$,
  'commerce_payment_attempt_events_attempt_fk',
  '23503'
);
set local role service_role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000002',
    '13400000-0000-0000-0000-000000000012',
    'payment', 'succeeded', 'cash', 1000, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000101'
  )$q$,
  'PAYMENT_ATTEMPT_NOT_FOUND',
  '23503'
);
reset role;
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind
  ) values (
    '13400000-0000-0000-0000-000000000002',
    '13400000-0000-0000-0000-000000000101',
    'appointment_cache'
  )$q$,
  'commerce_payment_reconciliation_ledger_fk',
  '23503'
);
\echo 'PASS 11 cross-tenant customer/appointment/gift-card/event/reconciliation relationships rejected'

set local role authenticated;
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider
) values (
  '13400000-0000-0000-0000-000000000309',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000021',
  'payment', 'pending', 'cash', 50, 'cad', 'manual'
);
update public.commerce_transactions set status = 'succeeded'
where id = '13400000-0000-0000-0000-000000000309';
delete from public.commerce_transactions
where id = '13400000-0000-0000-0000-000000000309';
reset role;
\echo 'PASS 12 legacy NULL-linked authenticated INSERT/UPDATE/DELETE remains functional'

set local role authenticated;
select pg_temp.expect_failure(
  $q$insert into public.commerce_transactions(
    business_id, customer_id, appointment_id, kind, status, method,
    amount_cents, currency, provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000011',
    '13400000-0000-0000-0000-000000000021',
    'payment', 'succeeded', 'cash', 2500, 'cad', 'manual',
    '13400000-0000-0000-0000-000000000103'
  )$q$,
  'PAYMENT_ATTEMPT_SERVER_ONLY',
  '42501'
);
reset role;
set local role service_role;
insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider, payment_attempt_id
) values (
  '13400000-0000-0000-0000-000000000303',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000021',
  'payment', 'pending', 'cash', 2500, 'cad', 'manual',
  '13400000-0000-0000-0000-000000000103'
);
reset role;
\echo 'PASS 13 authenticated linked DML rejected; service_role linked DML succeeds'

set local role service_role;
update public.commerce_transactions set status = 'succeeded'
where id = '13400000-0000-0000-0000-000000000303';
select pg_temp.expect_failure(
  $q$update public.commerce_transactions set amount_cents = 2501
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set customer_id = '13400000-0000-0000-0000-000000000012'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set appointment_id = '13400000-0000-0000-0000-000000000022'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set currency = 'usd'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set method = 'debit_card'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set kind = 'deposit'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set provider = 'stripe'
      where id = '13400000-0000-0000-0000-000000000303'$q$,
  'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH',
  '23514'
);
reset role;

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, method, provider_route, execution_state
) values (
  '13400000-0000-0000-0000-000000000112',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000212',
  'v1:'||repeat('e',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  'payment', 2512, 'cad', 'cash', 'manual', 'ACCEPTED'
);
set local role service_role;
insert into public.commerce_transactions(
  id, business_id, customer_id, kind, status, method, amount_cents, currency,
  provider, payment_attempt_id
) values (
  '13400000-0000-0000-0000-000000000312',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011',
  'payment', 'requires_action', 'cash', 2512, 'cad', 'manual',
  '13400000-0000-0000-0000-000000000112'
);
update public.commerce_transactions set status = 'succeeded'
where id = '13400000-0000-0000-0000-000000000312';
reset role;
\echo 'PASS 14 pending/requires_action rows may succeed; every guarded tuple-field mutation rejected'

insert into public.commerce_payment_reconciliation(
  business_id, attempt_id, projection_kind
) values
  ('13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'appointment_cache'),
  ('13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'invoice_settlement'),
  ('13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'customer_payment_events'),
  ('13400000-0000-0000-0000-000000000001', '13400000-0000-0000-0000-000000000101', 'receipt');
do $$
begin
  if (select count(*) from public.commerce_payment_reconciliation where attempt_id = '13400000-0000-0000-0000-000000000101') <> 4
     or (select count(*) from public.commerce_payment_reconciliation where attempt_id = '13400000-0000-0000-0000-000000000101' and is_financial) <> 3
     or (select is_financial from public.commerce_payment_reconciliation where attempt_id = '13400000-0000-0000-0000-000000000101' and projection_kind = 'receipt') then
    raise exception 'obligation classification is not exactly three financial plus one receipt';
  end if;
end $$;
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'fifth_kind'
  )$q$,
  'commerce_payment_reconciliation_projection_kind_check',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind, is_financial
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'receipt', true
  )$q$,
  'cannot insert a non-DEFAULT value',
  '428C9'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind, state
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'appointment_cache', 'COMPLETE'
  )$q$,
  'commerce_payment_reconciliation_completion_check',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind, state, completed_at
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'appointment_cache', 'PENDING', now()
  )$q$,
  'commerce_payment_reconciliation_completion_check',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind, state
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'appointment_cache', 'FAILED'
  )$q$,
  'commerce_payment_reconciliation_failure_check',
  '23514'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind, state, failure_code
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000102',
    'appointment_cache', 'PENDING', 'PROJECTION_FAILED'
  )$q$,
  'commerce_payment_reconciliation_failure_check',
  '23514'
);

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, method, provider_route, execution_state
) values (
  '13400000-0000-0000-0000-000000000109',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000209',
  'v1:'||repeat('6',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  'payment', 333, 'cad', 'cash', 'manual', 'ACCEPTED'
);
select pg_temp.expect_failure(
  $q$insert into public.commerce_payment_reconciliation(
    business_id, attempt_id, projection_kind
  ) values (
    '13400000-0000-0000-0000-000000000001',
    '13400000-0000-0000-0000-000000000109',
    'appointment_cache'
  )$q$,
  'commerce_payment_reconciliation_ledger_fk',
  '23503'
);
\echo 'PASS 15 four obligation kinds enforced; receipt mechanically non-financial; unlinked obligation rejected'

insert into public.customers(id, business_id, name) values (
  '13400000-0000-0000-0000-000000000013',
  '13400000-0000-0000-0000-000000000001',
  'Attempt-only Customer'
);
insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  payment_kind, amount_cents, currency, method, provider_route
) values (
  '13400000-0000-0000-0000-000000000110',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000210',
  'v1:'||repeat('7',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000013',
  'payment', 44, 'cad', 'cash', 'manual'
);
select pg_temp.expect_failure(
  $q$delete from public.customers
      where id = '13400000-0000-0000-0000-000000000013'$q$,
  'commerce_payment_attempts_customer_fk',
  '23503'
);
insert into public.appointments(id, business_id, customer_id) values (
  '13400000-0000-0000-0000-000000000024',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011'
);
insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, payment_kind, amount_cents, currency, method, provider_route
) values (
  '13400000-0000-0000-0000-000000000111',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000211',
  'v1:'||repeat('8',64), 'collect_payment',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000024',
  'payment', 45, 'cad', 'cash', 'manual'
);
select pg_temp.expect_failure(
  $q$delete from public.appointments
      where id = '13400000-0000-0000-0000-000000000024'$q$,
  'commerce_payment_attempts_appointment_fk',
  '23503'
);
\echo 'PASS 16 deletion of referenced customer or appointment refused'

insert into public.commerce_transactions(
  id, business_id, customer_id, appointment_id, kind, status, method,
  amount_cents, currency, provider
) values (
  '13400000-0000-0000-0000-000000000310',
  '13400000-0000-0000-0000-000000000001',
  '13400000-0000-0000-0000-000000000011',
  '13400000-0000-0000-0000-000000000021',
  'payment', 'pending', 'cash', 10, 'cad', 'manual'
);
set local role service_role;
select pg_temp.expect_failure(
  $q$update public.commerce_transactions
      set payment_attempt_id = '13400000-0000-0000-0000-000000000109'
      where id = '13400000-0000-0000-0000-000000000310'$q$,
  'PAYMENT_ATTEMPT_LEDGER_LINK_IMMUTABLE',
  '23514'
);
reset role;
\echo 'PASS 17 explicit legacy NULL -> UUID link update rejected'

rollback;
