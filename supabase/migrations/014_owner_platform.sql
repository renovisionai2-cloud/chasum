-- Chasum Owner Platform Phase 1
-- Platform admin allowlist + billing metadata for owner metrics

-- ---------------------------------------------------------------------------
-- Platform administrators (super admins)
-- ---------------------------------------------------------------------------

create table if not exists platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'super_admin'
    check (role in ('super_admin')),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create unique index if not exists platform_admins_email_idx
  on platform_admins (lower(email));

alter table platform_admins enable row level security;

-- No direct client policies: access is via service role after app-level gate.
drop policy if exists "No public access to platform admins" on platform_admins;

-- ---------------------------------------------------------------------------
-- Subscription plan list pricing (cents) for MRR estimates
-- ---------------------------------------------------------------------------

alter table subscription_plans
  add column if not exists monthly_price_cents integer;

update subscription_plans set monthly_price_cents = 0 where plan_key = 'starter' and monthly_price_cents is null;
update subscription_plans set monthly_price_cents = 7900 where plan_key = 'professional' and monthly_price_cents is null;
update subscription_plans set monthly_price_cents = 14900 where plan_key = 'business' and monthly_price_cents is null;
update subscription_plans set monthly_price_cents = null where plan_key = 'enterprise';

-- ---------------------------------------------------------------------------
-- Business subscription lifecycle fields
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'paused'));

alter table businesses
  add column if not exists trial_starts_at timestamptz;

alter table businesses
  add column if not exists trial_ends_at timestamptz;

alter table businesses
  add column if not exists stripe_customer_id text;

alter table businesses
  add column if not exists stripe_subscription_id text;

create index if not exists businesses_subscription_status_idx
  on businesses (subscription_status);

create index if not exists businesses_trial_ends_at_idx
  on businesses (trial_ends_at)
  where trial_ends_at is not null;

-- ---------------------------------------------------------------------------
-- Platform alerts (operator-facing)
-- ---------------------------------------------------------------------------

create table if not exists platform_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  title text not null,
  body text,
  source text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists platform_alerts_created_idx
  on platform_alerts (created_at desc);

alter table platform_alerts enable row level security;

-- Seed an informational alert so empty states are intentional after first deploy
insert into platform_alerts (severity, title, body, source)
select
  'info',
  'Owner Platform online',
  'Phase 1 Owner Dashboard is ready. Configure PLATFORM_OWNER_EMAILS and seed platform_admins for production access.',
  'owner_platform'
where not exists (
  select 1 from platform_alerts where title = 'Owner Platform online'
);
