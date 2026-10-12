-- Issue #134 / #158: PREPARED ONLY / UNWIRED / NOT APPLIED.
-- Durable fresh-booking registry, operation-tagged appointment persistence,
-- canonical manual commit, fenced close, and private recovery primitives.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if current_setting('lock_timeout')::interval <> interval '5 seconds'
     or current_setting('statement_timeout')::interval <> interval '30 seconds' then
    raise exception 'ISSUE_134_DURABLE_TIMEOUT_ASSERTION_FAILED'
      using errcode = '55000';
  end if;

  if to_regclass('public.commerce_booking_operations') is not null
     or exists (
       select 1
       from pg_catalog.pg_attribute attribute_row
       where attribute_row.attrelid = 'public.appointments'::regclass
         and attribute_row.attname = 'booking_operation_id'
         and not attribute_row.attisdropped
     )
     or exists (
       select 1
       from pg_catalog.pg_proc function_row
       join pg_catalog.pg_namespace namespace_row
         on namespace_row.oid = function_row.pronamespace
       where namespace_row.nspname = 'public'
         and function_row.proname in (
           'guard_commerce_booking_operation_v1',
           'guard_appointment_booking_operation_link_v1',
           'bootstrap_booking_operation_v1',
           'persist_booking_operation_appointment_v1',
           'bind_booking_operation_appointment_v1',
           'close_booking_operation_v1',
           'commit_booking_operation_manual_payment_v1',
           'read_booking_operations_v1'
         )
     )
     or exists (
       select 1
       from pg_catalog.pg_class relation_row
       join pg_catalog.pg_namespace namespace_row
         on namespace_row.oid = relation_row.relnamespace
       where namespace_row.nspname = 'public'
         and relation_row.relname in (
           'commerce_booking_operations_actor_recovery_idx',
           'appointments_booking_operation_key',
           'commerce_payment_attempts_booking_operation_key'
         )
     )
     or exists (
       select 1
       from pg_catalog.pg_trigger trigger_row
       where trigger_row.tgname in (
         'commerce_booking_operations_guard',
         'appointments_booking_operation_guard'
       )
         and not trigger_row.tgisinternal
     ) then
    raise exception 'ISSUE_134_DURABLE_OBJECT_COLLISION'
      using errcode = '42710';
  end if;

  if exists (
    select 1
    from public.commerce_payment_attempts attempt_row
    where attempt_row.booking_operation_id is not null
  ) then
    raise exception 'ISSUE_134_DURABLE_UNEXPECTED_EXISTING_OPERATION_LINK'
      using errcode = '23514';
  end if;

  if to_regclass('public.commerce_payment_attempts_booking_idx') is null then
    raise exception 'ISSUE_134_DURABLE_ACCEPTED_INDEX_MISSING'
      using errcode = '55000';
  end if;
end $$;

create table public.commerce_booking_operations (
  id uuid not null,
  business_id uuid not null,
  actor_id uuid not null,
  source text not null,
  booking_fingerprint text not null,
  customer_input_fingerprint text not null,
  customer_origin text not null,
  customer_id uuid not null,
  inline_name text,
  inline_email text,
  inline_phone_digits text,
  location_id uuid not null,
  service_id uuid not null,
  staff_id uuid,
  requested_start timestamptz not null,
  requested_end timestamptz not null,
  requested_status text not null,
  duration_minutes integer not null,
  room_id uuid,
  resource_ids uuid[] not null,
  package_id uuid,
  package_name text,
  subtotal_cents integer not null,
  tax_cents integer not null,
  deposit_required_cents integer not null,
  payment_mode text not null,
  appointment_notes text,
  payment_note text,
  receipt_requested boolean not null,
  lifecycle_state text not null default 'OPEN',
  close_reason text,
  replacement_customer_id uuid,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_booking_operations_pkey primary key (id),
  constraint commerce_booking_operations_id_business_key
    unique (id, business_id),
  constraint commerce_booking_operations_business_fk
    foreign key (business_id)
    references public.businesses(id) on delete restrict,
  constraint commerce_booking_operations_customer_fk
    foreign key (customer_id, business_id)
    references public.customers(id, business_id) on delete restrict,
  constraint commerce_booking_operations_request_check check (
    source in ('booking_sheet', 'quick_appointment')
    and booking_fingerprint ~ '^v1:[0-9a-f]{64}$'
    and customer_input_fingerprint ~ '^v1:[0-9a-f]{64}$'
    and customer_origin in ('existing', 'inline')
    and (
      (
        customer_origin = 'existing'
        and inline_name is null
        and inline_email is null
        and inline_phone_digits is null
      )
      or (
        customer_origin = 'inline'
        and inline_name is not null
        and inline_name = btrim(inline_name)
        and inline_name <> ''
        and inline_email is not null
        and inline_email = lower(btrim(inline_email))
        and position('@' in inline_email) > 1
        and (
          inline_phone_digits is null
          or inline_phone_digits ~ '^[0-9]+$'
        )
      )
    )
    and isfinite(requested_start)
    and isfinite(requested_end)
    and requested_end > requested_start
    and requested_status in (
      'pending',
      'confirmed',
      'arrived',
      'waiting',
      'in_progress',
      'cancelled',
      'completed',
      'no_show'
    )
    and duration_minutes > 0
    and coalesce(array_ndims(resource_ids), 1) = 1
    and array_position(resource_ids, null) is null
    and (package_id is null) = (package_name is null)
    and subtotal_cents >= 0
    and tax_cents >= 0
    and deposit_required_cents >= 0
    and deposit_required_cents <= subtotal_cents + tax_cents
    and payment_mode in ('none', 'deposit', 'full', 'custom')
  ),
  constraint commerce_booking_operations_lifecycle_check check (
    lifecycle_state in ('OPEN', 'APPOINTMENT_CREATED', 'CLOSED')
    and isfinite(created_at)
    and isfinite(updated_at)
    and updated_at >= created_at
    and (
      (
        lifecycle_state in ('OPEN', 'APPOINTMENT_CREATED')
        and close_reason is null
        and replacement_customer_id is null
        and closed_at is null
      )
      or (
        lifecycle_state = 'CLOSED'
        and close_reason in (
          'PRICING_CHANGED',
          'SLOT_CONFLICT',
          'CUSTOMER_REASSIGNED',
          'APPOINTMENT_CANCELLED',
          'OPERATOR_ABANDONED'
        )
        and closed_at is not null
        and isfinite(closed_at)
        and (
          (close_reason = 'CUSTOMER_REASSIGNED' and replacement_customer_id is not null)
          or (close_reason <> 'CUSTOMER_REASSIGNED' and replacement_customer_id is null)
        )
      )
    )
  )
);

alter table public.appointments
  add column booking_operation_id uuid;

alter table public.appointments
  add constraint appointments_booking_operation_fk
  foreign key (booking_operation_id, business_id)
  references public.commerce_booking_operations(id, business_id)
  on delete restrict;

alter table public.commerce_payment_attempts
  add constraint commerce_payment_attempts_booking_operation_fk
  foreign key (booking_operation_id, business_id)
  references public.commerce_booking_operations(id, business_id)
  on delete restrict;

create index commerce_booking_operations_actor_recovery_idx
  on public.commerce_booking_operations(
    business_id,
    actor_id,
    created_at desc,
    id
  );

create unique index appointments_booking_operation_key
  on public.appointments(business_id, booking_operation_id)
  where booking_operation_id is not null;

create unique index commerce_payment_attempts_booking_operation_key
  on public.commerce_payment_attempts(business_id, booking_operation_id)
  where booking_operation_id is not null;

create function public.guard_commerce_booking_operation_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'BOOKING_OPERATION_DELETE_FORBIDDEN'
      using errcode = '23514';
  end if;

  if row(
       new.id,
       new.business_id,
       new.actor_id,
       new.source,
       new.booking_fingerprint,
       new.customer_input_fingerprint,
       new.customer_origin,
       new.customer_id,
       new.inline_name,
       new.inline_email,
       new.inline_phone_digits,
       new.location_id,
       new.service_id,
       new.staff_id,
       new.requested_start,
       new.requested_end,
       new.requested_status,
       new.duration_minutes,
       new.room_id,
       new.resource_ids,
       new.package_id,
       new.package_name,
       new.subtotal_cents,
       new.tax_cents,
       new.deposit_required_cents,
       new.payment_mode,
       new.appointment_notes,
       new.payment_note,
       new.receipt_requested,
       new.created_at
     ) is distinct from row(
       old.id,
       old.business_id,
       old.actor_id,
       old.source,
       old.booking_fingerprint,
       old.customer_input_fingerprint,
       old.customer_origin,
       old.customer_id,
       old.inline_name,
       old.inline_email,
       old.inline_phone_digits,
       old.location_id,
       old.service_id,
       old.staff_id,
       old.requested_start,
       old.requested_end,
       old.requested_status,
       old.duration_minutes,
       old.room_id,
       old.resource_ids,
       old.package_id,
       old.package_name,
       old.subtotal_cents,
       old.tax_cents,
       old.deposit_required_cents,
       old.payment_mode,
       old.appointment_notes,
       old.payment_note,
       old.receipt_requested,
       old.created_at
     ) then
    raise exception 'BOOKING_OPERATION_REQUEST_IMMUTABLE'
      using errcode = '23514';
  end if;

  if old.lifecycle_state = 'CLOSED' and new.lifecycle_state <> 'CLOSED' then
    raise exception 'BOOKING_OPERATION_CLOSED'
      using errcode = '23514';
  end if;
  if old.lifecycle_state = 'APPOINTMENT_CREATED'
     and new.lifecycle_state = 'OPEN' then
    raise exception 'BOOKING_OPERATION_LIFECYCLE_REVERSED'
      using errcode = '23514';
  end if;
  if new.updated_at < old.updated_at then
    raise exception 'BOOKING_OPERATION_TIMESTAMP_REVERSED'
      using errcode = '23514';
  end if;
  return new;
