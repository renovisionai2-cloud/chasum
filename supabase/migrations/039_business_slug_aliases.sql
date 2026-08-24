-- 039_business_slug_aliases
-- Generic public-booking slug alias registry.
--
-- Separates immutable tenant identity (businesses.id) from human-readable
-- public URL identity (businesses.slug + historical aliases).
--
-- This file contains generic slug-alias infrastructure only. It inserts
-- NO tenant-specific rows.
--
-- Staging validation is complete (profile save, slug rename/alias capture,
-- redirect, TG_OP correction, two-session concurrency / SQLSTATE 23505,
-- synthetic cleanup).
--
-- Production application requires explicit Product Owner approval and
-- controlled verification. Applying this migration does NOT authorize
-- the separate GVM tenant-identity data remediation.
--
-- Next safe identifier is 039: docs record 037 and 038 as APPLIED + VERIFIED
-- on Staging/Production even though those files are not in this tree.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists business_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete restrict,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint business_slug_aliases_slug_not_blank check (length(trim(slug)) > 0)
);

comment on table business_slug_aliases is
  'Historical public booking slugs. Immutable once assigned. Never reassign to another business.';

comment on column business_slug_aliases.business_id is
  'Authoritative tenant id. Alias resolution must load this business, then use businesses.slug as canonical.';

comment on column business_slug_aliases.slug is
  'Retired public slug. Unique globally. Must never equal any current businesses.slug.';

create unique index if not exists business_slug_aliases_slug_key
  on business_slug_aliases (slug);

create index if not exists business_slug_aliases_business_id_idx
  on business_slug_aliases (business_id);

-- ---------------------------------------------------------------------------
-- Cross-table uniqueness + immutability
--
-- Trigger functions are SECURITY DEFINER with a pinned search_path so
-- authenticated Business Profile saves (which always include slug, even when
-- unchanged) can fire UPDATE OF slug without the invoker needing INSERT/
-- UPDATE/DELETE on business_slug_aliases. Direct client writes stay revoked.
--
-- Same-tenant reclaim (foo → bar → foo) deletes the alias row for foo because
-- foo is canonical again. That is the narrow exception to alias-row
-- immutability: the identifier is not unreserved; it is the current slug.
-- ---------------------------------------------------------------------------

-- Transaction-scoped per-slug lock shared by businesses.slug and alias writes.
create or replace function lock_business_slug_namespace(p_slug text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return;
  end if;
  -- key1 namespaces this lock class; key2 is the slug hash so unrelated slugs
  -- do not serialize. Xact-scoped: released at commit/rollback.
  perform pg_advisory_xact_lock(
    hashtext('chasum.business_slug_namespace'),
    hashtext(p_slug)
  );
end;
$$;

create or replace function lock_business_slug_namespace_pair(p_left text, p_right text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_left is null or p_right is null or p_left = p_right then
    perform lock_business_slug_namespace(coalesce(p_left, p_right));
    return;
  end if;
  -- Stable lock order avoids deadlock when two tenants swap/claim overlapping slugs.
  if p_left < p_right then
    perform lock_business_slug_namespace(p_left);
    perform lock_business_slug_namespace(p_right);
  else
    perform lock_business_slug_namespace(p_right);
    perform lock_business_slug_namespace(p_left);
  end if;
end;
$$;

create or replace function enforce_business_slug_namespace()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- PostgreSQL TG_OP is INSERT, UPDATE, DELETE, or TRUNCATE (always uppercase).
  if tg_table_name = 'business_slug_aliases' then
    if tg_op = 'UPDATE' then
      perform lock_business_slug_namespace_pair(old.slug, new.slug);
      if new.slug is distinct from old.slug
         or new.business_id is distinct from old.business_id then
        raise exception 'business_slug_aliases rows are immutable'
          using errcode = '22023';
      end if;
    else
      perform lock_business_slug_namespace(new.slug);
    end if;

    if exists (
      select 1 from businesses b
      where b.slug = new.slug
    ) then
      raise exception 'slug % is the current canonical slug of a business', new.slug
        using errcode = '23505';
    end if;
  elsif tg_table_name = 'businesses' and new.slug is not null then
    if tg_op = 'UPDATE' then
      perform lock_business_slug_namespace_pair(old.slug, new.slug);
    else
      perform lock_business_slug_namespace(new.slug);
    end if;

    if exists (
      select 1 from business_slug_aliases a
      where a.slug = new.slug
        and a.business_id is distinct from new.id
    ) then
      raise exception 'slug % is reserved as a historical alias of another business', new.slug
        using errcode = '23505';
    end if;

    -- Reclaiming this tenant's own historical alias as the current slug:
    -- drop the alias row so current slug and alias namespace never overlap.
    delete from business_slug_aliases
    where slug = new.slug
      and business_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function record_business_slug_alias()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- PostgreSQL TG_OP is INSERT, UPDATE, DELETE, or TRUNCATE (always uppercase).
  if tg_op = 'UPDATE'
     and old.slug is not null
     and new.slug is distinct from old.slug then
    perform lock_business_slug_namespace_pair(old.slug, new.slug);
    begin
      insert into business_slug_aliases (business_id, slug)
      values (old.id, old.slug);
    exception
      when unique_violation then
        if not exists (
          select 1
          from business_slug_aliases
          where slug = old.slug
            and business_id = old.id
        ) then
          raise;
        end if;
    end;
  end if;
  return new;
end;
$$;

revoke all on function lock_business_slug_namespace(text) from public;
revoke all on function lock_business_slug_namespace_pair(text, text) from public;
revoke all on function enforce_business_slug_namespace() from public;
revoke all on function record_business_slug_alias() from public;

drop trigger if exists business_slug_aliases_enforce_namespace on business_slug_aliases;
create trigger business_slug_aliases_enforce_namespace
  before insert or update on business_slug_aliases
  for each row
  execute function enforce_business_slug_namespace();

drop trigger if exists businesses_slug_namespace on businesses;
create trigger businesses_slug_namespace
  before insert or update of slug on businesses
  for each row
  execute function enforce_business_slug_namespace();

drop trigger if exists businesses_record_slug_alias on businesses;
create trigger businesses_record_slug_alias
  after update of slug on businesses
  for each row
  execute function record_business_slug_alias();

-- ---------------------------------------------------------------------------
-- RLS: public read (same posture as businesses); writes via service role / triggers
-- ---------------------------------------------------------------------------

alter table business_slug_aliases enable row level security;

drop policy if exists "Public can view business slug aliases" on business_slug_aliases;
create policy "Public can view business slug aliases"
  on business_slug_aliases for select
  using (true);

grant select on table business_slug_aliases to anon, authenticated;
grant select, insert, update, delete on table business_slug_aliases to service_role;
revoke insert, update, delete on table business_slug_aliases from anon, authenticated;

-- Future deletion implication (not implemented):
-- businesses ON DELETE RESTRICT while aliases exist, so a tenant cannot be
-- removed until aliases are deliberately retired by a future ops process.
-- Do not drop alias rows to "free" a slug for another tenant.
