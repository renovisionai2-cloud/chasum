-- #133/#134 Slice 1: PREPARED ONLY. No activation, backfill, worker or communication.
-- Apply atomically only after an independent exact-candidate gate.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Unique-index creation fails on historical duplicates; never pick a winner.
alter table public.commerce_transactions
  add constraint commerce_transactions_projection_tenant_key unique(id, business_id);
create unique index commerce_invoices_projection_appointment_key
  on public.commerce_invoices(business_id, appointment_id) where appointment_id is not null;
alter table public.commerce_receipts
  add constraint commerce_receipts_projection_transaction_key unique(business_id, transaction_id),
  add constraint commerce_receipts_projection_tenant_fk foreign key(transaction_id, business_id)
    references public.commerce_transactions(id, business_id) on delete cascade;
alter table public.customer_payment_events
  add column transaction_id uuid,
  add constraint customer_payment_events_projection_tenant_fk foreign key(transaction_id, business_id)
    references public.commerce_transactions(id, business_id) on delete cascade;
create unique index customer_payment_events_projection_transaction_key
  on public.customer_payment_events(business_id, transaction_id) where transaction_id is not null;

create table public.commerce_receipt_sequences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  next_number integer not null default 1 check(next_number > 0),
  prefix text not null default 'RCT' check(prefix ~ '^[A-Z][A-Z0-9-]{0,15}$'),
  updated_at timestamptz not null default now()
);
create table public.commerce_projection_admission (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  enabled boolean not null default false,
  admit_attempts_created_after timestamptz check(isfinite(admit_attempts_created_after)),
  updated_at timestamptz not null default now()
);
alter table public.commerce_receipt_sequences enable row level security;
alter table public.commerce_projection_admission enable row level security;
revoke all on public.commerce_receipt_sequences, public.commerce_projection_admission
  from public, anon, authenticated, service_role;
grant select on public.commerce_receipt_sequences, public.commerce_projection_admission to service_role;
grant insert(business_id) on public.commerce_receipt_sequences to service_role;
grant insert(business_id) on public.commerce_projection_admission to service_role;
grant update(next_number, updated_at) on public.commerce_receipt_sequences to service_role;
grant update(enabled, admit_attempts_created_after, updated_at) on public.commerce_projection_admission to service_role;

-- No caller-supplied watermark. Every enable advances to server time; no historical admission.
-- Real activation requires prior exclusion of every legacy writer BEFORE side effects.
create function public.set_payment_projection_admission_v1(p_business_id uuid, p_enabled boolean)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
declare a public.commerce_projection_admission%rowtype;
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  if p_enabled is null or not exists(select 1 from public.businesses where id=p_business_id) then
    raise exception 'PROJECTION_INVALID_ADMISSION' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('projection-admission:' || p_business_id, 0));
  insert into public.commerce_projection_admission(business_id) values(p_business_id) on conflict do nothing;
  select * into strict a from public.commerce_projection_admission where business_id=p_business_id for update;
  update public.commerce_projection_admission
  set enabled=p_enabled,
      admit_attempts_created_after=case when p_enabled then greatest(clock_timestamp(), a.admit_attempts_created_after) else a.admit_attempts_created_after end,
      updated_at=clock_timestamp()
  where business_id=p_business_id returning * into a;
  return jsonb_build_object('business_id',a.business_id,'enabled',a.enabled,'watermark',a.admit_attempts_created_after);
end $$;