end $$;

create function public.guard_appointment_booking_operation_link_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  operation_row public.commerce_booking_operations%rowtype;
  expected_notes text;
begin
  if tg_op = 'INSERT' and new.booking_operation_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.booking_operation_id is null
     and new.booking_operation_id is null then
    return new;
  end if;

  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if old.booking_operation_id is null
       or new.booking_operation_id is null
       or new.booking_operation_id is distinct from old.booking_operation_id
       or new.business_id is distinct from old.business_id then
      raise exception 'APPOINTMENT_BOOKING_OPERATION_IMMUTABLE'
        using errcode = '23514';
    end if;
  end if;

  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = new.booking_operation_id
    and operation_source.business_id = new.business_id;
  if not found then
    raise exception 'BOOKING_OPERATION_NOT_FOUND'
      using errcode = '23503';
  end if;

  expected_notes := case
    when operation_row.package_id is not null then
      concat_ws(
        E'\n',
        nullif(operation_row.appointment_notes, ''),
        'Package: ' || operation_row.package_name ||
          ' (' || operation_row.package_id::text || ')'
      )
    else operation_row.appointment_notes
  end;

  if tg_op = 'INSERT' then
    if operation_row.lifecycle_state <> 'OPEN'
       or row(
         new.business_id,
         new.customer_id,
         new.location_id,
         new.service_id,
         new.staff_id,
         new.start_time,
         new.end_time,
         new.status::text,
         new.notes,
         new.room_id,
         new.price_cents,
         new.tax_cents,
         new.deposit_cents
       ) is distinct from row(
         operation_row.business_id,
         operation_row.customer_id,
         operation_row.location_id,
         operation_row.service_id,
         operation_row.staff_id,
         operation_row.requested_start,
         operation_row.requested_end,
         operation_row.requested_status,
         expected_notes,
         operation_row.room_id,
         operation_row.subtotal_cents,
         operation_row.tax_cents,
         operation_row.deposit_required_cents
       ) then
      raise exception 'APPOINTMENT_BOOKING_OPERATION_REQUEST_MISMATCH'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if new.customer_id is distinct from old.customer_id then
    if operation_row.lifecycle_state <> 'CLOSED'
       or operation_row.close_reason <> 'CUSTOMER_REASSIGNED'
       or operation_row.replacement_customer_id is distinct from new.customer_id then
      raise exception 'BOOKING_OPERATION_CANONICAL_CLOSE_REQUIRED'
        using errcode = '23514';
    end if;
  end if;

  if new.status is distinct from old.status then
    if new.status::text <> 'cancelled'
       or operation_row.lifecycle_state <> 'CLOSED'
       or operation_row.close_reason not in (
         'APPOINTMENT_CANCELLED',
         'OPERATOR_ABANDONED'
       ) then
      raise exception 'BOOKING_OPERATION_CANONICAL_CLOSE_REQUIRED'
        using errcode = '23514';
    end if;
  end if;

  if row(
       new.location_id,
       new.service_id,
       new.staff_id,
       new.start_time,
       new.end_time,
       new.notes,
       new.room_id,
       new.price_cents,
       new.tax_cents,
       new.deposit_cents
     ) is distinct from row(
       old.location_id,
       old.service_id,
       old.staff_id,
       old.start_time,
       old.end_time,
       old.notes,
       old.room_id,
       old.price_cents,
       old.tax_cents,
       old.deposit_cents
     ) then
    raise exception 'BOOKING_OPERATION_ADMITTED_APPOINTMENT_IMMUTABLE'
      using errcode = '23514';
  end if;
  return new;
end $$;

