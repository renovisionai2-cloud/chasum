\set ON_ERROR_STOP on
set timezone = 'UTC';

-- Disposable fixture only. This file owns a synthetic PostgreSQL database and
-- applies the immutable accepted sources before the new prepared migration.
\ir issue-134-payment-attempt-foundation-fixture.sql

create schema auth;
create table auth.users(id uuid primary key);

alter table public.businesses
  add column owner_id uuid not null,
  add column currency text not null default 'cad';
alter table public.customers
  add column email text not null,
  add column phone text,
  add column tags text[] not null default '{}';
alter table public.customers
  add constraint customers_business_id_email_key unique(business_id, email);

create type public.appointment_status as enum(
  'pending', 'confirmed', 'arrived', 'waiting', 'in_progress',
  'cancelled', 'completed', 'no_show'
);
create table public.business_members(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  user_id uuid not null references auth.users(id),
  role text not null check(role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique(business_id, user_id)
);
create table public.locations(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null
);
create table public.services(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null,
  duration_minutes integer not null,
  price numeric not null,
  deposit_cents integer not null default 0,
  deposit_required boolean not null default false,
  tax_rate_bps integer
);
create table public.staff(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  name text not null
);
create table public.booking_resources(
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  resource_type text not null,
  name text not null,
  is_active boolean not null default true
);

alter table public.appointments
  add column location_id uuid references public.locations(id),
  add column service_id uuid references public.services(id),
  add column staff_id uuid references public.staff(id),
  add column start_time timestamptz,
  add column end_time timestamptz,
  add column status public.appointment_status not null default 'confirmed',
  add column notes text,
  add column room_id uuid references public.booking_resources(id),
  add column price_cents integer,
  add column tax_cents integer not null default 0,
  add column deposit_cents integer not null default 0,
  add column amount_paid_cents integer not null default 0,
  add column payment_status text not null default 'unpaid';
alter table public.appointments
  alter column id set default gen_random_uuid();
create table public.appointment_resources(
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  resource_id uuid not null references public.booking_resources(id),
  primary key(appointment_id, resource_id)
);
alter table public.commerce_transactions
  add column invoice_id uuid,
  add column created_by uuid references auth.users(id);

\ir ../../supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql

grant select on table
  public.businesses,
  public.business_members,
  public.customers,
  public.locations,
  public.services,
  public.staff,
  public.booking_resources,
  public.appointments,
  public.appointment_resources
to service_role;
grant insert on table
  public.customers,
  public.appointments,
  public.appointment_resources
to service_role;
grant update(customer_id, status) on table public.appointments to service_role;
grant usage, select on sequence
  public.commerce_payment_attempt_events_event_sequence_seq
to service_role;

\ir ../../supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql
\ir ../../supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql

\ir ../../supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql

-- Synthetic schema completion from 018/028, not hosted state or #158 proof execution.
alter table public.appointments add column amount_refunded_cents integer not null default 0;
alter table public.businesses alter column owner_id set default '13410000-0000-4000-8000-000000000001';
alter table public.customers alter column email set default (gen_random_uuid()::text || '@example.test');
create table if not exists commerce_invoice_sequences (
  business_id uuid primary key references businesses (id) on delete cascade,
  next_number integer not null default 1,
  prefix text not null default 'INV',
  updated_at timestamptz not null default now()
);
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

alter table public.commerce_transactions add constraint fixture_invoice_fk foreign key(invoice_id) references public.commerce_invoices(id) on delete set null;
grant select,insert,update on public.commerce_invoice_sequences,public.commerce_invoices,public.commerce_invoice_lines,public.commerce_receipts,public.commerce_refunds,public.customer_payment_events to service_role;
grant update(amount_paid_cents,amount_refunded_cents,payment_status) on public.appointments to service_role;
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

-- Snapshot of R1a ownership/effective ACL before replacement.
create temporary table issue133_r1a_posture as select proowner,proacl from pg_proc where oid='public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure;
\if :{?issue133_duplicate_preflight}
insert into public.commerce_invoices(business_id,customer_id,appointment_id,invoice_number)
 values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021','13410000-0000-4000-8000-000000000031','DUP-A'),
 ('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021','13410000-0000-4000-8000-000000000031','DUP-B');
\endif
\ir ../../supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql
-- REQUIRED: unchanged historical contract runs against the replacement.
\ir issue-134-r1a-manual-kernel-contract.sql
create or replace function pg_temp.expect_failure(
  p_sql text,
  p_contains text,
  p_sqlstate text default null
) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'expected failure but statement succeeded: %', p_sql;
  exception when others then
    if sqlerrm like 'expected failure%' then raise; end if;
    if position(lower(p_contains) in lower(sqlerrm)) = 0 then
      raise exception 'wrong failure. expected %, got %', p_contains, sqlerrm;
    end if;
    if p_sqlstate is not null and sqlstate <> p_sqlstate then
      raise exception 'wrong SQLSTATE. expected %, got % (%)',
        p_sqlstate, sqlstate, sqlerrm;
    end if;
  end;
end $$;


create function public.issue133_assert(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ISSUE133_ASSERT: %',label; end if; end $$;
select public.issue133_assert((select row(p.proowner,p.proacl) is not distinct from row(b.proowner,b.proacl)
 from pg_proc p cross join issue133_r1a_posture b where p.oid='public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure),'R1a owner ACL preserved');
select public.issue133_assert((select count(*)=0 from public.commerce_projection_admission),'disabled by absence');

-- Helpers exist ONLY in this disposable fixture, never in the product migration.
create function public.issue133_make(n integer,ap uuid default null,amount integer default 500) returns uuid
language plpgsql as $$
declare aid uuid; r record;
begin
 select attempt_id into aid from public.admit_payment_attempt_v1(
 '13410000-0000-4000-8000-000000000011',md5('issue133-key-'||n)::uuid,'v1:'||repeat('a',64),
 'collect_payment','13410000-0000-4000-8000-000000000021',ap,'13410000-0000-4000-8000-000000000001',
 'payment',amount,'cad','cash','manual');
 select * into r from public.commit_manual_payment_attempt_v1('13410000-0000-4000-8000-000000000011',aid);
 perform public.issue133_assert(r.outcome in ('RECORDED','REPLAY'),'fixture canonical commit');
 return aid;
end $$;
create function public.issue133_replay(aid uuid,expected text) returns void language plpgsql as $$
declare r record; before_digest text; after_digest text; tid uuid;
begin
 select id into tid from public.commerce_transactions where payment_attempt_id=aid;
 select md5(jsonb_build_object(
 'a',(select to_jsonb(a) from public.commerce_payment_attempts a where id=aid),
 't',(select jsonb_agg(to_jsonb(t) order by id) from public.commerce_transactions t where payment_attempt_id=aid),
 'e',(select jsonb_agg(to_jsonb(e) order by event_sequence) from public.commerce_payment_attempt_events e where attempt_id=aid),
 'o',(select jsonb_agg(to_jsonb(o) order by projection_kind) from public.commerce_payment_reconciliation o where attempt_id=aid))::text) into before_digest;
 select * into r from public.commit_manual_payment_attempt_v1('13410000-0000-4000-8000-000000000011',aid);
 select md5(jsonb_build_object(
 'a',(select to_jsonb(a) from public.commerce_payment_attempts a where id=aid),
 't',(select jsonb_agg(to_jsonb(t) order by id) from public.commerce_transactions t where payment_attempt_id=aid),
 'e',(select jsonb_agg(to_jsonb(e) order by event_sequence) from public.commerce_payment_attempt_events e where attempt_id=aid),
 'o',(select jsonb_agg(to_jsonb(o) order by projection_kind) from public.commerce_payment_reconciliation o where attempt_id=aid))::text) into after_digest;
 perform public.issue133_assert(r.outcome=expected and r.attempt_id=aid and r.transaction_id=tid and r.recorded
   and r.synchronization=case when expected='REPLAY' then 'PENDING' else 'UNKNOWN' end and before_digest=after_digest,'zero-write same-identity replay '||expected);
end $$;
create function public.issue133_event(aid uuid,k text,s text,f text default null,m text default 'RECORDED') returns void language sql as $$
 insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,projection_kind,reconciliation_state,failure_class,failure_code)
 values('13410000-0000-4000-8000-000000000011',aid,'PROJECTION_CHANGED',m,k,s,case when f is null then null else 'PROJECTION' end,f);
$$;
create table public.issue133_ids(n integer primary key,attempt_id uuid,appointment_id uuid);
grant select,insert on public.issue133_ids to service_role;

-- Local-only fixture appointments, no existing rows changed by migration.
insert into public.appointments(id,business_id,customer_id,price_cents,tax_cents,deposit_cents,status)
 select md5('issue133-ap-'||n)::uuid,'13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',1000,130,200,'confirmed'
 from generate_series(1,40) n;
set role service_role;
select public.set_payment_projection_admission_v1('13410000-0000-4000-8000-000000000011',true);
-- A later statement/transaction gives attempts a strictly later creation timestamp.
insert into public.issue133_ids select n,public.issue133_make(n,case when n<=30 then md5('issue133-ap-'||n)::uuid else null end),case when n<=30 then md5('issue133-ap-'||n)::uuid else null end from generate_series(1,40) n;

-- Amendment vectors 1/2/6/7/8/9 plus actual target identities and replay.
do $$ declare a uuid; result jsonb; k text; tid uuid; receipt_before jsonb;
begin
 select attempt_id into a from public.issue133_ids where n=1;
 perform public.issue133_replay(a,'REPLAY');
 result:=public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',a);
 perform public.issue133_assert(result->>'outcome'='APPLIED','receipt first projection');
 perform public.issue133_replay(a,'REPLAY');
 select to_jsonb(r) into receipt_before from public.commerce_receipts r where transaction_id=(select id from public.commerce_transactions where payment_attempt_id=a);
 perform public.issue133_assert(receipt_before->>'invoice_id' is null,'receipt independent of invoice');
 foreach k in array array['appointment_cache','invoice_settlement','customer_payment_events'] loop
 result:=public.project_payment_obligation_v1('13410000-0000-4000-8000-000000000011',a,k);
 perform public.issue133_assert(result->>'outcome'='APPLIED','project '||k);
 end loop;
 perform public.issue133_replay(a,'REPLAY');
 result:=public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',a);
 perform public.issue133_assert(result->>'outcome'='VERIFIED' and receipt_before=(select to_jsonb(r) from public.commerce_receipts r where transaction_id=(select id from public.commerce_transactions where payment_attempt_id=a)),'receipt COMPLETE replay never enriches');
 insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,failure_class,failure_code)
 values('13410000-0000-4000-8000-000000000011',a,'KEY_CONFLICT','NOT_RECORDED','CONFLICT','KEY_CONFLICT');
 perform public.issue133_replay(a,'REPLAY');
 select attempt_id into a from public.issue133_ids where n=31;
 perform public.issue133_replay(a,'REPLAY');
 result:=public.project_payment_invoice_settlement_v1('13410000-0000-4000-8000-000000000011',a);
 perform public.issue133_assert(result->>'state'='NOT_REQUIRED','unbound invoice');
 perform public.issue133_replay(a,'REPLAY');
end $$;
reset role;
\echo 'PASS projection targets and original/complete/unbound/key-conflict replay'

-- Atomic rollback injection: target exception => no target; FAILED then COMPLETE same obligation.
create function public.issue133_injected_failure() returns trigger language plpgsql as $$ begin raise exception 'synthetic definite failure'; end $$;
create trigger issue133_injected_failure before insert on public.customer_payment_events for each row execute function public.issue133_injected_failure();
set role service_role;
select public.issue133_assert((public.project_payment_customer_payment_events_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=2))->>'failure_code')='PROJECTION_FAILED','definite failure classified');
select public.issue133_assert(not exists(select 1 from public.customer_payment_events where transaction_id=(select id from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=2))),'failed target rolled back');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=2),'REPLAY');
reset role;
drop trigger issue133_injected_failure on public.customer_payment_events;
set role service_role;
select public.issue133_assert((public.project_payment_customer_payment_events_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=2))->>'state')='COMPLETE','failure recovery');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=2),'REPLAY');
reset role;

