"""Issue #73 exact migration on a fresh, socket-only PostgreSQL cluster.
Run: python3 tests/database/staff-quota.test.py
PG_TEST_BIN optionally selects local binaries. No existing/hosted DB is contacted.
Fixture is a source-derived subset, not a full hosted schema or migration replay.
"""
import concurrent.futures
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[2]
ENV = {'PATH': '/usr/bin:/bin', 'LC_ALL': 'C', 'TZ': 'UTC'}
if os.environ.get('PG_TEST_BIN'):
    BIN = Path(os.environ['PG_TEST_BIN'])
else:
    pg_config = shutil.which('pg_config')
    if not pg_config:
        raise SystemExit('Set PG_TEST_BIN to the local PostgreSQL binaries directory.')
    BIN = Path(subprocess.check_output([pg_config, '--bindir'], text=True, env=ENV).strip())
PORT = '57373'  # Socket filename only. TCP is disabled.
MIGRATIONS = ROOT / 'supabase/migrations'
MIGRATION = MIGRATIONS / '20260923152046_issue_73_staff_quota_hardening.sql'
BODY = MIGRATION.read_text()
BIZ = '10000000-0000-4000-8000-000000000001'
OTHER = '10000000-0000-4000-8000-000000000002'
OWNER = '20000000-0000-4000-8000-000000000001'


def source(name):
    return (MIGRATIONS / name).read_text()


def section(name, start, end):
    body = source(name)
    return body[body.index(start):body.index(end)]


def table(name, filename):
    return re.search(r'create table if not exists ' + name + r' \([\s\S]*?\n\);', source(filename))[0]


# Explicit end markers keep selected source objects exact without replaying
# historical backfills, RLS replacements, or migrations 034-036.
FIXTURE = """
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
""" + '\n'.join(table(t, '001_booking_engine.sql') for t in ['businesses', 'staff', 'services', 'customers']) + section(
    '008_phase5_multi_location.sql', 'create table if not exists subscription_plans', '-- Locations (extensible'
) + table('locations', '008_phase5_multi_location.sql') + """
alter table staff add column location_id uuid not null references locations(id);
create index staff_business_id_idx on staff(business_id);
alter table businesses add column private_alpha_enabled boolean not null default false;
alter table subscription_plans add column monthly_price_cents integer;
alter table subscription_plans add column yearly_price_cents integer;
update subscription_plans set max_locations=6 where plan_key='business';
""" + table('staff_working_hours', '002_booking_enhancements.sql') + section(
    '005_phase4_scheduling_engine.sql', 'create or replace function seed_staff_working_hours()', '-- Backfill staff'
) + section(
    '001_booking_engine.sql', 'create or replace function set_updated_at()', 'create trigger customers_updated_at'
) + section(
    '20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql',
    'create or replace function public.prevent_business_id_reassignment()',
    'drop trigger if exists locations_business_id_immutable'
) + section(
    '20260922210000_issue_81_stage_1c_location_template.sql',
    'create or replace function public.enforce_location_quota()',
    '-- One atomic Stage 1C workflow writer.'
) + """
alter table staff enable row level security;
create policy staff_owner on staff to authenticated
using (business_id in (select id from businesses where owner_id=auth.uid()))
with check (business_id in (select id from businesses where owner_id=auth.uid()));
grant usage on schema public, auth to anon, authenticated, service_role;
grant select on businesses, subscription_plans to authenticated;
grant select, insert, update on staff to authenticated;
grant all on all tables in schema public to service_role;
alter default privileges grant execute on functions to anon, authenticated, service_role;
"""


def insert_staff(biz=BIZ, active=True, name='Staff', staff_id=None):
    sid = staff_id or str(uuid.uuid4())
    return f"insert into staff(id,business_id,location_id,name,is_active) values ('{sid}','{biz}','{biz}','{name}',{str(active).lower()});"


