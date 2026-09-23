-- Issue #73: separately approved Staff quota prerequisite. CODE-ONLY candidate.
-- Apply the exact body in ONE transaction only after a separate hosted gate.
-- Requires accepted Stage 1B tenant-key immutability; never replay 034-036.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Seed only a newly added column. A rerun accepts canonical truth but never
-- silently overwrites an unexpected existing entitlement (including NULL).
do $staff_plan$
declare
  v_new boolean;
  v_plan record;
  v_current integer;
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.staff'::regclass
      and tgname = 'staff_business_id_immutable'
      and tgenabled in ('O', 'A')
      and tgfoid = 'public.prevent_business_id_reassignment()'::regprocedure
  ) then
    raise exception 'Staff tenant-key guard prerequisite is missing.';
  end if;

  select not exists (
    select 1 from pg_attribute
    where attrelid = 'public.subscription_plans'::regclass
      and attname = 'max_staff' and not attisdropped
  ) into v_new;

  alter table public.subscription_plans add column if not exists max_staff integer;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.subscription_plans'::regclass
      and attname = 'max_staff' and not attisdropped
      and atttypid = 'integer'::regtype and not attnotnull
      and not atthasdef and attidentity = '' and attgenerated = ''
  ) then
    raise exception 'Unexpected max_staff column definition; review required.';
  end if;

  for v_plan in
    select * from (values
      ('starter', 1),
      ('professional', 3),
      ('business', NULL::integer),
      ('enterprise', NULL::integer)
    ) as canonical(plan_key, max_staff)
  loop
    select sp.max_staff into v_current
    from public.subscription_plans sp
    where sp.plan_key = v_plan.plan_key and sp.is_active = true
    for update;
    if not found then
      raise exception 'Required active Staff plan is missing: %', v_plan.plan_key;
    end if;
    if v_new then
      update public.subscription_plans set max_staff = v_plan.max_staff
      where plan_key = v_plan.plan_key;
    elsif v_current is distinct from v_plan.max_staff then
      raise exception 'Unexpected max_staff for plan %; review required.', v_plan.plan_key;
    end if;
  end loop;
end
$staff_plan$;

-- Same Business-row serialization as Stage 1C Locations. The separate count
-- statement takes a fresh READ COMMITTED snapshot after any lock wait.
-- SECURITY DEFINER counts all Staff, independent of the writer's RLS view.
create or replace function public.enforce_staff_quota()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan_key text;
  v_max integer;
  v_active bigint;
begin
  if new.is_active is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.is_active is true then
    return new;
  end if;

  select coalesce(b.subscription_plan_key, 'starter') into v_plan_key
  from public.businesses b where b.id = new.business_id
  for update;
  if not found or v_plan_key not in ('starter', 'professional', 'business', 'enterprise') then
    raise exception 'Staff capacity is unavailable. Please try again.' using errcode = 'P0001';
  end if;

  select sp.max_staff into v_max
  from public.subscription_plans sp
  where sp.plan_key = v_plan_key and sp.is_active = true;
  if not found then
    raise exception 'Staff capacity is unavailable. Please try again.' using errcode = 'P0001';
  end if;
  if v_max is null then
    return new;
  end if;

  -- A lock alone cannot refresh a REPEATABLE READ/SERIALIZABLE snapshot.
  -- Fail closed for finite seat consumption instead of admitting a stale count.
  if current_setting('transaction_isolation') not in ('read committed', 'read uncommitted') then
    raise exception 'Staff changes require a fresh transaction. Please try again.' using errcode = '0A000';
  end if;

  select count(*) into v_active from public.staff s
  where s.business_id = new.business_id and s.is_active = true;
  if v_active >= v_max then
    raise exception 'STAFF_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_staff_quota()
  from public, anon, authenticated, service_role;

drop trigger if exists staff_enforce_plan_quota on public.staff;
create trigger staff_enforce_plan_quota
before insert or update of is_active on public.staff
for each row execute function public.enforce_staff_quota();
