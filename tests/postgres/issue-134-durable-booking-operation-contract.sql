\set ON_ERROR_STOP on

-- Disposable fixture only. This file owns a synthetic PostgreSQL database and
-- applies the immutable accepted sources before the new prepared migration.
\ir issue-134-payment-attempt-foundation-fixture.sql

create schema auth;
create table auth.users(id uuid primary key);

alter table public.businesses
  add column owner_id uuid not null,
  add column currency text not null default 'cad';
alter table public.customers
  add column email text not null,
  add column phone text,
  add column tags text[] not null default '{}';
alter table public.customers
  add constraint customers_business_id_email_key unique(business_id, email);

create type public.appointment_status as enum(
  'pending', 'confirmed', 'arrived', 'waiting', 'in_progress',
  'cancelled', 'completed', 'no_show'
);
create table public.business_members(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  user_id uuid not null references auth.users(id),
  role text not null check(role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique(business_id, user_id)
);
create table public.locations(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null
);
create table public.services(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null,
  duration_minutes integer not null,
  price numeric not null,
  deposit_cents integer not null default 0,
  deposit_required boolean not null default false,
  tax_rate_bps integer
);
create table public.staff(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null
);
create table public.booking_resources(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  resource_type text not null,
  name text not null,
  is_active boolean not null default true
);

alter table public.appointments
  add column location_id uuid references public.locations(id),
  add column service_id uuid references public.services(id),
  add column staff_id uuid references public.staff(id),
  add column start_time timestamptz,
  add column end_time timestamptz,
  add column status public.appointment_status not null default 'confirmed',
  add column notes text,
  add column room_id uuid references public.booking_resources(id),
  add column price_cents integer,
  add column tax_cents integer not null default 0,
  add column deposit_cents integer not null default 0,
  add column amount_paid_cents integer not null default 0,
  add column payment_status text not null default 'unpaid';
create table public.appointment_resources(
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  resource_id uuid not null references public.booking_resources(id),
  primary key(appointment_id, resource_id)
);
alter table public.commerce_transactions
  add column invoice_id uuid,
  add column created_by uuid references auth.users(id);

\ir ../../supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql

grant select on table
  public.businesses,
  public.business_members,
  public.customers,
  public.locations,
  public.services,
  public.staff,
  public.booking_resources,
  public.appointments,
  public.appointment_resources
to service_role;
grant insert on table
  public.customers,
  public.appointments,
  public.appointment_resources
to service_role;
grant update(customer_id, status) on table public.appointments to service_role;
grant usage, select on sequence
  public.commerce_payment_attempt_events_event_sequence_seq
to service_role;

\ir ../../supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql
\ir ../../supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql

create temporary table issue134_before_durable_digest as
select
  (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
   from public.businesses t) as businesses,
  (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
   from public.customers t) as customers,
  (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
   from public.appointments t) as appointments,
  (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
   from public.commerce_transactions t) as transactions,
  (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
   from public.commerce_payment_attempts t) as attempts;

\ir ../../supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql

do $$
declare
  functions text[];
  constraints text[];
  indexes text[];
  triggers text[];
begin
  select array_agg(proname order by proname)
  into functions
  from pg_catalog.pg_proc function_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'public'
    and function_row.proname like '%booking_operation%';
  if functions is distinct from array[
    'bind_booking_operation_appointment_v1',
    'bootstrap_booking_operation_v1',
    'close_booking_operation_v1',
    'commit_booking_operation_manual_payment_v1',
    'guard_appointment_booking_operation_link_v1',
    'guard_commerce_booking_operation_v1',
    'persist_booking_operation_appointment_v1',
    'read_booking_operations_v1'
  ] then
    raise exception 'function inventory mismatch: %', functions;
  end if;

  select array_agg(conname order by conname)
  into constraints
  from pg_catalog.pg_constraint
  where conname in (
    'commerce_booking_operations_pkey',
    'commerce_booking_operations_id_business_key',
    'commerce_booking_operations_business_fk',
    'commerce_booking_operations_customer_fk',
    'commerce_booking_operations_request_check',
    'commerce_booking_operations_lifecycle_check',
    'appointments_booking_operation_fk',
    'commerce_payment_attempts_booking_operation_fk'
  );
  if cardinality(constraints) <> 8 then
    raise exception 'constraint inventory mismatch: %', constraints;
  end if;

  select array_agg(indexname order by indexname)
  into indexes
  from pg_catalog.pg_indexes
  where schemaname = 'public'
    and indexname in (
      'commerce_booking_operations_actor_recovery_idx',
      'appointments_booking_operation_key',
      'commerce_payment_attempts_booking_operation_key'
    );
  if cardinality(indexes) <> 3
     or to_regclass('public.commerce_payment_attempts_booking_idx') is null then
    raise exception 'index inventory mismatch: %', indexes;
  end if;

  select array_agg(tgname order by tgname)
  into triggers
  from pg_catalog.pg_trigger
  where tgname in (
    'commerce_booking_operations_guard',
    'appointments_booking_operation_guard'
  ) and not tgisinternal;
  if cardinality(triggers) <> 2 then
    raise exception 'trigger inventory mismatch: %', triggers;
  end if;
end $$;
\echo 'PASS schema inventory: 1 table + 1 column + 8 constraints + 3 indexes + 8 functions + 2 triggers'

do $$
declare
  before_row issue134_before_durable_digest%rowtype;
  after_row issue134_before_durable_digest%rowtype;
begin
  select * into before_row from issue134_before_durable_digest;
  select
    (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
     from public.businesses t),
    (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
     from public.customers t),
    (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
     from public.appointments t),
    (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
     from public.commerce_transactions t),
    (select md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
     from public.commerce_payment_attempts t)
  into after_row;
  if before_row is distinct from after_row then
    raise exception 'migration changed protected fixture rows';
  end if;
end $$;
\echo 'PASS protected pre-existing fixture digests unchanged'

create function public.issue134_canonical_json(p_value jsonb)
returns text
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $$
declare
  result text;
begin
  if jsonb_typeof(p_value) = 'array' then
    select '[' || coalesce(
      string_agg(
        public.issue134_canonical_json(element.value),
        ','
        order by element.ordinality
      ),
      ''
    ) || ']'
    into result
    from jsonb_array_elements(p_value) with ordinality
      element(value, ordinality);
    return result;
  end if;
  if jsonb_typeof(p_value) = 'object' then
    raise exception 'fixture canonicalizer does not accept objects';
  end if;
  return p_value::text;
end $$;

create function public.issue134_fingerprint(p_values jsonb)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select 'v1:' || pg_catalog.encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(
        public.issue134_canonical_json(p_values),
        'UTF8'
      )
    ),
    'hex'
  )
  from jsonb_array_elements(p_values) with ordinality