create function public.bootstrap_booking_operation_v1(
  p_business_id uuid,
  p_operation_id uuid,
  p_attempt_key uuid,
  p_actor_id uuid,
  p_source text,
  p_booking_fingerprint text,
  p_payment_fingerprint text,
  p_customer_input_fingerprint text,
  p_customer_origin text,
  p_existing_customer_id uuid,
  p_inline_customer_id uuid,
  p_inline_name text,
  p_inline_email text,
  p_inline_phone text,
  p_location_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_requested_start timestamptz,
  p_requested_end timestamptz,
  p_requested_status text,
  p_duration_minutes integer,
  p_room_id uuid,
  p_resource_ids uuid[],
  p_package_id uuid,
  p_package_name text,
  p_subtotal_cents integer,
  p_tax_cents integer,
  p_deposit_required_cents integer,
  p_payment_mode text,
  p_appointment_notes text,
  p_payment_note text,
  p_receipt_requested boolean,
  p_payment_kind text,
  p_payment_amount_cents integer,
  p_currency text,
  p_method text,
  p_provider_route text
) returns table(
  outcome text,
  operation_id uuid,
  customer_id uuid,
  attempt_id uuid,
  execution_state text,
  conflict_event_id uuid
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  operation_row public.commerce_booking_operations%rowtype;
  attempt_row public.commerce_payment_attempts%rowtype;
  matched_customer_id uuid;
  resolved_customer_id uuid;
  advisory_key bigint;
  customer_canonical text;
  booking_canonical text;
  payment_canonical text;
  computed_customer_fingerprint text;
  computed_booking_fingerprint text;
  computed_payment_fingerprint text;
  derived_conflict_event_id uuid;
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  if p_business_id is null
     or p_operation_id is null
     or p_attempt_key is null
     or p_actor_id is null
     or p_operation_id = p_attempt_key
     or p_source not in ('booking_sheet', 'quick_appointment')
     or p_customer_origin not in ('existing', 'inline')
     or p_booking_fingerprint !~ '^v1:[0-9a-f]{64}$'
     or p_payment_fingerprint !~ '^v1:[0-9a-f]{64}$'
     or p_customer_input_fingerprint !~ '^v1:[0-9a-f]{64}$'
     or p_requested_start is null
     or p_requested_end is null
     or not isfinite(p_requested_start)
     or not isfinite(p_requested_end)
     or p_requested_end <= p_requested_start
     or p_duration_minutes is null
     or p_duration_minutes <= 0
     or p_resource_ids is null
     or array_position(p_resource_ids, null) is not null
     or (
       select count(*) <> count(distinct resource_id)
       from unnest(p_resource_ids) resource_id
     )
     or (p_package_id is null) <> (p_package_name is null)
     or p_subtotal_cents is null
     or p_subtotal_cents < 0
     or p_tax_cents is null
     or p_tax_cents < 0
     or p_deposit_required_cents is null
     or p_deposit_required_cents < 0
     or p_deposit_required_cents > p_subtotal_cents + p_tax_cents
     or p_payment_mode not in ('none', 'deposit', 'full', 'custom')
     or p_currency !~ '^[a-z]{3}$'
     or p_receipt_requested is null
     or (
       p_payment_mode = 'none'
       and row(
         p_payment_kind,
         p_payment_amount_cents,
         p_method,
         p_provider_route
       ) is distinct from row('none'::text, 0, null::text, null::text)
     )
     or (
       p_payment_mode <> 'none'
       and (
         p_payment_kind not in ('payment', 'deposit')
         or p_payment_amount_cents is null
         or p_payment_amount_cents <= 0
         or p_payment_amount_cents > p_subtotal_cents + p_tax_cents
         or p_method not in (
           'cash',
           'e_transfer',
           'debit_card',
           'credit_card',
           'other'
         )
         or p_provider_route is distinct from 'manual'
       )
     )
     or (
       p_payment_mode = 'deposit'
       and (
         p_deposit_required_cents <= 0
         or p_payment_amount_cents <> p_deposit_required_cents
         or p_payment_kind <> 'deposit'
       )
     )
     or (
       p_payment_mode = 'full'
       and (
         p_subtotal_cents + p_tax_cents <= 0
         or p_payment_amount_cents <> p_subtotal_cents + p_tax_cents
         or p_payment_kind <> 'payment'
       )
     ) then
    raise exception 'BOOKING_OPERATION_INVALID_REQUEST'
      using errcode = '22023';
  end if;

  if p_customer_origin = 'existing' then
    if p_existing_customer_id is null
       or p_inline_customer_id is not null
       or p_inline_name is not null
       or p_inline_email is not null
       or p_inline_phone is not null then
      raise exception 'BOOKING_OPERATION_INVALID_EXISTING_CUSTOMER'
        using errcode = '22023';
    end if;
    resolved_customer_id := p_existing_customer_id;
  else
    if p_existing_customer_id is not null
       or p_inline_customer_id is null
       or btrim(coalesce(p_inline_name, '')) = ''
       or lower(btrim(coalesce(p_inline_email, ''))) <> p_inline_email
       or position('@' in coalesce(p_inline_email, '')) <= 1
       or (
         p_inline_phone is not null
         and p_inline_phone !~ '^[0-9]+$'
       ) then
      raise exception 'BOOKING_OPERATION_INVALID_INLINE_CUSTOMER'
        using errcode = '22023';
    end if;
    resolved_customer_id := p_inline_customer_id;

    for advisory_key in
      select distinct lock_key
      from (
        select pg_catalog.hashtextextended(
          'booking-customer-email:' || p_business_id::text || ':' || p_inline_email,
          0
        ) as lock_key
        union all
        select pg_catalog.hashtextextended(
          'booking-customer-phone:' || p_business_id::text || ':' ||
            right(p_inline_phone, suffix_length),
          0
        )
        from generate_series(7, length(coalesce(p_inline_phone, '')))
          suffix_length
      ) identity_locks
      order by lock_key
    loop
      perform pg_catalog.pg_advisory_xact_lock(advisory_key);
    end loop;
  end if;

  select '[' || string_agg(element.value::text, ',' order by element.ordinality) || ']'
  into customer_canonical
  from jsonb_array_elements(jsonb_build_array(
    'chasum.booking-customer-input',
    1,
    p_customer_origin,
    resolved_customer_id,
    p_inline_name,
    p_inline_email,
    p_inline_phone
  )) with ordinality element(value, ordinality);

  select '[' || string_agg(
    case
      when element.ordinality = 13 then coalesce((
        select '[' || string_agg(
          to_jsonb(resource_value.id)::text,
          ','
          order by resource_value.ordinality
        ) || ']'
        from unnest(p_resource_ids) with ordinality
          resource_value(id, ordinality)
      ), '[]')
      else element.value::text
    end,
    ','
    order by element.ordinality
  ) || ']'
  into booking_canonical
  from jsonb_array_elements(jsonb_build_array(
    'chasum.booking-operation',
    1,
    p_business_id,
    resolved_customer_id,
    p_location_id,
    p_service_id,
    p_staff_id,
    pg_catalog.to_char(
      p_requested_start at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    pg_catalog.to_char(
      p_requested_end at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    p_requested_status,
    p_duration_minutes,
    p_room_id,
    to_jsonb(p_resource_ids),
    p_package_id,
    p_package_name,
    p_subtotal_cents,
    p_tax_cents,
    p_deposit_required_cents,
    p_payment_mode,
    p_appointment_notes,
    p_payment_note,
    p_receipt_requested
  )) with ordinality element(value, ordinality);

  select '[' || string_agg(element.value::text, ',' order by element.ordinality) || ']'
  into payment_canonical
  from jsonb_array_elements(jsonb_build_array(
    'chasum.payment-attempt',
    1,
    p_business_id,
    resolved_customer_id,
    'booking_operation',
    p_operation_id,
    p_payment_amount_cents,
    p_currency,
    p_method,
    p_payment_kind,
    p_provider_route,
    null::text
  )) with ordinality element(value, ordinality);

  computed_customer_fingerprint :=
    'v1:' || pg_catalog.encode(
      pg_catalog.sha256(pg_catalog.convert_to(customer_canonical, 'UTF8')),
      'hex'
    );
  computed_booking_fingerprint :=
    'v1:' || pg_catalog.encode(
      pg_catalog.sha256(pg_catalog.convert_to(booking_canonical, 'UTF8')),
      'hex'
    );
  computed_payment_fingerprint :=
    'v1:' || pg_catalog.encode(
      pg_catalog.sha256(pg_catalog.convert_to(payment_canonical, 'UTF8')),
      'hex'
    );
  if computed_customer_fingerprint <> p_customer_input_fingerprint
     or computed_booking_fingerprint <> p_booking_fingerprint
     or computed_payment_fingerprint <> p_payment_fingerprint then
    raise exception 'BOOKING_OPERATION_FINGERPRINT_MISMATCH'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'booking-operation:' || p_operation_id::text,
      0
    )
  );

  select *
  into operation_row
  from public.commerce_booking_operations stored_operation
  where stored_operation.id = p_operation_id
    and stored_operation.business_id = p_business_id;

  if found then
    if operation_row.actor_id <> p_actor_id then
      raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
        using errcode = '42501';
    end if;
    select *
    into attempt_row
    from public.commerce_payment_attempts stored_attempt
    where stored_attempt.business_id = p_business_id
      and stored_attempt.booking_operation_id = p_operation_id;
    if not found then
      raise exception 'BOOKING_OPERATION_ATTEMPT_MISSING'
        using errcode = '23514';
    end if;

    if row(
         operation_row.actor_id,
         operation_row.source,
         operation_row.booking_fingerprint,
         operation_row.customer_input_fingerprint,
         operation_row.customer_origin,
         operation_row.customer_id,
         operation_row.inline_name,
         operation_row.inline_email,
         operation_row.inline_phone_digits,
         operation_row.location_id,
         operation_row.service_id,
         operation_row.staff_id,
         operation_row.requested_start,
         operation_row.requested_end,
         operation_row.requested_status,
         operation_row.duration_minutes,
         operation_row.room_id,
         operation_row.resource_ids,
         operation_row.package_id,
         operation_row.package_name,
         operation_row.subtotal_cents,
         operation_row.tax_cents,
         operation_row.deposit_required_cents,
         operation_row.payment_mode,
         operation_row.appointment_notes,
         operation_row.payment_note,
         operation_row.receipt_requested,
         attempt_row.attempt_key,
         attempt_row.request_fingerprint,
         attempt_row.customer_id,
         attempt_row.payment_kind,
         attempt_row.amount_cents,
         attempt_row.currency,
         attempt_row.method,
         attempt_row.provider_route
       ) is not distinct from row(
         p_actor_id,
         p_source,
         p_booking_fingerprint,
         p_customer_input_fingerprint,
         p_customer_origin,
         resolved_customer_id,
         p_inline_name,
         p_inline_email,
         p_inline_phone,
         p_location_id,
         p_service_id,
         p_staff_id,
         p_requested_start,
         p_requested_end,
         p_requested_status,
         p_duration_minutes,
         p_room_id,
         p_resource_ids,
         p_package_id,
         p_package_name,
         p_subtotal_cents,
         p_tax_cents,
         p_deposit_required_cents,
         p_payment_mode,
         p_appointment_notes,
         p_payment_note,
         p_receipt_requested,
         p_attempt_key,
         p_payment_fingerprint,
         resolved_customer_id,
         p_payment_kind,
         p_payment_amount_cents,
         p_currency,
         p_method,
         p_provider_route
       ) then
      return query
        select
          'EXISTING'::text,
          operation_row.id,
          operation_row.customer_id,
          attempt_row.id,
          attempt_row.execution_state,
          null::uuid;
      return;
    end if;

    derived_conflict_event_id := pg_catalog.md5(
      'booking-operation-conflict:' || operation_row.id::text ||
      ':' || attempt_row.id::text
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
      attempt_row.business_id,
      attempt_row.id,
      'KEY_CONFLICT',
      'NOT_RECORDED',
      'CONFLICT',
      'KEY_CONFLICT'
    )
    on conflict (id) do nothing;

    return query
      select
        'KEY_CONFLICT'::text,
        operation_row.id,
        operation_row.customer_id,
        attempt_row.id,
        attempt_row.execution_state,
        derived_conflict_event_id;
    return;
  end if;

  if p_customer_origin = 'existing' then
    perform 1
    from public.customers customer_row
    where customer_row.id = resolved_customer_id
      and customer_row.business_id = p_business_id;
    if not found then
      raise exception 'BOOKING_OPERATION_CUSTOMER_BINDING_INVALID'
        using errcode = '23503';
    end if;
  else
    select customer_row.id
    into matched_customer_id
    from public.customers customer_row
    where customer_row.business_id = p_business_id
      and (
        lower(btrim(customer_row.email)) = p_inline_email
        or (
          p_inline_phone is not null
          and length(p_inline_phone) >= 7
          and length(
            pg_catalog.regexp_replace(
              coalesce(customer_row.phone, ''),
              '[^0-9]',
              '',
              'g'
            )
          ) >= 7
          and (
            pg_catalog.regexp_replace(
              coalesce(customer_row.phone, ''),
              '[^0-9]',
              '',
              'g'
            ) = p_inline_phone
            or pg_catalog.regexp_replace(
              coalesce(customer_row.phone, ''),
              '[^0-9]',
              '',
              'g'
            ) like '%' || p_inline_phone
            or p_inline_phone like '%' || pg_catalog.regexp_replace(
              coalesce(customer_row.phone, ''),
              '[^0-9]',
              '',
              'g'
            )
          )
        )
      )
    order by customer_row.id
    limit 1;
    if matched_customer_id is not null then
      return query
        select
          'CUSTOMER_MATCH_REQUIRES_SELECTION'::text,
          p_operation_id,
          null::uuid,
          null::uuid,
          null::text,
          null::uuid;
      return;
    end if;

    begin
      insert into public.customers(
        id,
        business_id,
        name,
        email,
        phone
      ) values (
        resolved_customer_id,
        p_business_id,
        p_inline_name,
        p_inline_email,
        p_inline_phone
      );
    exception when unique_violation then
      select customer_row.id
      into matched_customer_id
      from public.customers customer_row
      where customer_row.business_id = p_business_id
        and (
          lower(btrim(customer_row.email)) = p_inline_email
          or (
            p_inline_phone is not null
            and length(p_inline_phone) >= 7
            and length(
              pg_catalog.regexp_replace(
                coalesce(customer_row.phone, ''),
                '[^0-9]',
                '',
                'g'
              )
            ) >= 7
            and (
              pg_catalog.regexp_replace(
                coalesce(customer_row.phone, ''),
                '[^0-9]',
                '',
                'g'
              ) = p_inline_phone
              or pg_catalog.regexp_replace(
                coalesce(customer_row.phone, ''),
                '[^0-9]',
                '',
                'g'
              ) like '%' || p_inline_phone
              or p_inline_phone like '%' || pg_catalog.regexp_replace(
                coalesce(customer_row.phone, ''),
                '[^0-9]',
                '',
                'g'
              )
            )
          )
        )
      order by customer_row.id
      limit 1;
      if matched_customer_id is null then
        raise;
      end if;
      return query
        select
          'CUSTOMER_MATCH_REQUIRES_SELECTION'::text,
          p_operation_id,
          null::uuid,
          null::uuid,
          null::text,
          null::uuid;
      return;
    end;
  end if;

  insert into public.commerce_booking_operations(
    id,
    business_id,
    actor_id,
    source,
    booking_fingerprint,
    customer_input_fingerprint,
    customer_origin,
    customer_id,
    inline_name,
    inline_email,
    inline_phone_digits,
    location_id,
    service_id,
    staff_id,
    requested_start,
    requested_end,
    requested_status,
    duration_minutes,
    room_id,
    resource_ids,
    package_id,
    package_name,
    subtotal_cents,
    tax_cents,
    deposit_required_cents,
    payment_mode,
    appointment_notes,
    payment_note,
    receipt_requested
  ) values (
    p_operation_id,
    p_business_id,
    p_actor_id,
    p_source,
    computed_booking_fingerprint,
    computed_customer_fingerprint,
    p_customer_origin,
    resolved_customer_id,
    p_inline_name,
    p_inline_email,
    p_inline_phone,
    p_location_id,
    p_service_id,
    p_staff_id,
    p_requested_start,
    p_requested_end,
    p_requested_status,
    p_duration_minutes,
    p_room_id,
    p_resource_ids,
    p_package_id,
    p_package_name,
    p_subtotal_cents,
    p_tax_cents,
    p_deposit_required_cents,
    p_payment_mode,
    p_appointment_notes,
    p_payment_note,
    p_receipt_requested
  )
  returning * into operation_row;

  insert into public.commerce_payment_attempts(
    business_id,
    attempt_key,
    request_fingerprint,
    source,
    customer_id,
    booking_operation_id,
    actor_id,
    payment_kind,
    amount_cents,
    currency,
    method,
    provider_route,
    execution_state,
    recovery_disposition,
    resolved_at
  ) values (
    p_business_id,
    p_attempt_key,
    computed_payment_fingerprint,
    p_source,
    resolved_customer_id,
    p_operation_id,
    p_actor_id,
    p_payment_kind,
    p_payment_amount_cents,
    p_currency,
    p_method,
    p_provider_route,
    case when p_payment_mode = 'none' then 'SKIPPED' else 'REQUESTED' end,
    case when p_payment_mode = 'none' then 'DO_NOT_RETRY' else 'RECOVER' end,
    case when p_payment_mode = 'none' then pg_catalog.now() else null end
  )
  returning * into attempt_row;

  insert into public.commerce_payment_attempt_events(
    business_id,
    attempt_id,
    event_type,
    money_state
  ) values (
    p_business_id,
    attempt_row.id,
    'REQUESTED',
    'NOT_RECORDED'
  );

  if p_payment_mode = 'none' then
    insert into public.commerce_payment_attempt_events(
      business_id,
      attempt_id,
      event_type,
      money_state
    ) values (
      p_business_id,
      attempt_row.id,
      'SKIPPED',
      'NOT_RECORDED'
    );
  end if;

  return query
    select
      'ADMITTED'::text,
      operation_row.id,
      operation_row.customer_id,
      attempt_row.id,
      attempt_row.execution_state,
      null::uuid;
end $$;

create function public.persist_booking_operation_appointment_v1(
  p_business_id uuid,
  p_operation_id uuid,
  p_actor_id uuid,
  p_customer_id uuid,
  p_location_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_requested_start timestamptz,
  p_requested_end timestamptz,
  p_requested_status text,
  p_duration_minutes integer,
  p_appointment_notes text,
  p_room_id uuid,
  p_resource_ids uuid[],
  p_package_id uuid,
  p_package_name text,
  p_subtotal_cents integer,
  p_tax_cents integer,
  p_deposit_required_cents integer
) returns table(
  outcome text,
  operation_id uuid,
  appointment_id uuid
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  operation_row public.commerce_booking_operations%rowtype;
  attempt_row public.commerce_payment_attempts%rowtype;
  appointment_row public.appointments%rowtype;
  appointment_count integer;
  expected_notes text;
  created_appointment boolean := false;
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'booking-operation:' || p_operation_id::text,
      0
    )
  );

  select *
  into attempt_row
  from public.commerce_payment_attempts attempt_source
  where attempt_source.business_id = p_business_id
    and attempt_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_ATTEMPT_MISSING'
      using errcode = '23514';
  end if;

  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = p_operation_id
    and operation_source.business_id = p_business_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_NOT_FOUND'
      using errcode = '23503';
  end if;

  if operation_row.actor_id <> p_actor_id then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;
  if operation_row.lifecycle_state = 'CLOSED' then
    raise exception 'BOOKING_OPERATION_CLOSED'
      using errcode = '23514';
  end if;
  if row(
       operation_row.customer_id,
       operation_row.location_id,
       operation_row.service_id,
       operation_row.staff_id,
       operation_row.requested_start,
       operation_row.requested_end,
       operation_row.requested_status,
       operation_row.duration_minutes,
       operation_row.appointment_notes,
       operation_row.room_id,
       operation_row.resource_ids,
       operation_row.package_id,
       operation_row.package_name,
       operation_row.subtotal_cents,
       operation_row.tax_cents,
       operation_row.deposit_required_cents
     ) is distinct from row(
       p_customer_id,
       p_location_id,
       p_service_id,
       p_staff_id,
       p_requested_start,
       p_requested_end,
       p_requested_status,
       p_duration_minutes,
       p_appointment_notes,
       p_room_id,
       p_resource_ids,
       p_package_id,
       p_package_name,
       p_subtotal_cents,
       p_tax_cents,
       p_deposit_required_cents
     ) then
    raise exception 'BOOKING_OPERATION_APPOINTMENT_TUPLE_CHANGED'
      using errcode = '23514';
  end if;

  select count(*)::integer
  into appointment_count
  from public.appointments appointment_source
  where appointment_source.business_id = p_business_id
    and appointment_source.booking_operation_id = p_operation_id;
  if appointment_count > 1 then
    raise exception 'BOOKING_OPERATION_APPOINTMENT_COUNT_INVALID'
      using errcode = '23514';
  end if;
  if appointment_count = 1 then
    select *
    into appointment_row
    from public.appointments appointment_source
    where appointment_source.business_id = p_business_id
      and appointment_source.booking_operation_id = p_operation_id;
    return query
      select 'EXISTING'::text, p_operation_id, appointment_row.id;
    return;
  end if;

  perform 1
  from public.customers customer_row
  where customer_row.id = p_customer_id
    and customer_row.business_id = p_business_id;
  if not found then
    raise exception 'BOOKING_OPERATION_CUSTOMER_BINDING_INVALID'
      using errcode = '23503';
  end if;
  perform 1
  from public.locations location_row
  where location_row.id = p_location_id
    and location_row.business_id = p_business_id;
  if not found then
    raise exception 'BOOKING_OPERATION_LOCATION_BINDING_INVALID'
      using errcode = '23503';
  end if;
  perform 1
  from public.services service_row
  where service_row.id = p_service_id
    and service_row.business_id = p_business_id;
  if not found then
    raise exception 'BOOKING_OPERATION_SERVICE_BINDING_INVALID'
      using errcode = '23503';
  end if;
  if p_staff_id is not null then
    perform 1
    from public.staff staff_row
    where staff_row.id = p_staff_id
      and staff_row.business_id = p_business_id;
    if not found then
      raise exception 'BOOKING_OPERATION_STAFF_BINDING_INVALID'
        using errcode = '23503';
    end if;
  end if;
  if p_room_id is not null then
    perform 1
    from public.booking_resources resource_row
    where resource_row.id = p_room_id
      and resource_row.business_id = p_business_id
      and resource_row.resource_type = 'room'
      and resource_row.is_active;
    if not found then
      raise exception 'BOOKING_OPERATION_ROOM_BINDING_INVALID'
        using errcode = '23503';
    end if;
  end if;
  if exists (
    select 1
    from unnest(p_resource_ids) requested_resource(id)
    left join public.booking_resources resource_row
      on resource_row.id = requested_resource.id
     and resource_row.business_id = p_business_id
     and resource_row.is_active
    where resource_row.id is null
  ) then
    raise exception 'BOOKING_OPERATION_RESOURCE_BINDING_INVALID'
      using errcode = '23503';
  end if;

  expected_notes := case
    when p_package_id is not null then
      concat_ws(
        E'\n',
        nullif(p_appointment_notes, ''),
        'Package: ' || p_package_name || ' (' || p_package_id::text || ')'
      )
    else p_appointment_notes
  end;

  begin
    insert into public.appointments(
      business_id,
      location_id,
      service_id,
      staff_id,
      customer_id,
      start_time,
      end_time,
      status,
      notes,
      room_id,
      price_cents,
      tax_cents,
      deposit_cents,
      amount_paid_cents,
      payment_status,
      booking_operation_id
    ) values (
      p_business_id,
      p_location_id,
      p_service_id,
      p_staff_id,
      p_customer_id,
      p_requested_start,
      p_requested_end,
      p_requested_status::public.appointment_status,
      expected_notes,
      p_room_id,
      p_subtotal_cents,
      p_tax_cents,
      p_deposit_required_cents,
      0,
      case
        when p_deposit_required_cents > 0 then 'deposit_required'
        else 'unpaid'
      end,
      p_operation_id
    )
    returning * into appointment_row;
    created_appointment := true;

    insert into public.appointment_resources(appointment_id, resource_id)
    select appointment_row.id, requested_resource.id
    from unnest(p_resource_ids) requested_resource(id);
  exception when unique_violation then
    select *
    into appointment_row
    from public.appointments appointment_source
    where appointment_source.business_id = p_business_id
      and appointment_source.booking_operation_id = p_operation_id;
    if not found then
      raise;
    end if;
  end;

  return query
    select
      case when created_appointment then 'CREATED' else 'EXISTING' end::text,
      p_operation_id,
      appointment_row.id;
