-- Issue 112: scoped manual application only. No provider activation or backfill.
alter table public.businesses add column if not exists subscription_revision bigint not null default 0
  check (subscription_revision >= 0);

-- Globally unique revisions also prevent stale-token collisions if a mapping is
-- removed and later attached to a different Business. Rollback gaps are harmless.
create sequence if not exists public.saas_subscription_revision_seq as bigint;
revoke all on sequence public.saas_subscription_revision_seq from public, anon, authenticated;
grant usage on sequence public.saas_subscription_revision_seq to service_role;

-- INVOKER: actual database authority, never a caller-controlled JWT claim.
-- Every privileged UPDATE naming an authority column advances revision, including
-- a same-value Platform Admin assignment. Ordinary settings do not advance it.
create or replace function public.guard_subscription_authority() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'Subscription authority requires trusted server' using errcode = '42501';
  end if;
  new.subscription_revision := nextval('public.saas_subscription_revision_seq'::regclass);
  return new;
end $$;
revoke all on function public.guard_subscription_authority() from public, anon, authenticated;
drop trigger if exists businesses_subscription_authority on public.businesses;
create trigger businesses_subscription_authority before update of
 subscription_plan_key, subscription_status, billing_interval, trial_starts_at, trial_ends_at,
 current_period_start, current_period_end, cancel_at_period_end, canceled_at,
 stripe_customer_id, stripe_subscription_id, private_alpha_enabled, subscription_revision
 on public.businesses for each row execute function public.guard_subscription_authority();
revoke insert on public.businesses from public, anon, authenticated;
drop policy if exists saas_no_client_business_insert on public.businesses;
create policy saas_no_client_business_insert on public.businesses as restrictive
 for insert to anon, authenticated with check (false);
alter table public.businesses enable row level security;
alter table public.businesses force row level security;

-- Remove every write policy, retaining existing SELECT audiences verbatim.
-- The historical invoice ALL policies supplied owner/member reads as well.
do $$ declare p record; begin
 for p in select policyname, tablename from pg_policies where schemaname = 'public'
   and tablename in ('billing_invoices','subscription_events') and cmd <> 'SELECT'
 loop execute format('drop policy %I on public.%I', p.policyname, p.tablename); end loop;
end $$;
drop policy if exists saas_invoice_owner_reads on public.billing_invoices;
create policy saas_invoice_owner_reads on public.billing_invoices for select to authenticated
 using (public.is_business_owner(business_id));
revoke all on public.billing_invoices, public.subscription_events from public, anon, authenticated;
grant select on public.billing_invoices, public.subscription_events to authenticated;
grant select, insert, update, delete on public.billing_invoices, public.subscription_events, public.businesses to service_role;
alter table public.billing_invoices enable row level security;
alter table public.billing_invoices force row level security;
alter table public.subscription_events enable row level security;
alter table public.subscription_events force row level security;
create unique index if not exists billing_invoices_provider_identity
 on public.billing_invoices(stripe_invoice_id) where stripe_invoice_id is not null;

create table if not exists public.saas_subscription_mappings (
 business_id uuid primary key references public.businesses(id) on delete restrict,
 provider_account text not null check (length(provider_account) > 0),
 livemode boolean not null,
 customer_id text not null check (length(customer_id) > 0),
 subscription_id text not null check (length(subscription_id) > 0),
 price_id text not null check (length(price_id) > 0),
 plan_key text not null references public.subscription_plans(plan_key),
 billing_interval text not null check (billing_interval in ('monthly','yearly')),
 currency text not null check (currency ~ '^[a-z]{3}$'),
 unique(provider_account, livemode, subscription_id),
 unique(provider_account, livemode, customer_id)
);
create table if not exists public.saas_billing_events (
 provider_account text not null,
 livemode boolean not null,
 event_id text not null check (length(event_id) > 0),
 envelope jsonb not null check (jsonb_typeof(envelope) = 'object'),
 state text not null default 'RECEIVED' check (state in
   ('RECEIVED','RETRY_REQUIRED','BLOCKED','APPLIED','IGNORED')),
 reason text,
 received_at timestamptz not null default now(),
 completed_at timestamptz,
 primary key(provider_account, livemode, event_id),
 check ((state in ('APPLIED','IGNORED')) = (completed_at is not null))
);
create index if not exists saas_billing_recovery on public.saas_billing_events(received_at)
 where state in ('RECEIVED','RETRY_REQUIRED','BLOCKED');