-- Contradictory committed CRM target => uncertain; legacy NULL mirrors never adopted.
insert into public.customer_payment_events(business_id,customer_id,transaction_id,amount_cents,currency,status,method)
 select business_id,customer_id,id,1,currency,'paid',method from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=3);
insert into public.customer_payment_events(business_id,customer_id,amount_cents) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',77);
set role service_role;
select public.issue133_assert((public.project_payment_customer_payment_events_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=3))->>'failure_code')='PROJECTION_UNCERTAIN','contradictory CRM held');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=3),'REPLAY');
select public.issue133_assert(exists(select 1 from public.customer_payment_events where transaction_id is null and amount_cents=77),'legacy CRM preserved');
reset role;

-- Amendment negative: wrong money state; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
update public.commerce_payment_reconciliation set state='COMPLETE',failure_code=null,completed_at=now() where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','COMPLETE',null,'NOT_RECORDED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: FAILED missing failure metadata; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
update public.commerce_payment_reconciliation set state='FAILED',failure_code='PROJECTION_FAILED',completed_at=null where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','FAILED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: latest state mismatch; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
update public.commerce_payment_reconciliation set state='COMPLETE',failure_code=null,completed_at=now() where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','FAILED','PROJECTION_FAILED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: bound NOT_REQUIRED; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
update public.commerce_payment_reconciliation set state='NOT_REQUIRED',failure_code=null,completed_at=now() where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','NOT_REQUIRED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: PENDING with history; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','COMPLETE');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: unrecognized extra event; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state) values('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4),'REPLAYED','RECORDED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: wrong latest failure code; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
update public.commerce_payment_reconciliation set state='FAILED',failure_code='PROJECTION_FAILED',completed_at=null where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','FAILED','PROJECTION_UNCERTAIN');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

