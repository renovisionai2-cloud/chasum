-- 039_business_slug_aliases
-- Generic public-booking slug alias registry.
--
-- Separates immutable tenant identity (businesses.id) from human-readable
-- public URL identity (businesses.slug + historical aliases).
--
-- DO NOT apply this migration to Production as part of the GVM identity
-- incident. Staging/Preview only after review. This file inserts NO tenant rows.
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
-- ---------------------------------------------------------------------------

create or replace function enforce_business_slug_namespace()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'business_slug_aliases' then
    if tg_op = 'update' and (
      new.slug is distinct from old.slug
      or new.business_id is distinct from old.business_id
    ) then
      raise exception 'business_slug_aliases rows are immutable'
        using errcode = '22023';
    end if;

    if exists (
      select 1 from businesses b
      where b.slug = new.slug
    ) then
      raise exception 'slug % is the current canonical slug of a business', new.slug
        using errcode = '23505';
    end if;
  elsif tg_table_name = 'businesses' and new.slug is not null then
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
as $$
begin
  if tg_op = 'update'
     and old.slug is not null
     and new.slug is distinct from old.slug then
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

-- Future deletion implication (not implemented):
-- businesses ON DELETE RESTRICT while aliases exist, so a tenant cannot be
-- removed until aliases are deliberately retired by a future ops process.
-- Do not drop alias rows to "free" a slug for another tenant.
