-- Track 2 — additive Commercial Foundation
--
-- MANUAL SCOPED SQL EXECUTION ONLY.
-- DO NOT run `supabase db push`, `supabase migration up`, or any CLI that
-- applies pending files in filename order.
-- Migrations 034, 035, and 036 remain unapplied. A CLI apply would attempt
-- those first against the shared Preview/Production Supabase project.
-- This file is UNAPPLIED until Product Owner explicitly approves Track 2
-- database execution. Preview and Production share Supabase.
--
-- Scope: plan_offers, businesses.offer_id, usage_events, constraints, triggers.
-- Out of scope: offer seeds, backfill, billing_profiles, past_due_since,
-- subscription_events RLS, billing_invoices RLS, Private Alpha overlay,
-- Stripe Billing.

-- ---------------------------------------------------------------------------
-- plan_offers — versioned immutable commercial SKU
-- ---------------------------------------------------------------------------

create table if not exists public.plan_offers (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null references public.subscription_plans (plan_key),
  version integer not null check (version >= 1),
  currency text not null check (currency ~ '^[a-z]{3}$' and currency = lower(currency)),
  monthly_cents integer check (monthly_cents is null or monthly_cents >= 0),
  annual_cents integer check (annual_cents is null or annual_cents >= 0),
  max_active_staff integer check (max_active_staff is null or max_active_staff >= 0),
  max_locations integer check (max_locations is null or max_locations >= 0),
  sms_included boolean not null,
  remove_branding_allowed boolean not null,
  api_access_allowed boolean not null,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  effective_from timestamptz not null,
  is_default_for_new boolean not null default false,
  is_active_for_new_sales boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (plan_key, currency, version),
  constraint plan_offers_default_requires_locked
    check (not is_default_for_new or is_locked),
  constraint plan_offers_default_requires_active
    check (not is_default_for_new or is_active_for_new_sales),
  constraint plan_offers_active_requires_locked
    check (not is_active_for_new_sales or is_locked)
);

comment on table public.plan_offers is
  'Versioned commercial offer. Locked payload is immutable. Do not seed in Track 2.';

comment on column public.plan_offers.annual_cents is
  'Genuine once-per-year charge in minor units. Not a discounted monthly equivalent.';

create unique index if not exists plan_offers_one_default_per_plan_currency
  on public.plan_offers (plan_key, currency)
  where is_default_for_new;

create index if not exists plan_offers_plan_currency_idx
  on public.plan_offers (plan_key, currency, version);

create or replace function public.plan_offers_lifecycle_guard()
returns trigger
language plpgsql
as $$
begin
  if new.is_default_for_new and not new.is_locked then
    raise exception 'draft offers cannot be default for new sales';
  end if;
  if new.is_default_for_new and not new.is_active_for_new_sales then
    raise exception 'default offers must also be active for new sales';
  end if;
  if new.is_active_for_new_sales and not new.is_locked then
    raise exception 'draft offers cannot be active for new sales';
  end if;

  if tg_op = 'UPDATE' and old.is_locked then
    if new.is_locked is distinct from true then
      raise exception 'locked offers cannot be unlocked';
    end if;
    if new.plan_key is distinct from old.plan_key
      or new.version is distinct from old.version
      or new.currency is distinct from old.currency
      or new.monthly_cents is distinct from old.monthly_cents
      or new.annual_cents is distinct from old.annual_cents
      or new.max_active_staff is distinct from old.max_active_staff
      or new.max_locations is distinct from old.max_locations
      or new.sms_included is distinct from old.sms_included
      or new.remove_branding_allowed is distinct from old.remove_branding_allowed
      or new.api_access_allowed is distinct from old.api_access_allowed
      or new.stripe_price_id_monthly is distinct from old.stripe_price_id_monthly
      or new.stripe_price_id_yearly is distinct from old.stripe_price_id_yearly
      or new.effective_from is distinct from old.effective_from
    then
      raise exception 'locked offer commercial payload is immutable';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists plan_offers_lifecycle_guard on public.plan_offers;
create trigger plan_offers_lifecycle_guard
  before insert or update on public.plan_offers
  for each row execute function public.plan_offers_lifecycle_guard();

alter table public.plan_offers enable row level security;

revoke all on table public.plan_offers from public;
do $$
begin
  revoke all on table public.plan_offers from anon;