-- Amendment negative: PENDING transition event; isolated rollback leaves original fixture intact.
begin;
set local role service_role;
select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','PENDING');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;

begin;
delete from public.commerce_payment_reconciliation where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='receipt';
set local role service_role;
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'UNKNOWN');
rollback;
begin;
set local role service_role;
select public.issue133_event((select attempt_id from public.issue133_ids where n=32),'appointment_cache','NOT_REQUIRED');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=32),'UNKNOWN');
rollback;
-- A fifth/duplicate kind is mechanically impossible; preserve the constraints.
select pg_temp.expect_failure($q$insert into public.commerce_payment_reconciliation(business_id,attempt_id,projection_kind)
 values('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4),'receipt')$q$,'duplicate key','23505');
select pg_temp.expect_failure($q$insert into public.commerce_payment_reconciliation(business_id,attempt_id,projection_kind)
 values('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4),'extra_kind')$q$,'check constraint','23514');
\echo 'PASS replay negative census/state/history vectors'

begin;
delete from public.commerce_projection_admission where business_id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='NOT_ADMITTED','admission absent');
rollback;

begin;
update public.commerce_projection_admission set enabled=false where business_id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='NOT_ADMITTED','admission disabled');
rollback;

begin;
update public.commerce_projection_admission set admit_attempts_created_after=null where business_id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='NOT_ADMITTED','admission NULL watermark');
rollback;

begin;
update public.commerce_projection_admission set admit_attempts_created_after=(select created_at from public.commerce_payment_attempts where id=(select attempt_id from public.issue133_ids where n=4)) where business_id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='NOT_ADMITTED','admission equal watermark');
rollback;

