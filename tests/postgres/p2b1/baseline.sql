-- TEST ONLY: pre-correction synthetic baseline. NEVER a hosted migration.
-- Exact reused source excerpts are listed in provenance.json. 034-036 are excluded.
-- Synthetic Supabase auth helpers model JWT GUCs, NOT JWT verification/PostgREST.
create role anon nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
create role authenticated nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
create role service_role nologin nosuperuser nocreatedb nocreaterole noreplication bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'role')
$$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- Verbatim source: supabase/migrations/001_booking_engine.sql:8-16
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Verbatim source: supabase/migrations/008_phase5_multi_location.sql:8-15
create table if not exists subscription_plans (
  plan_key text primary key,
  name text not null,
  max_locations integer,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Verbatim source: supabase/migrations/008_phase5_multi_location.sql:25-27
alter table businesses
  add column if not exists subscription_plan_key text not null default 'starter'
    references subscription_plans (plan_key);

insert into subscription_plans(plan_key,name) values ('starter','Synthetic Free'),('professional','Synthetic Professional'),('business','Synthetic Business');

-- Verbatim source: supabase/migrations/014_owner_platform.sql:42-63
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

-- Verbatim source: supabase/migrations/015_billing_phase1.sql:61-178
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

-- Verbatim source: supabase/migrations/001_booking_engine.sql:112-123
create or replace function is_business_owner(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses
    where id = bid and owner_id = auth.uid()
  );
$$;

-- Verbatim source: supabase/migrations/032_private_alpha_co_owners.sql:23-76
create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (business_id, user_id)
);

create index if not exists business_members_user_idx
  on business_members (user_id);

create index if not exists business_members_business_idx
  on business_members (business_id);

alter table business_members enable row level security;

drop policy if exists "Members read own membership" on business_members;
create policy "Members read own membership"
  on business_members for select
  using (
    user_id = auth.uid()
    or is_business_owner(business_id)
  );

-- Writes are service-role / security definer only (no broad insert policy for clients).

grant select on table business_members to authenticated;
grant select, insert, update, delete on table business_members to service_role;

-- ---------------------------------------------------------------------------
-- 3. Expand is_business_owner to include co-owner members
-- ---------------------------------------------------------------------------

create or replace function is_business_owner(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses
    where id = bid and owner_id = auth.uid()
  )
  or exists (
    select 1 from business_members
    where business_id = bid
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- Verbatim source: supabase/migrations/20260920230358_tenant_identity_gate.sql:19-28
create policy "Owners read their businesses" on public.businesses for select to authenticated
  using (owner_id = auth.uid() or public.is_business_owner(id));
create policy "Owners update their businesses" on public.businesses for update to authenticated
  using (owner_id = auth.uid() or public.is_business_owner(id))
  with check (owner_id = auth.uid() or public.is_business_owner(id));
create policy "Owners delete their businesses" on public.businesses for delete to authenticated
  using (owner_id = auth.uid() or public.is_business_owner(id));
create policy "No client business creation" on public.businesses as restrictive for insert to anon, authenticated
  with check (false);
revoke insert on public.businesses from public, anon, authenticated;

-- Verbatim source: supabase/migrations/20260920230358_tenant_identity_gate.sql:38-49
create function public.guard_business_identity_update() returns trigger
language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated') and
     (new.id is distinct from old.id or new.owner_id is distinct from old.owner_id) then
    raise exception 'Business identity transfer requires governed review' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.guard_business_identity_update() from public, anon, authenticated;
create trigger businesses_guard_identity_update before update on public.businesses
for each row execute function public.guard_business_identity_update();

-- Verbatim source: supabase/migrations/001_booking_engine.sql:131-133
create policy "Public can view businesses"
  on businesses for select
  using (true);

-- Verbatim statement from supabase/migrations/033_private_alpha_co_owner_rls.sql
-- (dynamic DO wrapper omitted; explicit standalone statement terminator added).
      create policy "Owners manage billing invoices"
        on billing_invoices for all
        using (is_business_owner(business_id))
        with check (is_business_owner(business_id));

-- Fixture-only model of historical effective grants from supplied dated observations.
-- NOT a statement that hosted ACLs/default privileges are freshly known.
alter table public.businesses enable row level security;
grant all on public.billing_invoices, public.subscription_events
  to anon, authenticated, service_role;
grant select on public.businesses to anon;
grant select, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.businesses, public.business_members to service_role;
grant select on public.subscription_plans to anon, authenticated, service_role;

insert into auth.users(id) values
 ('00000000-0000-0000-0000-000000000101'), -- direct owner A
 ('00000000-0000-0000-0000-000000000102'), -- direct owner B / cross-business actor
 ('00000000-0000-0000-0000-000000000103'), -- business A admin (NOT platform/DB admin)
 ('00000000-0000-0000-0000-000000000104'), -- business A co-owner
 ('00000000-0000-0000-0000-000000000105'); -- outsider, no membership
insert into businesses(id,owner_id,name,slug,timezone) values
 ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000101','Synthetic A','p2b1-a','UTC'),
 ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000102','Synthetic B','p2b1-b','UTC');
insert into business_members(business_id,user_id,role) values
 ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000103','admin'),
 ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000104','owner');
insert into billing_invoices(business_id,invoice_number,status,currency,amount_cents,period_start,period_end) values
 ('00000000-0000-0000-0000-000000000201','SYN-A','open','cad',7900,'2026-01-01T00:00:00Z','2026-02-01T00:00:00Z'),
 ('00000000-0000-0000-0000-000000000202','SYN-B','open','cad',7900,'2026-01-01T00:00:00Z','2026-02-01T00:00:00Z');
insert into subscription_events(business_id,event_type,currency) values
 ('00000000-0000-0000-0000-000000000201','created','cad'),
 ('00000000-0000-0000-0000-000000000202','created','cad');

-- Helpers run as INVOKER: they cannot turn client assertions into superuser checks.
create schema p2b1_test;
grant usage on schema p2b1_test to anon, authenticated, service_role;
create function p2b1_test.expect(ok boolean, label text) returns void
language plpgsql security invoker as $$
begin
 if ok is distinct from true then raise exception 'Baseline assertion failed: %', label; end if;
end $$;
create function p2b1_test.expect_denied(statement text) returns void
language plpgsql security invoker as $$
begin
 begin
  execute statement;
 exception when insufficient_privilege then return;
 end;
 raise exception 'Expected insufficient_privilege but command succeeded';
end $$;
create function p2b1_test.actor(expected_role text, expected_uid uuid) returns void
language plpgsql security invoker as $$
begin
 perform p2b1_test.expect(current_user = expected_role, 'actual current_user');
 perform p2b1_test.expect(auth.role() = expected_role, 'synthetic JWT role');
 perform p2b1_test.expect(auth.uid() is not distinct from expected_uid, 'synthetic JWT uid');
 perform p2b1_test.expect((select not rolsuper and rolbypassrls = (expected_role = 'service_role')
   from pg_roles where rolname = current_user), 'actual role attributes');
 raise notice 'OBSERVED actor: current_user=%, uid=%', current_user, auth.uid();
end $$;
