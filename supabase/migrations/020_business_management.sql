-- Chasum Business Management Department
-- Additive commerce + ops config. Multi-tenant via business_id. No breaking FK changes.

-- ---------------------------------------------------------------------------
-- Business profile extensions
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists industry text;

alter table businesses
  add column if not exists tax_number text;

alter table businesses
  add column if not exists currency text not null default 'usd';

-- ---------------------------------------------------------------------------
-- Service categories (sortable catalog)
-- ---------------------------------------------------------------------------

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  description text,
  icon text,
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists service_categories_business_idx
  on service_categories (business_id, sort_order);

alter table service_categories enable row level security;

drop policy if exists "Owners manage service categories" on service_categories;
create policy "Owners manage service categories"
  on service_categories for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists service_categories_updated_at on service_categories;
create trigger service_categories_updated_at
  before update on service_categories
  for each row execute function set_updated_at();

alter table services
  add column if not exists category_id uuid references service_categories (id) on delete set null;

alter table services
  add column if not exists image_url text;

alter table services
  add column if not exists tax_rate_bps integer not null default 0;

alter table services
  add column if not exists deposit_cents integer not null default 0;

alter table services
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- Seed categories from distinct service.category strings
insert into service_categories (business_id, name, sort_order, color)
select distinct s.business_id, s.category, 0, '#64748b'
from services s
where s.category is not null and length(trim(s.category)) > 0
on conflict (business_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  description text,
  billing_interval text not null default 'monthly'
    check (billing_interval in ('weekly', 'monthly', 'yearly')),
  price_cents integer not null default 0,
  visit_limit integer,
  is_unlimited boolean not null default false,
  is_active boolean not null default true,
  stripe_price_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_business_idx on memberships (business_id);

alter table memberships enable row level security;

drop policy if exists "Owners manage memberships" on memberships;
create policy "Owners manage memberships"
  on memberships for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists memberships_updated_at on memberships;
create trigger memberships_updated_at
  before update on memberships
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Packages (prepaid / bundles)
-- ---------------------------------------------------------------------------

create table if not exists service_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  total_visits integer not null default 1,
  expires_after_days integer,
  transferable boolean not null default false,
  is_active boolean not null default true,
  service_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_packages_business_idx on service_packages (business_id);

alter table service_packages enable row level security;

drop policy if exists "Owners manage service packages" on service_packages;
create policy "Owners manage service packages"
  on service_packages for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists service_packages_updated_at on service_packages;
create trigger service_packages_updated_at
  before update on service_packages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Gift cards
-- ---------------------------------------------------------------------------

create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  code text not null,
  initial_balance_cents integer not null,
  balance_cents integer not null,
  is_digital boolean not null default true,
  expires_at timestamptz,
  purchaser_customer_id uuid references customers (id) on delete set null,
  redeemed_by_customer_id uuid references customers (id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'redeemed', 'expired', 'void')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code)
);

create index if not exists gift_cards_business_idx on gift_cards (business_id, status);

alter table gift_cards enable row level security;

drop policy if exists "Owners manage gift cards" on gift_cards;
create policy "Owners manage gift cards"
  on gift_cards for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists gift_cards_updated_at on gift_cards;
create trigger gift_cards_updated_at
  before update on gift_cards
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Tax rates
-- ---------------------------------------------------------------------------

create table if not exists tax_rates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  rate_bps integer not null default 0,
  country text,
  region text,
  inclusive boolean not null default false,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tax_rates_business_idx on tax_rates (business_id);

alter table tax_rates enable row level security;

drop policy if exists "Owners manage tax rates" on tax_rates;
create policy "Owners manage tax rates"
  on tax_rates for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists tax_rates_updated_at on tax_rates;
create trigger tax_rates_updated_at
  before update on tax_rates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Discounts / coupons / promo codes
-- ---------------------------------------------------------------------------

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  code text not null,
  name text not null,
  discount_type text not null default 'percentage'
    check (discount_type in ('percentage', 'fixed', 'automatic')),
  percent_bps integer,
  amount_cents integer,
  automatic boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer,
  redemption_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code)
);

create index if not exists discount_codes_business_idx on discount_codes (business_id);

alter table discount_codes enable row level security;

drop policy if exists "Owners manage discount codes" on discount_codes;
create policy "Owners manage discount codes"
  on discount_codes for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists discount_codes_updated_at on discount_codes;
create trigger discount_codes_updated_at
  before update on discount_codes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Custom form templates (consent / intake / waiver) — e-sign ready
-- ---------------------------------------------------------------------------

create table if not exists custom_form_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  form_type text not null default 'intake'
    check (form_type in (
      'consent',
      'medical',
      'intake',
      'waiver',
      'questionnaire',
      'other'
    )),
  description text,
  schema jsonb not null default '{"fields":[]}'::jsonb,
  requires_signature boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_form_templates_business_idx
  on custom_form_templates (business_id);

alter table custom_form_templates enable row level security;

drop policy if exists "Owners manage custom form templates" on custom_form_templates;
create policy "Owners manage custom form templates"
  on custom_form_templates for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists custom_form_templates_updated_at on custom_form_templates;
create trigger custom_form_templates_updated_at
  before update on custom_form_templates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Business automation rules (booking / cancel / reminder / waitlist)
-- ---------------------------------------------------------------------------

create table if not exists business_automation_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  rule_type text not null
    check (rule_type in (
      'booking',
      'cancellation',
      'reminder',
      'follow_up',
      'auto_assign',
      'auto_confirm',
      'auto_waitlist'
    )),
  name text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_automation_rules_business_idx
  on business_automation_rules (business_id, rule_type);

alter table business_automation_rules enable row level security;

drop policy if exists "Owners manage business automation rules" on business_automation_rules;
create policy "Owners manage business automation rules"
  on business_automation_rules for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists business_automation_rules_updated_at on business_automation_rules;
create trigger business_automation_rules_updated_at
  before update on business_automation_rules
  for each row execute function set_updated_at();