class StaffQuota(unittest.TestCase):
    @classmethod
    def command(cls, db):
        return [str(BIN/'psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose',
                '-h', str(cls.path), '-p', PORT, '-U', 'postgres', '-d', db]

    @classmethod
    def sql(cls, query, db):
        return subprocess.run(cls.command(db), input=query, text=True, capture_output=True, env=ENV, timeout=20)

    @classmethod
    def execute(cls, query, db):
        result = cls.sql(query, db)
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='chasum-staff-quota-', dir='/private/tmp')
        cls.path = Path(cls.temp.name)
        cls.addClassCleanup(cls.temp.cleanup)
        subprocess.run([str(BIN/'initdb'), '-D', str(cls.path/'data'), '-U', 'postgres', '-A', 'trust', '--no-locale', '--encoding=UTF8'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        subprocess.run([str(BIN/'pg_ctl'), '-D', str(cls.path/'data'), '-l', str(cls.path/'postgres.log'), '-o', f"-k {cls.path} -p {PORT} -c listen_addresses='' -c unix_socket_permissions=0700", '-w', 'start'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        cls.addClassCleanup(lambda: subprocess.run([str(BIN/'pg_ctl'), '-D', str(cls.path/'data'), '-m', 'fast', '-w', 'stop'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30))
        assert cls.execute('show listen_addresses', 'postgres') == ''
        assert cls.execute('select inet_server_addr() is null', 'postgres') == 't'
        print('LOCAL ONLY: TCP disabled; PostgreSQL', cls.execute('show server_version', 'postgres'), flush=True)
        print('MIGRATION SHA256:', hashlib.sha256(BODY.encode()).hexdigest(), flush=True)
        cls.execute('create role anon; create role authenticated; create role service_role bypassrls;', 'postgres')
        cls.execute('create database quota_baseline', 'postgres')
        cls.execute(FIXTURE, 'quota_baseline')

    def setUp(self):
        self.db = 'q_' + uuid.uuid4().hex
        self.execute(f'create database {self.db} template quota_baseline', 'postgres')
        self.addCleanup(lambda: self.execute(f'drop database {self.db} with (force)', 'postgres'))

    def run_sql(self, query):
        return self.execute(query, self.db)

    def apply(self):
        self.run_sql('begin;\n' + BODY + '\ncommit;')

    def business(self, plan='starter', biz=BIZ):
        self.run_sql(f"""
        insert into auth.users values ('{OWNER}') on conflict do nothing;
        insert into businesses(id,owner_id,name,slug,subscription_plan_key,private_alpha_enabled)
        values ('{biz}','{OWNER}','Fixture','{biz}','{plan}',true);
        insert into locations(id,business_id,name,slug,is_default) values ('{biz}','{biz}','Home','home',true);
        """)

    def rejected(self, query, message='STAFF_LIMIT_REACHED', state='P0001'):
        result = self.sql(query, self.db)
        self.assertNotEqual(result.returncode, 0, query)
        self.assertIn(f'{state}: {message}', result.stderr)

    def count(self, biz=BIZ):
        return int(self.run_sql(f"select count(*) from staff where business_id='{biz}' and is_active"))

    def fingerprint(self):
        # Exclude exactly the additive objects and the new seed field. Everything
        # else in this fixture (including Staff/location rows) must be unchanged.
        schema = self.run_sql("""
        select jsonb_agg(x order by x::text) from (
          select jsonb_build_array('function',p.oid::regprocedure::text,pg_get_functiondef(p.oid),p.proacl) x
          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
          where n.nspname in ('public','auth') and p.proname <> 'enforce_staff_quota'
          union all select jsonb_build_array('trigger',pg_get_triggerdef(oid),tgenabled) from pg_trigger
          where not tgisinternal and tgname <> 'staff_enforce_plan_quota'
          union all select jsonb_build_array('column',table_schema,table_name,column_name,data_type,is_nullable,column_default)
          from information_schema.columns where table_schema in ('public','auth') and column_name <> 'max_staff'
          union all select jsonb_build_array('policy',to_jsonb(p)) from pg_policies p
          union all select jsonb_build_array('constraint',conrelid::regclass::text,conname,pg_get_constraintdef(oid)) from pg_constraint where connamespace in ('public'::regnamespace,'auth'::regnamespace)
          union all select jsonb_build_array('table',relname,relacl,relrowsecurity,relforcerowsecurity) from pg_class where relnamespace in ('public'::regnamespace,'auth'::regnamespace) and relkind='r'
          union all select jsonb_build_array('index',indexdef) from pg_indexes where schemaname in ('public','auth')
        ) s;
        """)
        data = []
        for name in ['subscription_plans','businesses','staff','staff_working_hours','locations','services','customers','auth.users']:
            row = "to_jsonb(t) - 'max_staff'" if name == 'subscription_plans' else 'to_jsonb(t)'
            data.append(self.run_sql(f"select coalesce(jsonb_agg({row} order by ({row})::text),'[]') from {name} t"))
        return hashlib.sha256((schema + ''.join(data)).encode()).hexdigest()

    def test_canonical_truth_idempotence_and_unrelated_fingerprint(self):
        self.business()
        self.run_sql(insert_staff() + insert_staff())  # Grandfathered before apply.
        before = self.fingerprint()
        self.apply()
        self.assertEqual(self.fingerprint(), before)
        self.assertEqual(self.run_sql("select plan_key || ':' || coalesce(max_staff::text,'NULL') from subscription_plans order by plan_key"), 'business:NULL\nenterprise:NULL\nprofessional:3\nstarter:1')
        self.apply()
        self.assertEqual(self.fingerprint(), before)
        self.assertEqual(self.count(), 2)

    def test_finite_plans_and_update_semantics(self):
        self.apply()
        for plan, cap, biz in [('starter',1,BIZ),('professional',3,OTHER)]:
            with self.subTest(plan=plan):
                self.business(plan,biz)
                for count in range(cap):
                    self.run_sql(insert_staff(biz))
                    self.assertEqual(self.count(biz),count+1)
                self.rejected(insert_staff(biz))
                inactive = str(uuid.uuid4())
                self.run_sql(insert_staff(biz,False,staff_id=inactive))
                self.rejected(f"update staff set is_active=true where id='{inactive}'")
                self.run_sql(f"update staff set name='edited',is_active=true where business_id='{biz}' and is_active; update staff set name='still inactive',is_active=false where id='{inactive}';")
                self.run_sql(f"update staff set is_active=false where id=(select id from staff where business_id='{biz}' and is_active limit 1)")
                self.run_sql(f"update staff set is_active=true where id='{inactive}'")
                self.assertEqual(self.count(biz),cap)
                self.assertEqual(self.run_sql(f"select count(*) from staff_working_hours h join staff s on s.id=h.staff_id where s.business_id='{biz}'"),str((cap+1)*7))

    def test_unlimited(self):
        self.apply()
        for plan,biz in [('business',BIZ),('enterprise',OTHER)]:
            self.business(plan,biz)
            self.run_sql(''.join(insert_staff(biz) for _ in range(12)))
            self.assertEqual(self.count(biz),12)

    def test_grandfathering(self):
        self.business()
        self.run_sql(''.join(insert_staff() for _ in range(3)))
        inactive = str(uuid.uuid4())
        self.run_sql(insert_staff(active=False,staff_id=inactive))
        before = self.fingerprint()
        self.apply()
        self.assertEqual(self.fingerprint(),before)
        self.rejected(insert_staff())
        self.rejected(f"update staff set is_active=true where id='{inactive}'")
        self.run_sql("update staff set name='ordinary edit', is_active=is_active")
        self.run_sql("update staff set is_active=false where id=(select id from staff where is_active limit 1)")
        self.assertEqual(self.count(),2)
        self.assertEqual(self.run_sql('select count(*) from staff'),'4')

    def test_bulk_statements_roll_back(self):
        self.apply()
        self.business('professional')
        self.run_sql(insert_staff() + insert_staff())
        self.run_sql(insert_staff(active=False) + insert_staff(active=False))
        self.rejected('update staff set is_active=true where not is_active')
        self.assertEqual(self.count(),2)
        self.rejected(f"insert into staff(business_id,location_id,name) select '{BIZ}','{BIZ}','bulk' from generate_series(1,2)")
        self.assertEqual(self.count(),2)
        self.assertEqual(self.run_sql('select count(*) from staff_working_hours'),'28')

    def test_api_roles_and_hidden_count(self):
        self.apply()
        self.business()
        self.business(biz=OTHER)
        self.run_sql(f"set role authenticated; select set_config('request.jwt.claim.sub','{OWNER}',false);" + insert_staff())
        # Deliberately narrower SELECT visibility proves the definer counts rows
        # even when a writer cannot see existing Staff through RLS.
        self.run_sql('drop policy staff_owner on staff; create policy insert_only on staff for insert to authenticated with check (true)')
        self.assertEqual(self.run_sql('set role authenticated; select count(*) from staff'),'0')
        self.rejected('set role authenticated;' + insert_staff())
        self.rejected('set role service_role;' + insert_staff())
        self.run_sql('set role service_role;' + insert_staff(OTHER))
        self.assertEqual(self.count(OTHER),1)

    def test_acl_and_tenant_key_guard(self):
        self.apply()
        self.business()
        self.business(biz=OTHER)
        self.run_sql(insert_staff())
        self.rejected(f"update staff set business_id='{OTHER}',location_id='{OTHER}'",'business_id is immutable')
        for role in ['anon','authenticated','service_role']:
            self.assertEqual(self.run_sql(f"select has_function_privilege('{role}','public.enforce_staff_quota()','EXECUTE')"),'f')
        self.assertEqual(self.run_sql("select prosecdef and provolatile='v' and proconfig=array['search_path=public, pg_temp'] from pg_proc where oid='public.enforce_staff_quota()'::regprocedure"),'t')
        self.assertEqual(self.run_sql("select tgenabled from pg_trigger where tgname='staff_enforce_plan_quota'"),'O')

    def test_missing_or_inactive_entitlement_fails_closed(self):
        self.apply()
        self.business()
        self.run_sql("update subscription_plans set is_active=false where plan_key='starter'")
        self.rejected(insert_staff(),'Staff capacity is unavailable. Please try again.')
        self.run_sql(insert_staff(active=False))
        self.assertEqual(self.count(),0)

    def test_unknown_catalog_plan_does_not_inherit_unlimited(self):
        self.apply()
        self.run_sql("insert into subscription_plans(plan_key,name,max_locations) values ('custom','Unexpected catalog row',1)")
        self.business('custom')
        self.rejected(insert_staff(),'Staff capacity is unavailable. Please try again.')
        self.run_sql(insert_staff(active=False))
        self.assertEqual(self.count(),0)

    def test_fixed_snapshot_consumption_fails_closed(self):
        self.apply()
        self.business()
        for isolation in ['repeatable read','serializable']:
            self.rejected(f'begin isolation level {isolation}; select count(*) from staff;' + insert_staff(), 'Staff changes require a fresh transaction. Please try again.', '0A000')
        self.run_sql('begin isolation level repeatable read;' + insert_staff(active=False) + 'commit;')
        self.assertEqual(self.count(),0)

    def test_missing_seed_rolls_back_ddl(self):
        self.run_sql("delete from subscription_plans where plan_key='enterprise'")
        self.rejected('begin;' + BODY + 'commit;','Required active Staff plan is missing: enterprise')
        self.assertEqual(self.run_sql("select count(*) from information_schema.columns where table_name='subscription_plans' and column_name='max_staff'"),'0')

    def test_unexpected_existing_seed_is_not_overwritten(self):
        self.apply()
        for value in ['2','NULL']:
            self.run_sql(f"update subscription_plans set max_staff={value} where plan_key='starter'")
            before=self.fingerprint()
            self.rejected('begin;' + BODY + 'commit;','Unexpected max_staff for plan starter; review required.')
            self.assertEqual(self.fingerprint(),before)
            self.assertEqual(self.run_sql("select coalesce(max_staff::text,'NULL') from subscription_plans where plan_key='starter'"),value)

    def test_unexpected_column_definition(self):
        self.run_sql('alter table subscription_plans add column max_staff text')
        self.rejected('begin;' + BODY + 'commit;','Unexpected max_staff column definition; review required.')

    def test_missing_tenant_guard_rejects_migration(self):
        self.run_sql('alter table staff disable trigger staff_business_id_immutable')
        self.rejected('begin;' + BODY + 'commit;','Staff tenant-key guard prerequisite is missing.')

    def test_location_quota_regression(self):
        self.apply()
        self.business()
        self.rejected(f"insert into locations(business_id,name,slug) values ('{BIZ}','Second','second')", 'LOCATION_LIMIT_REACHED:')
        self.run_sql(f"insert into locations(business_id,name,slug,is_active) values ('{BIZ}','Inactive','inactive',false)")

    def race(self, first, second):
        winner=subprocess.Popen(self.command(self.db),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=ENV)
        try:
            winner.stdin.write("begin; set application_name='quota_winner'; set statement_timeout='10s';" + first + "select 'READY';\n")
            winner.stdin.flush()
            self.assertEqual(winner.stdout.readline().strip(),'READY')
            with concurrent.futures.ThreadPoolExecutor() as pool:
                loser=pool.submit(self.sql,"set application_name='quota_loser'; set statement_timeout='10s'; set role service_role;" + second,self.db)
                blocked=False
                for _ in range(100):
                    blocked=self.run_sql("select exists(select 1 from pg_stat_activity where application_name='quota_loser' and cardinality(pg_blocking_pids(pid))>0)")=='t'
                    if blocked:
                        break
                    time.sleep(.02)
                # Same plan, other Business remains writable during the wait.
                if blocked:
                    self.run_sql(insert_staff(OTHER))
                winner.stdin.write('commit;\n')
                winner.stdin.flush()
                winner.stdin.close()
                winner.wait(timeout=10)
                result=loser.result(timeout=15)
            self.assertTrue(blocked,'No positive evidence of concurrent lock contention')
            self.assertEqual(winner.returncode,0,winner.stderr.read())
            self.assertNotEqual(result.returncode,0)
            self.assertIn('P0001: STAFF_LIMIT_REACHED',result.stderr)
            self.assertEqual(self.count(),3)
            self.assertEqual(self.count(OTHER),1)
            print('RACE PASS: blocked waiter observed; 1 success / 1 STAFF_LIMIT_REACHED; final active=3; other tenant unblocked',flush=True)
        finally:
            if winner.poll() is None:
                winner.kill()
                winner.wait()
            for pipe in [winner.stdin,winner.stdout,winner.stderr]:
                pipe.close()

    def test_real_two_session_races(self):
        self.apply()
        self.business('professional')
        self.business('professional',OTHER)
        for mode in ['insert/insert','activate/activate','insert/activate','activate/insert']:
            with self.subTest(mode=mode):
                self.run_sql('delete from staff')
                self.run_sql(insert_staff()+insert_staff())
                ids=[str(uuid.uuid4()),str(uuid.uuid4())]
                self.run_sql(''.join(insert_staff(active=False,staff_id=sid) for sid in ids))
                writes=[insert_staff(name='race') if op=='insert' else f"update staff set is_active=true where id='{ids[i]}';" for i,op in enumerate(mode.split('/'))]
                self.race(*writes)


if __name__ == '__main__':
    unittest.main(verbosity=2)
