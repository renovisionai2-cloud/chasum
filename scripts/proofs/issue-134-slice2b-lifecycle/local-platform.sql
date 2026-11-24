-- New synthetic local platform only; no hosted-role equivalence claim.
create role anon nologin nosuperuser nobypassrls;
create role authenticated nologin nosuperuser nobypassrls;
create role service_role nologin nosuperuser bypassrls;
create role authenticator login nosuperuser nobypassrls noinherit;
grant anon, authenticated, service_role to authenticator;
create schema auth;
create table auth.users(id uuid primary key, email text, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as
$$ select nullif(current_setting('request.jwt.claim.role',true),'') $$;
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on all functions in schema auth to anon,authenticated,service_role;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql immutable as
$$ select string_to_array($1,'/') $$;
-- Explicit synthetic operational baseline: DML, no TRUNCATE/TRIGGER/CREATE.
-- Actual hosted default ACL/capability verification remains a separate gate.
alter default privileges in schema public grant select,insert,update,delete on tables to service_role;
alter default privileges in schema public grant select,insert,update,delete on tables to authenticated;
alter default privileges in schema public grant usage,select on sequences to service_role;