begin;
update public.commerce_projection_admission set admit_attempts_created_after=clock_timestamp()+interval '1 hour' where business_id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='NOT_ADMITTED','admission future watermark');
rollback;

begin;
set local role service_role;
do $$ declare prior timestamptz; later timestamptz; begin
 select admit_attempts_created_after into prior from public.commerce_projection_admission where business_id='13410000-0000-4000-8000-000000000011';
 perform public.set_payment_projection_admission_v1('13410000-0000-4000-8000-000000000011',false);
 perform public.set_payment_projection_admission_v1('13410000-0000-4000-8000-000000000011',true);
 select admit_attempts_created_after into later from public.commerce_projection_admission where business_id='13410000-0000-4000-8000-000000000011';
 perform public.issue133_assert(later>=prior,'reenable never moves backward');
end $$;
rollback;
\echo 'PASS admission strict equality/absence/disable/reenable fences'

begin;
update public.appointments set price_cents=null where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','NULL price held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
update public.appointments set price_cents=-1 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','negative price held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
alter table public.appointments alter column tax_cents drop not null;
update public.appointments set tax_cents=null where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','NULL tax held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
update public.appointments set tax_cents=-1 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','negative tax held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
update public.appointments set deposit_cents=-1 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','negative deposit held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
update public.appointments set amount_refunded_cents=1 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','refund cache held');
select public.issue133_assert((select amount_paid_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'no cache write');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'refund','succeeded','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported refund holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'void','succeeded','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported void holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'adjustment','succeeded','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported adjustment holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'store_credit','succeeded','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported store credit holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'gift_card','succeeded','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported gift card holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'payment','pending','manual','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported pending holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'payment','succeeded','stripe','cash',100,'cad');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported provider holds whole set');
rollback;

begin;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,kind,status,provider,method,amount_cents,currency) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'payment','succeeded','manual','cash',100,'usd');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','unsupported currency holds whole set');
rollback;

-- Equal-value distinct transactions both count. Old COMPLETE verifies but never writes/downgrades.
begin;
set local role service_role;
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4));
select public.issue133_make(1004,md5('issue133-ap-4')::uuid,500);
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='VERIFICATION_MISMATCH','old COMPLETE current aggregate mismatch visible');
select public.issue133_assert((select state='COMPLETE' from public.commerce_payment_reconciliation where attempt_id=(select attempt_id from public.issue133_ids where n=4) and projection_kind='appointment_cache'),'old COMPLETE retained');
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select id from public.commerce_payment_attempts where attempt_key=md5('issue133-key-1004')::uuid));
select public.issue133_assert((select amount_paid_cents=1000 and payment_status='deposit_paid' and price_cents=1000 and tax_cents=130 from public.appointments where id=md5('issue133-ap-4')::uuid),'equal values/full stored tax terms');
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='VERIFIED','old COMPLETE verifies current truth after later projection');
rollback;
begin;
set local role service_role;
select public.issue133_make(2004,md5('issue133-ap-4')::uuid,500);
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4));
select public.issue133_assert((select amount_paid_cents=1000 from public.appointments where id=md5('issue133-ap-4')::uuid),'old PENDING recomputes all money');
rollback;
begin;
update public.appointments set status='cancelled',price_cents=0,tax_cents=0,deposit_cents=0 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4));
select public.issue133_assert((select amount_paid_cents=500 and payment_status='fully_paid' and price_cents=0 and tax_cents=0 from public.appointments where id=md5('issue133-ap-4')::uuid),'cancelled and explicit zero retain money');
rollback;

begin;
insert into public.commerce_invoices(business_id,customer_id,appointment_id,invoice_number,status)
 values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'VOID-FIXTURE','void');
