"""B2 exact migration against fresh, private Unix-socket-only PostgreSQL.

Run: python3 tests/database/governed-import-writer.test.py
PG_TEST_BIN optionally selects local binaries. No existing database is contacted.
Operational fixture is a source-derived subset, not a hosted schema replay.
Real B1/Staff migrations and exact scheduling/relationship/Location quota guards
are applied. 034-036 are never read/applied. Provider code is never executed.
"""
import concurrent.futures
import copy
import hashlib
import json
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
MIGRATIONS = ROOT / 'supabase/migrations'
ENV = {'PATH': '/usr/bin:/bin', 'LC_ALL': 'C', 'TZ': 'UTC'}
BIN = Path(os.environ['PG_TEST_BIN']) if os.environ.get('PG_TEST_BIN') else Path(
    subprocess.check_output([shutil.which('pg_config'), '--bindir'], text=True, env=ENV).strip())
PORT = '57374'  # Socket filename only; TCP disabled.
B1 = '20260921203029_governed_import_foundation.sql'
QUOTA = '20260923152046_issue_73_staff_quota_hardening.sql'
B2 = '20260923210000_issue_73_package_b2_core.sql'
STAGE1B = '20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql'
STAGE1C = '20260922210000_issue_81_stage_1c_location_template.sql'
BIZ = '10000000-0000-4000-8000-000000000001'
OTHER = '10000000-0000-4000-8000-000000000002'
OWNER = '20000000-0000-4000-8000-000000000001'
OTHER_OWNER = '20000000-0000-4000-8000-000000000002'
ADMIN = '20000000-0000-4000-8000-000000000003'
PLATFORM = '20000000-0000-4000-8000-000000000004'
SHA = 'a' * 64
SNAP = 'b' * 64
SOURCE = dict(sourceSystem='synthetic-fixture', sourceAccountKey='workspace-1',
              schemaVersion='1', inputChecksum=SHA, sourceTimezone='America/Toronto', sourceCurrency='CAD')


def source(name):
    return (MIGRATIONS / name).read_text()


def section(name, start, end):
    body = source(name)
    return body[body.index(start):body.index(end)]


def table(name, filename):
    return re.search(r'create table (?:if not exists )?(?:public\.)?' + name + r' \([\s\S]*?\n\);', source(filename))[0]


def column(table_name, column_name, filename):
    return re.search(r'alter table (?:public\.)?' + table_name + r'\s+add column if not exists ' + column_name + r'\b[^;]+;', source(filename))[0]


