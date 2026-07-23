-- Operation GVM – Commerce Engine Finalization
-- Ensures payment columns, PostgREST grants/reload, and arrival workflow statuses.
-- Idempotent. Safe to re-run. Does not drop ledger data.

-- ---------------------------------------------------------------------------
-- Payment columns (complete partial 028 applies)
-- ---------------------------------------------------------------------------

alter table customers
  add column if not exists store_credit_cents integer not null default 0;

alter table customers
  add column if not exists payment_provider_customer_id text;

alter table appointments
  add column if not exists payment_status text not null default 'unpaid';

alter table appointments
  add column if not exists amount_paid_cents integer not null default 0;

alter table appointments
  add column if not exists amount_refunded_cents integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_payment_status_check'
  ) then
    alter table appointments
      add constraint appointments_payment_status_check
      check (payment_status in (
        'unpaid',
        'deposit_required',
        'deposit_paid',
        'partially_paid',
        'fully_paid',
        'refunded',
        'voided'
      ));
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists appointments_payment_status_idx
  on appointments (business_id, payment_status);

create table if not exists commerce_invoice_sequences (
  business_id uuid primary key references businesses (id) on delete cascade,
  next_number integer not null default 1,
  prefix text not null default 'INV',
  updated_at timestamptz not null default now()
);

alter table commerce_invoice_sequences enable row level security;

drop policy if exists "Owners manage commerce invoice sequences" on commerce_invoice_sequences;
create policy "Owners manage commerce invoice sequences"
  on commerce_invoice_sequences for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- PostgREST visibility (fixes "Could not find table … in the schema cache")
-- Requires commerce tables from 028_commerce_platform.sql
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.commerce_transactions') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_transactions to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_invoices') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_invoices to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_invoice_lines') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_invoice_lines to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_receipts') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_receipts to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_refunds') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_refunds to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_audit_log') is not null then
    execute 'grant select, insert on table public.commerce_audit_log to authenticated, service_role';
  end if;
  if to_regclass('public.commerce_invoice_sequences') is not null then
    execute 'grant select, insert, update, delete on table public.commerce_invoice_sequences to authenticated, service_role';
  end if;
end $$;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Arrival workflow statuses
-- ---------------------------------------------------------------------------

alter type appointment_status add value if not exists 'arrived';
alter type appointment_status add value if not exists 'waiting';
alter type appointment_status add value if not exists 'in_progress';

alter table businesses
  add column if not exists appointment_status_workflow jsonb;

comment on column businesses.appointment_status_workflow is
  'Optional JSON array of enabled appointment status keys. Null uses Chasum defaults.';

create index if not exists gift_cards_purchaser_idx
  on gift_cards (business_id, purchaser_customer_id)
  where purchaser_customer_id is not null;

create index if not exists gift_cards_redeemer_idx
  on gift_cards (business_id, redeemed_by_customer_id)
  where redeemed_by_customer_id is not null;
