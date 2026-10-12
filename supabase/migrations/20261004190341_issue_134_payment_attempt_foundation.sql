-- Issue #134: PREPARED ONLY / NOT APPLIED. Separate Level-3 + PO application gate.
-- DDL/guards only: no canonical writer, reconciliation worker, or historical backfill.
-- Execute atomically in a future authorized migration transaction; fail on drift.
set lock_timeout = '5s';
set statement_timeout = '30s';

do $$
begin
  if current_setting('lock_timeout')::interval <> interval '5 seconds'
     or current_setting('statement_timeout')::interval <> interval '30 seconds' then
    raise exception 'ISSUE_134_TIMEOUT_ASSERTION_FAILED: lock=%, statement=%',
      current_setting('lock_timeout'), current_setting('statement_timeout');
  end if;
end $$;

-- Existing global PKs already imply uniqueness. These keys support tenant FKs only.
alter table public.customers
  add constraint customers_id_business_attempt_key unique (id, business_id);
alter table public.appointments
  add constraint appointments_id_business_attempt_key unique (id, business_id);
alter table public.gift_cards
  add constraint gift_cards_id_business_attempt_key unique (id, business_id);

create table public.commerce_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  attempt_key uuid not null,
  request_fingerprint text not null
    check (request_fingerprint ~ '^v1:[0-9a-f]{64}$'),
  source text not null check (source in (
    'booking_sheet', 'quick_appointment', 'collect_payment', 'customer_billing', 'payments_dashboard'
  )),
  customer_id uuid not null,
  appointment_id uuid,
  booking_operation_id uuid,
  actor_id uuid,
  payment_kind text not null check (payment_kind in ('payment', 'deposit', 'none')),
  amount_cents integer not null,
  currency text not null check (currency ~ '^[a-z]{3}$'),
  method text check (method in (
    'credit_card', 'debit_card', 'cash', 'e_transfer', 'gift_card', 'store_credit', 'other'
  )),
  provider_route text check (provider_route in ('manual', 'stripe')),
  gift_card_id uuid,
  execution_state text not null default 'REQUESTED'
    check (execution_state in ('REQUESTED', 'ACCEPTED', 'FAILED', 'SKIPPED')),
  recovery_disposition text not null default 'RECOVER'
    check (recovery_disposition in ('RECOVER', 'DO_NOT_RETRY', 'NEW_ATTEMPT_ALLOWED')),
  failure_class text check (failure_class in (
    'VALIDATION', 'AUTHORIZATION', 'CONFLICT', 'PROVIDER', 'LEDGER', 'PROJECTION', 'INTERNAL'
  )),
  failure_code text check (failure_code in (
    'INVALID_REQUEST', 'NOT_AUTHORIZED', 'KEY_CONFLICT', 'PROVIDER_FAILED',
    'PROVIDER_UNCERTAIN', 'LEDGER_FAILED', 'LEDGER_UNCERTAIN',
    'PROJECTION_FAILED', 'PROJECTION_UNCERTAIN', 'INTERNAL_ERROR'
  )),
  created_at timestamptz not null default now() check (isfinite(created_at)),
  updated_at timestamptz not null default now() check (isfinite(updated_at)),
  resolved_at timestamptz check (isfinite(resolved_at)),
  constraint commerce_payment_attempts_business_key unique (business_id, attempt_key),
  constraint commerce_payment_attempts_id_business_key unique (id, business_id),
  constraint commerce_payment_attempts_customer_fk foreign key (customer_id, business_id)
    references public.customers(id, business_id) on delete restrict,
  constraint commerce_payment_attempts_appointment_fk foreign key (appointment_id, business_id)
    references public.appointments(id, business_id) on delete restrict,
  constraint commerce_payment_attempts_gift_card_fk foreign key (gift_card_id, business_id)
    references public.gift_cards(id, business_id) on delete restrict,
  constraint commerce_payment_attempts_request_check check (
    (payment_kind = 'none' and amount_cents = 0 and method is null and provider_route is null)
    or (payment_kind <> 'none' and amount_cents > 0 and method is not null and provider_route is not null)
  ),
  constraint commerce_payment_attempts_gift_card_check check (
    (method is not distinct from 'gift_card') = (gift_card_id is not null)
  ),
  constraint commerce_payment_attempts_skip_check check (
    execution_state <> 'SKIPPED' or (payment_kind = 'none' and recovery_disposition = 'DO_NOT_RETRY')
  ),
  constraint commerce_payment_attempts_accept_check check (
    execution_state <> 'ACCEPTED' or payment_kind <> 'none'
  ),
  constraint commerce_payment_attempts_failure_check check (
    (failure_class is null) = (failure_code is null)
  ),
  constraint commerce_payment_attempts_retry_check check (
    recovery_disposition <> 'NEW_ATTEMPT_ALLOWED' or execution_state = 'FAILED'
  )
);