exception
  when undefined_object then null;
end $$;
do $$
begin
  revoke all on table public.plan_offers from authenticated;
exception
  when undefined_object then null;
end $$;

grant select, insert, update, delete on table public.plan_offers to service_role;

-- No authenticated/anon policies: tenants do not read raw plan_offers via PostgREST.
-- Authoritative resolution is trusted-server / service_role only.

-- ---------------------------------------------------------------------------
-- businesses.offer_id — nullable commercial reference; no backfill
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists offer_id uuid references public.plan_offers (id);

comment on column public.businesses.offer_id is
  'Nullable FK to a locked plan_offers row. Canonical commercial plan identity once set. subscription_plan_key is the compatibility mirror and must match offer.plan_key. No Track 2 backfill.';

create index if not exists businesses_offer_id_idx
  on public.businesses (offer_id)
  where offer_id is not null;

create or replace function public.businesses_offer_assignment_guard()
returns trigger
language plpgsql
as $$
declare
  offer public.plan_offers%rowtype;
  offer_changed boolean;
begin
  if tg_op = 'INSERT' then
    offer_changed := new.offer_id is not null;
  else
    offer_changed := new.offer_id is distinct from old.offer_id;
  end if;

  -- Trust service_role JWT. Anonymous callers are role `anon`, not service_role.
  if offer_changed and auth.role() is distinct from 'service_role' then
    raise exception 'offer_id may only be assigned by trusted server role';
  end if;

  if new.offer_id is null then
    return new;
  end if;

  select * into offer
  from public.plan_offers
  where id = new.offer_id;

  if not found then
    raise exception 'offer_id does not exist';
  end if;

  if not offer.is_locked then
    raise exception 'businesses may only reference locked offers';
  end if;

  if offer.plan_key is distinct from new.subscription_plan_key then
    raise exception 'subscription_plan_key must match plan_offers.plan_key';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_offer_assignment_guard on public.businesses;
create trigger businesses_offer_assignment_guard
  before insert or update of offer_id, subscription_plan_key on public.businesses
  for each row execute function public.businesses_offer_assignment_guard();

-- ---------------------------------------------------------------------------
-- usage_events — internal append-only COGS ledger (no emitters in Track 2)
-- ---------------------------------------------------------------------------

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (char_length(trim(kind)) > 0),
  quantity numeric not null check (quantity >= 0),
  unit text not null check (char_length(trim(unit)) > 0),
  provider text,
  estimated_cost_micros bigint check (
    estimated_cost_micros is null or estimated_cost_micros >= 0
  ),
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.usage_events is
  'Internal append-only usage/COGS ledger. estimated_cost_micros is Chasum cost, not customer billing. 1,000,000 micros = $1.00 USD-equivalent. No tenant SELECT.';

comment on column public.usage_events.estimated_cost_micros is
  'Internal provider-cost micro-USD. Never tenant-visible. Corrections = new rows.';

comment on column public.usage_events.kind is
  'Application taxonomy (not a DB enum): summer_input_tokens, summer_output_tokens, summer_action, sms_segment, email_send, voice_minute, document_page.';

-- Future SMS writers (NOT implemented in Track 2):
-- Twilio REST create returns num_segments (provisional).
-- Twilio status callback NumSegments is the reconciliation signal.
-- One message != one segment. Append compensating events; never UPDATE this table.

create index if not exists usage_events_business_occurred_idx
  on public.usage_events (business_id, occurred_at desc);

create index if not exists usage_events_kind_occurred_idx
  on public.usage_events (kind, occurred_at desc);

create or replace function public.usage_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'usage_events is append-only; insert a compensating event';
end;
$$;

drop trigger if exists usage_events_append_only on public.usage_events;
create trigger usage_events_append_only
  before update or delete on public.usage_events
  for each row execute function public.usage_events_append_only();

alter table public.usage_events enable row level security;

revoke all on table public.usage_events from public;
do $$
begin
  revoke all on table public.usage_events from anon;
exception
  when undefined_object then null;
end $$;
do $$
begin
  revoke all on table public.usage_events from authenticated;
exception
  when undefined_object then null;
end $$;

grant select, insert on table public.usage_events to service_role;
-- UPDATE/DELETE intentionally not granted; trigger also blocks mutations.