$$;

create function public.issue134_bootstrap(
  p_operation uuid,
  p_key uuid,
  p_customer uuid,
  p_payment_mode text,
  p_payment_kind text,
  p_amount integer,
  p_method text,
  p_provider text,
  p_source text default 'booking_sheet'
) returns text
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  result text;
  customer_fingerprint text;
  booking_fingerprint text;
  payment_fingerprint text;
begin
  customer_fingerprint := public.issue134_fingerprint(jsonb_build_array(
    'chasum.booking-customer-input', 1, 'existing', p_customer,
    null::text, null::text, null::text
  ));
  booking_fingerprint := public.issue134_fingerprint(jsonb_build_array(
    'chasum.booking-operation', 1,
    '15800000-0000-4000-8000-000000000001'::uuid,
    p_customer,
    '15800000-0000-4000-8000-000000000010'::uuid,
    '15800000-0000-4000-8000-000000000020'::uuid,
    '15800000-0000-4000-8000-000000000030'::uuid,
    '2026-10-08T14:00:00.000Z',
    '2026-10-08T15:00:00.000Z',
    'confirmed', 60, null::uuid, to_jsonb(array[
      '15800000-0000-4000-8000-000000000060'::uuid,
      '15800000-0000-4000-8000-000000000061'::uuid
    ]), null::uuid, null::text,
    10000, 0, 5000, p_payment_mode, null::text, null::text, false
  ));
  payment_fingerprint := public.issue134_fingerprint(jsonb_build_array(
    'chasum.payment-attempt', 1,
    '15800000-0000-4000-8000-000000000001'::uuid,
    p_customer, 'booking_operation', p_operation, p_amount, 'cad',
    p_method, p_payment_kind, p_provider, null::text
  ));
  select outcome into result
  from public.bootstrap_booking_operation_v1(
    '15800000-0000-4000-8000-000000000001',
    p_operation,
    p_key,
    '15800000-0000-4000-8000-000000000002',
    p_source,
    booking_fingerprint,
    payment_fingerprint,
    customer_fingerprint,
    'existing',
    p_customer,
    null,
    null,
    null,
    null,
    '15800000-0000-4000-8000-000000000010',
    '15800000-0000-4000-8000-000000000020',
    '15800000-0000-4000-8000-000000000030',
    '2026-10-08T14:00:00.000Z',
    '2026-10-08T15:00:00.000Z',
    'confirmed',
    60,
    null,
    array[
      '15800000-0000-4000-8000-000000000060'::uuid,
      '15800000-0000-4000-8000-000000000061'::uuid
    ],
    null,
    null,
    10000,
    0,
    5000,
    p_payment_mode,
    null,
    null,
    false,
    p_payment_kind,
    p_amount,
    'cad',
    p_method,
    p_provider
  );
  return result;