create index commerce_payment_attempts_customer_idx
  on public.commerce_payment_attempts(customer_id, business_id);
create index commerce_payment_attempts_appointment_idx
  on public.commerce_payment_attempts(appointment_id, business_id) where appointment_id is not null;
create index commerce_payment_attempts_booking_idx
  on public.commerce_payment_attempts(business_id, booking_operation_id) where booking_operation_id is not null;
create index commerce_payment_attempts_gift_card_idx
  on public.commerce_payment_attempts(gift_card_id, business_id) where gift_card_id is not null;

-- NULL preserves every legacy transaction. Only future INSERTs can opt in.
alter table public.commerce_transactions
  add column payment_attempt_id uuid,
  add constraint commerce_transactions_payment_attempt_key unique (payment_attempt_id),
  add constraint commerce_transactions_attempt_business_key unique (payment_attempt_id, business_id),
  add constraint commerce_transactions_attempt_business_fk foreign key (payment_attempt_id, business_id)
    references public.commerce_payment_attempts(id, business_id) on delete restrict;

create table public.commerce_payment_attempt_events (
  id uuid primary key default gen_random_uuid(),
  event_sequence bigint generated always as identity unique,
  business_id uuid not null,
  attempt_id uuid not null,
  event_type text not null check (event_type in (
    'REQUESTED', 'ACCEPTED', 'FAILED', 'SKIPPED', 'REPLAYED', 'KEY_CONFLICT',
    'RECOVERY_REQUIRED', 'PROJECTION_CHANGED'
  )),
  money_state text not null check (money_state in (
    'NOT_RECORDED', 'RECORDED', 'PENDING', 'REQUIRES_ACTION', 'UNKNOWN'
  )),
  projection_kind text check (projection_kind in (
    'appointment_cache', 'invoice_settlement', 'customer_payment_events', 'receipt'
  )),
  reconciliation_state text check (reconciliation_state in ('NOT_REQUIRED', 'PENDING', 'COMPLETE', 'FAILED')),
  failure_class text check (failure_class in (
    'VALIDATION', 'AUTHORIZATION', 'CONFLICT', 'PROVIDER', 'LEDGER', 'PROJECTION', 'INTERNAL'
  )),
  failure_code text check (failure_code in (
    'INVALID_REQUEST', 'NOT_AUTHORIZED', 'KEY_CONFLICT', 'PROVIDER_FAILED',
    'PROVIDER_UNCERTAIN', 'LEDGER_FAILED', 'LEDGER_UNCERTAIN',
    'PROJECTION_FAILED', 'PROJECTION_UNCERTAIN', 'INTERNAL_ERROR'
  )),
  occurred_at timestamptz not null default now() check (isfinite(occurred_at)),
  constraint commerce_payment_attempt_events_attempt_fk foreign key (attempt_id, business_id)
    references public.commerce_payment_attempts(id, business_id) on delete restrict,
  constraint commerce_payment_attempt_events_projection_check check (
    (event_type = 'PROJECTION_CHANGED' and projection_kind is not null and reconciliation_state is not null)
    or (event_type <> 'PROJECTION_CHANGED' and projection_kind is null and reconciliation_state is null)
  ),
  constraint commerce_payment_attempt_events_failure_check check (
    (failure_class is null) = (failure_code is null)
  )
);
create index commerce_payment_attempt_events_history_idx
  on public.commerce_payment_attempt_events(attempt_id, business_id, event_sequence);

