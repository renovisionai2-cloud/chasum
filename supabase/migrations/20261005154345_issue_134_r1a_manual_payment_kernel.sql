-- Issue #134 R1a: PREPARED ONLY / NOT APPLIED / UNWIRED.
-- Manual-payment admission and atomic commit kernel only.
set lock_timeout = '5s';
set statement_timeout = '30s';

do $$
begin
  if current_setting('lock_timeout')::interval <> interval '5 seconds'
     or current_setting('statement_timeout')::interval <> interval '30 seconds' then
    raise exception 'ISSUE_134_R1A_TIMEOUT_ASSERTION_FAILED: lock=%, statement=%',
      current_setting('lock_timeout'), current_setting('statement_timeout');
  end if;
end $$;

create function public.admit_payment_attempt_v1(
  p_business_id uuid,
  p_attempt_key uuid,
  p_request_fingerprint text,
  p_source text,
  p_customer_id uuid,
  p_appointment_id uuid,
  p_actor_id uuid,
  p_payment_kind text,
  p_amount_cents integer,
  p_currency text,
  p_method text,
  p_provider_route text
) returns table (
  outcome text,
  attempt_id uuid,
  execution_state text,
  conflict_event_id uuid
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  winner public.commerce_payment_attempts%rowtype;
  conflict_event public.commerce_payment_attempt_events%rowtype;
  conflict_hex text;
  derived_conflict_event_id uuid;
begin
  if current_user <> 'service_role' then
    raise exception 'PAYMENT_ATTEMPT_SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if p_business_id is null
     or p_attempt_key is null
     or p_customer_id is null
     or p_request_fingerprint is null
     or p_request_fingerprint !~ '^v1:[0-9a-f]{64}$'
     or p_source is null
     or p_source not in (
       'booking_sheet', 'quick_appointment', 'collect_payment',
       'customer_billing', 'payments_dashboard'
     )
     or p_payment_kind is null
     or p_payment_kind not in ('payment', 'deposit')
     or p_amount_cents is null
     or p_amount_cents <= 0
     or p_currency is null
     or p_currency !~ '^[a-z]{3}$'
     or p_method is null
     or p_method not in (
       'cash', 'debit_card', 'credit_card', 'e_transfer', 'other'
     )
     or p_provider_route is distinct from 'manual' then
    raise exception 'PAYMENT_ATTEMPT_INVALID_R1A_REQUEST' using errcode = '22023';
  end if;

  perform 1
  from public.customers
  where id = p_customer_id
    and business_id = p_business_id;
  if not found then
    raise exception 'PAYMENT_ATTEMPT_CUSTOMER_BINDING_INVALID' using errcode = '23503';
  end if;

  if p_appointment_id is not null then
    perform 1
    from public.appointments
    where id = p_appointment_id
      and business_id = p_business_id
      and customer_id = p_customer_id;
    if not found then
      raise exception 'PAYMENT_ATTEMPT_APPOINTMENT_BINDING_INVALID' using errcode = '23503';
    end if;
  end if;

  insert into public.commerce_payment_attempts(
    business_id,
    attempt_key,
    request_fingerprint,
    source,
    customer_id,
    appointment_id,
    actor_id,
    payment_kind,
    amount_cents,
    currency,
    method,
    provider_route
  ) values (
    p_business_id,
    p_attempt_key,
    p_request_fingerprint,
    p_source,
    p_customer_id,
    p_appointment_id,
    p_actor_id,
    p_payment_kind,
    p_amount_cents,
    p_currency,
    p_method,
    p_provider_route
  )
  on conflict (business_id, attempt_key) do nothing
  returning * into winner;

  if winner.id is not null then
    insert into public.commerce_payment_attempt_events(
      business_id,
      attempt_id,
      event_type,
      money_state
    ) values (
      winner.business_id,
      winner.id,
      'REQUESTED',
      'NOT_RECORDED'
    );
    return query
      select 'ADMITTED'::text, winner.id, winner.execution_state, null::uuid;
    return;
  end if;

  select *
  into strict winner
  from public.commerce_payment_attempts
  where business_id = p_business_id
    and attempt_key = p_attempt_key
  for update;

  if row(
       winner.business_id,
       winner.customer_id,
       winner.appointment_id,
       winner.booking_operation_id,
       winner.payment_kind,
       winner.amount_cents,
       winner.currency,
       winner.method,
       winner.provider_route,
       winner.gift_card_id
     ) is not distinct from row(
       p_business_id,
       p_customer_id,
       p_appointment_id,
       null::uuid,
       p_payment_kind,
       p_amount_cents,
       p_currency,
       p_method,
       p_provider_route,
       null::uuid
     ) then
    return query
      select 'EXISTING'::text, winner.id, winner.execution_state, null::uuid;
    return;
  end if;

  -- This digest is only a stable evidence identity. The database never computes
  -- or substitutes the authoritative request fingerprint supplied by the server.
  conflict_hex := pg_catalog.md5(pg_catalog.concat_ws(
    E'\x1f',
    'chasum.payment-attempt.key-conflict',
    winner.id::text,
    p_business_id::text,
    p_customer_id::text,
    coalesce(p_appointment_id::text, '<null>'),
    p_payment_kind,
    p_amount_cents::text,
    p_currency,
    p_method,
    p_provider_route
  ));
  derived_conflict_event_id := (
    pg_catalog.substr(conflict_hex, 1, 8) || '-' ||
    pg_catalog.substr(conflict_hex, 9, 4) || '-5' ||
    pg_catalog.substr(conflict_hex, 14, 3) || '-a' ||
    pg_catalog.substr(conflict_hex, 18, 3) || '-' ||
    pg_catalog.substr(conflict_hex, 21, 12)
  )::uuid;

  insert into public.commerce_payment_attempt_events(
    id,
    business_id,
    attempt_id,
    event_type,
    money_state,
    failure_class,
    failure_code
  ) values (
    derived_conflict_event_id,
    winner.business_id,
    winner.id,
    'KEY_CONFLICT',
    'NOT_RECORDED',
    'CONFLICT',
    'KEY_CONFLICT'
  )
  on conflict (id) do nothing;

  select *
  into conflict_event
  from public.commerce_payment_attempt_events
  where id = derived_conflict_event_id;
  if not found
     or conflict_event.business_id is distinct from winner.business_id
     or conflict_event.attempt_id is distinct from winner.id
     or conflict_event.event_type is distinct from 'KEY_CONFLICT' then
    raise exception 'PAYMENT_ATTEMPT_CONFLICT_EVIDENCE_MISMATCH'
      using errcode = '23514';
  end if;

  return query
    select 'KEY_CONFLICT'::text, winner.id, winner.execution_state,
      derived_conflict_event_id;
end $$;

create function public.commit_manual_payment_attempt_v1(
  p_business_id uuid,
  p_attempt_id uuid
) returns table (
  outcome text,
  attempt_id uuid,
  transaction_id uuid,
  recorded boolean,
  synchronization text
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  attempt public.commerce_payment_attempts%rowtype;
  ledger public.commerce_transactions%rowtype;
  ledger_count integer;
  requested_event_count integer;
  accepted_event_count integer;
  obligation_count integer;
  valid_obligation_count integer;
begin
  if current_user <> 'service_role' then
    raise exception 'PAYMENT_ATTEMPT_SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if p_business_id is null or p_attempt_id is null then
    raise exception 'PAYMENT_ATTEMPT_INVALID_COMMIT_IDENTITY' using errcode = '22023';
  end if;

  select *
  into attempt
  from public.commerce_payment_attempts
  where id = p_attempt_id
    and business_id = p_business_id
  for update;
  if not found then
    return query
      select 'UNKNOWN'::text, p_attempt_id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  perform 1
  from public.customers
  where id = attempt.customer_id
    and business_id = attempt.business_id;
  if not found then
    return query
      select 'UNKNOWN'::text, attempt.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  if attempt.appointment_id is not null then
    perform 1
    from public.appointments
    where id = attempt.appointment_id
      and business_id = attempt.business_id
      and customer_id = attempt.customer_id;
    if not found then
      return query
        select 'UNKNOWN'::text, attempt.id, null::uuid, false, 'UNKNOWN'::text;
      return;
    end if;
  end if;

  if attempt.execution_state in ('FAILED', 'SKIPPED') then
    return query
      select 'NOT_COMMITTABLE'::text, attempt.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  if attempt.booking_operation_id is not null
     or attempt.gift_card_id is not null
     or attempt.payment_kind not in ('payment', 'deposit')
     or attempt.amount_cents <= 0
     or attempt.currency !~ '^[a-z]{3}$'
     or attempt.method not in (
       'cash', 'debit_card', 'credit_card', 'e_transfer', 'other'
     )
     or attempt.provider_route is distinct from 'manual' then
    return query
      select 'UNKNOWN'::text, attempt.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  select pg_catalog.count(*)::integer
  into ledger_count
  from public.commerce_transactions tx
  where tx.payment_attempt_id = attempt.id
    and tx.business_id = attempt.business_id;

  if attempt.execution_state = 'ACCEPTED' then
    if ledger_count = 1 then
      select *
      into ledger
      from public.commerce_transactions tx
      where tx.payment_attempt_id = attempt.id
        and tx.business_id = attempt.business_id;
    end if;
    select pg_catalog.count(*)::integer into requested_event_count
    from public.commerce_payment_attempt_events event_row
    where event_row.business_id = attempt.business_id
      and event_row.attempt_id = attempt.id
      and event_row.event_type = 'REQUESTED'
      and event_row.money_state = 'NOT_RECORDED';
    select pg_catalog.count(*)::integer into accepted_event_count
    from public.commerce_payment_attempt_events event_row
    where event_row.business_id = attempt.business_id
      and event_row.attempt_id = attempt.id
      and event_row.event_type = 'ACCEPTED'
      and event_row.money_state = 'RECORDED';
    select pg_catalog.count(*)::integer into obligation_count
    from public.commerce_payment_reconciliation obligation
    where obligation.business_id = attempt.business_id
      and obligation.attempt_id = attempt.id;
    select pg_catalog.count(*)::integer into valid_obligation_count
    from public.commerce_payment_reconciliation obligation
    where obligation.business_id = attempt.business_id
      and obligation.attempt_id = attempt.id
      and obligation.failure_code is null
      and (
        (
          attempt.appointment_id is not null
          and obligation.state = 'PENDING'
          and obligation.completed_at is null
        )
        or (
          attempt.appointment_id is null
          and obligation.projection_kind = 'appointment_cache'
          and obligation.state = 'NOT_REQUIRED'
          and obligation.completed_at is not null
        )
        or (
          attempt.appointment_id is null
          and obligation.projection_kind <> 'appointment_cache'
          and obligation.state = 'PENDING'
          and obligation.completed_at is null
        )
      );

    if ledger_count = 1
       and row(
         ledger.business_id,
         ledger.customer_id,
         ledger.appointment_id,
         ledger.kind,
         ledger.status,
         ledger.method,
         ledger.amount_cents,
         ledger.currency,
         ledger.provider,
         ledger.provider_reference,
         ledger.provider_payment_intent_id,
         ledger.created_by
       ) is not distinct from row(
         attempt.business_id,
         attempt.customer_id,
         attempt.appointment_id,
         attempt.payment_kind,
         'succeeded'::text,
         attempt.method,
         attempt.amount_cents,
         attempt.currency,
         'manual'::text,
         'manual-attempt:' || attempt.id::text,
         null::text,
         attempt.actor_id
       )
       and requested_event_count = 1
       and accepted_event_count = 1
       and obligation_count = 4
       and valid_obligation_count = 4 then
      return query
        select 'REPLAY'::text, attempt.id, ledger.id, true, 'PENDING'::text;
      return;
    end if;

    return query
      select 'UNKNOWN'::text, attempt.id,
        case when ledger_count = 1 then ledger.id else null::uuid end,
        ledger_count = 1,
        'UNKNOWN'::text;
    return;
  end if;

  if attempt.execution_state <> 'REQUESTED' or ledger_count <> 0 then
    return query
      select 'UNKNOWN'::text, attempt.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  update public.commerce_payment_attempts
  set execution_state = 'ACCEPTED',
      updated_at = pg_catalog.now(),
      resolved_at = pg_catalog.now()
  where id = attempt.id
    and business_id = attempt.business_id
    and execution_state = 'REQUESTED';
  if not found then
    raise exception 'PAYMENT_ATTEMPT_COMMIT_STATE_RACE' using errcode = '40001';
  end if;

  insert into public.commerce_transactions(
    business_id,
    customer_id,
    appointment_id,
    invoice_id,
    kind,
    status,
    method,
    amount_cents,
    currency,
    provider,
    provider_reference,
    provider_payment_intent_id,
    description,
    metadata,
    created_by,
    payment_attempt_id
  ) values (
    attempt.business_id,
    attempt.customer_id,
    attempt.appointment_id,
    null,
    attempt.payment_kind,
    'succeeded',
    attempt.method,
    attempt.amount_cents,
    attempt.currency,
    'manual',
    'manual-attempt:' || attempt.id::text,
    null,
    'Manual payment attempt',
    '{}'::jsonb,
    attempt.actor_id,
    attempt.id
  )
  returning * into ledger;

  insert into public.commerce_payment_attempt_events(
    business_id,
    attempt_id,
    event_type,
    money_state
  ) values (
    attempt.business_id,
    attempt.id,
    'ACCEPTED',
    'RECORDED'
  );

  insert into public.commerce_payment_reconciliation(
    business_id,
    attempt_id,
    projection_kind,
    state,
    completed_at
  ) values
    (
      attempt.business_id,
      attempt.id,
      'appointment_cache',
      case when attempt.appointment_id is null then 'NOT_REQUIRED' else 'PENDING' end,
      case when attempt.appointment_id is null then pg_catalog.now() else null end
    ),
    (attempt.business_id, attempt.id, 'invoice_settlement', 'PENDING', null),
    (attempt.business_id, attempt.id, 'customer_payment_events', 'PENDING', null),
    (attempt.business_id, attempt.id, 'receipt', 'PENDING', null);

  return query
    select 'RECORDED'::text, attempt.id, ledger.id, true, 'PENDING'::text;
end $$;

revoke all on function public.admit_payment_attempt_v1(
  uuid, uuid, text, text, uuid, uuid, uuid, text, integer, text, text, text
) from public, anon, authenticated;
revoke all on function public.commit_manual_payment_attempt_v1(
  uuid, uuid
) from public, anon, authenticated;
grant execute on function public.admit_payment_attempt_v1(
  uuid, uuid, text, text, uuid, uuid, uuid, text, integer, text, text, text
) to service_role;
grant execute on function public.commit_manual_payment_attempt_v1(
  uuid, uuid
) to service_role;

reset lock_timeout;
reset statement_timeout;
