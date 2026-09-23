-- Issue #73 C1 / Level 3. Additive, exact body in ONE transaction, DB FIRST.
-- No hosted application authorization. Requires accepted B1; does not alter B1/B2.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname like 'c1\_%' escape '\') then
    raise exception 'C1_EXISTING_HELPER_REVIEW_REQUIRED';
  end if;
end $$;

create table public.data_import_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  source_system text not null check (length(source_system) between 1 and 200
    and source_system = btrim(source_system, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') and source_system !~ '[[:cntrl:]]'),
  source_account_key text not null default gen_random_uuid()::text
    check (source_account_key ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'),
  display_label text not null check (length(display_label) between 1 and 120
    and display_label = btrim(display_label, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') and display_label !~ '[[:cntrl:]]'),
  created_at timestamptz not null default clock_timestamp() check (isfinite(created_at)),
  updated_at timestamptz not null default clock_timestamp() check (isfinite(updated_at) and updated_at >= created_at),
  unique (business_id, source_system, source_account_key),
  unique (id, business_id)
);
create index data_import_sources_creator_idx on public.data_import_sources(created_by);

create table public.data_import_artifacts (
  id uuid primary key,
  -- RESTRICT is intentional: offboarding must confirm Storage cleanup, then
  -- explicitly purge deleted artifact metadata before deleting the Business.
  business_id uuid not null references public.businesses(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  source_id uuid not null,
  entity_type text not null check (entity_type in ('location','service','staff','customer','appointment')),
  state text not null default 'upload_pending'
    check (state in ('upload_pending','raw_verified','freezing','reviewed_frozen','cleanup_pending','deleted')),
  raw_object_key text not null unique,
  raw_sha256 text check (raw_sha256 ~ '^[a-f0-9]{64}$'),
  raw_size_bytes bigint check (raw_size_bytes between 1 and 10485760),
  raw_media_type text check (raw_media_type in ('text/csv','text/plain','application/csv','application/vnd.ms-excel','application/octet-stream')),
  raw_expires_at timestamptz not null,
  -- Fixed provider token lifetime (2h), plus 5m issuance/quiescence margin.
  -- Never finalize raw deletion before this time: early deletion permits replay.
  upload_quiesce_at timestamptz not null,
  raw_deleted_at timestamptz,
  reviewed_object_key text unique,
  reviewed_sha256 text check (reviewed_sha256 ~ '^[a-f0-9]{64}$'),
  reviewed_size_bytes bigint check (reviewed_size_bytes between 1 and 10485760),
  reviewed_preview_hash text check (reviewed_preview_hash ~ '^[a-f0-9]{64}$'),
  reviewed_snapshot_hash text check (reviewed_snapshot_hash ~ '^[a-f0-9]{64}$'),
  reviewed_frozen_at timestamptz,
  reviewed_expires_at timestamptz,
  reviewed_deleted_at timestamptz,
  import_run_id uuid unique references public.data_import_runs(id) on delete restrict,
  lease_token uuid,
  lease_expires_at timestamptz,
  cleanup_after timestamptz,
  cleanup_attempts integer not null default 0 check (cleanup_attempts >= 0),
  cleanup_failed boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  foreign key (source_id,business_id) references public.data_import_sources(id,business_id) on delete restrict,
  check (raw_object_key ~ ('^' || business_id::text || '/' || id::text || '/raw/[a-f0-9-]{36}$')),
  check (reviewed_object_key ~ ('^' || business_id::text || '/' || id::text || '/reviewed/[a-f0-9-]{36}$')),
  check (isfinite(created_at) and isfinite(updated_at) and updated_at >= created_at),
  check (raw_expires_at = created_at + interval '24 hours'),
  check (upload_quiesce_at = created_at + interval '2 hours 5 minutes'),
  check (raw_deleted_at is null or (isfinite(raw_deleted_at) and raw_deleted_at >= upload_quiesce_at)),
  check ((raw_sha256 is null and raw_size_bytes is null and raw_media_type is null)
    or (raw_sha256 is not null and raw_size_bytes is not null and raw_media_type is not null)),
  check ((reviewed_object_key is null and reviewed_sha256 is null and reviewed_size_bytes is null
      and reviewed_preview_hash is null and reviewed_snapshot_hash is null
      and reviewed_frozen_at is null and reviewed_expires_at is null and reviewed_deleted_at is null)
    or (reviewed_object_key is not null and reviewed_sha256 is not null and reviewed_size_bytes is not null
      and reviewed_preview_hash is not null and reviewed_snapshot_hash is not null
      and reviewed_frozen_at is not null and isfinite(reviewed_frozen_at) and reviewed_frozen_at >= created_at
      and reviewed_expires_at is not null and reviewed_expires_at = reviewed_frozen_at + interval '72 hours')),
  check (reviewed_deleted_at is null or (isfinite(reviewed_deleted_at) and reviewed_deleted_at >= reviewed_frozen_at)),
  check ((lease_token is null) = (lease_expires_at is null)),
  check (lease_expires_at is null or isfinite(lease_expires_at)),
  check (cleanup_after is null or isfinite(cleanup_after)),
  check (state not in ('raw_verified','freezing','reviewed_frozen') or raw_sha256 is not null),
  check (state<>'upload_pending' or raw_sha256 is null),
  check (state not in ('upload_pending','raw_verified') or reviewed_object_key is null),
  check (state not in ('freezing','reviewed_frozen') or reviewed_object_key is not null),
  check (import_run_id is null or (reviewed_object_key is not null and state in ('reviewed_frozen','cleanup_pending','deleted'))),
  check (raw_deleted_at is null or state in ('reviewed_frozen','cleanup_pending','deleted')),
  check (reviewed_deleted_at is null or state in ('cleanup_pending','deleted')),
  check ((state = 'deleted') = (deleted_at is not null)),
  check (deleted_at is null or (isfinite(deleted_at) and raw_deleted_at is not null
    and (reviewed_object_key is null or reviewed_deleted_at is not null)))
);
create index data_import_artifacts_business_idx on public.data_import_artifacts(business_id,created_at);
create index data_import_artifacts_source_idx on public.data_import_artifacts(source_id,business_id);
create index data_import_artifacts_creator_idx on public.data_import_artifacts(created_by);
create index data_import_artifacts_cleanup_idx on public.data_import_artifacts(cleanup_after,raw_expires_at);

-- Guard privileged accidents too. API roles cannot write either table directly.
create function public.c1_guard_source() returns trigger
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if tg_op='UPDATE' then raise exception 'C1_IMMUTABLE'; end if;
  return new;
end $$;
create trigger c1_source_guard before update on public.data_import_sources
for each row execute function public.c1_guard_source();

create function public.c1_guard_artifact() returns trigger
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
declare s public.data_import_sources; r public.data_import_runs;
begin
  if tg_op='DELETE' then
    if old.state <> 'deleted' then raise exception 'C1_CLEANUP_REQUIRED'; end if;
    return old;
  end if;
  if tg_op='INSERT' then
    if new.state <> 'upload_pending' or new.raw_sha256 is not null or new.reviewed_object_key is not null
      or new.import_run_id is not null or new.raw_deleted_at is not null or new.deleted_at is not null then
      raise exception 'C1_INVALID_STATE'; end if;
  else
    if row(new.id,new.business_id,new.created_by,new.source_id,new.entity_type,new.raw_object_key,new.created_at,new.raw_expires_at,new.upload_quiesce_at)
      is distinct from row(old.id,old.business_id,old.created_by,old.source_id,old.entity_type,old.raw_object_key,old.created_at,old.raw_expires_at,old.upload_quiesce_at)
      or (old.state='deleted' and (new.state<>'deleted' or new.deleted_at is distinct from old.deleted_at)) then raise exception 'C1_IMMUTABLE'; end if;
    if new.state <> old.state and not (
      (old.state='upload_pending' and new.state in ('raw_verified','cleanup_pending')) or
      (old.state='raw_verified' and new.state in ('freezing','cleanup_pending')) or
      (old.state='freezing' and new.state in ('reviewed_frozen','cleanup_pending')) or
      (old.state='reviewed_frozen' and new.state='cleanup_pending') or
      (old.state='cleanup_pending' and new.state='deleted')) then raise exception 'C1_INVALID_STATE'; end if;
    if (old.raw_sha256 is not null and row(new.raw_sha256,new.raw_size_bytes,new.raw_media_type)
      is distinct from row(old.raw_sha256,old.raw_size_bytes,old.raw_media_type))
      or (old.reviewed_object_key is not null and row(new.reviewed_object_key,new.reviewed_sha256,new.reviewed_size_bytes,
        new.reviewed_preview_hash,new.reviewed_snapshot_hash,new.reviewed_frozen_at,new.reviewed_expires_at)
        is distinct from row(old.reviewed_object_key,old.reviewed_sha256,old.reviewed_size_bytes,
        old.reviewed_preview_hash,old.reviewed_snapshot_hash,old.reviewed_frozen_at,old.reviewed_expires_at))
      or (old.import_run_id is not null and new.import_run_id is distinct from old.import_run_id)
      or (old.raw_deleted_at is not null and new.raw_deleted_at is distinct from old.raw_deleted_at)
      or (old.reviewed_deleted_at is not null and new.reviewed_deleted_at is distinct from old.reviewed_deleted_at)
      then raise exception 'C1_IMMUTABLE'; end if;
  end if;
  if new.import_run_id is not null then
    select * into s from public.data_import_sources where id=new.source_id and business_id=new.business_id for share;
    select * into r from public.data_import_runs where id=new.import_run_id for share;
    if r.id is null or row(r.business_id,r.created_by,r.source_system,r.source_account_key,r.input_checksum,r.preview_hash,r.snapshot_hash)
      is distinct from row(new.business_id,new.created_by,s.source_system,s.source_account_key,new.raw_sha256,new.reviewed_preview_hash,new.reviewed_snapshot_hash)
      then raise exception 'C1_RUN_MISMATCH'; end if;
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end $$;
create trigger c1_artifact_guard before insert or update or delete on public.data_import_artifacts
for each row execute function public.c1_guard_artifact();

create function public.c1_require_owner(p_business uuid,p_actor uuid) returns void
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if current_setting('transaction_isolation') not in ('read committed','read uncommitted') then raise exception 'C1_FRESH_TRANSACTION_REQUIRED'; end if;
  perform 1 from public.businesses where id=p_business and owner_id=p_actor for share;
  if not found or p_actor is null then raise exception 'C1_OWNER_REQUIRED' using errcode='42501'; end if;
end $$;

create function public.c1_create_source(p_business uuid,p_actor uuid,p_system text,p_label text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s public.data_import_sources;
begin
  perform public.c1_require_owner(p_business,p_actor);
  insert into public.data_import_sources(business_id,created_by,source_system,display_label)
    values(p_business,p_actor,p_system,p_label) returning * into s;
  return jsonb_build_object('id',s.id,'sourceSystem',s.source_system,'displayLabel',s.display_label,'createdAt',s.created_at);
end $$;
create function public.c1_list_sources(p_business uuid,p_actor uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
begin
  perform public.c1_require_owner(p_business,p_actor);
  return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'sourceSystem',s.source_system,'displayLabel',s.display_label,'createdAt',s.created_at) order by s.created_at,s.id)
    from public.data_import_sources s where business_id=p_business),'[]'::jsonb);
end $$;

create function public.c1_create_artifact(p_business uuid,p_actor uuid,p_source uuid,p_entity text) returns public.data_import_artifacts
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; aid uuid:=gen_random_uuid(); t timestamptz;
begin
  perform public.c1_require_owner(p_business,p_actor);
  t:=clock_timestamp();
  insert into public.data_import_artifacts(id,business_id,created_by,source_id,entity_type,raw_object_key,created_at,raw_expires_at,upload_quiesce_at)
    values(aid,p_business,p_actor,p_source,p_entity,p_business::text || '/' || aid::text || '/raw/' || gen_random_uuid()::text,t,t+interval '24 hours',t+interval '2 hours 5 minutes') returning * into a;
  return a;
end $$;

-- Single expiry calculation, shared by reads, binding, and cleanup. B1 remains
-- sole authority for run lifecycle. NULL run => hard ceiling, never indefinite.
create function public.c1_reviewed_deadline(a public.data_import_artifacts) returns timestamptz
language sql stable security invoker set search_path=pg_catalog,pg_temp as $$
  select least(a.reviewed_expires_at,(select finished_at + interval '1 hour' from public.data_import_runs where id=a.import_run_id))
$$;

-- Internal to server C2/C3 callers: returns private metadata + source namespace.
-- No signed downloads and no browser direct access.
create function public.c1_access_artifact(p_business uuid,p_actor uuid,p_artifact uuid,p_kind text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; s public.data_import_sources;
begin
  perform public.c1_require_owner(p_business,p_actor);
  select * into a from public.data_import_artifacts where id=p_artifact and business_id=p_business and created_by=p_actor for share;
  if not found then raise exception 'C1_OWNER_REQUIRED' using errcode='42501'; end if;
  if p_kind='raw' then
    if a.state not in ('upload_pending','raw_verified') or a.raw_expires_at <= clock_timestamp() or a.raw_deleted_at is not null then raise exception 'C1_UNAVAILABLE'; end if;
  elsif p_kind='reviewed' then
    if a.state <> 'reviewed_frozen' or public.c1_reviewed_deadline(a) <= clock_timestamp() or a.reviewed_deleted_at is not null then raise exception 'C1_UNAVAILABLE'; end if;
  else raise exception 'C1_INVALID_INPUT'; end if;
  select * into s from public.data_import_sources where id=a.source_id;
  return to_jsonb(a) || jsonb_build_object('source_system',s.source_system,'source_account_key',s.source_account_key);
end $$;

create function public.c1_verify_raw(p_business uuid,p_actor uuid,p_artifact uuid,p_sha text,p_size bigint,p_media text) returns void
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts;
begin
  perform public.c1_require_owner(p_business,p_actor);
  select * into a from public.data_import_artifacts where id=p_artifact and business_id=p_business and created_by=p_actor for update;
  if a.id is null or a.state<>'upload_pending' or a.raw_expires_at<=clock_timestamp() then raise exception 'C1_UNAVAILABLE'; end if;
  update public.data_import_artifacts set state='raw_verified',raw_sha256=p_sha,raw_size_bytes=p_size,raw_media_type=p_media
    where id=a.id;
end $$;

-- Reserve exact hash/key BEFORE writing Storage. Interrupted freezes are reaped;
-- they can never be replaced with a different operational plan.
create function public.c1_reserve_reviewed(p_business uuid,p_actor uuid,p_artifact uuid,p_sha text,p_size bigint,p_preview text,p_snapshot text) returns public.data_import_artifacts
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; t timestamptz;
begin
  perform public.c1_require_owner(p_business,p_actor);
  select * into a from public.data_import_artifacts where id=p_artifact and business_id=p_business and created_by=p_actor for update;
  t:=clock_timestamp();
  if a.id is null or a.state<>'raw_verified' or a.raw_expires_at<=t then raise exception 'C1_UNAVAILABLE'; end if;
  update public.data_import_artifacts set state='freezing',reviewed_object_key=p_business::text || '/' || a.id::text || '/reviewed/' || gen_random_uuid()::text,
    reviewed_sha256=p_sha,reviewed_size_bytes=p_size,reviewed_preview_hash=p_preview,reviewed_snapshot_hash=p_snapshot,
    reviewed_frozen_at=t,reviewed_expires_at=t+interval '72 hours',lease_token=gen_random_uuid(),lease_expires_at=t+interval '5 minutes'
    where id=a.id returning * into a;
  return a;
end $$;
create function public.c1_finish_reviewed(p_business uuid,p_actor uuid,p_artifact uuid,p_token uuid) returns void
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts;
begin
  perform public.c1_require_owner(p_business,p_actor);
  select * into a from public.data_import_artifacts where id=p_artifact and business_id=p_business and created_by=p_actor for update;
  if a.id is null or a.state<>'freezing' or p_token is null or a.lease_token is distinct from p_token
    or a.lease_expires_at<=clock_timestamp() then raise exception 'C1_UNAVAILABLE'; end if;
  update public.data_import_artifacts set state='reviewed_frozen',lease_token=null,lease_expires_at=null,cleanup_after=clock_timestamp()
    where id=a.id;
end $$;

create function public.c1_bind_run(p_business uuid,p_actor uuid,p_artifact uuid,p_run uuid) returns void
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; r public.data_import_runs;
begin
  perform public.c1_require_owner(p_business,p_actor);
  -- B2 uses Business -> run. Acquire run before artifact to avoid lock inversion.
  select * into r from public.data_import_runs where id=p_run for share;
  select * into a from public.data_import_artifacts where id=p_artifact and business_id=p_business and created_by=p_actor for update;
  if a.id is null or a.state<>'reviewed_frozen' or public.c1_reviewed_deadline(a)<=clock_timestamp()
    or r.id is null or r.state not in ('previewed','committing') then raise exception 'C1_UNAVAILABLE'; end if;
  update public.data_import_artifacts set import_run_id=p_run where id=a.id;
  -- Trigger checks full namespace, creator, checksum and reviewed hashes.
end $$;

-- Bounded independent claims; expired leases rotate the fence. Cleanup never
-- changes B1 state, including a committing run that outlives the hard ceiling.
create function public.c1_claim_cleanup(p_limit integer default 25,p_artifact uuid default null) returns setof jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; t timestamptz; all_due boolean; raw_due boolean; reviewed_due boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>25 then raise exception 'C1_INVALID_INPUT'; end if;
  for a in select x.* from public.data_import_artifacts x
    where (p_artifact is null or x.id=p_artifact)
      and (x.lease_expires_at is null or x.lease_expires_at<=clock_timestamp())
      and (x.cleanup_after is null or x.cleanup_after<=clock_timestamp())
      and (x.state in ('freezing','cleanup_pending','deleted','reviewed_frozen') or
        (x.raw_deleted_at is null and (x.reviewed_frozen_at is not null or x.raw_expires_at<=clock_timestamp())) or
        (x.reviewed_object_key is not null and x.reviewed_deleted_at is null and public.c1_reviewed_deadline(x)<=clock_timestamp()))
    order by (x.state='deleted'),coalesce(x.cleanup_after,x.raw_expires_at),x.id for update skip locked limit p_limit
  loop
    t:=clock_timestamp();
    all_due:=a.state in ('freezing','cleanup_pending') or
      (a.reviewed_object_key is null and a.raw_expires_at<=t) or
      (a.reviewed_object_key is not null and public.c1_reviewed_deadline(a)<=t);
    -- Tombstones stay discoverable: aborting a client request is not proof the
    -- provider canceled an accepted write. Reap any very late completion too.
    raw_due:=true;
    reviewed_due:=(all_due or a.state='deleted') and a.reviewed_object_key is not null;
    update public.data_import_artifacts set state=case when all_due and state<>'deleted' then 'cleanup_pending' else state end,
      lease_token=gen_random_uuid(),lease_expires_at=t+interval '5 minutes',
      cleanup_attempts=cleanup_attempts+1,cleanup_after=null where id=a.id returning * into a;
    return next to_jsonb(a) || jsonb_build_object('raw_due',raw_due,'reviewed_due',reviewed_due);
  end loop;
end $$;

create function public.c1_finish_cleanup(p_artifact uuid,p_token uuid,p_raw_deleted boolean,p_reviewed_deleted boolean) returns void
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare a public.data_import_artifacts; t timestamptz;
begin
  select * into a from public.data_import_artifacts where id=p_artifact for update;
  t:=clock_timestamp();
  if a.id is null or a.lease_token is distinct from p_token or p_token is null or a.lease_expires_at<=t then raise exception 'C1_LEASE_LOST'; end if;
  if p_raw_deleted is null or p_reviewed_deleted is null or a.state='freezing' then raise exception 'C1_INVALID_INPUT'; end if;
  -- Never mark a reviewed plan gone on an early raw-only cleanup claim.
  if p_reviewed_deleted and a.state not in ('cleanup_pending','deleted') then raise exception 'C1_INVALID_INPUT'; end if;
  update public.data_import_artifacts set
    -- Claim itself must postdate token expiry. A delayed finish RPC must not
    -- turn an earlier absence observation into proof after quiescence.
    raw_deleted_at=case when p_raw_deleted and a.lease_expires_at-interval '5 minutes'>=upload_quiesce_at then coalesce(raw_deleted_at,t) else raw_deleted_at end,
    reviewed_deleted_at=case when p_reviewed_deleted and reviewed_object_key is not null then coalesce(reviewed_deleted_at,t) else reviewed_deleted_at end,
    cleanup_failed=not p_raw_deleted or (a.state in ('cleanup_pending','deleted') and a.reviewed_object_key is not null and not p_reviewed_deleted),
    cleanup_after=case when a.state='deleted' and p_raw_deleted and (a.reviewed_object_key is null or p_reviewed_deleted) then t+interval '24 hours'
      when p_raw_deleted and a.lease_expires_at-interval '5 minutes'<upload_quiesce_at then greatest(t,least(upload_quiesce_at,t+interval '1 hour')) else t+interval '1 hour' end,
    lease_token=null,lease_expires_at=null where id=a.id returning * into a;
  if a.state='cleanup_pending' and p_raw_deleted and a.raw_deleted_at is not null
    and (a.reviewed_object_key is null or (p_reviewed_deleted and a.reviewed_deleted_at is not null)) then
    update public.data_import_artifacts set state='deleted',deleted_at=t,cleanup_after=t+interval '24 hours',cleanup_failed=false where id=a.id;
  end if;
end $$;

alter table public.data_import_sources enable row level security;
alter table public.data_import_sources force row level security;
alter table public.data_import_artifacts enable row level security;
alter table public.data_import_artifacts force row level security;
revoke all on public.data_import_sources,public.data_import_artifacts from public,anon,authenticated,service_role;
grant select on public.data_import_sources,public.data_import_artifacts to service_role;
-- No client policies, no direct service mutation, no generic object proxy.
do $$
declare f record; role_name text; table_name text; privilege_name text; allowed boolean;
begin
  for f in select oid,proname,oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname like 'c1\_%' escape '\' loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    allowed:=f.proname in ('c1_create_source','c1_list_sources','c1_create_artifact','c1_access_artifact','c1_verify_raw','c1_reserve_reviewed','c1_finish_reviewed','c1_bind_run','c1_claim_cleanup','c1_finish_cleanup');
    if allowed then execute format('grant execute on function %s to service_role',f.signature); end if;
    foreach role_name in array array['anon','authenticated','service_role'] loop
      if has_function_privilege(role_name,f.oid,'EXECUTE') is distinct from (allowed and role_name='service_role') then raise exception 'C1_ACL_DRIFT'; end if;
    end loop;
  end loop;
  foreach role_name in array array['anon','authenticated','service_role'] loop
    foreach table_name in array array['data_import_sources','data_import_artifacts'] loop
      foreach privilege_name in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        if has_table_privilege(role_name,'public.'||table_name,privilege_name) is distinct from (role_name='service_role' and privilege_name='SELECT') then raise exception 'C1_ACL_DRIFT'; end if;
      end loop;
    end loop;
  end loop;
end $$;

-- Fail on existing-bucket drift, rather than silently making a populated bucket
-- private. No storage.objects policy is added or broadened.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('import-artifacts','import-artifacts',false,10485760,
  array['text/csv','text/plain','application/csv','application/vnd.ms-excel','application/octet-stream','application/json']);
do $$
begin
  if not exists(select 1 from storage.buckets where id='import-artifacts' and name='import-artifacts' and public=false and file_size_limit=10485760) then raise exception 'C1_BUCKET_DRIFT'; end if;
end $$;
