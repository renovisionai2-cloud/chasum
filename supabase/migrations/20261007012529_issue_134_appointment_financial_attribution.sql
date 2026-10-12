-- Issue #134 appointment/customer financial attribution:
-- PREPARED ONLY / HOSTED UNAPPLIED.
-- Additive DDL and a legacy integrity guard only. No data rewrite or backfill.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  column_contract record;
begin
  if current_setting('lock_timeout')::interval <> interval '5 seconds'
     or current_setting('statement_timeout')::interval <> interval '30 seconds' then
    raise exception 'ISSUE_134_ATTRIBUTION_TIMEOUT_ASSERTION_FAILED'
      using errcode = '55000';
  end if;

  for column_contract in
    select *
    from (values
      ('appointments', 'id', 'uuid', true),
      ('appointments', 'business_id', 'uuid', true),
      ('appointments', 'customer_id', 'uuid', true),
      ('commerce_transactions', 'appointment_id', 'uuid', false),
      ('commerce_transactions', 'business_id', 'uuid', true),
      ('commerce_transactions', 'customer_id', 'uuid', true),
      ('commerce_transactions', 'payment_attempt_id', 'uuid', false)
    ) expected(table_name, column_name, data_type, is_not_null)
  loop
    if not exists (
      select 1
      from pg_catalog.pg_attribute attribute_row
      join pg_catalog.pg_class relation
        on relation.oid = attribute_row.attrelid
      join pg_catalog.pg_namespace namespace
        on namespace.oid = relation.relnamespace
      join pg_catalog.pg_type type_row
        on type_row.oid = attribute_row.atttypid
      where namespace.nspname = 'public'
        and relation.relname = column_contract.table_name
        and relation.relkind in ('r', 'p')
        and attribute_row.attname = column_contract.column_name
        and not attribute_row.attisdropped
        and type_row.typname = column_contract.data_type
        and attribute_row.attnotnull = column_contract.is_not_null
    ) then
      raise exception 'ISSUE_134_ATTRIBUTION_SCHEMA_MISMATCH: %.%',
        column_contract.table_name,
        column_contract.column_name
        using errcode = '55000';
    end if;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.commerce_transactions'::regclass
      and constraint_row.contype = 'f'
      and constraint_row.confrelid = 'public.appointments'::regclass
      and constraint_row.conkey = array[
        (
          select attribute_row.attnum
          from pg_catalog.pg_attribute attribute_row
          where attribute_row.attrelid = 'public.commerce_transactions'::regclass
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
      and constraint_row.confupdtype = 'a'
      and constraint_row.confdeltype = 'n'
      and constraint_row.confmatchtype = 's'
      and not constraint_row.condeferrable
      and constraint_row.convalidated
  ) then
    raise exception 'ISSUE_134_ATTRIBUTION_OLD_APPOINTMENT_FK_MISMATCH'
      using errcode = '55000';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.commerce_transactions'::regclass
      and trigger_row.tgname = 'commerce_transactions_attempt_guard'
      and not trigger_row.tgisinternal
      and trigger_row.tgenabled = 'O'
  ) then
    raise exception 'ISSUE_134_ATTRIBUTION_ACCEPTED_GUARD_MISMATCH'
      using errcode = '55000';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conname in (
      'appointments_id_business_customer_financial_key',
      'commerce_transactions_appt_business_customer_financial_fk'
    )
  ) or to_regprocedure(
    'public.guard_legacy_commerce_transaction_appointment_attribution_v1()'
  ) is not null or exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname =
      'commerce_transactions_legacy_appointment_attribution_guard'
  ) then
    raise exception 'ISSUE_134_ATTRIBUTION_OBJECT_COLLISION'
      using errcode = '42710';
  end if;

  if exists (
    select 1
    from public.commerce_transactions transaction_row
    join public.appointments appointment_row
      on appointment_row.id = transaction_row.appointment_id
    where transaction_row.appointment_id is not null
      and row(transaction_row.business_id, transaction_row.customer_id)
        is distinct from
        row(appointment_row.business_id, appointment_row.customer_id)
  ) then
    raise exception 'ISSUE_134_ATTRIBUTION_EXISTING_TUPLE_MISMATCH'
      using errcode = '23514';
  end if;
end $$;

alter table public.appointments
  add constraint appointments_id_business_customer_financial_key
  unique (id, business_id, customer_id);

alter table public.commerce_transactions
  add constraint commerce_transactions_appt_business_customer_financial_fk
  foreign key (appointment_id, business_id, customer_id)
  references public.appointments(id, business_id, customer_id)
  match simple
  on update restrict
  on delete no action
  not deferrable;

create function public.guard_legacy_commerce_transaction_appointment_attribution_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
  if old.payment_attempt_id is not null or old.appointment_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'LEGACY_APPOINTMENT_LEDGER_DELETE_FORBIDDEN'
      using errcode = '23514';
  end if;

  if row(new.business_id, new.customer_id, new.appointment_id)
     is distinct from
     row(old.business_id, old.customer_id, old.appointment_id) then
    raise exception 'LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE'
      using errcode = '23514';
  end if;

  return new;
end $$;

create trigger commerce_transactions_legacy_appointment_attribution_guard
  before update or delete on public.commerce_transactions
  for each row
  execute function public.guard_legacy_commerce_transaction_appointment_attribution_v1();

revoke all on function
  public.guard_legacy_commerce_transaction_appointment_attribution_v1()
  from public, anon, authenticated, service_role;

commit;