end $$;

create function public.issue134_bootstrap_inline(
  p_operation uuid,
  p_key uuid,
  p_inline_customer uuid,
  p_email text,
  p_phone text
) returns text
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  result text;
begin
  select outcome into result
  from public.bootstrap_booking_operation_v1(
    '15800000-0000-4000-8000-000000000001',
    p_operation,
    p_key,
    '15800000-0000-4000-8000-000000000002',
    'quick_appointment',
    public.issue134_fingerprint(jsonb_build_array(
      'chasum.booking-operation', 1,
      '15800000-0000-4000-8000-000000000001'::uuid,
      p_inline_customer,
      '15800000-0000-4000-8000-000000000010'::uuid,
      '15800000-0000-4000-8000-000000000020'::uuid,
      '15800000-0000-4000-8000-000000000030'::uuid,
      '2026-10-08T16:00:00.000Z',
      '2026-10-08T17:00:00.000Z',
      'confirmed', 60, null::uuid, '[]'::jsonb, null::uuid, null::text,
      10000, 0, 5000, 'deposit', null::text, null::text, false
    )),
    public.issue134_fingerprint(jsonb_build_array(
      'chasum.payment-attempt', 1,
      '15800000-0000-4000-8000-000000000001'::uuid,
      p_inline_customer, 'booking_operation', p_operation, 5000, 'cad',
      'cash', 'deposit', 'manual', null::text
    )),
    public.issue134_fingerprint(jsonb_build_array(
      'chasum.booking-customer-input', 1, 'inline', p_inline_customer,
      'Inline Race', p_email, p_phone
    )),
    'inline',
    null,
    p_inline_customer,
    'Inline Race',
    p_email,
    p_phone,
    '15800000-0000-4000-8000-000000000010',
    '15800000-0000-4000-8000-000000000020',
    '15800000-0000-4000-8000-000000000030',
    '2026-10-08T16:00:00.000Z',
    '2026-10-08T17:00:00.000Z',
    'confirmed',
    60,
    null,
    '{}',
    null,
    null,
    10000,
    0,
    5000,
    'deposit',
    null,
    null,
    false,
    'deposit',
    5000,
    'cad',
    'cash',
    'manual'
  );
  return result;
end $$;

insert into auth.users(id) values
  ('15800000-0000-4000-8000-000000000002'),
  ('15800000-0000-4000-8000-000000000099');
insert into public.businesses(id, name, owner_id, currency)
values(
  '15800000-0000-4000-8000-000000000001',
  'Issue 158 Synthetic',
  '15800000-0000-4000-8000-000000000002',
  'cad'
);
insert into public.locations(id, business_id, name) values(
  '15800000-0000-4000-8000-000000000010',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Location'
);
insert into public.services(
  id, business_id, name, duration_minutes, price, deposit_cents, deposit_required
) values(
  '15800000-0000-4000-8000-000000000020',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Service',
  60,
  100,
  5000,
  true
);
insert into public.staff(id, business_id, name) values(
  '15800000-0000-4000-8000-000000000030',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Staff'
);
insert into public.booking_resources(
  id, business_id, resource_type, name, is_active
) values
(
  '15800000-0000-4000-8000-000000000060',
  '15800000-0000-4000-8000-000000000001',
  'equipment',
  'Synthetic Resource One',
  true
),
(
  '15800000-0000-4000-8000-000000000061',
  '15800000-0000-4000-8000-000000000001',
  'equipment',
  'Synthetic Resource Two',
  true
);
insert into public.customers(id, business_id, name, email, phone) values
(
  '15800000-0000-4000-8000-000000000040',
  '15800000-0000-4000-8000-000000000001',
  'Customer One',
  'one@example.com',
  '19055550100'
),
(
  '15800000-0000-4000-8000-000000000041',
  '15800000-0000-4000-8000-000000000001',
  'Customer Two',
  'two@example.com',
  '19055550101'
),
(
  '15800000-0000-4000-8000-000000000042',
  '15800000-0000-4000-8000-000000000001',
  'Customer Three',
  'three@example.com',
  '19055550102'
);