alter table public.saas_subscription_mappings enable row level security;
alter table public.saas_subscription_mappings force row level security;
alter table public.saas_billing_events enable row level security;
alter table public.saas_billing_events force row level security;
revoke all on public.saas_subscription_mappings, public.saas_billing_events from public, anon, authenticated;
grant select, insert, update, delete on public.saas_subscription_mappings, public.saas_billing_events to service_role;

-- Mapping maintenance invalidates previously fetched snapshots, including delete/reinsert.
create or replace function public.saas_mapping_revision() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
 if tg_op = 'UPDATE' and new.business_id <> old.business_id then
   raise exception 'Mapping Business identity is immutable';
 end if;
 if tg_op = 'DELETE' then
   update public.businesses set subscription_revision = subscription_revision where id = old.business_id;
   return old;
 end if;
 update public.businesses set subscription_revision = subscription_revision where id = new.business_id;
 return new;
end $$;
revoke all on function public.saas_mapping_revision() from public, anon, authenticated;
drop trigger if exists saas_mapping_revision on public.saas_subscription_mappings;
create trigger saas_mapping_revision after insert or update or delete on public.saas_subscription_mappings
 for each row execute function public.saas_mapping_revision();

-- Trusted synthetic pre-verified input only. Not a webhook/signature verifier.
-- Receipt commit is separate from apply; an existing receipt never means done.
create or replace function public.saas_receive(p jsonb) returns text
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare r public.saas_billing_events%rowtype;
begin
 if current_user <> 'service_role' then raise exception 'Service role required' using errcode = '42501'; end if;
 if nullif(p->>'account','') is null or jsonb_typeof(p->'livemode') is distinct from 'boolean'
   or nullif(p->>'event_id','') is null or nullif(p->>'type','') is null
   or nullif(p->>'customer_id','') is null or nullif(p->>'subscription_id','') is null then
   raise exception 'Invalid synthetic envelope';
 end if;
 insert into public.saas_billing_events(provider_account,livemode,event_id,envelope)
 values(p->>'account',(p->>'livemode')::boolean,p->>'event_id',p) on conflict do nothing;
 select * into strict r from public.saas_billing_events where provider_account=p->>'account'
   and livemode=(p->>'livemode')::boolean and event_id=p->>'event_id' for update;
 if r.envelope <> p then return 'ENVELOPE_MISMATCH'; end if;
 return r.state;
end $$;

create or replace function public.saas_apply(p jsonb, snapshot jsonb, expected_revision bigint) returns text
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
 r public.saas_billing_events%rowtype;
 m public.saas_subscription_mappings%rowtype;
 b public.businesses%rowtype;
 outcome text; why text; invoice_id uuid;