-- Each successful canonical writer must persist ALL FOUR rows atomically with
-- its ledger effect, including explicit NOT_REQUIRED decisions. Missing != complete.
create table public.commerce_payment_reconciliation (
  business_id uuid not null,
  attempt_id uuid not null,
  projection_kind text not null check (projection_kind in (
    'appointment_cache', 'invoice_settlement', 'customer_payment_events', 'receipt'
  )),
  is_financial boolean generated always as (projection_kind <> 'receipt') stored,
  state text not null default 'PENDING' check (state in ('NOT_REQUIRED', 'PENDING', 'COMPLETE', 'FAILED')),
  failure_code text check (failure_code in ('PROJECTION_FAILED', 'PROJECTION_UNCERTAIN')),
  created_at timestamptz not null default now() check (isfinite(created_at)),
  updated_at timestamptz not null default now() check (isfinite(updated_at)),
  completed_at timestamptz check (isfinite(completed_at)),
  primary key (attempt_id, projection_kind),
  constraint commerce_payment_reconciliation_ledger_fk foreign key (attempt_id, business_id)
    references public.commerce_transactions(payment_attempt_id, business_id) on delete restrict,
  constraint commerce_payment_reconciliation_completion_check check (
    (state in ('COMPLETE', 'NOT_REQUIRED')) = (completed_at is not null)
  ),
  constraint commerce_payment_reconciliation_failure_check check (
    (state = 'FAILED') = (failure_code is not null)
  )
);
create index commerce_payment_reconciliation_pending_idx
  on public.commerce_payment_reconciliation(business_id, updated_at, attempt_id)
  where state in ('PENDING', 'FAILED');

-- Only foundation integrity guards; these functions do not write any rows.
create function public.guard_commerce_payment_attempt() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  if old.execution_state in ('ACCEPTED', 'SKIPPED')
     and new.execution_state is distinct from old.execution_state then
    raise exception 'PAYMENT_ATTEMPT_STATE_TERMINAL' using errcode = '23514';
  end if;
  if row(new.id, new.business_id, new.attempt_key, new.request_fingerprint, new.source,
         new.customer_id, new.booking_operation_id, new.actor_id, new.payment_kind,
         new.amount_cents, new.currency, new.method, new.provider_route, new.gift_card_id, new.created_at)
     is distinct from
     row(old.id, old.business_id, old.attempt_key, old.request_fingerprint, old.source,
         old.customer_id, old.booking_operation_id, old.actor_id, old.payment_kind,
         old.amount_cents, old.currency, old.method, old.provider_route, old.gift_card_id, old.created_at) then
    raise exception 'PAYMENT_ATTEMPT_REQUEST_IMMUTABLE' using errcode = '23514';
  end if;
  if new.appointment_id is distinct from old.appointment_id
     and not (old.appointment_id is null and new.appointment_id is not null and old.booking_operation_id is not null) then
    raise exception 'PAYMENT_ATTEMPT_APPOINTMENT_IMMUTABLE' using errcode = '23514';
  end if;
  return new;
end $$;

create function public.guard_commerce_attempt_ledger_link() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
declare
  attempt public.commerce_payment_attempts;