set local role service_role;
select public.issue133_assert((public.project_payment_invoice_settlement_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','void invoice hold');
select public.issue133_assert((select count(*)=1 from public.commerce_invoices where appointment_id=md5('issue133-ap-4')::uuid),'no void replacement');
reset role;
select pg_temp.expect_failure($q$insert into public.commerce_invoices(business_id,customer_id,appointment_id,invoice_number)
 values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021',md5('issue133-ap-4')::uuid,'DUPLICATE')$q$,'duplicate key','23505');
rollback;
\echo 'PASS supported full aggregate, hold classes, zero/cancellation, invoice identity'

-- Canonical reader state/privacy, foreign/revoked authorization, stable pagination.
set role service_role;
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=1),null,1)#>>'{rows,0,operator_state}')='RECORDED','reader complete');
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=3),null,1)#>>'{rows,0,operator_state}')='RECORDED_BUT_NOT_FULLY_SYNCHRONIZED','reader failed projection still recorded');
do $$ declare a uuid; result jsonb; page1 jsonb; page2 jsonb; ap uuid; begin
 foreach ap in array array[null::uuid,md5('issue133-ap-40')::uuid] loop
 select attempt_id into a from public.admit_payment_attempt_v1('13410000-0000-4000-8000-000000000011',gen_random_uuid(),'v1:'||repeat('a',64),'collect_payment','13410000-0000-4000-8000-000000000021',ap,'13410000-0000-4000-8000-000000000001','payment',500,'cad','cash','manual');
 result:=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',a,null,1);
 perform public.issue133_assert(result#>>'{rows,0,operator_state}'='PAYMENT_RECOVERY_REQUIRED','REQUESTED bound/unbound recovery');
 update public.commerce_payment_attempts set execution_state='FAILED',recovery_disposition='DO_NOT_RETRY',failure_class='VALIDATION',failure_code='INVALID_REQUEST',resolved_at=now() where id=a;
 insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,failure_class,failure_code)
 values('13410000-0000-4000-8000-000000000011',a,'FAILED','NOT_RECORDED','VALIDATION','INVALID_REQUEST');
 result:=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',a,null,1);
 perform public.issue133_assert(result#>>'{rows,0,operator_state}'='NOT_RECORDED','FAILED zero ledger');
 end loop;
 -- Initial no-payment attempt fixture, with valid canonical event shape.
 insert into public.commerce_payment_attempts(business_id,attempt_key,request_fingerprint,source,customer_id,actor_id,payment_kind,amount_cents,currency,execution_state,recovery_disposition,resolved_at)
 values('13410000-0000-4000-8000-000000000011',gen_random_uuid(),'v1:'||repeat('a',64),'booking_sheet','13410000-0000-4000-8000-000000000021','13410000-0000-4000-8000-000000000001','none',0,'cad','SKIPPED','DO_NOT_RETRY',now()) returning id into a;
 insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state)
 values('13410000-0000-4000-8000-000000000011',a,'REQUESTED','NOT_RECORDED'),('13410000-0000-4000-8000-000000000011',a,'SKIPPED','NOT_RECORDED');
 result:=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',a,null,1);
 perform public.issue133_assert(result#>>'{rows,0,operator_state}'='NOT_RECORDED','SKIPPED zero ledger');
 page1:=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','history',null,null,5);
 page2:=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','history',null,page1->>'next_cursor',5);
 perform public.issue133_assert(page1->>'next_cursor' is not null and not exists(select 1 from jsonb_array_elements(page1->'rows') a join jsonb_array_elements(page2->'rows') b on a->>'attempt_id'=b->>'attempt_id'),'cursor disjoint pages');
 perform public.issue133_assert(page2->'rows'=public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','history',null,page1->>'next_cursor',5)->'rows','cursor deterministic');
 perform public.issue133_assert(page1::text !~ 'customer_email|customer_name|request_fingerprint|provider_reference|payment_note','PII-free history');
end $$;
reset role;
begin;
set local role service_role;
select public.issue133_event((select attempt_id from public.issue133_ids where n=4),'receipt','COMPLETE',null,'NOT_RECORDED');
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=4),null,1)#>>'{rows,0,operator_state}')='UNKNOWN','reader malformed history UNKNOWN');
rollback;
set role service_role;
select pg_temp.expect_failure($q$select public.read_payment_observability_v1('13410000-0000-4000-8000-000000000012','13410000-0000-4000-8000-000000000002','history',null,null,5)$q$,'NOT_AUTHORIZED','42501');
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',gen_random_uuid(),null,1)->'rows')='[]'::jsonb,'absent exact lookup no data');
reset role;
begin;
update public.businesses set owner_id='13410000-0000-4000-8000-000000000002' where id='13410000-0000-4000-8000-000000000011';
set local role service_role;
select pg_temp.expect_failure($q$select public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=1),null,1)$q$,'NOT_AUTHORIZED','42501');
rollback;

