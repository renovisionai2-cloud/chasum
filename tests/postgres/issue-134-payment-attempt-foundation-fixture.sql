\set ON_ERROR_STOP on

-- Minimal disposable baseline for the exact Issue #134 migration. This file is
-- local-test infrastructure only; it is not a deployable Chasum migration.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

create table public.businesses (
  id uuid primary key,
  name text not null
);

create table public.customers (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gift_cards (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, code)
);

create table public.commerce_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  kind text not null default 'payment'
    check (kind in ('payment', 'deposit', 'refund', 'void', 'adjustment', 'store_credit', 'gift_card')),
  status text not null default 'succeeded'
    check (status in ('pending', 'requires_action', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded')),
  method text not null
    check (method in ('credit_card', 'debit_card', 'cash', 'e_transfer', 'gift_card', 'store_credit', 'other')),
  amount_cents integer not null,
  currency text not null default 'usd',
  provider text not null default 'manual'
    check (provider in ('manual', 'stripe', 'other')),
  provider_reference text,
  provider_payment_intent_id text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commerce_transactions enable row level security;
create policy "Disposable authenticated commerce access"
  on public.commerce_transactions for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on table public.commerce_transactions
  to authenticated, service_role;
