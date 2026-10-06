\set ON_ERROR_STOP on

-- Source-derived columns required by the accepted commerce schema but omitted
-- from the narrower foundation fixture.
create schema auth;
create table auth.users (
  id uuid primary key
);

alter table public.businesses
  add column currency text not null default 'usd';
alter table public.commerce_transactions
  add column invoice_id uuid,
  add column created_by uuid references auth.users(id) on delete set null;

-- Model only existing privileges required by the accepted migrations:
-- service_role reads tenant bindings; migration 031 grants ledger DML; hosted
-- foundation evidence records inherited public-schema sequence privileges.
grant select on table public.businesses, public.customers, public.appointments
  to service_role;
grant usage, select on sequence public.commerce_payment_attempt_events_event_sequence_seq
  to service_role;

insert into auth.users(id) values
  ('13410000-0000-4000-8000-000000000001'),
  ('13410000-0000-4000-8000-000000000002');
insert into public.businesses(id, name, currency) values
  ('13410000-0000-4000-8000-000000000011', 'R1a Business A', 'cad'),
  ('13410000-0000-4000-8000-000000000012', 'R1a Business B', 'usd');
insert into public.customers(id, business_id, name) values
  ('13410000-0000-4000-8000-000000000021', '13410000-0000-4000-8000-000000000011', 'R1a Customer A'),
  ('13410000-0000-4000-8000-000000000022', '13410000-0000-4000-8000-000000000011', 'R1a Customer Other'),
  ('13410000-0000-4000-8000-000000000023', '13410000-0000-4000-8000-000000000012', 'R1a Customer B');
insert into public.appointments(id, business_id, customer_id) values
  ('13410000-0000-4000-8000-000000000031', '13410000-0000-4000-8000-000000000011', '13410000-0000-4000-8000-000000000021'),
  ('13410000-0000-4000-8000-000000000032', '13410000-0000-4000-8000-000000000011', '13410000-0000-4000-8000-000000000022'),
  ('13410000-0000-4000-8000-000000000033', '13410000-0000-4000-8000-000000000012', '13410000-0000-4000-8000-000000000023');

insert into public.commerce_transactions(
  id,
  business_id,
  customer_id,
  appointment_id,
  kind,
  status,
  method,
  amount_cents,
  currency,
  provider,
  provider_reference,
  description
) values (
  '13410000-0000-4000-8000-000000000041',
  '13410000-0000-4000-8000-000000000011',
  '13410000-0000-4000-8000-000000000021',
  '13410000-0000-4000-8000-000000000031',
  'payment',
  'succeeded',
  'cash',
  111,
  'cad',
  'manual',
  'legacy-baseline',
  'Existing legacy row'
);

create temporary table issue134_r1a_existing_data_digest (
  relation_name text primary key,
  row_count bigint not null,
  row_digest text not null
) on commit preserve rows;

insert into issue134_r1a_existing_data_digest(relation_name, row_count, row_digest)
select 'businesses', count(*), md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
from public.businesses t
union all
select 'customers', count(*), md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
from public.customers t
union all
select 'appointments', count(*), md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
from public.appointments t
union all
select 'commerce_transactions', count(*), md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
from public.commerce_transactions t;
