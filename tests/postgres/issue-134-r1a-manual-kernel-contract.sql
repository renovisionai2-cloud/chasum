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
      raise exception 'wrong failure. expected %, got %', p_contains, sqlerrm;
    end if;
    if p_sqlstate is not null and sqlstate <> p_sqlstate then
      raise exception 'wrong SQLSTATE. expected %, got % (%)',
        p_sqlstate, sqlstate, sqlerrm;
    end if;
  end;
end $$;

do $$
declare
  expected record;
  observed_count bigint;
  observed_digest text;
begin
  for expected in select * from pg_temp.issue134_r1a_existing_data_digest loop
    execute format(
      'select count(*), md5(coalesce(string_agg(row_to_json(t)::text, ''|'' order by id), '''')) from public.%I t',
      expected.relation_name
    ) into observed_count, observed_digest;
    if row(observed_count, observed_digest)
       is distinct from row(expected.row_count, expected.row_digest) then
      raise exception 'R1a migration changed existing data in %', expected.relation_name;
    end if;
  end loop;
  if current_setting('lock_timeout')::interval <> interval '0 seconds'
     or current_setting('statement_timeout')::interval <> interval '0 seconds' then
    raise exception 'R1a migration did not restore timeout defaults';
  end if;
end $$;
\echo 'PASS 01 R1a migration changed no existing rows and restored timeout defaults'

do $$
declare
  proc_row record;
begin
  if (
    select count(*)
    from pg_proc proc
    join pg_namespace n on n.oid = proc.pronamespace
    where n.nspname = 'public'
      and proc.proname in (
        'admit_payment_attempt_v1',
        'commit_manual_payment_attempt_v1'
      )
      and not proc.prosecdef
      and proc.proconfig = array['search_path=pg_catalog, pg_temp']
  ) <> 2 then
    raise exception 'R1a function security posture mismatch';
  end if;
  for proc_row in
    select oid::regprocedure as signature
    from pg_proc
    where oid in (
      'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)'::regprocedure,
      'public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure
    )
  loop
    if not has_function_privilege('service_role', proc_row.signature, 'EXECUTE')
       or has_function_privilege('anon', proc_row.signature, 'EXECUTE')
       or has_function_privilege('authenticated', proc_row.signature, 'EXECUTE') then
      raise exception 'R1a EXECUTE boundary mismatch for %', proc_row.signature;
    end if;
  end loop;
end $$;
\echo 'PASS 02 exactly two invoker functions have fixed search_path and service_role-only EXECUTE'

set local role anon;
select pg_temp.expect_failure(
  $q$select * from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000101'
  )$q$,
  'permission denied',
  '42501'
);
reset role;
set local role authenticated;
select pg_temp.expect_failure(
  $q$select * from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    null,
    '13410000-0000-4000-8000-000000000001',
    'payment', 5000, 'cad', 'cash', 'manual'
  )$q$,
  'permission denied',
  '42501'
);
reset role;
\echo 'PASS 03 anon and authenticated cannot execute either kernel function'

set local role service_role;
do $$
declare
  admission record;
  committed record;
  replayed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 5000, 'cad', 'cash', 'manual'
  );
  if admission.outcome <> 'ADMITTED' then
    raise exception 'first admission did not win: %', admission.outcome;
  end if;
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if row(committed.outcome, committed.recorded, committed.synchronization)
     is distinct from row('RECORDED'::text, true, 'PENDING'::text) then
    raise exception 'manual commit result mismatch: %', row_to_json(committed);
  end if;
  select * into replayed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if replayed.outcome <> 'REPLAY'
     or replayed.transaction_id is distinct from committed.transaction_id
     or replayed.synchronization <> 'PENDING' then
    raise exception 'lost-response replay mismatch: %', row_to_json(replayed);
  end if;
end $$;
reset role;

do $$
declare
  attempt_id_value uuid;
begin
  select id into attempt_id_value
  from public.commerce_payment_attempts
  where business_id = '13410000-0000-4000-8000-000000000011'
    and attempt_key = '13410000-0000-4000-8000-000000000201';
  if (select count(*) from public.commerce_payment_attempt_events
      where attempt_id = attempt_id_value and event_type = 'REQUESTED') <> 1
     or (select count(*) from public.commerce_payment_attempt_events
      where attempt_id = attempt_id_value and event_type = 'ACCEPTED') <> 1
     or (select count(*) from public.commerce_transactions
      where payment_attempt_id = attempt_id_value) <> 1
     or (select count(*) from public.commerce_payment_reconciliation
      where attempt_id = attempt_id_value and state = 'PENDING'
        and completed_at is null) <> 4 then
    raise exception 'appointment commit did not persist exactly one effect and four pending obligations';
  end if;
end $$;
\echo 'PASS 04 admission, commit, lost-response replay, and exactly four PENDING obligations'

set local role service_role;
do $$
declare
  first_conflict record;
  retry_conflict record;
  second_conflict record;
  replay_after_conflicts record;
begin
  select * into first_conflict from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'payments_dashboard',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000002',
    'payment', 6000, 'cad', 'cash', 'manual'
  );
  select * into retry_conflict from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'payments_dashboard',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000002',
    'payment', 6000, 'cad', 'cash', 'manual'
  );
  if first_conflict.outcome <> 'KEY_CONFLICT'
     or retry_conflict.outcome <> 'KEY_CONFLICT'
     or first_conflict.conflict_event_id is distinct from retry_conflict.conflict_event_id then
    raise exception 'conflict evidence was not stable and retry-idempotent';
  end if;
  select * into second_conflict from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'quick_appointment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000002',
    'payment', 6500, 'cad', 'other', 'manual'
  );
  select * into replay_after_conflicts
  from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    first_conflict.attempt_id
  );
  if second_conflict.outcome <> 'KEY_CONFLICT'
     or second_conflict.conflict_event_id = first_conflict.conflict_event_id
     or replay_after_conflicts.outcome <> 'REPLAY'
     or not replay_after_conflicts.recorded then
    raise exception 'valid conflict evidence was not compatible with recorded replay';
  end if;
end $$;
reset role;

do $$
declare
  winner public.commerce_payment_attempts%rowtype;
begin
  select * into winner from public.commerce_payment_attempts
  where business_id = '13410000-0000-4000-8000-000000000011'
    and attempt_key = '13410000-0000-4000-8000-000000000201';
  if winner.amount_cents <> 5000
     or winner.execution_state <> 'ACCEPTED'
     or winner.failure_code is not null
     or (select count(*) from public.commerce_payment_attempt_events
         where attempt_id = winner.id and event_type = 'KEY_CONFLICT') <> 2 then
    raise exception 'committed conflict mutated winner or duplicated evidence';
  end if;
end $$;
\echo 'PASS 05 equal-hash changed tuples return stable KEY_CONFLICT evidence compatible with ledger replay'

set local role service_role;
do $$
declare
  first_attempt uuid;
  existing_replay record;
  second_attempt uuid;
  second_commit record;
begin
  select * into existing_replay from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000201',
    'v1:' || repeat('a', 64),
    'quick_appointment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000002',
    'payment', 5000, 'cad', 'cash', 'manual'
  );
  first_attempt := existing_replay.attempt_id;
  select attempt_id into second_attempt from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000202',
    'v1:' || repeat('a', 64),
    'quick_appointment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000002',
    'payment', 5000, 'cad', 'cash', 'manual'
  );
  select * into second_commit from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    second_attempt
  );
  if existing_replay.outcome <> 'EXISTING'
     or first_attempt = second_attempt
     or second_commit.outcome <> 'RECORDED' then
    raise exception 'equal-value second key was not an independent payment';
  end if;
end $$;
reset role;
\echo 'PASS 06 changed source/actor returns EXISTING; equal intent under a new key records separately'

set local role service_role;
do $$
declare
  admission record;
  committed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000203',
    'v1:' || repeat('b', 64),
    'customer_billing',
    '13410000-0000-4000-8000-000000000021',
    null,
    '13410000-0000-4000-8000-000000000001',
    'payment', 700, 'cad', 'debit_card', 'manual'
  );
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if committed.outcome <> 'RECORDED' or committed.synchronization <> 'PENDING' then
    raise exception 'customer-only commit result mismatch';
  end if;
  if (select count(*) from public.commerce_payment_reconciliation
      where attempt_id = admission.attempt_id
        and projection_kind = 'appointment_cache'
        and state = 'NOT_REQUIRED'
        and completed_at is not null) <> 1
     or (select count(*) from public.commerce_payment_reconciliation
      where attempt_id = admission.attempt_id
        and projection_kind <> 'appointment_cache'
        and state = 'PENDING'
        and completed_at is null) <> 3 then
    raise exception 'customer-only obligation states mismatch';
  end if;
end $$;
reset role;
\echo 'PASS 07 customer-only appointment cache is NOT_REQUIRED; invoice/CRM/receipt remain PENDING'

set local role service_role;
select pg_temp.expect_failure(
  $q$select * from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000210',
    'v1:' || repeat('c', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000032',
    '13410000-0000-4000-8000-000000000001',
    'payment', 100, 'cad', 'cash', 'manual'
  )$q$,
  'PAYMENT_ATTEMPT_APPOINTMENT_BINDING_INVALID',
  '23503'
);
select pg_temp.expect_failure(
  $q$select * from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000211',
    'v1:' || repeat('c', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000023',
    null,
    '13410000-0000-4000-8000-000000000001',
    'payment', 100, 'cad', 'cash', 'manual'
  )$q$,
  'PAYMENT_ATTEMPT_CUSTOMER_BINDING_INVALID',
  '23503'
);
reset role;
\echo 'PASS 08 cross-customer appointment and cross-Business customer bindings fail closed'

set local role service_role;
do $$
declare
  admission record;
  held record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000212',
    'v1:' || repeat('4', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 1200, 'cad', 'cash', 'manual'
  );
  update public.commerce_payment_attempts
  set recovery_disposition = 'DO_NOT_RETRY'
  where id = admission.attempt_id;
  select * into held from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if held.outcome <> 'UNKNOWN' or held.recorded then
    raise exception 'DO_NOT_RETRY REQUESTED attempt was not held';
  end if;
end $$;

do $$
declare
  admission record;
  held record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000213',
    'v1:' || repeat('5', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 1300, 'cad', 'cash', 'manual'
  );
  update public.commerce_payment_attempts
  set failure_class = 'LEDGER',
      failure_code = 'LEDGER_UNCERTAIN'
  where id = admission.attempt_id;
  select * into held from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if held.outcome <> 'UNKNOWN' or held.recorded then
    raise exception 'annotated REQUESTED attempt was not held';
  end if;
end $$;
reset role;

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, actor_id, payment_kind, amount_cents, currency, method,
  provider_route, execution_state
) values (
  '13410000-0000-4000-8000-000000000112',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000214',
  'v1:' || repeat('6', 64),
  'collect_payment',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000031',
  '13410000-0000-4000-8000-000000000001',
  'payment', 1400, 'cad', 'cash', 'manual', 'REQUESTED'
);

set local role service_role;
do $$
declare
  held record;
begin
  select * into held from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000112'
  );
  if held.outcome <> 'UNKNOWN' or held.recorded then
    raise exception 'REQUESTED attempt without admission evidence was not held';
  end if;
end $$;

do $$
declare
  admission record;
  held record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000215',
    'v1:' || repeat('7', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 1500, 'cad', 'cash', 'manual'
  );
  insert into public.commerce_payment_attempt_events(
    business_id, attempt_id, event_type, money_state
  ) values (
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id,
    'RECOVERY_REQUIRED',
    'UNKNOWN'
  );
  select * into held from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
  if held.outcome <> 'UNKNOWN' or held.recorded then
    raise exception 'REQUESTED attempt with contradictory event was not held';
  end if;
end $$;
reset role;

do $$
declare
  held_attempt record;
begin
  for held_attempt in
    select id
    from public.commerce_payment_attempts
    where attempt_key in (
      '13410000-0000-4000-8000-000000000212',
      '13410000-0000-4000-8000-000000000213',
      '13410000-0000-4000-8000-000000000214',
      '13410000-0000-4000-8000-000000000215'
    )
  loop
    if (select execution_state from public.commerce_payment_attempts
        where id = held_attempt.id) <> 'REQUESTED'
       or exists (select 1 from public.commerce_transactions
         where payment_attempt_id = held_attempt.id)
       or exists (select 1 from public.commerce_payment_attempt_events
         where attempt_id = held_attempt.id and event_type = 'ACCEPTED')
       or exists (select 1 from public.commerce_payment_reconciliation
         where attempt_id = held_attempt.id) then
      raise exception 'held REQUESTED attempt gained a new effect: %', held_attempt.id;
    end if;
  end loop;
end $$;
\echo 'PASS 09 incoherent REQUESTED attempts return UNKNOWN with no new effect or hold mutation'

create function pg_temp.issue134_r1a_force_obligation_failure()
returns trigger language plpgsql as $$
begin
  raise exception 'R1A_FORCED_OBLIGATION_FAILURE';
end $$;
create trigger issue134_r1a_force_obligation_failure
before insert on public.commerce_payment_reconciliation
for each row execute function pg_temp.issue134_r1a_force_obligation_failure();

set local role service_role;
do $$
declare
  admission record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000204',
    'v1:' || repeat('d', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'deposit', 800, 'cad', 'e_transfer', 'manual'
  );
  perform pg_temp.expect_failure(
    format(
      'select * from public.commit_manual_payment_attempt_v1(%L, %L)',
      '13410000-0000-4000-8000-000000000011',
      admission.attempt_id
    ),
    'R1A_FORCED_OBLIGATION_FAILURE'
  );
end $$;
reset role;
drop trigger issue134_r1a_force_obligation_failure
  on public.commerce_payment_reconciliation;

do $$
declare
  failed_attempt uuid;
begin
  select id into failed_attempt from public.commerce_payment_attempts
  where business_id = '13410000-0000-4000-8000-000000000011'
    and attempt_key = '13410000-0000-4000-8000-000000000204';
  if (select execution_state from public.commerce_payment_attempts
      where id = failed_attempt) <> 'REQUESTED'
     or exists (select 1 from public.commerce_transactions
       where payment_attempt_id = failed_attempt)
     or exists (select 1 from public.commerce_payment_attempt_events
       where attempt_id = failed_attempt and event_type = 'ACCEPTED')
     or exists (select 1 from public.commerce_payment_reconciliation
       where attempt_id = failed_attempt) then
    raise exception 'failed obligation insert did not roll back the whole commit';
  end if;
end $$;
\echo 'PASS 09 failure before transaction completion rolls back state, ledger, outcome, and obligations'

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  appointment_id, actor_id, payment_kind, amount_cents, currency, method,
  provider_route, execution_state
) values (
  '13410000-0000-4000-8000-000000000105',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000205',
  'v1:' || repeat('e', 64),
  'collect_payment',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000031',
  '13410000-0000-4000-8000-000000000001',
  'payment', 900, 'cad', 'cash', 'manual', 'ACCEPTED'
);
set local role service_role;
do $$
declare result record;
begin
  select * into result from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000105'
  );
  if result.outcome <> 'UNKNOWN' or result.recorded then
    raise exception 'ACCEPTED without ledger was not held UNKNOWN';
  end if;
end $$;
reset role;
\echo 'PASS 10 ACCEPTED with missing ledger/evidence returns UNKNOWN without repair'

set local role service_role;
do $$
declare admission record;
declare committed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000207',
    'v1:' || repeat('1', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 902, 'cad', 'cash', 'manual'
  );
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
end $$;
reset role;
delete from public.commerce_payment_reconciliation
where attempt_id = (
  select id from public.commerce_payment_attempts
  where attempt_key = '13410000-0000-4000-8000-000000000207'
)
and projection_kind = 'receipt';
set local role service_role;
do $$
declare result record;
declare target_attempt uuid;
begin
  select id into target_attempt from public.commerce_payment_attempts
  where attempt_key = '13410000-0000-4000-8000-000000000207';
  select * into result from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    target_attempt
  );
  if result.outcome <> 'UNKNOWN'
     or not result.recorded
     or result.transaction_id is distinct from (
       select id from public.commerce_transactions
       where payment_attempt_id = target_attempt
     ) then
    raise exception 'missing obligation did not return a ledger-backed UNKNOWN hold';
  end if;
end $$;
reset role;
\echo 'PASS 11 missing obligation returns UNKNOWN and creates no repair effect'

set local role service_role;
do $$
declare admission record;
declare committed record;
begin
  select * into admission from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000206',
    'v1:' || repeat('f', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000021',
    '13410000-0000-4000-8000-000000000031',
    '13410000-0000-4000-8000-000000000001',
    'payment', 904, 'cad', 'cash', 'manual'
  );
  select * into committed from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    admission.attempt_id
  );
end $$;
reset role;
insert into public.commerce_payment_attempt_events(
  business_id, attempt_id, event_type, money_state
) select business_id, id, 'ACCEPTED', 'RECORDED'
from public.commerce_payment_attempts
where attempt_key = '13410000-0000-4000-8000-000000000206';
set local role service_role;
do $$
declare result record;
declare target_attempt uuid;
begin
  select id into target_attempt from public.commerce_payment_attempts
  where attempt_key = '13410000-0000-4000-8000-000000000206';
  select * into result from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    target_attempt
  );
  if result.outcome <> 'UNKNOWN'
     or not result.recorded
     or result.transaction_id is distinct from (
       select id from public.commerce_transactions
       where payment_attempt_id = target_attempt
     ) then
    raise exception 'contradictory ACCEPTED evidence did not preserve ledger-backed money truth';
  end if;
end $$;
reset role;
\echo 'PASS 12 contradictory ACCEPTED evidence returns recorded ledger-backed UNKNOWN without a second effect'

insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  actor_id, payment_kind, amount_cents, currency, method, provider_route,
  execution_state, failure_class, failure_code
) values (
  '13410000-0000-4000-8000-000000000108',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000208',
  'v1:' || repeat('2', 64),
  'collect_payment',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000001',
  'payment', 903, 'cad', 'cash', 'manual',
  'FAILED', 'LEDGER', 'LEDGER_FAILED'
);
insert into public.commerce_payment_attempts(
  id, business_id, attempt_key, request_fingerprint, source, customer_id,
  actor_id, payment_kind, amount_cents, currency, execution_state,
  recovery_disposition
) values (
  '13410000-0000-4000-8000-000000000109',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000209',
  'v1:' || repeat('3', 64),
  'collect_payment',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000001',
  'none', 0, 'cad', 'SKIPPED', 'DO_NOT_RETRY'
);
set local role service_role;
do $$
declare failed_result record;
declare skipped_result record;
begin
  select * into failed_result from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000108'
  );
  select * into skipped_result from public.commit_manual_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000011',
    '13410000-0000-4000-8000-000000000109'
  );
  if failed_result.outcome <> 'NOT_COMMITTABLE'
     or skipped_result.outcome <> 'NOT_COMMITTABLE' then
    raise exception 'FAILED/SKIPPED handling mismatch';
  end if;
end $$;
reset role;
\echo 'PASS 13 FAILED and SKIPPED attempts are not revived'

do $$
begin
  if (select amount_cents from public.commerce_transactions
      where id = '13410000-0000-4000-8000-000000000041') <> 111
     or (select payment_attempt_id from public.commerce_transactions
      where id = '13410000-0000-4000-8000-000000000041') is not null
     or (select provider_reference from public.commerce_transactions
      where id = '13410000-0000-4000-8000-000000000041') <> 'legacy-baseline' then
    raise exception 'legacy commerce row changed';
  end if;
end $$;
\echo 'PASS 14 existing legacy transaction remains unchanged'

rollback;