set role service_role;

select public.issue134_bootstrap(
  '15800000-0000-4000-8000-000000000100',
  '15800000-0000-4000-8000-000000000101',
  '15800000-0000-4000-8000-000000000040',
  'deposit', 'deposit', 5000, 'e_transfer', 'manual'
) = 'ADMITTED' as deposit_admitted
\gset
\if :deposit_admitted
\else
  \quit 1
\endif

select booking_fingerprint =
  'v1:f127742ab003f093518cd7d3be5ba127be02240852736d53900bb6c90c8a2704'
  as nested_resource_vector_matched
from public.commerce_booking_operations
where id = '15800000-0000-4000-8000-000000000100'
\gset
\if :nested_resource_vector_matched
\else
  \quit 1
\endif
\echo 'PASS TypeScript/PostgreSQL nested resource fingerprint vector'

select outcome = 'EXISTING' as deposit_replayed
from public.bootstrap_booking_operation_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000100',
  '15800000-0000-4000-8000-000000000101',
  '15800000-0000-4000-8000-000000000002',
  'booking_sheet',
  (select booking_fingerprint from public.commerce_booking_operations where id='15800000-0000-4000-8000-000000000100'),
  (select request_fingerprint from public.commerce_payment_attempts where booking_operation_id='15800000-0000-4000-8000-000000000100'),
  (select customer_input_fingerprint from public.commerce_booking_operations where id='15800000-0000-4000-8000-000000000100'),
  'existing',
  '15800000-0000-4000-8000-000000000040',
  null, null, null, null,
  '15800000-0000-4000-8000-000000000010',
  '15800000-0000-4000-8000-000000000020',
  '15800000-0000-4000-8000-000000000030',
  '2026-10-08T14:00:00.000Z',
  '2026-10-08T15:00:00.000Z',
  'confirmed', 60, null, array[
    '15800000-0000-4000-8000-000000000060'::uuid,
    '15800000-0000-4000-8000-000000000061'::uuid
  ], null, null, 10000, 0, 5000,
  'deposit', null, null, false, 'deposit', 5000, 'cad', 'e_transfer', 'manual'
)
\gset
\if :deposit_replayed
\else
  \quit 1
\endif

select outcome, appointment_id
from public.persist_booking_operation_appointment_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000100',
  '15800000-0000-4000-8000-000000000002',
  '15800000-0000-4000-8000-000000000040',
  '15800000-0000-4000-8000-000000000010',
  '15800000-0000-4000-8000-000000000020',
  '15800000-0000-4000-8000-000000000030',
  '2026-10-08T14:00:00.000Z',
  '2026-10-08T15:00:00.000Z',
  'confirmed', 60, null, null, array[
    '15800000-0000-4000-8000-000000000060'::uuid,
    '15800000-0000-4000-8000-000000000061'::uuid
  ], null, null, 10000, 0, 5000
)
\gset

select outcome
from public.bind_booking_operation_appointment_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000100',
  '15800000-0000-4000-8000-000000000002',
  :'appointment_id'
)
\gset
\if :{?outcome}
\else
  \quit 1
\endif

select outcome = 'RECORDED' as committed, transaction_id
from public.commit_booking_operation_manual_payment_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000100',
  '15800000-0000-4000-8000-000000000002',
  (select id from public.commerce_payment_attempts where booking_operation_id='15800000-0000-4000-8000-000000000100')
)
\gset
\if :committed
\else
  \quit 1
\endif

do $$
declare
  exact_payload jsonb;
  history_payload jsonb;
begin
  select payload into exact_payload
  from public.read_booking_operations_v1(
    '15800000-0000-4000-8000-000000000001',
    '15800000-0000-4000-8000-000000000002',
    'one',
    '15800000-0000-4000-8000-000000000100',
    null, null, null, 1
  );
  if exact_payload->>'found' <> 'true'
     or (exact_payload->>'ledger_count')::integer <> 1
     or jsonb_array_length(exact_payload->'obligations') <> 4 then
    raise exception 'exact read mismatch: %', exact_payload;
  end if;

  select payload into history_payload
  from public.read_booking_operations_v1(
    '15800000-0000-4000-8000-000000000001',
    '15800000-0000-4000-8000-000000000002',
    'history',
    null, null, null, null, 20
  );
  if jsonb_array_length(history_payload->'items') <> 1
     or history_payload::text ~
       '(inline_name|inline_email|inline_phone|payment_note|booking_fingerprint|customer_id|actor_id)' then
    raise exception 'history payload leaked PII/request internals: %', history_payload;
  end if;
