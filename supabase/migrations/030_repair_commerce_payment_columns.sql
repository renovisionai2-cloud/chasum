-- Repair: complete Commerce Platform pieces that may be missing after a partial 028 apply.
-- Safe to run multiple times (IF NOT EXISTS / exception guards).
-- Does NOT recreate existing commerce ledger tables.

-- Customers
alter table customers
  add column if not exists store_credit_cents integer not null default 0;

alter table customers
  add column if not exists payment_provider_customer_id text;

comment on column customers.payment_provider_customer_id is
  'External provider customer id (e.g. Stripe cus_…). Never a card number.';

-- Appointments payment lifecycle
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

-- Invoice number sequence per business
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