end $$;

create function public.bind_booking_operation_appointment_v1(
  p_business_id uuid,
  p_operation_id uuid,
  p_actor_id uuid,
  p_appointment_id uuid
) returns table(
  outcome text,
  operation_id uuid,
  appointment_id uuid,
  attempt_id uuid
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  operation_row public.commerce_booking_operations%rowtype;
  attempt_row public.commerce_payment_attempts%rowtype;
  appointment_row public.appointments%rowtype;
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'booking-operation:' || p_operation_id::text,
      0
    )
  );
  select *
  into attempt_row
  from public.commerce_payment_attempts attempt_source
  where attempt_source.business_id = p_business_id
    and attempt_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_ATTEMPT_MISSING'
      using errcode = '23514';
  end if;
  select *
  into appointment_row
  from public.appointments appointment_source
  where appointment_source.id = p_appointment_id
    and appointment_source.business_id = p_business_id
    and appointment_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_APPOINTMENT_BINDING_INVALID'
      using errcode = '23503';
  end if;
  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = p_operation_id
    and operation_source.business_id = p_business_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_NOT_FOUND'
      using errcode = '23503';
  end if;

  if operation_row.actor_id <> p_actor_id
     or row(
       operation_row.customer_id,
       appointment_row.customer_id,
       attempt_row.customer_id
     ) is distinct from row(
       appointment_row.customer_id,
       attempt_row.customer_id,
       operation_row.customer_id
     ) then
    raise exception 'BOOKING_OPERATION_BINDING_IDENTITY_MISMATCH'
      using errcode = '23514';
  end if;
  if operation_row.lifecycle_state = 'CLOSED' then
    return query
      select 'CLOSED'::text, operation_row.id, appointment_row.id, attempt_row.id;
    return;
  end if;
  if attempt_row.appointment_id is not null
     and attempt_row.appointment_id <> appointment_row.id then
    raise exception 'BOOKING_OPERATION_ATTEMPT_ALREADY_BOUND'
      using errcode = '23514';
  end if;

  if attempt_row.appointment_id is null then
    update public.commerce_payment_attempts as attempt_target
    set appointment_id = appointment_row.id,
        updated_at = pg_catalog.now()
    where attempt_target.id = attempt_row.id
      and attempt_target.business_id = p_business_id
      and attempt_target.appointment_id is null;
  end if;
  if operation_row.lifecycle_state = 'OPEN' then
    update public.commerce_booking_operations as operation_target
    set lifecycle_state = 'APPOINTMENT_CREATED',
        updated_at = pg_catalog.now()
    where operation_target.id = operation_row.id
      and operation_target.business_id = p_business_id
      and operation_target.lifecycle_state = 'OPEN';
  end if;

  return query
    select
      case
        when attempt_row.appointment_id is null then 'BOUND'
        else 'EXISTING'
      end::text,
      operation_row.id,
      appointment_row.id,
      attempt_row.id;
