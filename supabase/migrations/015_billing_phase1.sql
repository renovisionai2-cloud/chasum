-- Chasum Billing Phase 1 — subscription foundation (no live Stripe required)

-- ---------------------------------------------------------------------------
-- Plan catalog pricing (monthly + yearly list prices)
-- ---------------------------------------------------------------------------

alter table subscription_plans
  add column if not exists yearly_price_cents integer;

alter table subscription_plans
  add column if not exists sort_order integer not null default 0;

update subscription_plans
set
  name = 'Free',
  description = 'Everything you need to experience Chasum.',
  monthly_price_cents = 0,
  yearly_price_cents = 0,
  sort_order = 1
where plan_key = 'starter';

update subscription_plans
set
  name = 'Professional',
  description = 'Powerful scheduling, AI assistance, and automation for professionals.',
  monthly_price_cents = coalesce(monthly_price_cents, 7900),
  yearly_price_cents = coalesce(yearly_price_cents, 79000),
  sort_order = 2
where plan_key = 'professional';

update subscription_plans
set
  name = 'Business',
  description = 'Multi-location management, advanced automation, and collaboration for growing teams.',
  monthly_price_cents = coalesce(monthly_price_cents, 14900),
  yearly_price_cents = coalesce(yearly_price_cents, 149000),
  sort_order = 3
where plan_key = 'business';

update subscription_plans
set
  name = 'Enterprise',
  description = 'Custom onboarding, advanced security, dedicated support, and tailored solutions.',
  monthly_price_cents = null,
  yearly_price_cents = null,
  sort_order = 4
where plan_key = 'enterprise';

insert into subscription_plans (plan_key, name, max_locations, description, is_active, monthly_price_cents, yearly_price_cents, sort_order)
values
  ('starter', 'Free', 1, 'Everything you need to experience Chasum.', true, 0, 0, 1),
  ('professional', 'Professional', 3, 'Powerful scheduling, AI assistance, and automation for professionals.', true, 7900, 79000, 2),
  ('business', 'Business', 10, 'Multi-location management, advanced automation, and collaboration for growing teams.', true, 14900, 149000, 3),
  ('enterprise', 'Enterprise', null, 'Custom onboarding, advanced security, dedicated support, and tailored solutions.', true, null, null, 4)
on conflict (plan_key) do nothing;

-- ---------------------------------------------------------------------------
-- Business billing period fields
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly'));

alter table businesses
  add column if not exists current_period_start timestamptz;

alter table businesses
  add column if not exists current_period_end timestamptz;

alter table businesses
  add column if not exists cancel_at_period_end boolean not null default false;

alter table businesses
  add column if not exists canceled_at timestamptz;

-- ---------------------------------------------------------------------------
-- Subscription events (upgrade / downgrade / cancel / trial) — churn + history
-- ---------------------------------------------------------------------------

create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created',
      'upgraded',
      'downgraded',
      'canceled',
      'reactivated',
      'trial_started',
      'trial_ended',
      'interval_changed',
      'invoice_paid',
      'invoice_voided'
    )),
  from_plan_key text references subscription_plans (plan_key),
  to_plan_key text references subscription_plans (plan_key),
  from_status text,
  to_status text,
  amount_cents integer,
  currency text not null default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_business_idx
  on subscription_events (business_id, created_at desc);

create index if not exists subscription_events_type_idx
  on subscription_events (event_type, created_at desc);

alter table subscription_events enable row level security;

drop policy if exists "Owners read own subscription events" on subscription_events;
create policy "Owners read own subscription events"
  on subscription_events for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

drop policy if exists "Owners insert own subscription events" on subscription_events;
create policy "Owners insert own subscription events"
  on subscription_events for insert
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Invoices (mock / Stripe-ready)
-- ---------------------------------------------------------------------------

create table if not exists billing_invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  invoice_number text not null,
  status text not null default 'paid'
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  plan_key text references subscription_plans (plan_key),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly')),
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  description text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  pdf_url text,
  stripe_invoice_id text,
  stripe_hosted_invoice_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_invoices_number_idx
  on billing_invoices (invoice_number);

create index if not exists billing_invoices_business_idx
  on billing_invoices (business_id, created_at desc);

alter table billing_invoices enable row level security;

drop policy if exists "Owners manage own invoices" on billing_invoices;
create policy "Owners manage own invoices"
  on billing_invoices for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