begin
  if tg_op = 'DELETE' then
    if old.payment_attempt_id is not null then
      raise exception 'PAYMENT_ATTEMPT_LEDGER_DELETE_FORBIDDEN' using errcode = '23514';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if new.payment_attempt_id is distinct from old.payment_attempt_id then
      raise exception 'PAYMENT_ATTEMPT_LEDGER_LINK_IMMUTABLE' using errcode = '23514';
    end if;
    if old.payment_attempt_id is not null and new.id is distinct from old.id then
      raise exception 'PAYMENT_ATTEMPT_TRANSACTION_ID_IMMUTABLE' using errcode = '23514';
    end if;
  end if;
  if new.payment_attempt_id is null then return new; end if;
  -- Existing ledger table grants extend to new columns. Do not expose an opt-in
  -- attempt path through authenticated direct DML while legacy writers coexist.
  if current_user <> 'service_role' then
    raise exception 'PAYMENT_ATTEMPT_SERVER_ONLY' using errcode = '42501';
  end if;
  select * into attempt from public.commerce_payment_attempts
    where id = new.payment_attempt_id and business_id = new.business_id;
  if not found then
    raise exception 'PAYMENT_ATTEMPT_NOT_FOUND' using errcode = '23503';
  end if;
  if (tg_op = 'INSERT' and attempt.execution_state <> 'ACCEPTED')
     or attempt.payment_kind = 'none'
     or (attempt.booking_operation_id is not null and attempt.appointment_id is null)
     or row(new.customer_id, new.appointment_id, new.amount_cents, new.currency, new.method, new.kind, new.provider)
        is distinct from
        row(attempt.customer_id, attempt.appointment_id, attempt.amount_cents, attempt.currency,
            attempt.method, attempt.payment_kind, attempt.provider_route) then
    raise exception 'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH' using errcode = '23514';
  end if;
  return new;
end $$;

create function public.reject_commerce_attempt_history_mutation() returns trigger
language plpgsql security invoker set search_path = pg_catalog, pg_temp as $$
begin
  raise exception 'PAYMENT_ATTEMPT_HISTORY_IMMUTABLE' using errcode = '23514';
end $$;

create trigger commerce_payment_attempts_immutable_request
  before update on public.commerce_payment_attempts
  for each row execute function public.guard_commerce_payment_attempt();
create trigger commerce_payment_attempts_no_delete
  before delete on public.commerce_payment_attempts
  for each row execute function public.reject_commerce_attempt_history_mutation();
create trigger commerce_transactions_attempt_guard
  before insert or update or delete on public.commerce_transactions
  for each row execute function public.guard_commerce_attempt_ledger_link();
create trigger commerce_payment_attempt_events_append_only
  before update or delete on public.commerce_payment_attempt_events
  for each row execute function public.reject_commerce_attempt_history_mutation();

alter table public.commerce_payment_attempts enable row level security;
alter table public.commerce_payment_attempt_events enable row level security;
alter table public.commerce_payment_reconciliation enable row level security;

-- No browser/owner/staff policies in this prepared foundation. Server-authorized
-- reads only; Summer uses that same boundary. Do not rely on inherited defaults.
revoke all on table public.commerce_payment_attempts from public, anon, authenticated, service_role;
revoke all on table public.commerce_payment_attempt_events from public, anon, authenticated, service_role;
revoke all on table public.commerce_payment_reconciliation from public, anon, authenticated, service_role;
grant select, insert on table public.commerce_payment_attempts to service_role;
grant update (appointment_id, execution_state, recovery_disposition, failure_class, failure_code, updated_at, resolved_at)
  on table public.commerce_payment_attempts to service_role;
grant select, insert on table public.commerce_payment_attempt_events to service_role;
grant select, insert on table public.commerce_payment_reconciliation to service_role;
grant update (state, failure_code, updated_at, completed_at)
  on table public.commerce_payment_reconciliation to service_role;

revoke all on function public.guard_commerce_payment_attempt() from public, anon, authenticated, service_role;
revoke all on function public.guard_commerce_attempt_ledger_link() from public, anon, authenticated, service_role;
revoke all on function public.reject_commerce_attempt_history_mutation() from public, anon, authenticated, service_role;
grant execute on function public.guard_commerce_payment_attempt() to service_role;
grant execute on function public.guard_commerce_attempt_ledger_link() to service_role;
grant execute on function public.reject_commerce_attempt_history_mutation() to service_role;

reset lock_timeout;
reset statement_timeout;