begin
 if current_user <> 'service_role' then raise exception 'Service role required' using errcode = '42501'; end if;
 select * into r from public.saas_billing_events where provider_account=p->>'account'
   and livemode=(p->>'livemode')::boolean and event_id=p->>'event_id' for update;
 if not found then return 'RECEIPT_REQUIRED'; end if;
 if r.envelope <> p then return 'ENVELOPE_MISMATCH'; end if;
 if r.state in ('APPLIED','IGNORED') then return r.state; end if;
 -- Exceptions roll back ALL business/invoice/history effects inside this block,
 -- while leaving a replayable receipt outside it. No raw exception payload stored.
 begin
   if p->>'type' not in ('subscription.updated','invoice.paid') then
     outcome := 'IGNORED'; why := 'UNSUPPORTED_EVENT';
   else
     select * into m from public.saas_subscription_mappings where
       provider_account=p->>'account' and livemode=(p->>'livemode')::boolean
       and subscription_id=p->>'subscription_id' for update;
     if not found then outcome := 'BLOCKED'; why := 'UNKNOWN_MAPPING';
     elsif m.customer_id is distinct from p->>'customer_id'
       or (p->>'metadata_business_id' is not null and p->>'metadata_business_id' <> m.business_id::text) then
       outcome := 'BLOCKED'; why := 'IDENTITY_MISMATCH';
     else
       select * into strict b from public.businesses where id=m.business_id for update;
       if expected_revision is null or b.subscription_revision <> expected_revision then
         outcome := 'RETRY_REQUIRED'; why := 'REVISION_MISMATCH';
       elsif snapshot->>'status' is null then
         outcome := 'BLOCKED'; why := 'MISSING_SNAPSHOT';
       elsif snapshot->>'account' is distinct from m.provider_account
         or snapshot->'livemode' is distinct from to_jsonb(m.livemode)
         or snapshot->>'customer_id' is distinct from m.customer_id
         or snapshot->>'subscription_id' is distinct from m.subscription_id
         or snapshot->>'price_id' is distinct from m.price_id then
         outcome := 'BLOCKED'; why := 'SNAPSHOT_IDENTITY_MISMATCH';
       elsif snapshot->>'status' not in ('trialing','active','past_due','canceled','paused') then
         outcome := 'IGNORED'; why := 'UNSUPPORTED_STATE';
       else
         if p->>'type' = 'invoice.paid' then
           if nullif(p->>'invoice_id','') is null or p->>'currency' is distinct from m.currency
             or (p->>'amount_cents')::integer is null or (p->>'amount_cents')::integer < 0 then
             raise exception 'Invalid invoice';
           end if;
           insert into public.billing_invoices(business_id,invoice_number,status,plan_key,billing_interval,
             amount_cents,currency,stripe_invoice_id,period_start,period_end,paid_at)
           values(m.business_id,'saas:' || (p->>'invoice_id'),'paid',m.plan_key,m.billing_interval,
             (p->>'amount_cents')::integer,m.currency,p->>'invoice_id',
             (snapshot->>'period_start')::timestamptz,(snapshot->>'period_end')::timestamptz,now())
           on conflict (stripe_invoice_id) where stripe_invoice_id is not null do nothing returning id into invoice_id;
           if invoice_id is null then
             -- A duplicate invoice does not update subscription state or append history.
             outcome := 'IGNORED'; why := 'INVOICE_ALREADY_RECORDED';
           end if;
         end if;
         if outcome is null then
           update public.businesses set subscription_plan_key=m.plan_key, billing_interval=m.billing_interval,
             subscription_status=snapshot->>'status', stripe_customer_id=m.customer_id,
             stripe_subscription_id=m.subscription_id,
             current_period_start=(snapshot->>'period_start')::timestamptz,
             current_period_end=(snapshot->>'period_end')::timestamptz,
             trial_starts_at=(snapshot->>'trial_start')::timestamptz,
             trial_ends_at=(snapshot->>'trial_end')::timestamptz,
             cancel_at_period_end=coalesce((snapshot->>'cancel_at_period_end')::boolean,false),
             canceled_at=(snapshot->>'canceled_at')::timestamptz, updated_at=now()
             where id=m.business_id;
           insert into public.subscription_events(business_id,event_type,from_plan_key,to_plan_key,
             from_status,to_status,currency,metadata)
           values(m.business_id,case when p->>'type'='invoice.paid' then 'invoice_paid' else 'interval_changed' end,
             b.subscription_plan_key,m.plan_key,b.subscription_status,snapshot->>'status',m.currency,
             jsonb_build_object('source','synthetic_preverified','event_id',p->>'event_id'));
           outcome := 'APPLIED';
         end if;
       end if;
     end if;
   end if;
 exception when others then outcome := 'BLOCKED'; why := 'APPLY_FAILED';
 end;
 update public.saas_billing_events set state=outcome,reason=why,
   completed_at=case when outcome in ('APPLIED','IGNORED') then now() else null end
 where provider_account=r.provider_account and livemode=r.livemode and event_id=r.event_id;
 return outcome;
end $$;
revoke all on function public.saas_receive(jsonb), public.saas_apply(jsonb,jsonb,bigint) from public, anon, authenticated;
grant execute on function public.saas_receive(jsonb), public.saas_apply(jsonb,jsonb,bigint) to service_role;