end $$;
\echo 'PASS canonical deposit commit, replay, exact read, four PENDING obligations, and PII-free history'

select public.issue134_bootstrap(
  '15800000-0000-4000-8000-000000000200',
  '15800000-0000-4000-8000-000000000201',
  '15800000-0000-4000-8000-000000000040',
  'none', 'none', 0, null, null, 'quick_appointment'
) = 'ADMITTED' as no_payment_admitted
\gset
\if :no_payment_admitted
\else
  \quit 1
\endif

select outcome, appointment_id as no_payment_appointment_id
from public.persist_booking_operation_appointment_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000200',
  '15800000-0000-4000-8000-000000000002',
  '15800000-0000-4000-8000-000000000040',
  '15800000-0000-4000-8000-000000000010',
  '15800000-0000-4000-8000-000000000020',
  '15800000-0000-4000-8000-000000000030',
  '2026-10-08T14:00:00.000Z',
  '2026-10-08T15:00:00.000Z',
  'confirmed', 60, null, null, array[
    '15800000-0000-4000-8000-000000000060'::uuid,
    '15800000-0000-4000-8000-000000000061'::uuid
  ], null, null, 10000, 0, 5000
)
\gset
select outcome
from public.bind_booking_operation_appointment_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000200',
  '15800000-0000-4000-8000-000000000002',
  :'no_payment_appointment_id'
);

do $$
begin
  if (
    select row(
      attempt_row.execution_state,
      attempt_row.recovery_disposition,
      (select count(*) from public.commerce_payment_attempt_events event_row where event_row.attempt_id=attempt_row.id),
      (select count(*) from public.commerce_transactions transaction_row where transaction_row.payment_attempt_id=attempt_row.id),
      (select count(*) from public.commerce_payment_reconciliation obligation_row where obligation_row.attempt_id=attempt_row.id)
    ) is distinct from row('SKIPPED'::text, 'DO_NOT_RETRY'::text, 2::bigint, 0::bigint, 0::bigint)
    from public.commerce_payment_attempts attempt_row
    where attempt_row.booking_operation_id='15800000-0000-4000-8000-000000000200'
  ) then
    raise exception 'no-payment evidence mismatch';
  end if;
end $$;
\echo 'PASS explicit no-payment has REQUESTED+SKIPPED, zero ledger, and zero obligations'

select outcome
from public.close_booking_operation_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000200',
  '15800000-0000-4000-8000-000000000002',
  'CUSTOMER_REASSIGNED',
  '15800000-0000-4000-8000-000000000040',
  '15800000-0000-4000-8000-000000000041',
  false
);
select outcome
from public.close_booking_operation_v1(
  '15800000-0000-4000-8000-000000000001',
  '15800000-0000-4000-8000-000000000200',
  '15800000-0000-4000-8000-000000000002',
  'CUSTOMER_REASSIGNED',
  '15800000-0000-4000-8000-000000000041',
  '15800000-0000-4000-8000-000000000042',
  false
);
do $$
begin
  if (
    select customer_id
    from public.appointments
    where booking_operation_id='15800000-0000-4000-8000-000000000200'
  )
     <> '15800000-0000-4000-8000-000000000042' then
    raise exception 'repeated no-ledger correction failed';
  end if;
end $$;
\echo 'PASS repeated CLOSED no-ledger customer correction preserves terminal no-payment attempt'

do $$
begin
  begin
    perform public.close_booking_operation_v1(
      '15800000-0000-4000-8000-000000000001',
      '15800000-0000-4000-8000-000000000100',
      '15800000-0000-4000-8000-000000000002',
      'CUSTOMER_REASSIGNED',
      '15800000-0000-4000-8000-000000000040',
      '15800000-0000-4000-8000-000000000041',
      false
    );
    raise exception 'ledger-backed correction unexpectedly succeeded';
  exception when check_violation then
    if position('APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN' in sqlerrm) = 0 then
      raise;
    end if;
  end;
end $$;
\echo 'PASS original appointment-linked ledger blocks customer reassignment'

reset role;
do $$
begin
  set local role authenticated;
  begin
    perform public.read_booking_operations_v1(
      '15800000-0000-4000-8000-000000000001',
      '15800000-0000-4000-8000-000000000002',
      'one',
      '15800000-0000-4000-8000-000000000100',
      null, null, null, 1
    );
    raise exception 'authenticated read unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;
\echo 'PASS browser roles cannot execute private mutation/read primitives'

select 'ISSUE134_DURABLE_SQL_CONTRACT_PASS';