end $$;

create function public.close_booking_operation_v1(
  p_business_id uuid,
  p_operation_id uuid,
  p_actor_id uuid,
  p_reason text,
  p_expected_current_customer_id uuid,
  p_replacement_customer_id uuid,
  p_cancel boolean
) returns table(
  outcome text,
  operation_id uuid,
  appointment_id uuid,
  attempt_id uuid,
  recorded boolean
)
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  operation_row public.commerce_booking_operations%rowtype;
  attempt_row public.commerce_payment_attempts%rowtype;
  appointment_row public.appointments%rowtype;
  ledger_count integer;
  v_failure_class text;
  v_failure_code text;
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;
  if p_reason not in (
       'PRICING_CHANGED',
       'SLOT_CONFLICT',
       'CUSTOMER_REASSIGNED',
       'APPOINTMENT_CANCELLED',
       'OPERATOR_ABANDONED'
     )
     or p_cancel is null
     or (
       p_reason = 'CUSTOMER_REASSIGNED'
       and (
         p_expected_current_customer_id is null
         or p_replacement_customer_id is null
         or p_cancel
       )
     )
     or (
       p_reason <> 'CUSTOMER_REASSIGNED'
       and (
         p_expected_current_customer_id is not null
         or p_replacement_customer_id is not null
       )
     )
     or (p_cancel <> (p_reason = 'APPOINTMENT_CANCELLED')) then
    raise exception 'BOOKING_OPERATION_INVALID_CLOSE_REQUEST'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'booking-operation:' || p_operation_id::text,
      0
    )
  );
  select *
  into attempt_row
  from public.commerce_payment_attempts attempt_source
  where attempt_source.business_id = p_business_id
    and attempt_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_ATTEMPT_MISSING'
      using errcode = '23514';
  end if;
  select *
  into appointment_row
  from public.appointments appointment_source
  where appointment_source.business_id = p_business_id
    and appointment_source.booking_operation_id = p_operation_id
  for update;
  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = p_operation_id
    and operation_source.business_id = p_business_id
  for update;
  if not found then
    raise exception 'BOOKING_OPERATION_NOT_FOUND'
      using errcode = '23503';
  end if;
  if operation_row.actor_id <> p_actor_id then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  select count(*)::integer
  into ledger_count
  from public.commerce_transactions transaction_row
  where appointment_row.id is not null
    and transaction_row.business_id = p_business_id
    and transaction_row.appointment_id = appointment_row.id;

  if p_reason in ('PRICING_CHANGED', 'SLOT_CONFLICT', 'OPERATOR_ABANDONED')
     and (appointment_row.id is not null or ledger_count <> 0) then
    return query
      select
        'RECOVERY_REQUIRED'::text,
        operation_row.id,
        appointment_row.id,
        attempt_row.id,
        ledger_count > 0;
    return;
  end if;
  if p_reason = 'CUSTOMER_REASSIGNED' then
    if appointment_row.id is null then
      raise exception 'BOOKING_OPERATION_APPOINTMENT_REQUIRED'
        using errcode = '23514';
    end if;
    if ledger_count <> 0 then
      raise exception 'APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN'
        using errcode = '23514';
    end if;
    perform 1
    from public.customers customer_row
    where customer_row.id = p_replacement_customer_id
      and customer_row.business_id = p_business_id;
    if not found then
      raise exception 'BOOKING_OPERATION_REPLACEMENT_CUSTOMER_INVALID'
        using errcode = '23503';
    end if;
  end if;
  if p_cancel and appointment_row.id is null then
    raise exception 'BOOKING_OPERATION_APPOINTMENT_REQUIRED'
      using errcode = '23514';
  end if;

  update public.commerce_booking_operations
  set lifecycle_state = 'CLOSED',
      close_reason = p_reason,
      replacement_customer_id = case
        when p_reason = 'CUSTOMER_REASSIGNED' then p_replacement_customer_id
        else null
      end,
      closed_at = coalesce(closed_at, pg_catalog.now()),
      updated_at = pg_catalog.now()
  where id = operation_row.id
    and business_id = p_business_id;

  if p_reason = 'CUSTOMER_REASSIGNED' then
    update public.appointments
    set customer_id = p_replacement_customer_id
    where id = appointment_row.id
      and business_id = p_business_id
      and customer_id = p_expected_current_customer_id;
    if not found then
      raise exception 'BOOKING_OPERATION_EXPECTED_CUSTOMER_CHANGED'
        using errcode = '40001';
    end if;
  elsif p_cancel then
    update public.appointments
    set status = 'cancelled'
    where id = appointment_row.id
      and business_id = p_business_id
      and status <> 'cancelled';
  end if;

  if attempt_row.execution_state = 'REQUESTED' and ledger_count = 0 then
    if p_reason in ('PRICING_CHANGED', 'OPERATOR_ABANDONED') then
      v_failure_class := 'VALIDATION';
      v_failure_code := 'INVALID_REQUEST';
    else
      v_failure_class := 'CONFLICT';
      v_failure_code := 'KEY_CONFLICT';
    end if;
    update public.commerce_payment_attempts
    set execution_state = 'FAILED',
        recovery_disposition = 'DO_NOT_RETRY',
        failure_class = v_failure_class,
        failure_code = v_failure_code,
        updated_at = pg_catalog.now(),
        resolved_at = pg_catalog.now()
    where id = attempt_row.id
      and business_id = p_business_id
      and execution_state = 'REQUESTED';
    insert into public.commerce_payment_attempt_events(
      business_id,
      attempt_id,
      event_type,
      money_state,
      failure_class,
      failure_code
    ) values (
      p_business_id,
      attempt_row.id,
      'FAILED',
      'NOT_RECORDED',
      v_failure_class,
      v_failure_code
    );
  end if;

  return query
    select
      case
        when operation_row.lifecycle_state = 'CLOSED' then 'EXISTING'
        else 'CLOSED'
      end::text,
      operation_row.id,
      appointment_row.id,
      attempt_row.id,
      ledger_count > 0;