-- All new primitives deny browser execution; new internal tables have no policies.
do $$ declare f record; r text; begin
 for f in select oid::regprocedure signature,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace
 and proname in ('set_payment_projection_admission_v1','payment_projection_history_valid_v1','payment_appointment_truth_v1','project_payment_obligation_v1',
 'project_payment_appointment_cache_v1','project_payment_invoice_settlement_v1','project_payment_customer_payment_events_v1','project_payment_receipt_v1','read_payment_observability_v1') loop
 perform public.issue133_assert(not f.prosecdef and f.proconfig=array['search_path=pg_catalog, pg_temp'],'private invoker config');
 foreach r in array array['anon','authenticated'] loop perform public.issue133_assert(not has_function_privilege(r,f.signature,'EXECUTE'),'browser RPC denied'); end loop;
 perform public.issue133_assert(has_function_privilege('service_role',f.signature,'EXECUTE'),'service RPC granted');
 end loop;
 perform public.issue133_assert((select count(*)=2 from pg_class where oid in ('public.commerce_projection_admission'::regclass,'public.commerce_receipt_sequences'::regclass) and relrowsecurity),'RLS enabled');
 perform public.issue133_assert(not exists(select 1 from pg_policy where polrelid in ('public.commerce_projection_admission'::regclass,'public.commerce_receipt_sequences'::regclass)),'no browser policy');
 foreach r in array array['anon','authenticated'] loop
 perform public.issue133_assert(not has_table_privilege(r,'public.commerce_projection_admission','SELECT,INSERT,UPDATE,DELETE'),'admission ACL');
 perform public.issue133_assert(not has_table_privilege(r,'public.commerce_receipt_sequences','SELECT,INSERT,UPDATE,DELETE'),'receipt sequence ACL');
 end loop;
end $$;

-- Additional corruption/failure probes remain rollback-only in the owned fixture.
begin;
alter table public.appointments alter column deposit_cents drop not null;
update public.appointments set deposit_cents=null where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','NULL deposit held');
rollback;
begin;
insert into public.commerce_refunds(business_id,customer_id,transaction_id,amount_cents,currency,reason)
 select business_id,customer_id,id,100,currency,'synthetic evidence' from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=4);
set local role service_role;
select public.issue133_assert((public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','independent refund row held');
rollback;
begin;
alter table public.commerce_transactions drop constraint commerce_transactions_payment_attempt_key;
alter table public.commerce_transactions drop constraint commerce_transactions_attempt_business_key cascade;
set local role service_role;
insert into public.commerce_transactions(business_id,customer_id,appointment_id,payment_attempt_id,kind,status,method,amount_cents,currency,provider,provider_reference,created_by)
 select business_id,customer_id,appointment_id,payment_attempt_id,kind,status,method,amount_cents,currency,provider,provider_reference,created_by from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=4);
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=4),null,1)#>>'{rows,0,operator_state}')='UNKNOWN','multiple ledger corruption UNKNOWN');
rollback;

-- Event-write failure occurs AFTER target write; both must roll back before FAILED evidence.
create function public.issue133_late_failure() returns trigger language plpgsql as $$
begin if new.event_type='PROJECTION_CHANGED' and new.reconciliation_state='COMPLETE' then raise exception 'synthetic late failure'; end if; return new; end $$;
create trigger issue133_late_failure before insert on public.commerce_payment_attempt_events for each row execute function public.issue133_late_failure();
begin;
set local role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=5))->>'failure_code')='PROJECTION_FAILED','late event failure');
select public.issue133_assert(not exists(select 1 from public.commerce_receipts where transaction_id=(select id from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=5))),'late failure leaves no receipt');
select public.issue133_assert((select count(*)=3 from public.commerce_payment_reconciliation where attempt_id=(select attempt_id from public.issue133_ids where n=5) and state='PENDING'),'other obligations untouched');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=5),'REPLAY');
rollback;
drop trigger issue133_late_failure on public.commerce_payment_attempt_events;


-- #133 reader integration with the accepted booking-operation primitives.
-- Setup only; does not rerun the #158 proof or alter its source.
begin;
create function public.issue133_fixture_canonical_json(p_value jsonb)
returns text
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $$
declare
  result text;
begin
  if jsonb_typeof(p_value) = 'array' then
    select '[' || coalesce(
      string_agg(
        public.issue133_fixture_canonical_json(element.value),
        ','
        order by element.ordinality
      ),
      ''
    ) || ']'
    into result
    from jsonb_array_elements(p_value) with ordinality
      element(value, ordinality);
    return result;
  end if;
  if jsonb_typeof(p_value) = 'object' then
    raise exception 'fixture canonicalizer does not accept objects';
  end if;
  return p_value::text;
end $$;

create function public.issue133_fixture_fingerprint(p_values jsonb)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select 'v1:' || pg_catalog.encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(
        public.issue133_fixture_canonical_json(p_values),
        'UTF8'
      )
    ),
    'hex'
  )
$$;

create function public.issue133_fixture_bootstrap(
  p_operation uuid,
  p_key uuid,
  p_customer uuid,
  p_payment_mode text,
  p_payment_kind text,
  p_amount integer,
  p_method text,
  p_provider text,
  p_source text default 'booking_sheet',
  p_staff uuid default '15800000-0000-4000-8000-000000000030'
) returns text
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  result text;
  customer_fingerprint text;
  booking_fingerprint text;
  payment_fingerprint text;
