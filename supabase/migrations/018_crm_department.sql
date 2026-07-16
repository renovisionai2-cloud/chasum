-- Chasum CRM Department (Phase 1)
-- Extends customers into a full relationship hub. Keeps booking FKs intact.

-- ---------------------------------------------------------------------------
-- CRM columns on customers
-- ---------------------------------------------------------------------------

alter table customers
  add column if not exists first_name text;

alter table customers
  add column if not exists last_name text;

alter table customers
  add column if not exists preferred_name text;

alter table customers
  add column if not exists photo_url text;

alter table customers
  add column if not exists date_of_birth date;

alter table customers
  add column if not exists gender text;

alter table customers
  add column if not exists emergency_contact_name text;

alter table customers
  add column if not exists emergency_contact_phone text;

alter table customers
  add column if not exists emergency_contact_relationship text;

alter table customers
  add column if not exists preferred_communication_method text
    check (
      preferred_communication_method is null
      or preferred_communication_method in ('call', 'sms', 'email', 'any')
    );

alter table customers
  add column if not exists crm_status text not null default 'active'
    check (crm_status in ('lead', 'active', 'inactive', 'vip', 'archived'));

alter table customers
  add column if not exists assigned_staff_id uuid references staff (id) on delete set null;

alter table customers
  add column if not exists preferred_location_id uuid references locations (id) on delete set null;

alter table customers
  add column if not exists is_vip boolean not null default false;

alter table customers
  add column if not exists anniversary_date date;

alter table customers
  add column if not exists loyalty_status text not null default 'standard'
    check (loyalty_status in ('standard', 'silver', 'gold', 'platinum', 'member'));

alter table customers
  add column if not exists last_activity_at timestamptz;

create index if not exists customers_crm_status_idx
  on customers (business_id, crm_status);

create index if not exists customers_assigned_staff_idx
  on customers (assigned_staff_id)
  where assigned_staff_id is not null;

create index if not exists customers_last_activity_idx
  on customers (business_id, last_activity_at desc nulls last);

create index if not exists customers_tags_gin_idx
  on customers using gin (tags);

-- Backfill first/last from single name where missing
update customers
set
  first_name = coalesce(
    first_name,
    nullif(split_part(trim(name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(trim(substring(trim(name) from length(split_part(trim(name), ' ', 1)) + 1)), '')
  )
where first_name is null and name is not null and length(trim(name)) > 0;

update customers
set last_activity_at = coalesce(last_activity_at, updated_at, created_at)
where last_activity_at is null;

update customers
set is_vip = true, crm_status = 'vip'
where is_vip = false
  and (
    'VIP' = any (tags)
    or 'vip' = any (tags)
  );

-- ---------------------------------------------------------------------------
-- Structured CRM notes (pinned / private)
-- ---------------------------------------------------------------------------

create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  body text not null,
  is_pinned boolean not null default false,
  is_private boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_notes_customer_idx
  on customer_notes (customer_id, is_pinned desc, created_at desc);

alter table customer_notes enable row level security;

drop policy if exists "Owners manage customer notes" on customer_notes;
create policy "Owners manage customer notes"
  on customer_notes for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists customer_notes_updated_at on customer_notes;
create trigger customer_notes_updated_at
  before update on customer_notes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Payment / invoice events (timeline + future payments)
-- ---------------------------------------------------------------------------

create table if not exists customer_payment_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  appointment_id uuid references appointments (id) on delete set null,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'recorded'
    check (status in (
      'recorded',
      'pending',
      'paid',
      'refunded',
      'failed',
      'void'
    )),
  method text,
  description text,
  provider text,
  provider_reference text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_payment_events_customer_idx
  on customer_payment_events (customer_id, occurred_at desc);

alter table customer_payment_events enable row level security;

drop policy if exists "Owners manage customer payment events" on customer_payment_events;
create policy "Owners manage customer payment events"
  on customer_payment_events for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Document signing readiness
-- ---------------------------------------------------------------------------

alter table customer_documents
  add column if not exists category text not null default 'general'
    check (category in (
      'general',
      'waiver',
      'consent',
      'intake',
      'id',
      'insurance',
      'signed',
      'other'
    ));

alter table customer_documents
  add column if not exists signature_status text not null default 'none'
    check (signature_status in ('none', 'pending', 'signed', 'expired'));

alter table customer_documents
  add column if not exists signed_at timestamptz;