end $$;

create function public.commit_booking_operation_manual_payment_v1(
  p_business_id uuid,
  p_operation_id uuid,
  p_actor_id uuid,
  p_attempt_id uuid
) returns table(
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
  operation_row public.commerce_booking_operations%rowtype;
  attempt_row public.commerce_payment_attempts%rowtype;
  appointment_row public.appointments%rowtype;
  ledger_row public.commerce_transactions%rowtype;
  ledger_count integer;
  requested_event_count integer;
  accepted_event_count integer;
  obligation_count integer;
  terminal_event_count integer;
  lifecycle_event_count integer;
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'booking-operation:' || p_operation_id::text,
      0
    )
  );
  select *
  into attempt_row
  from public.commerce_payment_attempts attempt_source
  where attempt_source.id = p_attempt_id
    and attempt_source.business_id = p_business_id
    and attempt_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    return query
      select 'UNKNOWN'::text, p_attempt_id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;
  select *
  into appointment_row
  from public.appointments appointment_source
  where appointment_source.id = attempt_row.appointment_id
    and appointment_source.business_id = p_business_id
    and appointment_source.booking_operation_id = p_operation_id
  for update;
  if not found then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;
  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = p_operation_id
    and operation_source.business_id = p_business_id
  for update;
  if not found then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  if operation_row.actor_id <> p_actor_id
     or row(
       operation_row.business_id,
       operation_row.customer_id,
       appointment_row.business_id,
       appointment_row.customer_id,
       attempt_row.business_id,
       attempt_row.customer_id,
       attempt_row.appointment_id
     ) is distinct from row(
       p_business_id,
       attempt_row.customer_id,
       p_business_id,
       operation_row.customer_id,
       p_business_id,
       appointment_row.customer_id,
       appointment_row.id
     ) then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  select count(*)::integer
  into ledger_count
  from public.commerce_transactions transaction_row
  where transaction_row.business_id = p_business_id
    and transaction_row.payment_attempt_id = attempt_row.id;
  select count(*)::integer
  into requested_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.business_id = p_business_id
    and event_row.attempt_id = attempt_row.id
    and event_row.event_type = 'REQUESTED'
    and event_row.money_state = 'NOT_RECORDED';
  select count(*)::integer
  into accepted_event_count
  from public.commerce_payment_attempt_events event_row
  where event_row.business_id = p_business_id
    and event_row.attempt_id = attempt_row.id
    and event_row.event_type = 'ACCEPTED'
    and event_row.money_state = 'RECORDED';
  select count(*)::integer
  into obligation_count
  from public.commerce_payment_reconciliation obligation_row
  where obligation_row.business_id = p_business_id
    and obligation_row.attempt_id = attempt_row.id;

  -- Terminal truth precedes mutable lifecycle/tender eligibility, but never
  -- precedes identity locks or proof of zero ledger and coherent terminal events.
  if attempt_row.execution_state in ('FAILED', 'SKIPPED') then
    select
      count(*) filter (
        where event_row.event_type = attempt_row.execution_state
          and event_row.money_state = 'NOT_RECORDED'
          and event_row.failure_class is not distinct from attempt_row.failure_class
          and event_row.failure_code is not distinct from attempt_row.failure_code
      )::integer,
      count(*)::integer
    into terminal_event_count, lifecycle_event_count
    from public.commerce_payment_attempt_events event_row
    where event_row.business_id = p_business_id
      and event_row.attempt_id = attempt_row.id
      and event_row.event_type in ('REQUESTED', 'ACCEPTED', 'FAILED', 'SKIPPED');

    if ledger_count <> 0
       or requested_event_count <> 1
       or accepted_event_count <> 0
       or obligation_count <> 0
       or terminal_event_count <> 1
       or lifecycle_event_count <> 2
       or attempt_row.recovery_disposition is distinct from 'DO_NOT_RETRY'
       or attempt_row.resolved_at is null
       or (
         attempt_row.execution_state = 'FAILED'
         and not (
           row(attempt_row.failure_class, attempt_row.failure_code)
             is not distinct from row('CONFLICT'::text, 'KEY_CONFLICT'::text)
           or row(attempt_row.failure_class, attempt_row.failure_code)
             is not distinct from row('VALIDATION'::text, 'INVALID_REQUEST'::text)
         )
       )
       or (
         attempt_row.execution_state = 'FAILED'
         and not coalesce(
           attempt_row.payment_kind in ('payment', 'deposit')
           and attempt_row.amount_cents > 0
           and attempt_row.method in ('cash', 'e_transfer', 'debit_card', 'credit_card', 'other')
           and attempt_row.provider_route = 'manual'
           and attempt_row.gift_card_id is null,
           false
         )
       )
       or (
         attempt_row.execution_state = 'SKIPPED'
         and row(
           attempt_row.payment_kind, attempt_row.amount_cents,
           attempt_row.method, attempt_row.provider_route, attempt_row.gift_card_id,
           attempt_row.failure_class, attempt_row.failure_code
         ) is distinct from row(
           'none'::text, 0, null::text, null::text, null::uuid, null::text, null::text
         )
       ) then
      return query
        select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
      return;
    end if;
    return query
      select
        'NOT_COMMITTABLE'::text,
        attempt_row.id,
        null::uuid,
        false,
        'UNKNOWN'::text;
    return;
  end if;

  if attempt_row.payment_kind not in ('payment', 'deposit')
     or attempt_row.amount_cents <= 0
     or attempt_row.method not in (
       'cash',
       'e_transfer',
       'debit_card',
       'credit_card',
       'other'
     )
     or attempt_row.provider_route is distinct from 'manual'
     or attempt_row.gift_card_id is not null then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  if attempt_row.execution_state = 'ACCEPTED' then
    if ledger_count = 1 then
      select *
      into ledger_row
      from public.commerce_transactions transaction_row
      where transaction_row.business_id = p_business_id
        and transaction_row.payment_attempt_id = attempt_row.id;
    end if;
    if ledger_count = 1
       and requested_event_count = 1
       and accepted_event_count = 1
       and obligation_count = 4
       and row(
         ledger_row.customer_id,
         ledger_row.appointment_id,
         ledger_row.kind,
         ledger_row.status,
         ledger_row.method,
         ledger_row.amount_cents,
         ledger_row.currency,
         ledger_row.provider,
         ledger_row.created_by
       ) is not distinct from row(
         attempt_row.customer_id,
         appointment_row.id,
         attempt_row.payment_kind,
         'succeeded'::text,
         attempt_row.method,
         attempt_row.amount_cents,
         attempt_row.currency,
         'manual'::text,
         attempt_row.actor_id
       ) then
      return query
        select 'REPLAY'::text, attempt_row.id, ledger_row.id, true, 'PENDING'::text;
      return;
    end if;
    return query
      select
        'UNKNOWN'::text,
        attempt_row.id,
        case when ledger_count = 1 then ledger_row.id else null::uuid end,
        ledger_count = 1,
        'UNKNOWN'::text;
    return;
  end if;

  -- Replay above remains truthful after cancellation; only new money needs an active booking.
  if operation_row.lifecycle_state <> 'APPOINTMENT_CREATED'
     or appointment_row.status::text = 'cancelled' then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;
  if attempt_row.execution_state <> 'REQUESTED'
     or attempt_row.recovery_disposition <> 'RECOVER'
     or attempt_row.failure_class is not null
     or attempt_row.failure_code is not null
     or ledger_count <> 0
     or requested_event_count <> 1
     or accepted_event_count <> 0
     or obligation_count <> 0 then
    return query
      select 'UNKNOWN'::text, attempt_row.id, null::uuid, false, 'UNKNOWN'::text;
    return;
  end if;

  update public.commerce_payment_attempts
  set execution_state = 'ACCEPTED',
      updated_at = pg_catalog.now(),
      resolved_at = pg_catalog.now()
  where id = attempt_row.id
    and business_id = p_business_id
    and execution_state = 'REQUESTED';
  if not found then
    raise exception 'BOOKING_OPERATION_COMMIT_STATE_RACE'
      using errcode = '40001';
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
    p_business_id,
    attempt_row.customer_id,
    appointment_row.id,
    null,
    attempt_row.payment_kind,
    'succeeded',
    attempt_row.method,
    attempt_row.amount_cents,
    attempt_row.currency,
    'manual',
    'manual-booking-operation:' || attempt_row.id::text,
    null,
    'Manual booking-operation payment',
    '{}'::jsonb,
    attempt_row.actor_id,
    attempt_row.id
  )
  returning * into ledger_row;

  insert into public.commerce_payment_attempt_events(
    business_id,
    attempt_id,
    event_type,
    money_state
  ) values (
    p_business_id,
    attempt_row.id,
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
    (p_business_id, attempt_row.id, 'appointment_cache', 'PENDING', null),
    (p_business_id, attempt_row.id, 'invoice_settlement', 'PENDING', null),
    (p_business_id, attempt_row.id, 'customer_payment_events', 'PENDING', null),
    (p_business_id, attempt_row.id, 'receipt', 'PENDING', null);

  return query
    select 'RECORDED'::text, attempt_row.id, ledger_row.id, true, 'PENDING'::text;
end $$;

create function public.read_booking_operations_v1(
  p_business_id uuid,
  p_actor_id uuid,
  p_mode text,
  p_operation_id uuid,
  p_cursor_attention_rank integer,
  p_cursor_created_at timestamptz,
  p_cursor_id uuid,
  p_limit integer
) returns table(
  snapshot_at timestamptz,
  payload jsonb
)
language plpgsql
stable
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
  if current_user <> 'service_role' then
    raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.businesses business_row
    where business_row.id = p_business_id
      and (
        business_row.owner_id = p_actor_id
        or exists (
          select 1
          from public.business_members member_row
          where member_row.business_id = p_business_id
            and member_row.user_id = p_actor_id
            and member_row.role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED'
      using errcode = '42501';
  end if;
  if p_mode not in ('one', 'history')
     or p_limit is null
     or p_limit < 1
     or p_limit > 50
     or (
       p_mode = 'one'
       and (
         p_operation_id is null
         or p_cursor_attention_rank is not null
         or p_cursor_created_at is not null
         or p_cursor_id is not null
       )
     )
     or (
       p_mode = 'history'
       and (
         p_operation_id is not null
         or (
           (p_cursor_attention_rank is null)::integer
           + (p_cursor_created_at is null)::integer
           + (p_cursor_id is null)::integer
         ) not in (0, 3)
         or (
           p_cursor_attention_rank is not null
           and p_cursor_attention_rank not in (0, 1)
         )
       )
     ) then
    raise exception 'BOOKING_OPERATION_INVALID_READ_REQUEST'
      using errcode = '22023';
  end if;

  if p_mode = 'one' then
    return query
    with operation_row as (
      select operation_source.*
      from public.commerce_booking_operations operation_source
      where operation_source.id = p_operation_id
        and operation_source.business_id = p_business_id
        and operation_source.actor_id = p_actor_id
    ),
    appointment_rows as (
      select appointment_source.*
      from public.appointments appointment_source
      join operation_row
        on operation_row.id = appointment_source.booking_operation_id
       and operation_row.business_id = appointment_source.business_id
    ),
    attempt_rows as (
      select attempt_source.*
      from public.commerce_payment_attempts attempt_source
      join operation_row
        on operation_row.id = attempt_source.booking_operation_id
       and operation_row.business_id = attempt_source.business_id
    ),
    event_rows as (
      select event_source.*
      from public.commerce_payment_attempt_events event_source
      join attempt_rows
        on attempt_rows.id = event_source.attempt_id
       and attempt_rows.business_id = event_source.business_id
    ),
    ledger_rows as (
      select transaction_source.*
      from public.commerce_transactions transaction_source
      join attempt_rows
        on attempt_rows.id = transaction_source.payment_attempt_id
       and attempt_rows.business_id = transaction_source.business_id
    ),
    obligation_rows as (
      select obligation_source.*
      from public.commerce_payment_reconciliation obligation_source
      join attempt_rows
        on attempt_rows.id = obligation_source.attempt_id
       and attempt_rows.business_id = obligation_source.business_id
    )
    select
      pg_catalog.now(),
      case
        when not exists (select 1 from operation_row) then
          jsonb_build_object('found', false)
        else jsonb_build_object(
          'found', true,
          'operation', (
            select jsonb_build_object(
              'id', operation_value.id,
              'actor_id', operation_value.actor_id,
              'source', operation_value.source,
              'lifecycle_state', operation_value.lifecycle_state,
              'close_reason', operation_value.close_reason,
              'payment_mode', operation_value.payment_mode,
              'created_at', operation_value.created_at,
              'updated_at', operation_value.updated_at
            )
            from operation_row operation_value
          ),
          'appointment', (
            select jsonb_build_object(
              'id', appointment_value.id,
              'booking_operation_id', appointment_value.booking_operation_id,
              'status', appointment_value.status
            )
            from appointment_rows appointment_value
            limit 1
          ),
          'appointment_count', (select count(*) from appointment_rows),
          'attempt', (
            select jsonb_build_object(
              'id', attempt_value.id,
              'booking_operation_id', attempt_value.booking_operation_id,
              'appointment_id', attempt_value.appointment_id,
              'execution_state', attempt_value.execution_state,
              'recovery_disposition', attempt_value.recovery_disposition,
              'payment_kind', attempt_value.payment_kind,
              'amount_cents', attempt_value.amount_cents,
              'currency', attempt_value.currency,
              'method', attempt_value.method,
              'provider_route', attempt_value.provider_route,
              'failure_class', attempt_value.failure_class,
              'failure_code', attempt_value.failure_code,
              'created_at', attempt_value.created_at,
              'resolved_at', attempt_value.resolved_at
            )
            from attempt_rows attempt_value
            limit 1
          ),
          'attempt_count', (select count(*) from attempt_rows),
          'events', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', event_value.id,
                'sequence', event_value.event_sequence,
                'type', event_value.event_type,
                'money_state', event_value.money_state,
                'failure_class', event_value.failure_class,
                'failure_code', event_value.failure_code,
                'occurred_at', event_value.occurred_at
              )
              order by event_value.event_sequence
            )
            from event_rows event_value
          ), '[]'::jsonb),
          'ledger', (
            select jsonb_build_object(
              'id', ledger_value.id,
              'customer_id', ledger_value.customer_id,
              'appointment_id', ledger_value.appointment_id,
              'amount_cents', ledger_value.amount_cents,
              'currency', ledger_value.currency,
              'method', ledger_value.method,
              'kind', ledger_value.kind,
              'status', ledger_value.status,
              'provider', ledger_value.provider
            )
            from ledger_rows ledger_value
            limit 1
          ),
          'ledger_count', (select count(*) from ledger_rows),
          'obligations', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'kind', obligation_value.projection_kind,
                'state', obligation_value.state,
                'failure_code', obligation_value.failure_code,
                'updated_at', obligation_value.updated_at,
                'completed_at', obligation_value.completed_at
              )
              order by obligation_value.projection_kind
            )
            from obligation_rows obligation_value
          ), '[]'::jsonb)
        )
      end
    ;
    return;
  end if;

  return query
  with canonical as (
    select
      operation_row.*,
      appointment_row.id as appointment_id,
      attempt_row.id as attempt_id,
      attempt_row.appointment_id as attempt_appointment_id,
      attempt_row.execution_state,
      attempt_row.amount_cents,
      attempt_row.currency,
      attempt_row.method,
      ledger_summary.transaction_id,
      ledger_summary.ledger_count,
      obligation_summary.obligation_count,
      obligation_summary.incomplete_count,
      case
        when operation_row.lifecycle_state = 'OPEN'
          or (
            attempt_row.execution_state = 'REQUESTED'
            and ledger_summary.ledger_count = 0
          )
        then 0
        else 1
      end as attention_rank
    from public.commerce_booking_operations operation_row
    join public.commerce_payment_attempts attempt_row
      on attempt_row.business_id = operation_row.business_id
     and attempt_row.booking_operation_id = operation_row.id
    left join public.appointments appointment_row
      on appointment_row.business_id = operation_row.business_id
     and appointment_row.booking_operation_id = operation_row.id
    left join lateral (
      select
        count(*)::integer as ledger_count,
        min(transaction_row.id::text collate "C")::uuid as transaction_id
      from public.commerce_transactions transaction_row
      where transaction_row.business_id = attempt_row.business_id
        and transaction_row.payment_attempt_id = attempt_row.id
    ) ledger_summary on true
    left join lateral (
      select
        count(*)::integer as obligation_count,
        count(*) filter (
          where obligation_row.state not in ('COMPLETE', 'NOT_REQUIRED')
        )::integer as incomplete_count
      from public.commerce_payment_reconciliation obligation_row
      where obligation_row.business_id = attempt_row.business_id
        and obligation_row.attempt_id = attempt_row.id
    ) obligation_summary on true
    where operation_row.business_id = p_business_id
      and operation_row.actor_id = p_actor_id
  ),
  selected as (
    select *
    from canonical
    where p_cursor_attention_rank is null
       or attention_rank > p_cursor_attention_rank
       or (
         attention_rank = p_cursor_attention_rank
         and row(created_at, id) <
             row(p_cursor_created_at, p_cursor_id)
       )
    order by attention_rank, created_at desc, id desc
    limit p_limit + 1
  ),
  visible as (
    select *
    from selected
    order by attention_rank, created_at desc, id desc
    limit p_limit
  ),
  last_visible as (
    select attention_rank, created_at, id
    from visible
    order by attention_rank desc, created_at, id
    limit 1
  )
  select
    pg_catalog.now(),
    jsonb_build_object(
      'items',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'operation_id', visible_row.id,
            'appointment_id', visible_row.appointment_id,
            'attempt_id', visible_row.attempt_id,
            'source', visible_row.source,
            'created_at', visible_row.created_at,
            'updated_at', visible_row.updated_at,
            'lifecycle_state', visible_row.lifecycle_state,
            'close_reason', visible_row.close_reason,
            'payment_mode', visible_row.payment_mode,
            'execution_state', visible_row.execution_state,
            'amount_cents', visible_row.amount_cents,
            'currency', visible_row.currency,
            'method', visible_row.method,
            'transaction_id', visible_row.transaction_id,
            'ledger_count', visible_row.ledger_count,
            'operator_state', case
              when visible_row.execution_state in ('SKIPPED', 'FAILED')
                and visible_row.ledger_count = 0
                then 'NOT_RECORDED'
              when visible_row.execution_state = 'REQUESTED'
                and visible_row.ledger_count = 0
                then 'PAYMENT_RECOVERY_REQUIRED'
              when visible_row.execution_state = 'ACCEPTED'
                and visible_row.ledger_count = 1
                and visible_row.obligation_count = 4
                and visible_row.incomplete_count = 0
                then 'RECORDED'
              when visible_row.execution_state = 'ACCEPTED'
                and visible_row.ledger_count = 1
                and visible_row.obligation_count = 4
                then 'RECORDED_BUT_NOT_FULLY_SYNCHRONIZED'
              else 'UNKNOWN'
            end,
            'synchronization', case
              when visible_row.execution_state in ('SKIPPED', 'FAILED')
                and visible_row.ledger_count = 0
                then 'NOT_REQUIRED'
              when visible_row.execution_state = 'ACCEPTED'
                and visible_row.ledger_count = 1
                and visible_row.obligation_count = 4
                and visible_row.incomplete_count = 0
                then 'COMPLETE'
              when visible_row.execution_state in ('REQUESTED', 'ACCEPTED')
                then 'PENDING'
              else 'UNKNOWN'
            end,
            'recovery_action', case
              when visible_row.execution_state = 'REQUESTED'
                and visible_row.appointment_id is null
                then 'CREATE_APPOINTMENT'
              when visible_row.execution_state = 'REQUESTED'
                and visible_row.appointment_id is not null
                and visible_row.attempt_appointment_id is null
                then 'BIND_APPOINTMENT'
              when visible_row.execution_state = 'REQUESTED'
                and visible_row.appointment_id is not null
                and visible_row.attempt_appointment_id = visible_row.appointment_id
                then 'COMMIT_PAYMENT'
              when visible_row.execution_state = 'REQUESTED'
                then 'REVIEW'
              when visible_row.execution_state = 'ACCEPTED'
                and visible_row.incomplete_count > 0
                then 'REVIEW'
              else 'NONE'
            end
          )
          order by
            visible_row.attention_rank,
            visible_row.created_at desc,
            visible_row.id desc
        )
        from visible visible_row
      ), '[]'::jsonb),
      'next_cursor', case
        when (select count(*) from selected) > p_limit then (
          select jsonb_build_object(
            'attention_rank', last_row.attention_rank,
            'created_at', last_row.created_at,
            'id', last_row.id
          )
          from last_visible last_row
        )
        else null
      end
    )
  ;