-- Shared emitter/replay/reader vocabulary and current-state coherence. No writes.
create function public.payment_projection_history_valid_v1(p_business_id uuid, p_attempt_id uuid)
returns boolean language plpgsql stable security invoker set search_path = pg_catalog, pg_temp as $$
declare valid boolean;
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  with a as (
    select * from public.commerce_payment_attempts where id=p_attempt_id and business_id=p_business_id
  ), e as (
    select * from public.commerce_payment_attempt_events where attempt_id=p_attempt_id
  ), o as (
    select * from public.commerce_payment_reconciliation where attempt_id=p_attempt_id
  ), latest as (
    select distinct on(projection_kind) * from e where event_type='PROJECTION_CHANGED'
    order by projection_kind, event_sequence desc
  )
  select exists(select 1 from a)
    and (select count(*) from o)=4
    and not exists(select 1 from o where business_id<>p_business_id)
    and not exists(select 1 from e where business_id<>p_business_id)
    and (select count(*) from e where event_type='REQUESTED' and money_state='NOT_RECORDED' and failure_class is null and failure_code is null)=1
    and (select count(*) from e where event_type='ACCEPTED' and money_state='RECORDED' and failure_class is null and failure_code is null)=1
    and (select count(*) from e)=2 + (select count(*) from e where
      (event_type='KEY_CONFLICT' and money_state='NOT_RECORDED' and failure_class='CONFLICT' and failure_code='KEY_CONFLICT')
      or (event_type='PROJECTION_CHANGED' and money_state='RECORDED'
        and projection_kind in ('appointment_cache','invoice_settlement','customer_payment_events','receipt')
        and ((reconciliation_state in ('COMPLETE','NOT_REQUIRED') and failure_class is null and failure_code is null)
          or (reconciliation_state='FAILED' and failure_class='PROJECTION' and failure_code in ('PROJECTION_FAILED','PROJECTION_UNCERTAIN')))))
    and not exists(select 1 from e cross join a where e.event_type='PROJECTION_CHANGED' and
      ((a.appointment_id is not null and e.reconciliation_state='NOT_REQUIRED')
       or (a.appointment_id is null and (e.projection_kind='appointment_cache'
         or (e.projection_kind='invoice_settlement' and e.reconciliation_state<>'NOT_REQUIRED')))))
    and not exists(select 1 from e prior join e later on prior.projection_kind=later.projection_kind
      and prior.event_sequence<later.event_sequence where prior.event_type='PROJECTION_CHANGED'
      and later.event_type='PROJECTION_CHANGED' and prior.reconciliation_state in ('COMPLETE','NOT_REQUIRED'))
    and not exists (
      select 1 from o cross join a left join latest l on l.projection_kind=o.projection_kind
      where not coalesce(
        -- State domain depends on binding. NULL appointment never fabricates a target.
        ((a.appointment_id is not null and o.state in ('PENDING','COMPLETE','FAILED'))
          or (a.appointment_id is null and (
            (o.projection_kind='appointment_cache' and o.state='NOT_REQUIRED')
            or (o.projection_kind='invoice_settlement' and o.state in ('PENDING','NOT_REQUIRED'))
            or (o.projection_kind in ('customer_payment_events','receipt') and o.state in ('PENDING','COMPLETE','FAILED')))))
        and ((o.state in ('COMPLETE','NOT_REQUIRED')) = (o.completed_at is not null))
        and ((o.state='FAILED' and o.failure_code in ('PROJECTION_FAILED','PROJECTION_UNCERTAIN')) or (o.state<>'FAILED' and o.failure_code is null))
        and (case
          when o.state='PENDING' then l.id is null
          when a.appointment_id is null and o.projection_kind='appointment_cache' then l.id is null
          else l.reconciliation_state=o.state and l.failure_code is not distinct from o.failure_code
        end), false)
    ) into valid;
  return coalesce(valid,false);
end $$;