begin
  customer_fingerprint := public.issue133_fixture_fingerprint(jsonb_build_array(
    'chasum.booking-customer-input', 1, 'existing', p_customer,
    null::text, null::text, null::text
  ));
  booking_fingerprint := public.issue133_fixture_fingerprint(jsonb_build_array(
    'chasum.booking-operation', 1,
    '15800000-0000-4000-8000-000000000001'::uuid,
    p_customer,
    '15800000-0000-4000-8000-000000000010'::uuid,
    '15800000-0000-4000-8000-000000000020'::uuid,
    p_staff,
    '2026-10-08T14:00:00.000Z',
    '2026-10-08T15:00:00.000Z',
    'confirmed', 60, null::uuid, to_jsonb(array[
      '15800000-0000-4000-8000-000000000060'::uuid,
      '15800000-0000-4000-8000-000000000061'::uuid
    ]), null::uuid, null::text,
    10000, 0, 5000, p_payment_mode, null::text, null::text, false
  ));
  payment_fingerprint := public.issue133_fixture_fingerprint(jsonb_build_array(
    'chasum.payment-attempt', 1,
    '15800000-0000-4000-8000-000000000001'::uuid,
    p_customer, 'booking_operation', p_operation, p_amount, 'cad',
    p_method, p_payment_kind, p_provider, null::text
  ));
  select outcome into result
  from public.bootstrap_booking_operation_v1(
    '15800000-0000-4000-8000-000000000001',
    p_operation,
    p_key,
    '15800000-0000-4000-8000-000000000002',
    p_source,
    booking_fingerprint,
    payment_fingerprint,
    customer_fingerprint,
    'existing',
    p_customer,
    null,
    null,
    null,
    null,
    '15800000-0000-4000-8000-000000000010',
    '15800000-0000-4000-8000-000000000020',
    p_staff,
    '2026-10-08T14:00:00.000Z',
    '2026-10-08T15:00:00.000Z',
    'confirmed',
    60,
    null,
    array[
      '15800000-0000-4000-8000-000000000060'::uuid,
      '15800000-0000-4000-8000-000000000061'::uuid
    ],
    null,
    null,
    10000,
    0,
    5000,
    p_payment_mode,
    null,
    null,
    false,
    p_payment_kind,
    p_amount,
    'cad',
    p_method,
    p_provider
  );
  return result;
end $$;

insert into auth.users(id) values
  ('15800000-0000-4000-8000-000000000002'),
  ('15800000-0000-4000-8000-000000000099');
insert into public.businesses(id, name, owner_id, currency)
values
(
  '15800000-0000-4000-8000-000000000001',
  'Issue 158 Synthetic',
  '15800000-0000-4000-8000-000000000002',
  'cad'
),
(
  '15800000-0000-4000-8000-000000000801',
  'Issue 158 Foreign Tenant',
  '15800000-0000-4000-8000-000000000099',
  'cad'
);
insert into public.locations(id, business_id, name) values(
  '15800000-0000-4000-8000-000000000010',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Location'
);
insert into public.services(
  id, business_id, name, duration_minutes, price, deposit_cents, deposit_required
) values(
  '15800000-0000-4000-8000-000000000020',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Service',
  60,
  100,
  5000,
  true
);
insert into public.staff(id, business_id, name) values(
  '15800000-0000-4000-8000-000000000030',
  '15800000-0000-4000-8000-000000000001',
  'Synthetic Staff'
);
insert into public.booking_resources(
  id, business_id, resource_type, name, is_active
) values
(
  '15800000-0000-4000-8000-000000000060',
  '15800000-0000-4000-8000-000000000001',
  'equipment',
  'Synthetic Resource One',
  true
),
(
  '15800000-0000-4000-8000-000000000061',
  '15800000-0000-4000-8000-000000000001',
  'equipment',
  'Synthetic Resource Two',
  true
);
insert into public.customers(id, business_id, name, email, phone) values
(
  '15800000-0000-4000-8000-000000000040',
  '15800000-0000-4000-8000-000000000001',
  'Customer One',
  'one@example.com',
  '19055550100'
),
(
  '15800000-0000-4000-8000-000000000041',
  '15800000-0000-4000-8000-000000000001',
  'Customer Two',
  'two@example.com',
  '19055550101'
),
(
  '15800000-0000-4000-8000-000000000042',
  '15800000-0000-4000-8000-000000000001',
  'Customer Three',
  'three@example.com',
  '19055550102'
),
(
  '15800000-0000-4000-8000-000000000802',
  '15800000-0000-4000-8000-000000000801',
  'Foreign Tenant Customer',
  'foreign@example.com',
  '19055550802'
);

