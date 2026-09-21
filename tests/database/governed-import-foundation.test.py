"""B1 exact-migration tests. Fresh disposable PostgreSQL 17; Unix socket ONLY.
Run: python3 tests/database/governed-import-foundation.test.py
PG_TEST_BIN may select local binaries. Child processes receive a minimal environment,
no PG* variables, DATABASE_URL, Supabase/provider credentials, or user psql startup file.
No existing database is contacted. The private cluster is stopped/removed on exit.
"""
import concurrent.futures
import hashlib
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
BIN = Path(os.environ.get('PG_TEST_BIN', '/opt/homebrew/opt/postgresql@17/bin'))
MIGRATION = ROOT / 'supabase/migrations/20260921203029_governed_import_foundation.sql'
BODY = MIGRATION.read_text()
ENV = {'PATH': '/usr/bin:/bin', 'LC_ALL': 'C', 'TZ': 'UTC'}
PORT = '57371'  # Unix socket filename only; listen_addresses is empty.
TABLES = ['data_import_runs', 'data_import_entity_refs', 'data_import_row_outcomes']
TYPES = ['location', 'service', 'staff', 'customer', 'appointment']
TARGETS = dict(zip(TYPES, ['locations', 'services', 'staff', 'customers', 'appointments']))
BIZ = '10000000-0000-4000-8000-000000000001'
FOREIGN = '10000000-0000-4000-8000-000000000002'
ACTOR = '20000000-0000-4000-8000-000000000001'
RUN_ID = '30000000-0000-4000-8000-000000000001'
RUN_2 = '30000000-0000-4000-8000-000000000002'
REF_ID = '40000000-0000-4000-8000-000000000001'
OUTCOME = '50000000-0000-4000-8000-000000000001'
SHA = 'a' * 64
ALT = 'b' * 64

def target(kind, foreign=False):
    return f'60000000-0000-4000-8000-{TYPES.index(kind) + 1:011d}{2 if foreign else 1}'

def literal(value):
    return 'null' if value is None else "'" + str(value).replace("'", "''") + "'"

def insert(table, values):
    return f"insert into public.{table} ({','.join(values)}) values ({','.join(literal(v) for v in values.values())});"

def run_insert(**changes):
    values = dict(id=RUN_ID, business_id=BIZ, created_by=ACTOR, source_system='fixture', source_account_key='workspace-1', schema_version='1', input_checksum=SHA, source_timezone='America/Toronto', source_currency='CAD')
    values.update(changes)
    return insert('data_import_runs', values)

def preview(run=RUN_ID):
    return f"update public.data_import_runs set state='previewed',preview_hash='{SHA}',snapshot_hash='{ALT}',previewed_at=clock_timestamp() where id='{run}';"

def committing(run=RUN_ID):
    return preview(run) + f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp() where id='{run}';"

def ref_insert(kind='customer', **changes):
    values = dict(id=REF_ID, business_id=BIZ, source_system='fixture', source_account_key='workspace-1', entity_type=kind, source_external_id='external-1', source_row_hash=SHA, chasum_entity_id=target(kind), first_import_run_id=RUN_ID, last_import_run_id=RUN_ID)
    values.update(changes)
    return insert('data_import_entity_refs', values)

def outcome_insert(**changes):
    values = dict(id=OUTCOME, import_run_id=RUN_ID, phase='preview', entity_type='customer', source_row_key='row-1', source_row_hash=SHA, status='READY', planned_action='CREATE', reason_codes='{}')
    values.update(changes)
    return insert('data_import_row_outcomes', values)

FIXTURE = '''
create schema auth;
create table auth.users (id uuid primary key);
create table public.businesses (id uuid primary key);
''' + '\n'.join(f'create table public.{table} (id uuid primary key, business_id uuid not null references public.businesses(id) on delete cascade);' for table in TARGETS.values())