-- Existing-function replacement: ACCEPTED classification only; owner/ACL preserved.
create or replace function public.commit_manual_payment_attempt_v1(
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
  valid_conflict_event_count integer;
  total_event_count integer;
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

  select pg_catalog.count(*)::integer into requested_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.business_id = attempt.business_id
    and event_row.attempt_id = attempt.id
    and event_row.event_type = 'REQUESTED'
    and event_row.money_state = 'NOT_RECORDED'
    and event_row.failure_class is null
    and event_row.failure_code is null;
  select pg_catalog.count(*)::integer into accepted_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.business_id = attempt.business_id
    and event_row.attempt_id = attempt.id
    and event_row.event_type = 'ACCEPTED'
    and event_row.money_state = 'RECORDED'
    and event_row.failure_class is null
    and event_row.failure_code is null;
  select pg_catalog.count(*)::integer into valid_conflict_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.business_id = attempt.business_id
    and event_row.attempt_id = attempt.id
    and event_row.event_type = 'KEY_CONFLICT'
    and event_row.money_state = 'NOT_RECORDED'
    and event_row.failure_class = 'CONFLICT'
    and event_row.failure_code = 'KEY_CONFLICT';
  select pg_catalog.count(*)::integer into total_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.attempt_id = attempt.id;

  if attempt.execution_state = 'ACCEPTED' then
    if ledger_count = 1 then
      select *
      into ledger
      from public.commerce_transactions tx
      where tx.payment_attempt_id = attempt.id
        and tx.business_id = attempt.business_id;
    end if;

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
       and attempt.recovery_disposition = 'RECOVER'
       and attempt.failure_class is null
       and attempt.failure_code is null
       and requested_event_count = 1
       and accepted_event_count = 1
       and public.payment_projection_history_valid_v1(attempt.business_id, attempt.id) then
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

  if attempt.execution_state <> 'REQUESTED'
     or ledger_count <> 0
     or attempt.recovery_disposition <> 'RECOVER'
     or attempt.failure_class is not null
     or attempt.failure_code is not null
     or requested_event_count <> 1
     or accepted_event_count <> 0
     or total_event_count <> 1 + valid_conflict_event_count then
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


-- Locks appointment BEFORE the full ledger snapshot. Never uses catalog prices.
-- NULL means unsupported/contradictory evidence, not zero money.
create function public.payment_appointment_truth_v1(p_business_id uuid, p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
declare a public.commerce_payment_attempts%rowtype; ap public.appointments%rowtype;
  paid bigint; total bigint; payment_state text;
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  select * into a from public.commerce_payment_attempts where id=p_attempt_id and business_id=p_business_id;
  if not found or a.appointment_id is null or a.execution_state<>'ACCEPTED' then return null; end if;
  select * into ap from public.appointments where id=a.appointment_id and business_id=p_business_id for update;
  if not found or ap.customer_id<>a.customer_id
    or ap.price_cents is null or ap.tax_cents is null or ap.deposit_cents is null
    or ap.price_cents<0 or ap.tax_cents<0 or ap.deposit_cents<0
    or ap.amount_refunded_cents is null or ap.amount_refunded_cents<>0 then return null; end if;
  total := ap.price_cents::bigint+ap.tax_cents::bigint;
  if total>2147483647 then return null; end if;
  if (select count(*) from public.commerce_transactions where payment_attempt_id=a.id)<>1
    or not exists(select 1 from public.commerce_transactions t where t.payment_attempt_id=a.id and
      row(t.business_id,t.customer_id,t.appointment_id,t.kind,t.status,t.method,t.amount_cents,t.currency,t.provider)
      is not distinct from row(a.business_id,a.customer_id,a.appointment_id,a.payment_kind,'succeeded'::text,a.method,a.amount_cents,a.currency,'manual'::text)) then return null; end if;
  -- No filtering-away of unsupported movements. Every linked row must be supported.
  if exists(select 1 from public.commerce_transactions t
      left join public.commerce_payment_attempts ta on ta.id=t.payment_attempt_id
      where t.appointment_id=ap.id and (
        t.business_id<>p_business_id or t.customer_id<>ap.customer_id
        or t.kind not in ('payment','deposit') or t.status<>'succeeded'
        or t.provider<>'manual' or t.currency<>a.currency or t.amount_cents<=0
        or t.method not in ('cash','e_transfer','debit_card','credit_card','other')
        or (t.payment_attempt_id is not null and (ta.id is null or ta.execution_state<>'ACCEPTED'
          or row(t.business_id,t.customer_id,t.appointment_id,t.kind,t.method,t.amount_cents,t.currency,t.provider)
            is distinct from row(ta.business_id,ta.customer_id,ta.appointment_id,ta.payment_kind,ta.method,ta.amount_cents,ta.currency,ta.provider_route)))))
    or exists(select 1 from public.commerce_refunds r where r.appointment_id=ap.id
      or r.transaction_id in(select id from public.commerce_transactions where appointment_id=ap.id)) then return null; end if;
  select coalesce(sum(amount_cents::bigint),0) into paid from public.commerce_transactions
    where appointment_id=ap.id and business_id=p_business_id;
  if paid>2147483647 then return null; end if;
  payment_state:=case
    when paid<=0 and total>0 and ap.deposit_cents>0 then 'deposit_required'
    when paid<=0 and total>0 then 'unpaid'
    when ap.deposit_cents>0 and paid>=ap.deposit_cents and paid<total then 'deposit_paid'
    when paid>=total then 'fully_paid' else 'partially_paid' end;
  return jsonb_build_object('appointment_id',ap.id,'customer_id',ap.customer_id,
    'price',ap.price_cents,'tax',ap.tax_cents,'total',total,'paid',paid,'refunded',0,'payment_status',payment_state);
end $$;

-- Shared dispatcher is private and independently enforces the complete boundary.
-- Four public-schema RPC entrypoints below expose fixed obligation kinds only.
create function public.project_payment_obligation_v1(p_business_id uuid, p_attempt_id uuid, p_kind text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
declare
  admission public.commerce_projection_admission%rowtype;
  o public.commerce_payment_reconciliation%rowtype;
  a public.commerce_payment_attempts%rowtype;
  t public.commerce_transactions%rowtype;
  inv public.commerce_invoices%rowtype;
  rec public.commerce_receipts%rowtype;
  crm public.customer_payment_events%rowtype;
  truth jsonb; target_id uuid; terminal boolean; target_valid boolean;
  failure text; number_value integer; prefix_value text; document_number text;
  next_state text:='COMPLETE'; paid integer; total integer; body text; invoice_state text;
  allocation integer;
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  if p_business_id is null or p_attempt_id is null or p_kind is null
    or p_kind not in ('appointment_cache','invoice_settlement','customer_payment_events','receipt') then
    raise exception 'PROJECTION_INVALID_REQUEST' using errcode='22023'; end if;
  -- Admission lock survives until transaction end; disabling cannot race an admitted write.
  select * into admission from public.commerce_projection_admission where business_id=p_business_id for share;
  if not found or not admission.enabled or admission.admit_attempts_created_after is null then
    return jsonb_build_object('outcome','NOT_ADMITTED','business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind); end if;
  -- Global order: obligation -> attempt -> trigger ledger -> appointment -> aggregate -> target/sequence.
  select * into o from public.commerce_payment_reconciliation
    where business_id=p_business_id and attempt_id=p_attempt_id and projection_kind=p_kind for update;
  if not found then return jsonb_build_object('outcome','UNKNOWN','business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind); end if;
  select * into a from public.commerce_payment_attempts where business_id=p_business_id and id=p_attempt_id for update;
  if not found or a.created_at<=admission.admit_attempts_created_after then
    return jsonb_build_object('outcome','NOT_ADMITTED','business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind); end if;
  terminal:=o.state in ('COMPLETE','NOT_REQUIRED');
  if a.execution_state<>'ACCEPTED' or a.recovery_disposition<>'RECOVER' or a.failure_class is not null
    or a.failure_code is not null or not public.payment_projection_history_valid_v1(p_business_id,p_attempt_id)
    or (select count(*) from public.commerce_transactions where payment_attempt_id=a.id)<>1 then
    return jsonb_build_object('outcome','UNKNOWN','business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind); end if;
  select * into t from public.commerce_transactions where payment_attempt_id=a.id and business_id=p_business_id for update;
  if not found or row(t.business_id,t.customer_id,t.appointment_id,t.kind,t.status,t.method,t.amount_cents,t.currency,t.provider,t.created_by)
    is distinct from row(a.business_id,a.customer_id,a.appointment_id,a.payment_kind,'succeeded'::text,a.method,a.amount_cents,a.currency,'manual'::text,a.actor_id)
    or a.amount_cents<=0 or a.payment_kind not in ('payment','deposit') or a.provider_route<>'manual'
    or t.provider_payment_intent_id is not null
    or t.provider_reference is distinct from ((case when a.booking_operation_id is null then 'manual-attempt:' else 'manual-booking-operation:' end)||a.id::text)
    or (a.booking_operation_id is not null and not exists(select 1 from public.commerce_booking_operations op where op.id=a.booking_operation_id and op.business_id=a.business_id and op.customer_id=a.customer_id and op.actor_id=a.actor_id and op.source=a.source))
    or a.gift_card_id is not null or a.method not in ('cash','e_transfer','debit_card','credit_card','other')
    or not exists(select 1 from public.customers where id=a.customer_id and business_id=p_business_id) then
    return jsonb_build_object('outcome','UNKNOWN','business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind); end if;
  if a.appointment_id is not null then truth:=public.payment_appointment_truth_v1(p_business_id,p_attempt_id); end if;
  -- A subtransaction ensures no target change survives a definite or uncertain failure.
  begin
    if a.appointment_id is not null and truth is null then raise exception 'UNSUPPORTED_TRUTH' using errcode='P1331'; end if;
    if a.appointment_id is null and p_kind in ('appointment_cache','invoice_settlement') then
      next_state:='NOT_REQUIRED'; target_valid:=true;
    elsif p_kind='appointment_cache' then
      target_id:=a.appointment_id;
      select row(amount_paid_cents,amount_refunded_cents,payment_status)
        is not distinct from row((truth->>'paid')::integer,0,truth->>'payment_status') into target_valid
        from public.appointments where id=a.appointment_id and business_id=p_business_id;
      if not terminal then
        update public.appointments set amount_paid_cents=(truth->>'paid')::integer,
          amount_refunded_cents=0, payment_status=truth->>'payment_status'
        where id=a.appointment_id and business_id=p_business_id;
        target_valid:=found;
      end if;
    elsif p_kind='invoice_settlement' then
      paid:=(truth->>'paid')::integer; total:=(truth->>'total')::integer;
      invoice_state:=case when paid>=total then 'paid' when paid>0 then 'partial' else 'open' end;
      select * into inv from public.commerce_invoices where business_id=p_business_id and appointment_id=a.appointment_id for update;
      if not found and not terminal then
        perform pg_advisory_xact_lock(hashtextextended('invoice-sequence:'||p_business_id,0));
        insert into public.commerce_invoice_sequences(business_id) values(p_business_id) on conflict do nothing;
        select next_number,prefix into number_value,prefix_value from public.commerce_invoice_sequences where business_id=p_business_id for update;
        if number_value<=0 or prefix_value is null then raise exception 'INVALID_SEQUENCE' using errcode='P1331'; end if;
        for allocation in 1..32 loop
          document_number:=prefix_value||'-'||lpad(number_value::text, greatest(6,length(number_value::text)), '0');
          number_value:=number_value+1;
          exit when not exists(select 1 from public.commerce_invoices where business_id=p_business_id and invoice_number=document_number);
          if allocation=32 then raise exception 'SEQUENCE_COLLISION' using errcode='23505'; end if;
        end loop;
        update public.commerce_invoice_sequences set next_number=number_value,updated_at=clock_timestamp() where business_id=p_business_id;
        insert into public.commerce_invoices(business_id,customer_id,appointment_id,invoice_number,currency,
          subtotal_cents,tax_cents,total_cents,balance_cents)
        values(p_business_id,a.customer_id,a.appointment_id,document_number,a.currency,(truth->>'price')::integer,(truth->>'tax')::integer,total,total)
        on conflict(business_id,appointment_id) where appointment_id is not null do nothing returning * into inv;
        if found then
          insert into public.commerce_invoice_lines(business_id,invoice_id,description,quantity,unit_amount_cents,tax_cents,total_cents)
          values(p_business_id,inv.id,'Appointment',1,(truth->>'price')::integer,(truth->>'tax')::integer,total);
        else
          select * into inv from public.commerce_invoices where business_id=p_business_id and appointment_id=a.appointment_id for update;
        end if;
      end if;
      target_id:=inv.id;
      if inv.id is null or inv.status in ('void','refunded') or inv.voided_at is not null or inv.amount_refunded_cents<>0
        or row(inv.customer_id,inv.currency,inv.subtotal_cents,inv.tax_cents,inv.discount_cents,inv.total_cents)
          is distinct from row(a.customer_id,a.currency,(truth->>'price')::integer,(truth->>'tax')::integer,0,total)
        or not exists(select 1 from public.commerce_invoice_lines where invoice_id=inv.id)
        or exists(select 1 from public.commerce_invoice_lines line_row where invoice_id=inv.id and
          ((line_row.service_id is not null and not exists(select 1 from public.services service_row where service_row.id=line_row.service_id and service_row.business_id=p_business_id))
            or business_id<>p_business_id or quantity::text in ('NaN','Infinity','-Infinity') or quantity<=0 or unit_amount_cents<0 or tax_cents<0 or discount_cents<>0
            or total_cents<>round(quantity*unit_amount_cents)+tax_cents))
        or (select sum(round(quantity*unit_amount_cents)) from public.commerce_invoice_lines where invoice_id=inv.id)<>(truth->>'price')::integer
        or (select sum(tax_cents) from public.commerce_invoice_lines where invoice_id=inv.id)<>(truth->>'tax')::integer
        or (t.invoice_id is not null and t.invoice_id<>inv.id) then raise exception 'INVOICE_CONTRADICTION' using errcode='P1331'; end if;
      target_valid:=row(inv.amount_paid_cents,inv.amount_refunded_cents,inv.balance_cents,inv.status,t.invoice_id)
        is not distinct from row(paid,0,greatest(total-paid,0),invoice_state,inv.id);
      if not terminal then
        update public.commerce_invoices set amount_paid_cents=paid,amount_refunded_cents=0,
          balance_cents=greatest(total-paid,0),status=invoice_state,
          paid_at=case when invoice_state='paid' then coalesce(paid_at,clock_timestamp()) else null end,updated_at=clock_timestamp()
        where id=inv.id and business_id=p_business_id;
        update public.commerce_transactions set invoice_id=inv.id where id=t.id and business_id=p_business_id and invoice_id is null;
        target_valid:=true;
      end if;
    elsif p_kind='customer_payment_events' then
      select * into crm from public.customer_payment_events where business_id=p_business_id and transaction_id=t.id for update;
      if not found and not terminal then
        insert into public.customer_payment_events(business_id,customer_id,appointment_id,transaction_id,amount_cents,currency,status,method,provider,occurred_at)
        values(p_business_id,t.customer_id,t.appointment_id,t.id,t.amount_cents,t.currency,'paid',t.method,t.provider,t.occurred_at)
        on conflict(business_id,transaction_id) where transaction_id is not null do nothing;
        select * into crm from public.customer_payment_events where business_id=p_business_id and transaction_id=t.id for update;
      end if;
      target_id:=crm.id;
      target_valid:=crm.id is not null and row(crm.customer_id,crm.appointment_id,crm.amount_cents,crm.currency,crm.status,crm.method,crm.provider,crm.occurred_at)
        is not distinct from row(t.customer_id,t.appointment_id,t.amount_cents,t.currency,'paid'::text,t.method,t.provider,t.occurred_at);
    elsif p_kind='receipt' then
      body:='Transaction '||t.id||': '||t.amount_cents||' '||upper(t.currency)||' cents; '||t.method;
      select * into rec from public.commerce_receipts where business_id=p_business_id and transaction_id=t.id for update;
      if not found and not terminal then
        perform pg_advisory_xact_lock(hashtextextended('receipt-sequence:'||p_business_id,0));
        insert into public.commerce_receipt_sequences(business_id) values(p_business_id) on conflict do nothing;
        select next_number,prefix into number_value,prefix_value from public.commerce_receipt_sequences where business_id=p_business_id for update;
        for allocation in 1..32 loop
          document_number:=prefix_value||'-'||lpad(number_value::text,greatest(6,length(number_value::text)),'0');
          number_value:=number_value+1;
          exit when not exists(select 1 from public.commerce_receipts where business_id=p_business_id and receipt_number=document_number);
          if allocation=32 then raise exception 'SEQUENCE_COLLISION' using errcode='23505'; end if;
        end loop;
        update public.commerce_receipt_sequences set next_number=number_value,updated_at=clock_timestamp() where business_id=p_business_id;
        -- Deliberately leave invoice_id NULL. Invoice linkage is not receipt completion truth.
        insert into public.commerce_receipts(business_id,customer_id,transaction_id,receipt_number,amount_cents,currency,method,body_text,email_status)
        values(p_business_id,t.customer_id,t.id,document_number,t.amount_cents,t.currency,t.method,body,'not_sent')
        on conflict(business_id,transaction_id) do nothing;
        select * into rec from public.commerce_receipts where business_id=p_business_id and transaction_id=t.id for update;
      end if;
      target_id:=rec.id;
      target_valid:=rec.id is not null and rec.receipt_number<>''
        and (rec.invoice_id is null or exists(select 1 from public.commerce_invoices linked_invoice where linked_invoice.id=rec.invoice_id and linked_invoice.business_id=p_business_id and linked_invoice.customer_id=t.customer_id and linked_invoice.appointment_id is not distinct from t.appointment_id))
        and row(rec.customer_id,rec.amount_cents,rec.currency,rec.method,rec.body_text,rec.email_status,rec.emailed_at)
        is not distinct from row(t.customer_id,t.amount_cents,t.currency,t.method,body,'not_sent'::text,null::timestamptz);
    end if;
    if not coalesce(target_valid,false) then raise exception 'TARGET_CONTRADICTION' using errcode='P1331'; end if;
    if not terminal then
      update public.commerce_payment_reconciliation set state=next_state,failure_code=null,updated_at=clock_timestamp(),completed_at=clock_timestamp()
        where attempt_id=a.id and business_id=p_business_id and projection_kind=p_kind;
      insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,projection_kind,reconciliation_state)
        values(p_business_id,a.id,'PROJECTION_CHANGED','RECORDED',p_kind,next_state);
    end if;
  exception
    when sqlstate 'P1331' then failure:='PROJECTION_UNCERTAIN';
    when others then
      -- Customer-only invoice has no FAILED state in the approved R1a vocabulary.
      -- Infrastructure failure therefore rolls back the invocation, retaining PENDING.
      if a.appointment_id is null and p_kind='invoice_settlement' then raise; end if;
      failure:='PROJECTION_FAILED';
  end;
  if failure is not null and not terminal then
    -- No raw database errors escape. The target subtransaction has rolled back.
    update public.commerce_payment_reconciliation set state='FAILED',failure_code=failure,updated_at=clock_timestamp(),completed_at=null
      where attempt_id=a.id and business_id=p_business_id and projection_kind=p_kind;
    insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,projection_kind,reconciliation_state,failure_class,failure_code)
      values(p_business_id,a.id,'PROJECTION_CHANGED','RECORDED',p_kind,'FAILED','PROJECTION',failure);
  end if;
  return jsonb_build_object('outcome',case when failure is not null then case when terminal then 'VERIFICATION_MISMATCH' else 'FAILED' end when terminal then 'VERIFIED' else 'APPLIED' end,
    'business_id',p_business_id,'attempt_id',p_attempt_id,'projection_kind',p_kind,
    'state',case when terminal then o.state when failure is not null then 'FAILED' else next_state end,
    'target_id',case when failure is null then target_id else null end,'failure_code',failure);
end $$;

create function public.project_payment_appointment_cache_v1(p_business_id uuid, p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  return public.project_payment_obligation_v1(p_business_id,p_attempt_id,'appointment_cache');
end $$;

create function public.project_payment_invoice_settlement_v1(p_business_id uuid, p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  return public.project_payment_obligation_v1(p_business_id,p_attempt_id,'invoice_settlement');
end $$;

create function public.project_payment_customer_payment_events_v1(p_business_id uuid, p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  return public.project_payment_obligation_v1(p_business_id,p_attempt_id,'customer_payment_events');
end $$;

create function public.project_payment_receipt_v1(p_business_id uuid, p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if current_user <> 'service_role' then raise exception 'PROJECTION_NOT_AUTHORIZED' using errcode='42501'; end if;
  return public.project_payment_obligation_v1(p_business_id,p_attempt_id,'receipt');
end $$;

-- One stable statement snapshot for authorization and canonical history. No revenue aggregate.
create function public.read_payment_observability_v1(
  p_business_id uuid, p_actor_id uuid, p_mode text, p_attempt_id uuid, p_cursor text, p_limit integer
) returns jsonb language plpgsql stable security invoker set search_path = pg_catalog, pg_temp as $$
declare result jsonb; cursor_value jsonb; cursor_time timestamptz; cursor_id uuid;
begin
  if current_user <> 'service_role' then raise exception 'OBSERVABILITY_NOT_AUTHORIZED' using errcode='42501'; end if;
  if not exists(select 1 from public.businesses b where b.id=p_business_id and
    (b.owner_id=p_actor_id or exists(select 1 from public.business_members m where m.business_id=b.id and m.user_id=p_actor_id and m.role in ('owner','admin')))) then
    raise exception 'OBSERVABILITY_NOT_AUTHORIZED' using errcode='42501'; end if;
  if p_mode is null or p_mode not in ('one','history') or p_limit is null or p_limit<1 or p_limit>50
    or (p_mode='one' and (p_attempt_id is null or p_cursor is not null))
    or (p_mode='history' and p_attempt_id is not null) then raise exception 'OBSERVABILITY_INVALID_REQUEST' using errcode='22023'; end if;
  if p_cursor is not null then
    begin
      if length(p_cursor)>1024 then raise exception 'invalid cursor'; end if;
      cursor_value:=convert_from(decode(p_cursor,'hex'),'UTF8')::jsonb;
      cursor_time:=(cursor_value->>'created_at')::timestamptz; cursor_id:=(cursor_value->>'id')::uuid;
      if cursor_value->>'business_id' is distinct from p_business_id::text or cursor_time is null or not isfinite(cursor_time) or cursor_id is null then raise exception 'invalid cursor'; end if;
    exception when others then raise exception 'OBSERVABILITY_INVALID_CURSOR' using errcode='22023'; end;
  end if;
  with candidates as materialized (
    select a.* from public.commerce_payment_attempts a where a.business_id=p_business_id
      and (p_mode='history' or a.id=p_attempt_id)
      and (cursor_id is null or (a.created_at,a.id)<(cursor_time,cursor_id))
    order by a.created_at desc,a.id desc limit p_limit+1
  ), page as materialized (
    select * from candidates order by created_at desc,id desc limit p_limit
  ), evidence as (
    select a.*, b.payment_mode,
      (a.booking_operation_id is null or (b.id is not null and b.business_id=a.business_id and b.customer_id=a.customer_id and b.actor_id=a.actor_id and b.source=a.source)) as binding_valid,
      (a.appointment_id is null or exists(select 1 from public.appointments ap where ap.id=a.appointment_id and ap.business_id=a.business_id and ap.customer_id=a.customer_id)) as appointment_valid,
      (select count(*) from public.commerce_payment_attempt_events ev where ev.attempt_id=a.id and
        (ev.business_id<>a.business_id or (ev.event_type not in ('REQUESTED','ACCEPTED','FAILED','SKIPPED') and not
          (ev.event_type='KEY_CONFLICT' and ev.money_state='NOT_RECORDED' and ev.failure_class='CONFLICT' and ev.failure_code='KEY_CONFLICT')))) as nonterminal_invalid_events,
      (select count(*) from public.commerce_transactions t where t.payment_attempt_id=a.id) as ledger_count,
      (select count(*) from public.commerce_payment_reconciliation o where o.attempt_id=a.id) as obligation_count,
      (select count(*) from public.commerce_payment_reconciliation o where o.attempt_id=a.id and o.state in ('PENDING','FAILED')) as incomplete_count,
      (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=a.id and e.event_type='REQUESTED' and e.business_id=a.business_id and e.money_state='NOT_RECORDED' and e.failure_class is null and e.failure_code is null) as requested_count,
      (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=a.id and e.event_type in ('REQUESTED','ACCEPTED','FAILED','SKIPPED')) as lifecycle_count,
      (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=a.id and e.business_id=a.business_id and e.event_type=a.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from a.failure_class and e.failure_code is not distinct from a.failure_code) as terminal_count,
      (select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'sequence',e.event_sequence,'type',e.event_type,'money_state',e.money_state,
        'projection_kind',e.projection_kind,'state',e.reconciliation_state,'failure_class',e.failure_class,'failure_code',e.failure_code,'occurred_at',e.occurred_at) order by e.event_sequence),'[]')
        from public.commerce_payment_attempt_events e where e.attempt_id=a.id and e.business_id=a.business_id) as events,
      (select coalesce(jsonb_agg(jsonb_build_object('kind',o.projection_kind,'state',o.state,'failure_code',o.failure_code,'updated_at',o.updated_at,'completed_at',o.completed_at) order by o.projection_kind),'[]')
        from public.commerce_payment_reconciliation o where o.attempt_id=a.id and o.business_id=a.business_id) as obligations,
      (select jsonb_build_object('id',t.id,'appointment_id',t.appointment_id,'amount_cents',t.amount_cents,'currency',t.currency,'method',t.method,'kind',t.kind,'status',t.status,'provider',t.provider)
        from public.commerce_transactions t where t.payment_attempt_id=a.id and t.business_id=a.business_id
        and t.provider_payment_intent_id is null
        and t.provider_reference=((case when a.booking_operation_id is null then 'manual-attempt:' else 'manual-booking-operation:' end)||a.id::text)
        and row(t.customer_id,t.appointment_id,t.kind,t.status,t.amount_cents,t.currency,t.method,t.provider,t.created_by)
        is not distinct from row(a.customer_id,a.appointment_id,a.payment_kind,'succeeded'::text,a.amount_cents,a.currency,a.method,a.provider_route,a.actor_id)
        limit 1) as ledger
    from page a left join public.commerce_booking_operations b on b.id=a.booking_operation_id
  ), states as (
    select e.*,case
      when not binding_valid or not appointment_valid or not exists(select 1 from public.customers c where c.id=e.customer_id and c.business_id=e.business_id) then 'UNKNOWN'
      when execution_state='ACCEPTED' and payment_kind in ('payment','deposit') and amount_cents>0 and provider_route='manual' and method in ('cash','debit_card','credit_card','e_transfer','other') and gift_card_id is null and recovery_disposition='RECOVER' and failure_class is null and failure_code is null
        and resolved_at is not null and ledger_count=1 and ledger is not null
        and public.payment_projection_history_valid_v1(business_id,id)
        then case when incomplete_count>0 then 'RECORDED_BUT_NOT_FULLY_SYNCHRONIZED' else 'RECORDED' end
      when execution_state='REQUESTED' and nonterminal_invalid_events=0 and recovery_disposition='RECOVER' and resolved_at is null and failure_class is null and failure_code is null
        and ledger_count=0 and obligation_count=0 and requested_count=1 and lifecycle_count=1 then 'PAYMENT_RECOVERY_REQUIRED'
      when execution_state in ('SKIPPED','FAILED') and nonterminal_invalid_events=0 and recovery_disposition in ('DO_NOT_RETRY','NEW_ATTEMPT_ALLOWED') and resolved_at is not null
        and ledger_count=0 and obligation_count=0 and requested_count=1 and lifecycle_count=2 and terminal_count=1
        and ((execution_state='SKIPPED' and payment_kind='none' and amount_cents=0 and method is null and provider_route is null and failure_class is null and failure_code is null)
          or (execution_state='FAILED' and failure_class is not null and failure_code is not null)) then 'NOT_RECORDED'
      else 'UNKNOWN' end as operator_state from evidence e
  )
  select jsonb_build_object('snapshot_at',statement_timestamp(),'business_id',p_business_id,
    'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'attempt_id',id,'attempt_key',case when actor_id=p_actor_id then attempt_key else null end,'source',source,
      'booking_operation_id',booking_operation_id,'appointment_id',appointment_id,'payment_kind',payment_kind,
      'amount_cents',amount_cents,'currency',currency,'method',method,'provider_route',provider_route,'payment_mode',payment_mode,
      'execution_state',execution_state,'recovery_disposition',recovery_disposition,'failure_class',failure_class,'failure_code',failure_code,
      'events',events,'ledger_count',ledger_count,'ledger',case when ledger_count=1 then ledger else null end,'obligations',obligations,
      'operator_state',operator_state,'synchronization',case operator_state when 'RECORDED' then 'COMPLETE' when 'NOT_RECORDED' then 'NOT_REQUIRED' when 'UNKNOWN' then 'UNKNOWN' else 'PENDING' end,
      'created_at',created_at,'resolved_at',resolved_at,'communication_eligibility','NOT_IMPLEMENTED'
    ) order by created_at desc,id desc) from states),'[]'::jsonb),
    'next_cursor',case when (select count(*) from candidates)>p_limit then
      (select encode(convert_to(jsonb_build_object('business_id',p_business_id,'created_at',created_at,'id',id)::text,'UTF8'),'hex') from page order by created_at,id limit 1) else null end)
    into result;
  return result;
end $$;

revoke all on function public.set_payment_projection_admission_v1(uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.set_payment_projection_admission_v1(uuid,boolean) to service_role;

revoke all on function public.payment_projection_history_valid_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.payment_projection_history_valid_v1(uuid,uuid) to service_role;

revoke all on function public.payment_appointment_truth_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.payment_appointment_truth_v1(uuid,uuid) to service_role;

revoke all on function public.project_payment_obligation_v1(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.project_payment_obligation_v1(uuid,uuid,text) to service_role;

revoke all on function public.read_payment_observability_v1(uuid,uuid,text,uuid,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.read_payment_observability_v1(uuid,uuid,text,uuid,text,integer) to service_role;

revoke all on function public.project_payment_appointment_cache_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.project_payment_appointment_cache_v1(uuid,uuid) to service_role;

revoke all on function public.project_payment_invoice_settlement_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.project_payment_invoice_settlement_v1(uuid,uuid) to service_role;

revoke all on function public.project_payment_customer_payment_events_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.project_payment_customer_payment_events_v1(uuid,uuid) to service_role;

revoke all on function public.project_payment_receipt_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.project_payment_receipt_v1(uuid,uuid) to service_role;

commit;