def literal(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return str(value).lower()
    return "'" + str(value).replace("'", "''") + "'"


def j(value):
    return literal(json.dumps(value)) + '::jsonb'


def row(kind, key, **fields):
    value = dict(entityType=kind, sourceRowKey=key, **fields)
    outcome = dict(entityType=kind, sourceRowKey=key,
                   sourceRowHash=hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest(),
                   status='READY', plannedAction='CREATE', reasonCodes=[])
    if 'sourceExternalId' in value:
        outcome['sourceExternalId'] = value['sourceExternalId']
    return dict(row=value, outcome=outcome)


def linked(item, target):
    item = copy.deepcopy(item)
    item['outcome'].update(status='DUPLICATE_EXISTING', plannedAction='LINK_EXISTING',
                           existingId=target, reasonCodes=['SOURCE_REF_MATCH'])
    return item


def customer(key='customer-1', external=True):
    fields = dict(name='Synthetic Person', email=key + '@example.test')
    if external:
        fields['sourceExternalId'] = key
    return row('customer', key, **fields)


def complete_plan():
    ref = lambda key: dict(sourceRowKey=key)
    money = dict(kind='EXACT', currency='CAD', priceCents=1800, taxCents=234,
                 discountCents=0, depositCents=500, amountPaidCents=0, amountRefundedCents=0)
    appointment = row('appointment', 'appointment-1', sourceExternalId='appointment-1',
                      location=ref('location-1'), service=ref('service-1'), staff=ref('staff-1'),
                      customer=ref('customer-1'), start='2099-01-20T17:30:00.000Z',
                      end='2099-01-20T18:00:00.000Z', sourceStatus='booked', financials=money)
    appointment['mappedStatus'] = 'confirmed'
    return [
        row('location', 'location-1', sourceExternalId='location-1', name='Synthetic Location',
            slug='synthetic-location', address='Source address unchanged'),
        row('service', 'service-1', sourceExternalId='service-1', name='Synthetic Service',
            durationMinutes=30, priceCents=2500, currency='CAD', primaryLocation=ref('location-1')),
        row('staff', 'staff-1', sourceExternalId='staff-1', name='Synthetic Staff', primaryLocation=ref('location-1')),
        row('staffService', 'assignment-1', staff=ref('staff-1'), service=ref('service-1')),
        customer(), appointment,
    ]


FIXTURE = """
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
""" + section('001_booking_engine.sql', 'create table if not exists businesses', '-- Row Level Security')
FIXTURE += section('002_booking_enhancements.sql', 'alter table businesses', '-- Extend services')
FIXTURE += section('008_phase5_multi_location.sql', 'create table if not exists subscription_plans', '-- Locations (extensible')
FIXTURE += '\n'.join(table(t, '008_phase5_multi_location.sql') for t in ['locations', 'location_settings', 'location_hours'])
FIXTURE += """
alter table services add column location_id uuid not null references locations(id);
alter table staff add column location_id uuid not null references locations(id);
alter table appointments add column location_id uuid not null references locations(id);
alter type appointment_status add value 'pending';
alter type appointment_status add value 'arrived';
alter type appointment_status add value 'waiting';
alter type appointment_status add value 'in_progress';
create table platform_admins(user_id uuid primary key references auth.users(id));
"""
for name, col, filename in [
    ('businesses', 'currency', '020_business_management.sql'),
    ('businesses', 'min_notice_minutes', '023_business_management_settings.sql'),
    ('businesses', 'private_alpha_enabled', '032_private_alpha_co_owners.sql'),
    ('services', 'online_booking', '011_sprint2_gvm_go_live.sql'),
    ('services', 'deposit_cents', '020_business_management.sql'),
    ('services', 'taxable', '024_services_module.sql'),
    ('services', 'deposit_required', '024_services_module.sql'),
    ('services', 'booking_visibility', '024_services_module.sql'),
    ('staff', 'phone', '017_employee_management.sql'),
    ('staff', 'employment_status', '017_employee_management.sql'),
    ('staff', 'user_id', '017_employee_management.sql'),
    ('staff', 'default_location_id', '025_employees_module.sql'),
    ('staff', 'accept_online_bookings', '025_employees_module.sql'),
    ('staff', 'accept_new_clients', '025_employees_module.sql'),
    ('staff', 'accept_walk_ins', '025_employees_module.sql'),
    ('customers', 'marketing_consent', '20260909140000_communication_consent_compatibility.sql'),
    ('customers', 'marketing_consent_at', '20260909140000_communication_consent_compatibility.sql'),
    *[('appointments', col, '019_booking_engine_2.sql') for col in ['price_cents', 'tax_cents', 'discount_cents', 'deposit_cents']],
    *[('appointments', col, '028_commerce_platform.sql') for col in ['payment_status', 'amount_paid_cents', 'amount_refunded_cents']],
    *[('location_settings', col, '019_booking_engine_2.sql') for col in ['min_booking_notice_minutes', 'default_travel_minutes', 'timezone']],
]:
    FIXTURE += column(name, col, filename)
FIXTURE += section('004_phase3_integrations.sql', 'create type job_status', 'create type waitlist_status')
FIXTURE += '\n'.join([
    table('staff_working_hours', '002_booking_enhancements.sql'),
    table('service_locations', '024_services_module.sql'),
    table('staff_locations', '017_employee_management.sql'),
    table('business_members', '032_private_alpha_co_owners.sql'),
    table('location_hour_segments', '023_business_management_settings.sql'),
    table('booking_resources', '019_booking_engine_2.sql'),
    table('background_jobs', '004_phase3_integrations.sql'),
    table('communication_send_intents', '20260905024239_communication_send_intents.sql'),
])
FIXTURE += section('005_phase4_scheduling_engine.sql', 'create extension if not exists btree_gist;', '-- Backfill staff')
FIXTURE += section(STAGE1B, 'create or replace function public.assert_same_business_relationship()', 'create or replace function public.is_public_service_location(')
FIXTURE += section(STAGE1C, 'create or replace function public.enforce_location_quota()', '-- One atomic Stage 1C workflow writer.')
FIXTURE += """
update subscription_plans set max_locations=6 where plan_key='business';
grant usage on schema public,auth to anon,authenticated,service_role;
grant all on all tables in schema public to service_role;
grant select,insert,update on services to authenticated;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
"""


class Writer(unittest.TestCase):
    @classmethod
    def command(cls, db):
        return [str(BIN / 'psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose',
                '-h', str(cls.path), '-p', PORT, '-U', 'postgres', '-d', db]

    @classmethod
    def sql(cls, query, db):
        return subprocess.run(cls.command(db), input=query, text=True, capture_output=True, env=ENV, timeout=30)

    @classmethod
    def execute(cls, query, db):
        result = cls.sql(query, db)
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='chasum-b2-', dir='/private/tmp')
        cls.path = Path(cls.temp.name)
        cls.addClassCleanup(cls.temp.cleanup)
        subprocess.run([str(BIN / 'initdb'), '-D', str(cls.path / 'data'), '-U', 'postgres', '-A', 'trust', '--no-locale', '--encoding=UTF8'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        subprocess.run([str(BIN / 'pg_ctl'), '-D', str(cls.path / 'data'), '-l', str(cls.path / 'postgres.log'), '-o', f"-k {cls.path} -p {PORT} -c listen_addresses='' -c unix_socket_permissions=0700", '-w', 'start'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        cls.addClassCleanup(lambda: subprocess.run([str(BIN / 'pg_ctl'), '-D', str(cls.path / 'data'), '-m', 'fast', '-w', 'stop'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30))
        assert cls.execute('show listen_addresses', 'postgres') == ''
        assert cls.execute('select inet_server_addr() is null', 'postgres') == 't'
        assert cls.execute('show unix_socket_directories', 'postgres') == str(cls.path)
        print('LOCAL ONLY: TCP disabled; PostgreSQL ' + cls.execute('show server_version', 'postgres'), flush=True)
        cls.execute('create role anon; create role authenticated; create role service_role bypassrls;', 'postgres')
        cls.execute('create database writer_baseline', 'postgres')
        cls.execute(FIXTURE, 'writer_baseline')
        for migration in [B1, QUOTA, B2]:
            body = source(migration)
            print('EXACT MIGRATION SHA256:', migration, hashlib.sha256(body.encode()).hexdigest(), flush=True)
            if migration == B2:
                cls.execute('create database writer_prerequisite template writer_baseline', 'postgres')
            cls.execute('begin;\n' + body + '\ncommit;', 'writer_baseline')

    def setUp(self):
        self.db = 'b2_' + uuid.uuid4().hex
        self.execute(f'create database {self.db} template writer_baseline', 'postgres')
        self.addCleanup(lambda: self.execute(f'drop database {self.db} with (force)', 'postgres'))
        self.run_sql(f"""
        insert into auth.users values ('{OWNER}'),('{OTHER_OWNER}'),('{ADMIN}'),('{PLATFORM}');
        insert into businesses(id,owner_id,name,slug,currency,timezone,subscription_plan_key,min_notice_minutes)
          values ('{BIZ}','{OWNER}','Synthetic A','synthetic-a','CAD','America/Toronto','enterprise',45),
                 ('{OTHER}','{OTHER_OWNER}','Synthetic B','synthetic-b','CAD','UTC','enterprise',0);
        insert into business_members(business_id,user_id,role) values ('{BIZ}','{ADMIN}','admin');
        insert into platform_admins values ('{PLATFORM}');
        """)

    def run_sql(self, query):
        return self.execute(query, self.db)

    def rejected(self, query, message):
        result = self.sql(query, self.db)
        self.assertNotEqual(result.returncode, 0, query)
        self.assertIn(message, result.stderr)

    def rpc(self, name, *args, actor=OWNER, business=BIZ):
        values = [literal(business), literal(actor), *args]
        return 'set role service_role;select public.' + name + '(' + ','.join(values) + ');'

    def prepare(self, items, actor=OWNER, business=BIZ):
        ctx = json.loads(self.run_sql(self.rpc('get_data_import_context', actor=actor, business=business)))
        result = json.loads(self.run_sql(self.rpc('prepare_data_import_run', j(SOURCE), literal(SHA), literal(SNAP), literal(ctx['fingerprint']), j(items), actor=actor, business=business)))
        return dict(id=result['runId'], guard=result['commitGuardHash'], items=copy.deepcopy(items), actor=actor, business=business)

    def begin_sql(self, run, resume=False, **changes):
        values = dict(preview=SHA, snapshot=SNAP, guard=run['guard'])
        values.update(changes)
        return self.rpc('begin_data_import_commit', literal(run['id']), literal(values['preview']), literal(values['snapshot']), literal(values['guard']), j(run['items']), literal(resume), actor=run['actor'], business=run['business'])

    def begin(self, run, resume=False):
        run['token'] = self.run_sql(self.begin_sql(run, resume))
        return run['token']

    def batch_sql(self, run, items=None, **changes):
        values = dict(actor=run['actor'], business=run['business'], token=run['token'])
        values.update(changes)
        return self.rpc('commit_data_import_batch', literal(run['id']), literal(values['token']), j(run['items'] if items is None else items), actor=values['actor'], business=values['business'])

    def batch(self, run, items=None):
        return json.loads(self.run_sql(self.batch_sql(run, items)))

    def finish_sql(self, run, abort=False, **changes):
        values = dict(actor=run['actor'], business=run['business'])
        values.update(changes)
        return self.rpc('finish_data_import_run', literal(run['id']), literal(run['token']), literal(abort), **values)

    def finish(self, run, abort=False):
        return self.run_sql(self.finish_sql(run, abort))

    def count(self, table_name):
        return int(self.run_sql('select count(*) from ' + table_name))

    def expire(self, run):
        # Test clock fault injection only: no 2-minute wall-clock sleep. Ordinary
        # writer calls never receive superuser/direct table mutation privileges.
        self.run_sql(f"alter table data_import_runs disable trigger data_import_runs_guard; update data_import_runs set heartbeat_at=clock_timestamp()-interval '3 minutes',lease_expires_at=clock_timestamp()-interval '1 minute' where id='{run['id']}'; alter table data_import_runs enable trigger data_import_runs_guard;")

    def seeded(self):
        run = self.prepare(complete_plan()[:-1])
        self.begin(run)
        results = self.batch(run)
        self.assertEqual(self.finish(run), 'completed')
        return {o['entity_type']: o['target_entity_id'] for o in results if o['target_entity_id']}

    def appointment(self, ids, key='appointment-1'):
        item = complete_plan()[-1]
        item['row']['sourceRowKey'] = key
        item['row']['sourceExternalId'] = key
        item['outcome']['sourceRowKey'] = key
        item['outcome']['sourceExternalId'] = key
        for kind in ['location', 'service', 'staff', 'customer']:
            item['row'][kind] = dict(existingId=ids[kind])
        return item

    def test_01_complete_operational_graph_and_no_communications(self):
        run = self.prepare(complete_plan())
        self.begin(run)
        out = self.batch(run)
        self.assertTrue(all(o['commit_result'] == 'CREATED' for o in out))
        self.assertEqual(self.finish(run), 'completed')
        self.assertEqual(self.run_sql('select is_active and not is_default and timezone=\'America/Toronto\' and address_line1=\'Source address unchanged\' and city is null and state is null and postal_code is null from locations'), 't')
        self.assertEqual(self.run_sql('select count(*)=7 and not bool_or(is_open) from location_hours'), 't')
        self.assertEqual(self.run_sql('select count(*)=1 and min(min_booking_notice_minutes)=45 and min(timezone)=\'America/Toronto\' from location_settings'), 't')
        self.assertEqual(self.count('location_hour_segments'), 0)
        self.assertEqual(self.count('booking_resources'), 0)
        self.assertEqual(self.run_sql("select name='Synthetic Service' and duration_minutes=30 and price=25 and is_active and not online_booking and booking_visibility='internal' and not commercial_settings_reviewed from services"), 't')
        self.assertEqual(self.run_sql('select count(*)=1 and bool_and(is_primary) from service_locations'), 't')
        self.assertEqual(self.run_sql("select is_active and employment_status='active' and location_id=default_location_id and user_id is null and not accept_online_bookings and not accept_new_clients and not accept_walk_ins from staff"), 't')
        self.assertEqual(self.run_sql('select count(*)=1 and bool_and(is_primary) from staff_locations'), 't')
        self.assertEqual(self.run_sql('select count(*)=7 and not bool_or(is_working) from staff_working_hours'), 't')
        self.assertEqual(self.run_sql('select not marketing_consent and marketing_consent_at is null from customers'), 't')
        self.assertEqual(self.run_sql("select price_cents=1800 and tax_cents=234 and deposit_cents=500 and amount_paid_cents=0 and amount_refunded_cents=0 and discount_cents=0 and payment_status='deposit_required' and status='confirmed' and start_time='2099-01-20 17:30:00+00'::timestamptz from appointments"), 't')
        self.assertEqual(self.count('background_jobs'), 0)
        self.assertEqual(self.count('communication_send_intents'), 0)
        self.assertEqual(self.count('auth.users'), 4)
        self.assertEqual(self.count('data_import_entity_refs'), 5)

    def test_02_primary_owner_only_and_context_authority(self):
        self.run_sql(self.rpc('get_data_import_context'))
        for actor in [ADMIN, PLATFORM, OTHER_OWNER, None]:
            with self.subTest(actor=actor):
                self.rejected(self.rpc('get_data_import_context', actor=actor), 'IMPORT_OWNER_REQUIRED')
        self.rejected(self.rpc('get_data_import_context', business=OTHER), 'IMPORT_OWNER_REQUIRED')
        self.rejected('begin isolation level repeatable read;' + self.rpc('get_data_import_context'), 'IMPORT_FRESH_TRANSACTION_REQUIRED')

    def test_03_role_acl_private_tables_and_search_path(self):
        names = ['get_data_import_context', 'prepare_data_import_run', 'begin_data_import_commit', 'commit_data_import_batch', 'finish_data_import_run']
        for name in names:
            self.assertEqual(self.run_sql(f"select prosecdef and proconfig=array['search_path=pg_catalog, pg_temp'] from pg_proc where proname='{name}'"), 't')
            for role in ['anon', 'authenticated', 'service_role']:
                self.assertEqual(self.run_sql(f"select has_function_privilege('{role}',oid,'EXECUTE') from pg_proc where proname='{name}'"), 't' if role == 'service_role' else 'f')
        for role in ['anon', 'authenticated']:
            self.rejected(f"set role {role};select get_data_import_context('{BIZ}','{OWNER}')", 'permission denied')
            nonexistent = literal(str(uuid.uuid4()))
            calls = [
                self.rpc('prepare_data_import_run', j(SOURCE), literal(SHA), literal(SNAP), literal(SHA), j([])),
                self.rpc('begin_data_import_commit', nonexistent, literal(SHA), literal(SNAP), literal(SHA), j([]), 'false'),
                self.rpc('commit_data_import_batch', nonexistent, nonexistent, j([])),
                self.rpc('finish_data_import_run', nonexistent, nonexistent, 'false'),
            ]
            for call in calls:
                self.rejected(call.replace('set role service_role;', 'set role ' + role + ';'), 'permission denied for function')
        for role in ['anon', 'authenticated', 'service_role']:
            self.assertEqual(self.run_sql(f"select count(*) from pg_proc where proname like 'data_import_%' and has_function_privilege('{role}',oid,'EXECUTE')"), '0')
            for name in ['data_import_runs', 'data_import_row_outcomes', 'data_import_entity_refs']:
                for privilege in ['INSERT', 'UPDATE', 'DELETE']:
                    self.assertEqual(self.run_sql(f"select has_table_privilege('{role}','{name}','{privilege}')"), 'f')
        self.assertEqual(self.run_sql("select count(*) from pg_policies where tablename like 'data_import_%'"), '0')
        self.assertEqual(self.run_sql("select count(*) from pg_class where relname in ('data_import_runs','data_import_row_outcomes','data_import_entity_refs') and relrowsecurity and relforcerowsecurity"), '3')

    def test_04_hash_mismatch_and_all_target_guard_drift(self):
        run = self.prepare([customer()])
        for key in ['preview', 'snapshot', 'guard']:
            self.rejected(self.begin_sql(run, **{key: 'c' * 64}), 'IMPORT_REPREVIEW_REQUIRED')
        self.assertEqual(self.run_sql('select state from data_import_runs'), 'previewed')
        changes = [
            "update businesses set subscription_plan_key='professional' where id='%s'" % BIZ,
            "update subscription_plans set max_locations=17 where plan_key='enterprise'",
            "update subscription_plans set max_staff=17 where plan_key='enterprise'",
            f"insert into locations(business_id,name,slug) values('{BIZ}','Drift','drift')",
            f"insert into customers(business_id,name,email) values('{BIZ}','Drift','drift@example.test')",
            f"update businesses set currency='USD' where id='{BIZ}'",
        ]
        for change in changes:
            with self.subTest(change=change):
                self.rejected('begin;' + change + ';' + self.begin_sql(run), 'IMPORT_REPREVIEW_REQUIRED')
        self.begin(run)

    def test_05_run_creator_mismatch_and_recheck_batch_finish(self):
        run = self.prepare([customer()])
        self.run_sql(f"update businesses set owner_id='{ADMIN}' where id='{BIZ}'")
        self.rejected(self.begin_sql(run), 'IMPORT_OWNER_REQUIRED')
        other = dict(run, actor=ADMIN)
        self.rejected(self.begin_sql(other), 'IMPORT_RUN_AUTHORITY')
        self.run_sql(f"update businesses set owner_id='{OWNER}' where id='{BIZ}'")
        self.begin(run)
        self.run_sql(f"update businesses set owner_id='{ADMIN}' where id='{BIZ}'")
        self.rejected(self.batch_sql(run), 'IMPORT_OWNER_REQUIRED')
        self.rejected(self.finish_sql(run), 'IMPORT_OWNER_REQUIRED')
        self.rejected(self.batch_sql(run, actor=ADMIN), 'IMPORT_RUN_AUTHORITY')
        self.rejected(self.finish_sql(run, actor=ADMIN), 'IMPORT_RUN_AUTHORITY')
        self.rejected(self.batch_sql(run, business=OTHER, actor=OTHER_OWNER), 'IMPORT_RUN_AUTHORITY')

    def test_06_row_commitment_dependency_order_and_bounds(self):
        items = [customer('first'), customer('second')]
        run = self.prepare(items)
        self.begin(run)
        changed = copy.deepcopy(items[0])
        changed['row']['name'] = 'Substituted'
        substituted = dict(run, items=[changed, items[1]])
        self.rejected(self.begin_sql(substituted, True), 'IMPORT_ROW_NOT_REVIEWED')
        self.rejected(self.batch_sql(run, [changed]), 'IMPORT_ROW_NOT_REVIEWED')
        self.rejected(self.batch_sql(run, [items[1]]), 'IMPORT_DEPENDENCY_ORDER')
        self.rejected(self.batch_sql(run, items * 26), 'IMPORT_BATCH_LIMIT')
        self.rejected(self.finish_sql(run), 'IMPORT_INCOMPLETE')
        self.assertEqual(self.count('customers'), 0)
        self.batch(run, [items[0]])
        self.batch(run, [items[1]])
        self.assertEqual(self.finish(run), 'completed')

    def test_07_same_run_replay_and_new_run_source_reuse(self):
        item = customer()
        run = self.prepare([item])
        self.begin(run)
        original = self.batch(run)
        self.assertEqual(self.batch(run), original)
        self.assertEqual(self.count('customers'), 1)
        self.assertEqual(self.count('data_import_row_outcomes'), 2)
        self.finish(run)
        target = original[0]['target_entity_id']
        rerun = self.prepare([linked(item, target)])
        self.begin(rerun)
        self.assertEqual(self.batch(rerun)[0]['commit_result'], 'LINKED')
        self.assertEqual(self.finish(rerun), 'completed')
        self.assertEqual(self.count('customers'), 1)
        self.assertEqual(self.count('data_import_entity_refs'), 1)
        self.assertEqual(self.run_sql('select last_import_run_id from data_import_entity_refs'), rerun['id'])
        self.assertEqual(self.run_sql('select first_import_run_id from data_import_entity_refs'), run['id'])

    def test_08_changed_source_ref_and_stale_target_block(self):
        item = customer()
        run = self.prepare([item]); self.begin(run)
        target = self.batch(run)[0]['target_entity_id']; self.finish(run)
        changed = linked(item, target)
        changed['row']['name'] = 'Changed source'
        changed['outcome']['sourceRowHash'] = 'c' * 64
        rerun = self.prepare([changed]); self.begin(rerun)
        outcome = self.batch(rerun)[0]
        self.assertEqual(outcome['reason_codes'], ['SOURCE_ID_CHANGED'])
        self.assertEqual(self.finish(rerun), 'failed')
        self.assertEqual(self.run_sql('select chasum_entity_id from data_import_entity_refs'), target)
        stale = self.prepare([linked(item, target)]); self.begin(stale)
        self.run_sql(f"delete from customers where id='{target}'")
        self.assertEqual(self.batch(stale)[0]['reason_codes'], ['MISSING_REFERENCE'])
        self.assertEqual(self.finish(stale), 'failed')
        self.assertEqual(self.count('customers'), 0)
        self.assertEqual(self.run_sql('select chasum_entity_id from data_import_entity_refs'), target)

    def test_09_missing_external_id_never_fabricates_ref(self):
        run = self.prepare([customer(external=False)]); self.begin(run)
        self.batch(run); self.finish(run)
        self.assertEqual(self.count('customers'), 1)
        self.assertEqual(self.count('data_import_entity_refs'), 0)

    def test_10_lease_heartbeat_reclaim_and_old_writer_fencing(self):
        items = [customer('first'), customer('second')]
        run = self.prepare(items); self.begin(run)
        old_token = run['token']
        before = self.run_sql(f"select heartbeat_at from data_import_runs where id='{run['id']}'")
        self.batch(run, [])
        after = self.run_sql(f"select heartbeat_at from data_import_runs where id='{run['id']}'")
        self.assertNotEqual(before, after)
        self.rejected(self.begin_sql(run, True), 'IMPORT_RUN_NOT_CLAIMABLE')
        first = self.batch(run, [items[0]])
        self.expire(run)
        self.rejected(self.batch_sql(run, []), 'IMPORT_LEASE_LOST')
        self.rejected(self.finish_sql(run), 'IMPORT_LEASE_LOST')
        changed = copy.deepcopy(run)
        changed['items'][1]['row']['name'] = 'Substituted after expiry'
        self.rejected(self.begin_sql(changed, True), 'IMPORT_ROW_NOT_REVIEWED')
        self.begin(run, True)
        self.assertNotEqual(run['token'], old_token)
        self.rejected(self.batch_sql(run, [], token=old_token), 'IMPORT_LEASE_LOST')
        self.rejected(self.finish_sql(dict(run, token=old_token)), 'IMPORT_LEASE_LOST')
        self.assertEqual(self.batch(run, [items[0]]), first)
        self.batch(run, [items[1]])
        self.assertEqual(self.finish(run), 'completed')
        self.assertEqual(self.count('customers'), 2)

    def test_11_terminal_truth_and_immutability(self):
        for kinds, expected in [(['valid'], 'completed'), (['invalid'], 'failed'), (['valid', 'invalid'], 'completed_with_errors')]:
            items = [customer(str(uuid.uuid4())) for _ in kinds]
            for kind, item in zip(kinds, items):
                if kind == 'invalid':
                    item['row']['email'] = ''
            run = self.prepare(items); self.begin(run); self.batch(run)
            self.assertEqual(self.finish(run), expected)
            self.rejected(self.begin_sql(run, True), 'IMPORT_RUN_NOT_CLAIMABLE')
            self.rejected(f"update data_import_runs set state=state where id='{run['id']}'", 'Terminal import run is immutable')
            self.rejected(self.batch_sql(run, []), 'IMPORT_LEASE_LOST')
        aborted = self.prepare([customer('abort')]); self.begin(aborted)
        self.assertEqual(self.finish(aborted, True), 'failed')

    def test_12_service_readiness_normal_operator_and_internal_use(self):
        ids = self.seeded()
        for update in ["online_booking=true", "booking_visibility='online'"]:
            self.rejected(f"set role authenticated;update services set {update} where id='{ids['service']}'", 'SERVICE_COMMERCIAL_REVIEW_REQUIRED')
        self.run_sql(f"set role authenticated;update services set name='Internal edit' where id='{ids['service']}'")
        self.run_sql(f"set role authenticated;update services set commercial_settings_reviewed=true,online_booking=true,booking_visibility='online' where id='{ids['service']}'")
        self.assertEqual(self.run_sql('select commercial_settings_reviewed and online_booking from services'), 't')

    def test_13_customer_normalized_exact_link_and_conflict(self):
        cid = str(uuid.uuid4())
        self.run_sql(f"insert into customers(id,business_id,name,email) values('{cid}','{BIZ}','Synthetic Person',' PERSON@EXAMPLE.TEST ')")
        item = customer('person', external=False)
        run = self.prepare([linked(item, cid)]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['commit_result'], 'LINKED')
        self.finish(run)
        item['row']['name'] = 'Other Person'
        conflict = self.prepare([linked(item, cid)]); self.begin(conflict)
        self.assertEqual(self.batch(conflict)[0]['reason_codes'], ['IDENTITY_CONFLICT'])
        self.assertEqual(self.count('customers'), 1)
        for email in ['', 'bad', 'person@EXAMPLE.test', None]:
            bad = customer(str(uuid.uuid4()), external=False)
            bad['row']['email'] = email
            invalid = self.prepare([bad]); self.begin(invalid)
            self.assertEqual(self.batch(invalid)[0]['reason_codes'], ['CUSTOMER_EMAIL_UNSUPPORTED'])

    def test_14_exact_only_money_and_utc_status(self):
        ids = self.seeded()
        cases = [
            ('NONE', {'kind': 'NONE'}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('unreconciled', {'kind': 'UNRECONCILED'}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('currency', {'currency': 'USD'}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('paid', {'amountPaidCents': 1}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('refunded', {'amountRefundedCents': 1}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('discount', {'discountCents': 1}, 'FINANCIAL_RECONCILIATION_REQUIRED'),
            ('negative', {'priceCents': -1}, 'INVALID_MONEY'),
            ('fraction', {'taxCents': .5}, 'INVALID_MONEY'),
            ('overflow', {'priceCents': 2147483647, 'taxCents': 1}, 'INVALID_MONEY'),
            ('deposit', {'depositCents': 2035}, 'INVALID_MONEY'),
        ]
        for label, changes, reason in cases:
            with self.subTest(label=label):
                item = self.appointment(ids, label)
                item['row']['financials'].update(changes)
                run = self.prepare([item]); self.begin(run)
                self.assertEqual(self.batch(run)[0]['reason_codes'], [reason])
                self.assertEqual(self.finish(run), 'failed')
        for field, value, reason in [('start', '2000-01-01T00:00:00Z', 'NOT_FUTURE'), ('end', '2099-01-20T17:00:00Z', 'INVALID_RANGE'), ('start', '2099-01-20T17:30:00+00:00', 'INVALID_TIMESTAMP')]:
            item = self.appointment(ids, str(uuid.uuid4())); item['row'][field] = value
            run = self.prepare([item]); self.begin(run)
            self.assertEqual(self.batch(run)[0]['reason_codes'], [reason])
        item = self.appointment(ids, 'status'); item['mappedStatus'] = 'invented'
        run = self.prepare([item]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['reason_codes'], ['UNMAPPED_STATUS'])
        self.assertEqual(self.count('appointments'), 0)
        item = self.appointment(ids, 'zero-deposit'); item['row']['financials']['depositCents'] = 0
        run = self.prepare([item]); self.begin(run); self.batch(run); self.finish(run)
        self.assertEqual(self.run_sql('select payment_status from appointments'), 'unpaid')

    def test_15_relationship_truth_and_blocked_parent(self):
        ids = self.seeded()
        for table_name in ['service_locations', 'staff_locations', 'staff_services']:
            item = self.appointment(ids, table_name)
            run = self.prepare([item]); self.begin(run)
            original = self.run_sql(f'select row_to_json(t) from {table_name} t')
            self.run_sql('delete from ' + table_name)
            self.assertEqual(self.batch(run)[0]['reason_codes'], ['ASSIGNMENT_REQUIRED'])
            self.run_sql(f'insert into {table_name} select * from jsonb_populate_record(null::{table_name},{literal(original)}::jsonb)')
        item = self.appointment(ids, 'missing-staff'); del item['row']['staff']
        run = self.prepare([item]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['reason_codes'], ['BLOCKED_PARENT'])

    def test_16_location_and_staff_quota_final_authority(self):
        self.run_sql(f"update businesses set subscription_plan_key='starter' where id='{BIZ}'")
        items = [row('location', 'first', name='First', slug='first'), row('location', 'second', name='Second', slug='second')]
        run = self.prepare(items); self.begin(run)
        result = self.batch(run)
        self.assertEqual([o['commit_result'] for o in result], ['CREATED', 'BLOCKED'])
        self.assertEqual(self.finish(run), 'completed_with_errors')
        loc = result[0]['target_entity_id']
        items = [row('staff', key, name=key, primaryLocation=dict(existingId=loc)) for key in ['first', 'second']]
        run = self.prepare(items); self.begin(run)
        self.assertEqual([o['commit_result'] for o in self.batch(run)], ['CREATED', 'BLOCKED'])
        self.assertEqual(self.count('staff_working_hours'), 7)
        self.assertEqual(self.count('locations'), 1)

    def test_17_unexpected_error_rolls_back_whole_batch(self):
        items = [customer('first'), customer('second')]
        run = self.prepare(items); self.begin(run)
        self.run_sql("""create function synthetic_failure() returns trigger language plpgsql as $$ begin if new.email='second@example.test' then raise exception 'SYNTHETIC_SYSTEM_FAILURE'; end if; return new; end $$; create trigger synthetic_failure before insert on customers for each row execute function synthetic_failure();""")
        self.rejected(self.batch_sql(run), 'SYNTHETIC_SYSTEM_FAILURE')
        self.assertEqual(self.count('customers'), 0)
        self.assertEqual(self.count('data_import_entity_refs'), 0)
        self.assertEqual(self.run_sql("select count(*) from data_import_row_outcomes where phase='commit'"), '0')
        self.run_sql('drop trigger synthetic_failure on customers')
        self.batch(run); self.assertEqual(self.finish(run), 'completed')

    def test_18_privacy_and_required_migration_prerequisites(self):
        self.assertEqual(self.run_sql("select count(*) from information_schema.columns where table_name like 'data_import_%' and data_type in ('json','jsonb','bytea')"), '0')
        run = self.prepare([customer()]); self.begin(run); self.batch(run)
        audit = self.run_sql("select to_jsonb(t) from data_import_row_outcomes t")
        self.assertNotIn('Synthetic Person', audit)
        self.assertNotIn('@example.test', audit)
        self.assertNotIn('phone', audit)
        self.assertNotIn('034_', source(B2))
        self.assertNotIn('create or replace function public.enforce_staff_quota', source(B2))

    def race(self, first_sql, second_sql):
        first = subprocess.Popen(self.command(self.db), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=ENV)
        try:
            first.stdin.write("begin;set application_name='b2_first';set statement_timeout='15s';" + first_sql + "select 'READY';\n")
            first.stdin.flush()
            output = []
            while True:
                line = first.stdout.readline().strip()
                if not line and first.poll() is not None:
                    self.fail(first.stderr.read())
                if line == 'READY':
                    break
                output.append(line)
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(self.sql, "set application_name='b2_second';set statement_timeout='15s';" + second_sql, self.db)
                blocked = False
                for _ in range(100):
                    blocked = self.run_sql("select exists(select 1 from pg_stat_activity where application_name='b2_second' and cardinality(pg_blocking_pids(pid))>0)") == 't'
                    if blocked:
                        break
                    time.sleep(.02)
                # A different Business can still acquire its authority/context lock.
                self.run_sql(self.rpc('get_data_import_context', business=OTHER, actor=OTHER_OWNER))
                first.stdin.write('commit;\n'); first.stdin.flush(); first.stdin.close()
                first.wait(timeout=15)
                result = future.result(timeout=20)
            self.assertTrue(blocked, 'No positive evidence of lock contention')
            self.assertEqual(first.returncode, 0, first.stderr.read())
            return '\n'.join(output), result
        finally:
            if first.poll() is None:
                first.kill(); first.wait()
            for pipe in [first.stdin, first.stdout, first.stderr]:
                if not pipe.closed:
                    pipe.close()

    def test_19_begin_cas_positive_concurrency_evidence(self):
        run = self.prepare([customer()])
        winner, loser = self.race(self.begin_sql(run), self.begin_sql(run))
        self.assertEqual(len(winner), 36)
        self.assertNotEqual(loser.returncode, 0)
        self.assertIn('IMPORT_RUN_NOT_CLAIMABLE', loser.stderr)
        self.assertEqual(self.run_sql('select lease_token from data_import_runs'), winner)
        print('RACE PASS: begin CAS; blocked waiter observed; exactly one winner; other tenant unblocked', flush=True)

    def test_20_staff_overlap_race_and_half_open_intervals(self):
        ids = self.seeded()
        first = self.prepare([self.appointment(ids, 'first')])
        second = self.prepare([self.appointment(ids, 'second')])
        self.begin(first); self.begin(second)
        winner, loser = self.race(self.batch_sql(first), self.batch_sql(second))
        self.assertEqual(json.loads(winner)[0]['commit_result'], 'CREATED')
        self.assertEqual(loser.returncode, 0, loser.stderr)
        self.assertEqual(json.loads(loser.stdout)[0]['reason_codes'], ['APPOINTMENT_OVERLAP'])
        self.assertEqual(self.count('appointments'), 1)
        adjacent = self.appointment(ids, 'adjacent')
        adjacent['row'].update(start='2099-01-20T18:00:00.000Z', end='2099-01-20T18:30:00.000Z')
        run = self.prepare([adjacent]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['commit_result'], 'CREATED')
        cancelled = self.appointment(ids, 'cancelled'); cancelled['mappedStatus'] = 'cancelled'
        run = self.prepare([cancelled]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['commit_result'], 'CREATED')
        print('RACE PASS: appointment overlap; blocked waiter observed; one CREATED / one BLOCKED; adjacent/cancelled accepted', flush=True)

    def test_21_staff_count_slug_collision_and_prepare_drift(self):
        ids = self.seeded()
        run = self.prepare([row('location', 'new-location', name='New', slug='reviewed-slug')])
        for change in [
            f"update staff set is_active=false where id='{ids['staff']}'",
            f"insert into locations(business_id,name,slug) values('{BIZ}','Collision','reviewed-slug')",
            f"update services set name='Changed target version' where id='{ids['service']}'",
        ]:
            self.rejected('begin;' + change + ';' + self.begin_sql(run), 'IMPORT_REPREVIEW_REQUIRED')
        stale_context = json.loads(self.run_sql(self.rpc('get_data_import_context')))
        self.run_sql(f"update staff set is_active=false where id='{ids['staff']}'")
        self.rejected(self.rpc('prepare_data_import_run', j(SOURCE), literal(SHA), literal(SNAP), literal(stale_context['fingerprint']), j([customer('stale')])), 'IMPORT_REPREVIEW_REQUIRED')

    def test_22_prerequisites_fail_closed_and_existing_services_preserved(self):
        db = 'prereq_' + uuid.uuid4().hex
        self.execute(f'create database {db} template writer_prerequisite', 'postgres')
        self.addCleanup(lambda: self.execute(f'drop database {db} with (force)', 'postgres'))
        for table_name, trigger in [('staff', 'staff_enforce_plan_quota'), ('locations', 'locations_enforce_plan_quota')]:
            result = self.sql(f'begin;alter table {table_name} disable trigger {trigger};' + source(B2) + 'commit;', db)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('B2 requires', result.stderr)
            self.assertEqual(self.execute("select count(*) from information_schema.columns where table_name='services' and column_name='commercial_settings_reviewed'", db), '0')
        result = self.sql('begin;alter table appointments drop constraint appointments_staff_no_overlap;' + source(B2) + 'commit;', db)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('B2 requires', result.stderr)
        self.execute(f"insert into auth.users values('{OWNER}');insert into businesses(id,owner_id,name,slug,subscription_plan_key) values('{BIZ}','{OWNER}','Existing','existing','enterprise');insert into locations(id,business_id,name,slug) values('{BIZ}','{BIZ}','Existing','existing');insert into services(business_id,location_id,name,duration_minutes,price) values('{BIZ}','{BIZ}','Existing Service',30,42);", db)
        original = self.execute('select to_jsonb(t) from services t', db)
        self.execute('begin;' + source(B2) + 'commit;', db)
        self.assertEqual(self.execute("select commercial_settings_reviewed and online_booking and booking_visibility='online' and price=42 from services", db), 't')
        self.assertEqual(self.execute("select to_jsonb(t)-'commercial_settings_reviewed' from services t", db), original)

    def test_23_explicit_assignments_and_cross_tenant_endpoints(self):
        plan = complete_plan()[:-1]
        plan.insert(1, row('location', 'second-location', name='Second', slug='second'))
        plan.insert(4, row('serviceLocation', 'second-service-location', service=dict(sourceRowKey='service-1'), location=dict(sourceRowKey='second-location')))
        plan.insert(5, row('staffLocation', 'second-staff-location', staff=dict(sourceRowKey='staff-1'), location=dict(sourceRowKey='second-location')))
        run = self.prepare(plan); self.begin(run); out = self.batch(run)
        self.assertTrue(all(o['commit_result'] == 'CREATED' for o in out))
        self.assertEqual(self.count('services'), 1)
        self.assertEqual(self.count('staff'), 1)
        self.assertEqual(self.count('service_locations'), 2)
        self.assertEqual(self.count('staff_locations'), 2)
        self.assertEqual(self.count('staff_services'), 1)
        self.assertEqual(self.run_sql('select count(*) from service_locations where is_primary'), '1')
        self.assertEqual(self.run_sql('select count(*) from staff_locations where is_primary'), '1')
        self.finish(run)
        foreign_id = str(uuid.uuid4())
        self.run_sql(f"insert into locations(id,business_id,name,slug) values('{foreign_id}','{OTHER}','Foreign','foreign')")
        bad = row('service', 'foreign-service', name='Foreign service', durationMinutes=30,priceCents=100,currency='CAD',primaryLocation=dict(existingId=foreign_id))
        run = self.prepare([bad]); self.begin(run)
        self.assertEqual(self.batch(run)[0]['reason_codes'], ['MISSING_REFERENCE'])

    def test_24_successful_outcome_ref_atomicity_and_ref_immutability(self):
        item = customer()
        run = self.prepare([item]); self.begin(run); out = self.batch(run)
        target = out[0]['target_entity_id']
        self.rejected("update data_import_row_outcomes set planned_action=planned_action where phase='commit'", 'Import outcome is immutable')
        self.rejected(f"update data_import_entity_refs set chasum_entity_id='{str(uuid.uuid4())}'", 'Import source identity is immutable')
        self.rejected('set role service_role;delete from data_import_entity_refs', 'permission denied')
        self.assertEqual(self.run_sql('select chasum_entity_id from data_import_entity_refs'), target)
        self.finish(run)
        retry = self.prepare([linked(item, target)]); self.begin(retry)
        self.assertEqual(self.batch(retry)[0]['target_entity_id'], target)

    def test_25_ordinary_customer_insert_race_normalized_link_or_conflict(self):
        for key, name, expected in [('person', 'Synthetic Person', 'LINKED'), ('conflict', 'Different Person', 'BLOCKED')]:
            with self.subTest(expected=expected):
                item = customer(key)
                run = self.prepare([item]); self.begin(run)
                cid = str(uuid.uuid4())
                direct = f"insert into customers(id,business_id,name,email) values('{cid}','{BIZ}',{literal(name)},'{key.upper()}@EXAMPLE.TEST');"
                _, result = self.race(direct, self.batch_sql(run))
                self.assertEqual(result.returncode, 0, result.stderr)
                outcome = json.loads(result.stdout)[0]
                self.assertEqual(outcome['commit_result'], expected)
                if expected == 'LINKED':
                    self.assertEqual(outcome['target_entity_id'], cid)
                else:
                    self.assertEqual(outcome['reason_codes'], ['IDENTITY_CONFLICT'])
                self.assertEqual(self.run_sql(f"select count(*) from customers where lower(email)='{key}@example.test'"), '1')
                print('RACE PASS: ordinary mixed-case Customer INSERT; blocked import waiter observed; ' + expected + '; no duplicate', flush=True)

    def test_26_normal_staff_seed_preserved_import_seed_closed(self):
        ids = self.seeded()
        normal_id = str(uuid.uuid4())
        self.run_sql(f"insert into staff(id,business_id,location_id,name) values('{normal_id}','{BIZ}','{ids['location']}','Normal Operator Staff')")
        self.assertEqual(self.run_sql(f"select count(*)=7 and count(*) filter(where is_working)=5 and bool_and(start_time='09:00' and end_time='17:00') from staff_working_hours where staff_id='{normal_id}'"), 't')
        self.assertEqual(self.run_sql(f"select count(*)=7 and not bool_or(is_working) from staff_working_hours where staff_id='{ids['staff']}'"), 't')

    def test_27_ordinary_location_final_seat_race(self):
        self.run_sql(f"update businesses set subscription_plan_key='starter' where id='{BIZ}'")
        item = row('location', 'import-location', sourceExternalId='import-location', name='Imported Location', slug='import-location')
        run = self.prepare([item]); self.begin(run)
        direct = f"set role service_role;insert into locations(business_id,name,slug) values('{BIZ}','Ordinary Location','ordinary-location');"
        _, result = self.race(direct, self.batch_sql(run))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]['commit_result'], 'BLOCKED')
        self.assertEqual(self.run_sql(f"select count(*) from locations where business_id='{BIZ}' and is_active"), '1')
        self.assertEqual(self.run_sql('select slug from locations'), 'ordinary-location')
        self.assertEqual(self.count('data_import_entity_refs'), 0)
        self.assertEqual(self.finish(run), 'failed')
        print('RACE PASS: ordinary Location INSERT consumes final seat; blocked import waiter observed; import BLOCKED; active=1', flush=True)

    def test_28_ordinary_staff_final_seat_race(self):
        self.run_sql(f"update businesses set subscription_plan_key='starter' where id='{BIZ}';insert into locations(id,business_id,name,slug) values('{BIZ}','{BIZ}','Primary','primary');")
        item = row('staff', 'import-staff', sourceExternalId='import-staff', name='Imported Staff', primaryLocation=dict(existingId=BIZ))
        run = self.prepare([item]); self.begin(run)
        direct = f"set role service_role;insert into staff(business_id,location_id,name) values('{BIZ}','{BIZ}','Ordinary Staff');"
        _, result = self.race(direct, self.batch_sql(run))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]['commit_result'], 'BLOCKED')
        self.assertEqual(self.run_sql(f"select count(*) from staff where business_id='{BIZ}' and is_active"), '1')
        self.assertEqual(self.run_sql('select name from staff'), 'Ordinary Staff')
        self.assertEqual(self.run_sql('select count(*)=7 and count(*) filter(where is_working)=5 from staff_working_hours'), 't')
        self.assertEqual(self.count('data_import_entity_refs'), 0)
        self.assertEqual(self.finish(run), 'failed')
        print('RACE PASS: ordinary Staff INSERT consumes final seat; blocked import waiter observed; import BLOCKED; active=1', flush=True)

    def test_29_context_fingerprint_independent_of_session_timezone(self):
        run = self.prepare(complete_plan()); self.begin(run); self.batch(run); self.finish(run)
        contexts = [json.loads(self.run_sql('set timezone=' + literal(zone) + ';' + self.rpc('get_data_import_context')))
                    for zone in ['UTC', 'America/Toronto']]
        self.assertEqual(contexts[0]['fingerprint'], contexts[1]['fingerprint'])
        self.assertEqual(contexts[0], contexts[1])

    def test_30_primary_assignment_noop_is_immutable_skipped_outcome(self):
        plan = complete_plan()[:-1]
        plan.insert(3, row('serviceLocation', 'primary-service-location', service=dict(sourceRowKey='service-1'), location=dict(sourceRowKey='location-1')))
        plan.insert(4, row('staffLocation', 'primary-staff-location', staff=dict(sourceRowKey='staff-1'), location=dict(sourceRowKey='location-1')))
        run = self.prepare(plan); self.begin(run)
        outcomes = self.batch(run)
        for kind in ['serviceLocation', 'staffLocation']:
            outcome = next(o for o in outcomes if o['entity_type'] == kind)
            self.assertEqual(outcome['commit_result'], 'SKIPPED')
            self.assertEqual(outcome['status'], 'DUPLICATE_EXISTING')
            self.assertEqual(outcome['planned_action'], 'SKIP')
            self.assertEqual(outcome['reason_codes'], ['ASSIGNMENT_EXISTS'])
            self.assertIsNone(outcome['target_entity_id'])
        self.assertEqual(self.batch(run), outcomes)
        self.assertEqual(self.count('service_locations'), 1)
        self.assertEqual(self.count('staff_locations'), 1)
        self.assertEqual(self.finish(run), 'completed')

    def test_31_business_lock_then_ordinary_customer_fk_no_deadlock(self):
        item = customer('reversed-lock-order')
        run = self.prepare([item]); self.begin(run)
        holder = subprocess.Popen(self.command(self.db), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True, env=ENV)
        try:
            # Pause the import transaction after its real authority RPC acquired
            # the Business row lock, before the batch acquires its Customer table
            # lock. An ordinary INSERT must be able to finish its Business FK
            # check while that import Business lock remains held.
            holder.stdin.write("begin;set application_name='b2_reversed_holder';set statement_timeout='10s';" +
                               self.rpc('get_data_import_context') + "select 'READY';\n")
            holder.stdin.flush()
            while True:
                line = holder.stdout.readline().strip()
                if not line and holder.poll() is not None:
                    self.fail(holder.stderr.read())
                if line == 'READY':
                    break
            cid = str(uuid.uuid4())
            self.run_sql(f"set statement_timeout='3s';set role service_role;insert into customers(id,business_id,name,email) values('{cid}','{BIZ}','Synthetic Person','REVERSED-LOCK-ORDER@EXAMPLE.TEST');")
            self.assertEqual(self.run_sql("select exists(select 1 from pg_stat_activity where application_name='b2_reversed_holder' and state='idle in transaction' and backend_xid is not null)"), 't')
            self.assertEqual(self.run_sql(f"select count(*) from customers where id='{cid}'"), '1')
            holder.stdin.write(self.batch_sql(run) + 'commit;\n')
            holder.stdin.flush(); holder.stdin.close()
            holder.wait(timeout=15)
            self.assertEqual(holder.returncode, 0, holder.stderr.read())
            outcome = json.loads(holder.stdout.read().strip())[0]
            self.assertEqual(outcome['commit_result'], 'LINKED')
            self.assertEqual(outcome['target_entity_id'], cid)
            self.assertEqual(self.count('customers'), 1)
            self.assertEqual(self.finish(run), 'completed')
            print('INTERLEAVING PASS: import Business lock held first; ordinary Customer FK INSERT committed while held; import LINKED; no deadlock/duplicate', flush=True)
        finally:
            if holder.poll() is None:
                holder.kill(); holder.wait()
            for pipe in [holder.stdin, holder.stdout, holder.stderr]:
                if not pipe.closed:
                    pipe.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