set local role service_role;
select public.issue133_assert(public.issue133_fixture_bootstrap('15800000-0000-4000-8000-000000000100','15800000-0000-4000-8000-000000000101','15800000-0000-4000-8000-000000000040','deposit','deposit',5000,'cash','manual')='ADMITTED','reader booking setup');
do $$ declare aid uuid; ap uuid; op public.commerce_booking_operations%rowtype; result jsonb; begin
 select * into op from public.commerce_booking_operations where id='15800000-0000-4000-8000-000000000100';
 select id into aid from public.commerce_payment_attempts where booking_operation_id=op.id;
 result:=public.read_payment_observability_v1(op.business_id,op.actor_id,'one',aid,null,1);
 perform public.issue133_assert(result#>>'{rows,0,operator_state}'='PAYMENT_RECOVERY_REQUIRED' and result#>>'{rows,0,payment_mode}'='deposit' and result#>>'{rows,0,appointment_id}' is null,'booking pre-bind reader');
 select appointment_id into ap from public.persist_booking_operation_appointment_v1(op.business_id,op.id,op.actor_id,op.customer_id,op.location_id,op.service_id,op.staff_id,op.requested_start,op.requested_end,op.requested_status,op.duration_minutes,op.appointment_notes,op.room_id,op.resource_ids,op.package_id,op.package_name,op.subtotal_cents,op.tax_cents,op.deposit_required_cents);
 perform public.bind_booking_operation_appointment_v1(op.business_id,op.id,op.actor_id,ap);
 result:=public.read_payment_observability_v1(op.business_id,op.actor_id,'one',aid,null,1);
 perform public.issue133_assert(ap is not null and result#>>'{rows,0,operator_state}'='PAYMENT_RECOVERY_REQUIRED' and result#>>'{rows,0,appointment_id}'=ap::text and result#>>'{rows,0,payment_mode}'='deposit','same booking attempt post-bind reader');
end $$;
rollback;


-- Old FAILED cache recomputes the full later aggregate, never an attempt delta.
begin;
update public.appointments set price_cents=null where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4));
reset role;
update public.appointments set price_cents=1000 where id=md5('issue133-ap-4')::uuid;
set local role service_role;
select public.issue133_make(3004,md5('issue133-ap-4')::uuid,500);
select public.project_payment_appointment_cache_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4));
select public.issue133_assert((select amount_paid_cents=1000 from public.appointments where id=md5('issue133-ap-4')::uuid),'old FAILED full aggregate');
select public.issue133_replay((select attempt_id from public.issue133_ids where n=4),'REPLAY');
rollback;
begin;
insert into public.commerce_invoices(business_id,customer_id,invoice_number) values('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000021','WRONG-LINK');
set local role service_role;
update public.commerce_transactions set invoice_id=(select id from public.commerce_invoices where invoice_number='WRONG-LINK') where payment_attempt_id=(select attempt_id from public.issue133_ids where n=4);
select public.issue133_assert((public.project_payment_invoice_settlement_v1('13410000-0000-4000-8000-000000000011',(select attempt_id from public.issue133_ids where n=4))->>'failure_code')='PROJECTION_UNCERTAIN','different non-null invoice link held');
select public.issue133_assert(not exists(select 1 from public.commerce_invoices where appointment_id=md5('issue133-ap-4')::uuid),'contradiction rolls back new invoice and lines');
rollback;

\echo 'ISSUE133_SQL_CONTRACT_PASS'

-- Fresh second-Business sequence cohort, reserved for verifier concurrency.
insert into public.appointments(id,business_id,customer_id,price_cents,tax_cents,deposit_cents,status)
 select md5('issue133-other-ap-'||n)::uuid,'13410000-0000-4000-8000-000000000012','13410000-0000-4000-8000-000000000023',1000,0,0,'confirmed' from generate_series(51,52) n;
create function public.issue133_make_other(n integer) returns uuid language plpgsql as $$
declare aid uuid; result record; begin
 select attempt_id into aid from public.admit_payment_attempt_v1('13410000-0000-4000-8000-000000000012',md5('issue133-other-key-'||n)::uuid,'v1:'||repeat('b',64),'collect_payment','13410000-0000-4000-8000-000000000023',case when n<=52 then md5('issue133-other-ap-'||n)::uuid else null end,'13410000-0000-4000-8000-000000000002','payment',500,'usd','cash','manual');
 select * into result from public.commit_manual_payment_attempt_v1('13410000-0000-4000-8000-000000000012',aid);
 perform public.issue133_assert(result.outcome='RECORDED','fresh other Business commit'); return aid;
end $$;
set role service_role;
select public.set_payment_projection_admission_v1('13410000-0000-4000-8000-000000000012',true);
insert into public.issue133_ids select n,public.issue133_make_other(n),case when n<=52 then md5('issue133-other-ap-'||n)::uuid else null end from generate_series(51,54) n;
reset role;

set role service_role;
select public.issue133_assert((public.project_payment_receipt_v1('13410000-0000-4000-8000-000000000012',(select attempt_id from public.issue133_ids where n=4))->>'outcome')='UNKNOWN','service role still proves Business/attempt binding');
select public.issue133_assert((public.read_payment_observability_v1('13410000-0000-4000-8000-000000000011','13410000-0000-4000-8000-000000000001','one',(select attempt_id from public.issue133_ids where n=51),null,1)->'rows')='[]'::jsonb,'foreign attempt matches absent result');
select pg_temp.expect_failure($q$insert into public.customer_payment_events(business_id,customer_id,transaction_id,amount_cents)
 select '13410000-0000-4000-8000-000000000012','13410000-0000-4000-8000-000000000023',id,500 from public.commerce_transactions where payment_attempt_id=(select attempt_id from public.issue133_ids where n=4)$q$,'foreign key','23503');
reset role;

\echo 'ISSUE133_FIXTURE_READY'
