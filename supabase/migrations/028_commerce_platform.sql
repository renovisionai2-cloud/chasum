-- Milestone 4 / Phase 5.7 — Commerce Platform (client payments & billing)
-- Provider-agnostic ledger. Never store card numbers — only provider references.

-- ---------------------------------------------------------------------------
-- Customers: store credit + provider customer ref (PCI-safe)
-- ---------------------------------------------------------------------------

alter table customers
  add column if not exists store_credit_cents integer not null default 0;

alter table customers
  add column if not exists payment_provider_customer_id text;

comment on column customers.payment_provider_customer_id is
  'External provider customer id (e.g. Stripe cus_…). Never a card number.';

-- ---------------------------------------------------------------------------
-- Appointments: payment lifecycle
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Invoice number sequence per business
-- ---------------------------------------------------------------------------

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
-- Commerce invoices (customer-facing)
-- ---------------------------------------------------------------------------

create table if not exists commerce_invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  appointment_id uuid references appointments (id) on delete set null,
  invoice_number text not null,
  status text not null default 'open'
    check (status in (
      'draft',
      'open',
      'partial',
      'paid',
      'void',
      'refunded',
      'overdue'
    )),
  issue_date date not null default (timezone('utc', now())::date),
  due_date date,
  currency text not null default 'usd',
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  amount_refunded_cents integer not null default 0,
  balance_cents integer not null default 0,
  notes text,
  business_snapshot jsonb not null default '{}'::jsonb,
  customer_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  voided_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create index if not exists commerce_invoices_business_status_idx
  on commerce_invoices (business_id, status, issue_date desc);

create index if not exists commerce_invoices_customer_idx
  on commerce_invoices (customer_id, issue_date desc);

create index if not exists commerce_invoices_appointment_idx
  on commerce_invoices (appointment_id)
  where appointment_id is not null;

alter table commerce_invoices enable row level security;

drop policy if exists "Owners manage commerce invoices" on commerce_invoices;
create policy "Owners manage commerce invoices"
  on commerce_invoices for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists commerce_invoices_updated_at on commerce_invoices;
create trigger commerce_invoices_updated_at
  before update on commerce_invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Invoice line items
-- ---------------------------------------------------------------------------

create table if not exists commerce_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  invoice_id uuid not null references commerce_invoices (id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_amount_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  service_id uuid references services (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_invoice_lines_invoice_idx
  on commerce_invoice_lines (invoice_id, sort_order);

alter table commerce_invoice_lines enable row level security;

drop policy if exists "Owners manage commerce invoice lines" on commerce_invoice_lines;
create policy "Owners manage commerce invoice lines"
  on commerce_invoice_lines for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Canonical commerce transactions (ledger)
-- ---------------------------------------------------------------------------

create table if not exists commerce_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  appointment_id uuid references appointments (id) on delete set null,
  invoice_id uuid references commerce_invoices (id) on delete set null,
  kind text not null default 'payment'
    check (kind in (
      'payment',
      'deposit',
      'refund',
      'void',
      'adjustment',
      'store_credit',
      'gift_card'
    )),
  status text not null default 'succeeded'
    check (status in (
      'pending',
      'requires_action',
      'succeeded',
      'failed',
      'canceled',
      'refunded',
      'partially_refunded'
    )),
  method text not null
    check (method in (
      'credit_card',
      'debit_card',
      'cash',
      'e_transfer',
      'gift_card',
      'store_credit',
      'other'
    )),
  amount_cents integer not null,
  currency text not null default 'usd',
  provider text not null default 'manual'
    check (provider in ('manual', 'stripe', 'other')),
  provider_reference text,
  provider_payment_intent_id text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commerce_transactions_business_idx
  on commerce_transactions (business_id, occurred_at desc);

create index if not exists commerce_transactions_customer_idx
  on commerce_transactions (customer_id, occurred_at desc);

create index if not exists commerce_transactions_appointment_idx
  on commerce_transactions (appointment_id)
  where appointment_id is not null;

create index if not exists commerce_transactions_invoice_idx
  on commerce_transactions (invoice_id)
  where invoice_id is not null;

alter table commerce_transactions enable row level security;

drop policy if exists "Owners manage commerce transactions" on commerce_transactions;
create policy "Owners manage commerce transactions"
  on commerce_transactions for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists commerce_transactions_updated_at on commerce_transactions;
create trigger commerce_transactions_updated_at
  before update on commerce_transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Receipts (printable / downloadable; email-ready)
-- ---------------------------------------------------------------------------

create table if not exists commerce_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  transaction_id uuid not null references commerce_transactions (id) on delete cascade,
  invoice_id uuid references commerce_invoices (id) on delete set null,
  receipt_number text not null,
  issued_at timestamptz not null default now(),
  amount_cents integer not null,
  currency text not null default 'usd',
  method text not null,
  body_text text not null,
  email_status text not null default 'not_sent'
    check (email_status in ('not_sent', 'queued', 'sent', 'failed')),
  emailed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, receipt_number)
);

create index if not exists commerce_receipts_customer_idx
  on commerce_receipts (customer_id, issued_at desc);

alter table commerce_receipts enable row level security;

drop policy if exists "Owners manage commerce receipts" on commerce_receipts;
create policy "Owners manage commerce receipts"
  on commerce_receipts for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Refunds (full / partial) with approval + audit trail
-- ---------------------------------------------------------------------------

create table if not exists commerce_refunds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  transaction_id uuid not null references commerce_transactions (id) on delete restrict,
  invoice_id uuid references commerce_invoices (id) on delete set null,
  appointment_id uuid references appointments (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  reason text not null,
  refund_type text not null default 'full'
    check (refund_type in ('full', 'partial')),
  approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  provider text not null default 'manual',
  provider_reference text,
  status text not null default 'succeeded'
    check (status in ('pending', 'succeeded', 'failed', 'canceled')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commerce_refunds_business_idx
  on commerce_refunds (business_id, created_at desc);

create index if not exists commerce_refunds_transaction_idx
  on commerce_refunds (transaction_id);

alter table commerce_refunds enable row level security;

drop policy if exists "Owners manage commerce refunds" on commerce_refunds;
create policy "Owners manage commerce refunds"
  on commerce_refunds for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists commerce_refunds_updated_at on commerce_refunds;
create trigger commerce_refunds_updated_at
  before update on commerce_refunds
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Financial audit log (immutable append-only intent)
-- ---------------------------------------------------------------------------

create table if not exists commerce_audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_audit_log_business_idx
  on commerce_audit_log (business_id, created_at desc);

alter table commerce_audit_log enable row level security;

drop policy if exists "Owners read commerce audit log" on commerce_audit_log;
create policy "Owners read commerce audit log"
  on commerce_audit_log for select
  using (is_business_owner(business_id));

drop policy if exists "Owners insert commerce audit log" on commerce_audit_log;
create policy "Owners insert commerce audit log"
  on commerce_audit_log for insert
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Align legacy customer_payment_events with commerce methods (soft widen)
-- ---------------------------------------------------------------------------

comment on table customer_payment_events is
  'Legacy CRM payment timeline. Prefer commerce_transactions for new writes; mirrored for compatibility.';