class Foundation(unittest.TestCase):
    @classmethod
    def sql(cls, query, db='postgres'):
        return subprocess.run([str(BIN/'psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-h', str(cls.path), '-p', PORT, '-U', 'postgres', '-d', db], input=query, text=True, capture_output=True, env=ENV, timeout=15)

    @classmethod
    def execute(cls, query, db='postgres'):
        result = cls.sql(query, db)
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='chasum-b1-', dir='/private/tmp')
        cls.path = Path(cls.temp.name)
        cls.addClassCleanup(cls.temp.cleanup)
        subprocess.run([str(BIN/'initdb'), '-D', str(cls.path/'data'), '-U', 'postgres', '-A', 'trust', '--no-locale'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        subprocess.run([str(BIN/'pg_ctl'), '-D', str(cls.path/'data'), '-l', str(cls.path/'postgres.log'), '-o', f"-k {cls.path} -p {PORT} -c listen_addresses='' -c unix_socket_permissions=0700", '-w', 'start'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        cls.addClassCleanup(lambda: subprocess.run([str(BIN/'pg_ctl'), '-D', str(cls.path/'data'), '-m', 'fast', '-w', 'stop'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30))
        assert cls.execute('show listen_addresses;') == ''
        assert cls.execute('show unix_socket_directories;') == str(cls.path)
        assert cls.execute('select inet_server_addr() is null;') == 't'
        print('LOCAL ONLY:', cls.path, 'TCP disabled; version', cls.execute('show server_version;'), flush=True)
        print('EXACT MIGRATION SHA256:', hashlib.sha256(BODY.encode()).hexdigest(), flush=True)
        cls.execute('create role anon;create role authenticated;create role service_role bypassrls;')
        cls.execute(FIXTURE)
        # Adversarial Supabase-like defaults: migration must remove all of these.
        cls.execute('alter default privileges in schema public grant all on tables to public, anon, authenticated, service_role; alter default privileges in schema public grant execute on functions to public, anon, authenticated, service_role;')
        cls.execute('begin;\n' + BODY + '\ncommit;')

    def setUp(self):
        self.execute('truncate public.data_import_entity_refs, public.data_import_row_outcomes, public.data_import_runs, public.businesses, auth.users cascade;')
        self.execute(f"insert into auth.users values ('{ACTOR}'); insert into public.businesses values ('{BIZ}'),('{FOREIGN}');" + ''.join(f"insert into public.{table} values ('{target(kind)}','{BIZ}'),('{target(kind, True)}','{FOREIGN}');" for kind, table in TARGETS.items()))

    def rejected(self, query, state='23514', db='postgres'):
        result = self.sql(query, db)
        self.assertNotEqual(result.returncode, 0, query)
        self.assertIn(state, result.stderr, result.stderr)

    def test_exact_tables_columns_privacy(self):
        actual = self.execute("select tablename from pg_tables where schemaname='public' and tablename like 'data_import_%' order by tablename;").splitlines()
        self.assertEqual(actual, sorted(TABLES))
        expected = {
            TABLES[0]: 'id business_id created_by source_system source_account_key schema_version input_checksum source_timezone source_currency state preview_hash snapshot_hash created_at previewed_at commit_started_at finished_at',
            TABLES[1]: 'id business_id source_system source_account_key entity_type source_external_id source_row_hash chasum_entity_id first_import_run_id last_import_run_id created_at updated_at',
            TABLES[2]: 'id import_run_id phase entity_type source_row_key source_row_hash status planned_action reason_codes target_entity_id created_at',
        }
        for table, columns in expected.items():
            self.assertEqual(self.execute(f"select column_name from information_schema.columns where table_schema='public' and table_name='{table}' order by ordinal_position;").splitlines(), columns.split())
        self.assertEqual(self.execute("select count(*) from information_schema.columns where table_name like 'data_import_%' and data_type in ('json','jsonb','bytea');"), '0')

    def test_rls_no_policies_and_no_public_acl(self):
        self.assertEqual(self.execute("select count(*) from pg_class where oid in ('public.data_import_runs'::regclass,'public.data_import_entity_refs'::regclass,'public.data_import_row_outcomes'::regclass) and relrowsecurity and relforcerowsecurity;"), '3')
        self.assertEqual(self.execute("select count(*) from pg_policies where schemaname='public' and tablename like 'data_import_%';"), '0')
        self.assertEqual(self.execute("select count(*) from pg_class c cross join lateral aclexplode(c.relacl) a where c.relname like 'data_import_%' and a.grantee=0;"), '0')

    def test_helper_acl_invoker_and_pinned_path(self):
        rows = self.execute("select p.proname, p.prosecdef, p.proconfig::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'data_import_%' order by p.proname;").splitlines()
        self.assertEqual(len(rows), 4)
        for row in rows:
            self.assertIn('|f|', row)
            self.assertIn('search_path=pg_catalog, pg_temp', row)
        for role in ['anon', 'authenticated', 'service_role']:
            self.assertEqual(self.execute(f"select count(*) from pg_proc where proname like 'data_import_%' and has_function_privilege('{role}',oid,'EXECUTE');"), '0')
            self.rejected(f"set role {role};select public.data_import_assert_target('customer','{target('customer')}','{BIZ}');", '42501')
        self.assertEqual(self.execute("select count(*) from pg_proc p cross join lateral aclexplode(p.proacl) a where p.proname like 'data_import_%' and a.grantee=0;"), '0')

    def test_triggers_on_import_tables_only(self):
        rows = self.execute("select c.relname,pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal order by c.relname;").splitlines()
        self.assertEqual(len(rows), 3)
        for row in rows:
            self.assertTrue(row.startswith('data_import_'))
            self.assertIn('BEFORE INSERT OR UPDATE', row)
            self.assertNotIn('DELETE', row)

    def test_rls_independent_of_acl(self):
        self.execute(run_insert())
        self.execute('create role b1_rls_probe;grant usage on schema public to b1_rls_probe;grant select,insert on public.data_import_runs to b1_rls_probe;')
        try:
            self.assertEqual(self.execute('set role b1_rls_probe;select count(*) from public.data_import_runs;'), '0')
            self.rejected('set role b1_rls_probe;' + run_insert(id=RUN_2), '42501')
        finally:
            self.execute('drop owned by b1_rls_probe;drop role b1_rls_probe;')

    def test_indexes_and_fk_definitions(self):
        self.assertEqual(self.execute("select count(*) from pg_indexes where schemaname='public' and tablename like 'data_import_%';"), '11')
        self.assertEqual(self.execute("select count(*) from pg_constraint where conrelid='public.data_import_entity_refs'::regclass and contype='f' and condeferrable and condeferred and confdeltype='a';"), '2')
        self.assertEqual(self.execute("select count(*) from pg_constraint where conrelid in ('public.data_import_runs'::regclass,'public.data_import_entity_refs'::regclass,'public.data_import_row_outcomes'::regclass) and contype='f' and confdeltype='c';"), '3')
        self.assertEqual(self.execute("select count(*) from pg_constraint where conrelid='public.data_import_runs'::regclass and contype='f' and confrelid='auth.users'::regclass and confdeltype='r';"), '1')
        columns = self.execute("select column_name,data_type,is_nullable from information_schema.columns where table_name='data_import_runs' order by ordinal_position;")
        for column in ['id','business_id','created_by']:
            self.assertIn(column + '|uuid|NO', columns)
        self.assertIn('created_at|timestamp with time zone|NO', columns)
        self.assertIn('preview_hash|text|YES', columns)

    def test_inherited_acl_drift_rolls_back_whole_migration(self):
        self.execute('create database acl_drift;create role b1_unexpected_group;grant b1_unexpected_group to service_role;')
        try:
            self.execute(FIXTURE + 'alter default privileges in schema public grant insert on tables to b1_unexpected_group;', 'acl_drift')
            self.rejected('begin;\n' + BODY + '\ncommit;', 'Unexpected effective B1 mutation privilege', 'acl_drift')
            self.assertEqual(self.execute("select count(*) from pg_tables where schemaname='public' and tablename like 'data_import_%';", 'acl_drift'), '0')
            self.assertEqual(self.execute("select count(*) from pg_proc where proname like 'data_import_%';", 'acl_drift'), '0')
        finally:
            self.execute('drop database acl_drift;revoke b1_unexpected_group from service_role;drop role b1_unexpected_group;')

    def test_concurrent_source_tuple_one_winner(self):
        self.execute(run_insert() + committing())
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results = list(pool.map(self.sql, [ref_insert(), ref_insert(id=OUTCOME)]))
        self.assertEqual(sum(r.returncode == 0 for r in results), 1)
        self.assertIn('23505', next(r.stderr for r in results if r.returncode))
        self.assertEqual(self.execute('select count(*) from public.data_import_entity_refs;'), '1')

    def test_valid_postgres_insert(self):
        self.execute(run_insert())
        self.assertEqual(self.execute('select state from public.data_import_runs;'), 'uploaded')

    def test_all_allowed_transitions(self):
        paths = [['previewed','committing','completed'], ['previewed','committing','completed_with_errors'], ['failed'], ['cancelled'], ['previewed','failed'], ['previewed','cancelled'], ['previewed','committing','failed']]
        for states in paths:
            with self.subTest(states=states):
                self.setUp(); self.execute(run_insert())
                for state in states:
                    if state == 'previewed': self.execute(preview())
                    elif state == 'committing': self.execute(f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp() where id='{RUN_ID}';")
                    else: self.execute(f"update public.data_import_runs set state='{state}',finished_at=clock_timestamp() where id='{RUN_ID}';")
                self.assertEqual(self.execute('select state from public.data_import_runs;'), states[-1])

    def test_every_illegal_state_edge(self):
        allowed = {'uploaded': ['previewed','failed','cancelled'], 'previewed': ['committing','failed','cancelled'], 'committing': ['completed','completed_with_errors','failed']}
        states = ['uploaded','previewed','committing','completed','completed_with_errors','failed','cancelled']
        for old in states:
            for new in states:
                if new in allowed.get(old, []): continue
                with self.subTest(old=old, new=new):
                    self.setUp(); self.execute(run_insert())
                    if old in ['previewed','committing','completed','completed_with_errors']: self.execute(preview())
                    if old in ['committing','completed','completed_with_errors']: self.execute(f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp();")
                    if old in ['completed','completed_with_errors','failed','cancelled']: self.execute(f"update public.data_import_runs set state='{old}',finished_at=clock_timestamp();")
                    self.rejected(f"update public.data_import_runs set state='{new}';")

    def test_terminal_noop_and_identity_mutation(self):
        self.execute(run_insert() + "update public.data_import_runs set state='cancelled',finished_at=clock_timestamp();")
        self.rejected('update public.data_import_runs set state=state;')
        self.rejected("update public.data_import_runs set source_account_key='retarget';")

    def test_preview_hashes_and_timestamps(self):
        self.execute(run_insert())
        for update in ["state='previewed'", f"state='previewed',preview_hash='{SHA}'", f"state='previewed',preview_hash='{SHA}',snapshot_hash='{ALT}'", f"state='previewed',preview_hash='{SHA}',snapshot_hash='{ALT}',previewed_at='2000-01-01'", f"state='previewed',preview_hash='{SHA}',snapshot_hash='{ALT}',previewed_at='infinity'"]:
            with self.subTest(update=update): self.rejected('update public.data_import_runs set ' + update + ';')
        self.execute(preview())
        self.rejected("update public.data_import_runs set state='committing';")
        self.rejected(f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp(),preview_hash='{ALT}';")
        self.rejected("update public.data_import_runs set state='failed';")

    def test_terminal_preserves_reviewed_timestamps(self):
        self.execute(run_insert() + committing())
        self.rejected("update public.data_import_runs set state='completed',finished_at=clock_timestamp(),commit_started_at=clock_timestamp();")
        self.rejected("update public.data_import_runs set state='completed',finished_at='2000-01-01';")

    def test_compare_and_swap_one_winner(self):
        self.execute(run_insert() + preview())
        query = "update public.data_import_runs set state='committing',commit_started_at=clock_timestamp() where state='previewed' returning id;"
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            replies = list(pool.map(lambda _: self.execute(query), range(2)))
        self.assertEqual(sum(bool(r) for r in replies), 1)

    def test_duplicate_source_tuple(self):
        self.execute(run_insert() + committing() + ref_insert())
        self.rejected(ref_insert(id=OUTCOME), '23505')

    def test_ref_namespace_and_first_run_fk(self):
        self.execute(run_insert() + committing())
        for changes in [dict(source_system='other'), dict(source_account_key='other'), dict(business_id=FOREIGN), dict(first_import_run_id=RUN_2, last_import_run_id=RUN_2)]:
            with self.subTest(changes=changes): self.rejected(ref_insert(**changes))
        self.execute(run_insert(id=RUN_2, source_account_key='other') + committing(RUN_2))
        self.execute(ref_insert())
        # Update mutable last-run fields can't cross namespace, even if target is valid.
        self.rejected(f"update public.data_import_entity_refs set last_import_run_id='{RUN_2}';")
        # Verify composite FKs themselves with only the custom trigger disabled locally.
        self.execute('alter table public.data_import_entity_refs disable trigger data_import_refs_guard;')
        try:
            self.rejected(f"begin;update public.data_import_entity_refs set last_import_run_id='{RUN_2}';commit;", '23503')
        finally: self.execute('alter table public.data_import_entity_refs enable trigger data_import_refs_guard;')

    def test_ref_allowed_last_seen_update(self):
        self.execute(run_insert() + committing() + ref_insert())
        self.execute("update public.data_import_runs set state='completed',finished_at=clock_timestamp();")
        self.execute(run_insert(id=RUN_2) + committing(RUN_2))
        self.execute(f"update public.data_import_entity_refs set source_row_hash='{ALT}',last_import_run_id='{RUN_2}',updated_at=clock_timestamp();")
        self.assertEqual(self.execute('select first_import_run_id,last_import_run_id,source_row_hash from public.data_import_entity_refs;'), f'{RUN_ID}|{RUN_2}|{ALT}')
        self.rejected("update public.data_import_entity_refs set updated_at='2000-01-01';")

    def test_ref_requires_committing_and_revalidates_target(self):
        self.execute(run_insert())
        self.rejected(ref_insert())
        self.execute(committing() + ref_insert())
        self.execute(f"delete from public.customers where id='{target('customer')}';")
        self.rejected(f"update public.data_import_entity_refs set source_row_hash='{ALT}',updated_at=clock_timestamp();", '23503')
        self.assertEqual(self.execute('select count(*) from public.data_import_entity_refs;'), '1')

    def test_outcome_separate_phases_and_closed_phases(self):
        self.execute(run_insert() + outcome_insert() + committing())
        self.execute(outcome_insert(id=REF_ID, phase='commit'))
        self.assertEqual(self.execute('select count(*) from public.data_import_row_outcomes;'), '2')
        self.rejected(outcome_insert(id=ACTOR, source_row_key='late-preview'))
        self.execute("update public.data_import_runs set state='completed',finished_at=clock_timestamp();")
        self.rejected(outcome_insert(id=ACTOR, phase='commit', source_row_key='late-commit'))
        self.rejected(ref_insert())

    def test_outcome_duplicate_and_immutable(self):
        self.execute(run_insert() + outcome_insert())
        self.rejected(outcome_insert(id=REF_ID), '23505')
        self.rejected("update public.data_import_row_outcomes set phase='commit';")
        self.rejected('update public.data_import_row_outcomes set status=status;')

    def test_reconciliation_never_ready(self):
        self.execute(run_insert())
        self.rejected(outcome_insert(reason_codes='{FINANCIAL_RECONCILIATION_REQUIRED}'))
        self.execute(outcome_insert(status='WARNING', planned_action='REVIEW', reason_codes='{FINANCIAL_RECONCILIATION_REQUIRED}'))

    def test_business_offboarding_and_run_delete(self):
        self.execute(run_insert() + outcome_insert() + committing() + ref_insert())
        self.execute(run_insert(id=RUN_2) + committing(RUN_2))
        self.execute(f"update public.data_import_entity_refs set last_import_run_id='{RUN_2}',updated_at=clock_timestamp();")
        self.rejected(f"begin;delete from public.data_import_runs where id='{RUN_ID}';commit;", '23503')
        self.assertEqual(self.execute('select count(*) from public.data_import_runs;'), '2')
        self.execute("update public.data_import_runs set state='completed',finished_at=clock_timestamp();")
        self.execute(f"begin;delete from public.businesses where id='{BIZ}';commit;")
        for table in TABLES: self.assertEqual(self.execute('select count(*) from public.' + table), '0')
        self.assertEqual(self.execute('select id from public.businesses;'), FOREIGN)
        self.assertEqual(self.execute('select count(*) from auth.users;'), '1')

    def test_auth_deletion_not_silent_audit_loss(self):
        self.execute(run_insert())
        self.rejected(f"delete from auth.users where id='{ACTOR}';", '23503')

    def test_reapply_rolls_back_without_adoption(self):
        self.execute(run_insert())
        self.rejected('begin;\n' + BODY + '\ncommit;', 'B1 target already exists')
        self.assertEqual(self.execute('select count(*) from public.data_import_runs;'), '1')

    def test_migration_static_scope_and_reason_parity(self):
        code = re.sub(r'--[^\n]*', '', BODY).lower()
        self.assertEqual(len(re.findall(r'create table public\.', code)), 3)
        self.assertNotIn('create table if not exists', code)
        self.assertNotRegex(code, r'\b(insert\s+into|update|delete\s+from)\s+(?:public\.)?(?:locations|services|staff|customers|appointments|staff_locations|service_locations|staff_services)\b')
        self.assertNotIn('security definer', code)
        self.assertNotIn('payment_status', code)
        self.assertNotIn('create policy', code)
        self.assertNotRegex(code, r'\bgrant\s+(?:all|insert|update|delete)\b')
        contracts = (ROOT/'lib/imports/contracts.ts').read_text()
        reasons = re.search(r'export const reasonCodes = \[(.*?)\] as const;', contracts, re.S).group(1)
        self.assertEqual(set(re.findall(r'"([A-Z_]+)"', reasons)), set(re.findall(r"'([A-Z_]+)'", BODY[BODY.index('and reason_codes <@ array['):BODY.index(']::text[]),') ])))

    def test_lock_target_against_concurrent_retenanting(self):
        self.execute(run_insert() + committing())
        # A ref insert's SHARE lock must block business_id changes through commit.
        script = 'begin;' + ref_insert() + "select pg_sleep(2);commit;"
        with concurrent.futures.ThreadPoolExecutor(1) as pool:
            worker = pool.submit(self.execute, script)
            import time
            for _ in range(100):
                if self.execute("select count(*) from pg_locks where relation='public.customers'::regclass and mode='RowShareLock' and granted;") != '0': break
                time.sleep(0.02)
            else: self.fail('local target lock was not acquired')
            self.rejected(f"set lock_timeout='100ms';update public.customers set business_id='{FOREIGN}' where id='{target('customer')}';", '55P03')
            worker.result()

# Each generated case is a separately counted unittest, not a source-text assertion.
def register(name, function):
    setattr(Foundation, 'test_' + name, function)

for role in ['anon', 'authenticated', 'service_role']:
    for table in TABLES:
        def acl_test(self, role=role, table=table):
            self.execute(run_insert())
            for privilege in ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']:
                self.assertEqual(self.execute(f"select has_table_privilege('{role}','public.{table}','{privilege}');"), 't' if role == 'service_role' and privilege == 'SELECT' else 'f')
            if role == 'service_role':
                self.execute(f'set role {role};select * from public.{table};')
            else: self.rejected(f'set role {role};select * from public.{table};', '42501')
            for query in [f'insert into public.{table} default values;', f'update public.{table} set id=id;', f'delete from public.{table};', f'truncate public.{table};']:
                self.rejected(f'set role {role};' + query, '42501')
        register(f'acl_{role}_{table}', acl_test)

for field, value, state in [
    ('input_checksum','A'*64,'23514'), ('input_checksum','bad','23514'), ('source_system','','23514'), ('source_account_key',' ','23514'),
    ('source_currency','cad','23514'), ('source_currency','CA','23514'), ('state','other','23514'), ('state','completed','23514'),
    ('created_by',FOREIGN,'23503'), ('business_id',ACTOR,'23503'), ('schema_version','','23514'), ('source_timezone','','23514'),
]:
    def invalid_run(self, field=field, value=value, state=state): self.rejected(run_insert(**{field:value}), state)
    register(f'run_invalid_{field}_{len(value)}', invalid_run)

for field in ['id','business_id','created_by','source_system','source_account_key','schema_version','input_checksum','source_timezone','source_currency','created_at']:
    def immutable_run(self, field=field):
        self.execute(run_insert())
        value = FOREIGN if field in ['id','business_id','created_by'] else ALT if field=='input_checksum' else '2000-01-01' if field=='created_at' else 'other'
        self.rejected(f"update public.data_import_runs set {field}={literal(value)},state='failed',finished_at=clock_timestamp();")
    register('run_immutable_' + field, immutable_run)

for kind in TYPES:
    def valid_target(self, kind=kind):
        self.execute(run_insert() + outcome_insert(entity_type=kind, target_entity_id=target(kind)) + committing() + ref_insert(kind))
        self.assertEqual(self.execute('select count(*) from public.data_import_entity_refs;'), '1')
    register('target_valid_' + kind, valid_target)
    for mode in ['missing','wrong_type','foreign']:
        def bad_target(self, kind=kind, mode=mode):
            bad = ACTOR if mode=='missing' else target(TYPES[(TYPES.index(kind)+1)%len(TYPES)]) if mode=='wrong_type' else target(kind, True)
            self.execute(run_insert())
            self.rejected(outcome_insert(entity_type=kind, target_entity_id=bad), '23503')
            self.execute(committing())
            self.rejected(ref_insert(kind, chasum_entity_id=bad), '23503')
        register(f'target_{kind}_{mode}', bad_target)

for kind in ['staffService','staffLocation','serviceLocation']:
    def assignment(self, kind=kind):
        self.execute(run_insert())
        self.execute(outcome_insert(entity_type=kind, status='DUPLICATE_EXISTING', planned_action='SKIP', reason_codes='{ASSIGNMENT_EXISTS}'))
        self.rejected(outcome_insert(id=REF_ID, entity_type=kind, source_row_key='row-2', target_entity_id=target('staff')))
        self.execute(committing())
        self.rejected(ref_insert(entity_type=kind))
    register('assignment_' + kind, assignment)

for field in ['id','business_id','source_system','source_account_key','entity_type','source_external_id','chasum_entity_id','first_import_run_id','created_at']:
    def immutable_ref(self, field=field):
        self.execute(run_insert() + committing() + ref_insert())
        value = FOREIGN if field in ['id','business_id','chasum_entity_id','first_import_run_id'] else '2000-01-01' if field=='created_at' else 'other'
        self.rejected(f'update public.data_import_entity_refs set {field}={literal(value)};')
    register('ref_immutable_' + field, immutable_ref)

for field, value in [
    ('status','UNKNOWN'), ('planned_action','SEND'), ('source_row_hash','bad'), ('source_row_key','person@example.test'),
    ('reason_codes','{free form error}'), ('reason_codes','{SECRET_PROVIDER_ERROR}'), ('reason_codes','{NULL}'),
    ('reason_codes','{' + ','.join(['INVALID_ROW']*41) + '}'), ('phase','other'), ('target_entity_id',None),
]:
    def invalid_outcome(self, field=field, value=value):
        self.execute(run_insert())
        extra = dict(planned_action='LINK_EXISTING', status='DUPLICATE_EXISTING') if field=='target_entity_id' else {}
        self.rejected(outcome_insert(**extra, **{field:value}))
    register('outcome_invalid_' + field + '_' + str(len(str(value))), invalid_outcome)

for table in TABLES:
    def drift(self, table=table):
        database = 'drift_' + table
        self.execute('create database ' + database)
        try:
            self.execute(FIXTURE + f'create table public.{table}(unexpected text);', database)
            self.rejected('begin;\n' + BODY + '\ncommit;', 'B1 target already exists', database)
            self.assertEqual(self.execute("select count(*) from pg_tables where schemaname='public' and tablename like 'data_import_%';", database), '1')
            self.assertEqual(self.execute("select count(*) from pg_proc where proname like 'data_import_%';", database), '0')
        finally: self.execute('drop database ' + database)
    register('drift_' + table, drift)

for prerequisite in ['businesses','locations','services','staff','customers','appointments','auth.users']:
    def missing_prerequisite(self, prerequisite=prerequisite):
        self.execute('create database prerequisite_drift;')
        try:
            qualified = prerequisite if prerequisite == 'auth.users' else 'public.' + prerequisite
            self.execute(FIXTURE + 'drop table ' + qualified + ' cascade;', 'prerequisite_drift')
            self.rejected('begin;\n' + BODY + '\ncommit;', 'B1 prerequisite missing or incompatible', 'prerequisite_drift')
            self.assertEqual(self.execute("select count(*) from pg_tables where tablename like 'data_import_%';", 'prerequisite_drift'), '0')
        finally: self.execute('drop database prerequisite_drift;')
    register('prerequisite_' + prerequisite.replace('.', '_'), missing_prerequisite)

if __name__ == '__main__':
    unittest.main(verbosity=2)