end $$;

create trigger commerce_booking_operations_guard
  before update or delete on public.commerce_booking_operations
  for each row execute function public.guard_commerce_booking_operation_v1();

create trigger appointments_booking_operation_guard
  before insert or update of
    booking_operation_id,
    business_id,
    customer_id,
    location_id,
    service_id,
    staff_id,
    start_time,
    end_time,
    status,
    notes,
    room_id,
    price_cents,
    tax_cents,
    deposit_cents
  on public.appointments
  for each row
  execute function public.guard_appointment_booking_operation_link_v1();

alter table public.commerce_booking_operations enable row level security;

revoke all on table public.commerce_booking_operations
  from public, anon, authenticated, service_role;
grant select, insert on table public.commerce_booking_operations to service_role;
grant update (
  lifecycle_state,
  close_reason,
  replacement_customer_id,
  closed_at,
  updated_at
) on table public.commerce_booking_operations to service_role;

revoke all on function public.guard_commerce_booking_operation_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.guard_appointment_booking_operation_link_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.bootstrap_booking_operation_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, text, uuid, uuid,
  text, text, text, uuid, uuid, uuid, timestamptz, timestamptz, text,
  integer, uuid, uuid[], uuid, text, integer, integer, integer, text,
  text, text, boolean, text, integer, text, text, text
) from public, anon, authenticated;
revoke all on function public.persist_booking_operation_appointment_v1(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, timestamptz, timestamptz,
  text, integer, text, uuid, uuid[], uuid, text, integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.bind_booking_operation_appointment_v1(
  uuid, uuid, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.close_booking_operation_v1(
  uuid, uuid, uuid, text, uuid, uuid, boolean
) from public, anon, authenticated;
revoke all on function public.commit_booking_operation_manual_payment_v1(
  uuid, uuid, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.read_booking_operations_v1(
  uuid, uuid, text, uuid, integer, timestamptz, uuid, integer
) from public, anon, authenticated;

grant execute on function public.guard_commerce_booking_operation_v1()
  to service_role;
grant execute on function public.guard_appointment_booking_operation_link_v1()
  to service_role;
grant execute on function public.bootstrap_booking_operation_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, text, uuid, uuid,
  text, text, text, uuid, uuid, uuid, timestamptz, timestamptz, text,
  integer, uuid, uuid[], uuid, text, integer, integer, integer, text,
  text, text, boolean, text, integer, text, text, text
) to service_role;
grant execute on function public.persist_booking_operation_appointment_v1(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, timestamptz, timestamptz,
  text, integer, text, uuid, uuid[], uuid, text, integer, integer, integer
) to service_role;
grant execute on function public.bind_booking_operation_appointment_v1(
  uuid, uuid, uuid, uuid
) to service_role;
grant execute on function public.close_booking_operation_v1(
  uuid, uuid, uuid, text, uuid, uuid, boolean
) to service_role;
grant execute on function public.commit_booking_operation_manual_payment_v1(
  uuid, uuid, uuid, uuid
) to service_role;
grant execute on function public.read_booking_operations_v1(
  uuid, uuid, text, uuid, integer, timestamptz, uuid, integer
) to service_role;

commit;
