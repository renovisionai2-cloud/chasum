-- TEST ONLY: source overlay behavior with null offers. No offer assignment.
-- Model ONLY the dated effective usage_events grants reported in ../inputs.
-- The source's GRANT SELECT/INSERT does not revoke broader existing rights.
-- This synthetic fixture grant is not an ACL repair or a fresh hosted observation.
grant update, delete, truncate on public.usage_events to service_role;

begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000101');
select p2b1_test.expect_denied('select * from plan_offers');
select p2b1_test.expect_denied('select * from usage_events');
select p2b1_test.expect_denied('select * from design_partner_applications');
rollback;

begin;
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claim.sub = '';
select p2b1_test.actor('anon', null);
select p2b1_test.expect_denied('select * from plan_offers');
select p2b1_test.expect_denied('select * from usage_events');
select p2b1_test.expect_denied('select * from design_partner_applications');
rollback;

begin;
set local role service_role;
set local request.jwt.claim.role = 'service_role';
set local request.jwt.claim.sub = '';
select p2b1_test.actor('service_role', null);
-- These counts describe ONLY our synthetic seed, never live hosted counts.
select p2b1_test.expect((select count(*) = 0 from businesses where offer_id is not null), 'synthetic fixture null offers');
select p2b1_test.expect((select count(*) = 3 from pg_trigger where not tgisinternal and tgenabled = 'O'
 and tgname in ('plan_offers_lifecycle_guard','businesses_offer_assignment_guard','usage_events_append_only')), 'three historical source triggers enabled');
select p2b1_test.expect((select count(*) = 3 from pg_class where relnamespace = 'public'::regnamespace
 and relname in ('plan_offers','usage_events','design_partner_applications') and relrowsecurity), 'overlay RLS enabled');
select p2b1_test.expect(has_table_privilege(current_user, 'usage_events', 'UPDATE')
 and has_table_privilege(current_user, 'usage_events', 'DELETE')
 and has_table_privilege(current_user, 'usage_events', 'TRUNCATE'), 'historically observed broad service grants model');
insert into usage_events(business_id,kind,quantity,unit,occurred_at) values
 ('00000000-0000-0000-0000-000000000201','synthetic_test',1,'synthetic','2026-01-01T00:00:00Z');
do $$
begin
 begin
  update usage_events set quantity = 2;
  raise exception 'Expected append-only trigger failure';
 exception when raise_exception then
  if sqlerrm <> 'usage_events is append-only; insert a compensating event' then raise; end if;
 end;
 begin
  delete from usage_events;
  raise exception 'Expected append-only trigger failure';
 exception when raise_exception then
  if sqlerrm <> 'usage_events is append-only; insert a compensating event' then raise; end if;
 end;
end $$;
truncate usage_events;
select p2b1_test.expect((select count(*) = 0 from usage_events), 'TRUNCATE bypasses row trigger');
rollback;
\echo 'OBSERVED BASELINE GAP: historical row trigger rejects UPDATE/DELETE but service TRUNCATE succeeds under modelled effective grants. NOT append-only security PASS.'
