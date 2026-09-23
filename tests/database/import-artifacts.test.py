"""C1 exact-migration contract on fresh private Unix-socket-only PostgreSQL.

Run: python3 tests/database/import-artifacts.test.py
PG_TEST_BIN optionally selects local PostgreSQL binaries. No existing database,
URL, provider credential or hosted service is used. The minimal storage.buckets
and storage.objects fixtures are NOT the Supabase Storage service: these tests
prove SQL/ACL/lifecycle behavior, not signed-token or HTTP object enforcement.
Privileged fixture-only clock shifts disable the relevant immutable guard and
move related timestamps together; application/RPC roles never receive this power.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / 'supabase/migrations'
BODY = (MIGRATIONS / '20260923205834_issue_73_package_c1_private_artifacts.sql').read_text()
B1 = (MIGRATIONS / '20260921203029_governed_import_foundation.sql').read_text()
BIN = Path(os.environ['PG_TEST_BIN']) if os.environ.get('PG_TEST_BIN') else Path(
    subprocess.check_output([shutil.which('pg_config'), '--bindir'], text=True).strip())
ENV = {'PATH': '/usr/bin:/bin', 'LC_ALL': 'C', 'TZ': 'UTC'}
PORT = '57375'  # Unix socket filename only. TCP is disabled.
BIZ = '10000000-0000-4000-8000-000000000001'
OTHER = '10000000-0000-4000-8000-000000000002'
OWNER = '20000000-0000-4000-8000-000000000001'
OTHER_OWNER = '20000000-0000-4000-8000-000000000002'
ADMIN = '20000000-0000-4000-8000-000000000003'
SHA, REVIEWED, PREVIEW, SNAPSHOT = [c * 64 for c in 'abcd']
TABLES = ['data_import_sources', 'data_import_artifacts']
UUID4 = r'[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}'
RPCS = ['c1_create_source', 'c1_list_sources', 'c1_create_artifact', 'c1_access_artifact',
        'c1_verify_raw', 'c1_reserve_reviewed', 'c1_finish_reviewed', 'c1_bind_run',
        'c1_claim_cleanup', 'c1_finish_cleanup']

FIXTURE = '''
create schema auth;
create table auth.users(id uuid primary key);
create table public.businesses(id uuid primary key,owner_id uuid not null);
create schema storage;
-- SQL-shape-only fixtures. No Storage HTTP server, signed token or object bytes.
create table storage.buckets(id text primary key,name text not null,public boolean not null,
  file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
''' + '\n'.join(f'create table public.{name}(id uuid primary key,business_id uuid not null references public.businesses(id) on delete cascade);'
               for name in ['locations', 'services', 'staff', 'customers', 'appointments'])


def literal(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return str(value).lower()
    return "'" + str(value).replace("'", "''") + "'"


class Artifacts(unittest.TestCase):
    @classmethod
    def sql(cls, query, db='postgres'):
        return subprocess.run([str(BIN / 'psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1',
                               '-v', 'VERBOSITY=verbose', '-h', str(cls.path), '-p', PORT,
                               '-U', 'postgres', '-d', db], input=query, text=True,
                              capture_output=True, env=ENV, timeout=20)

    @classmethod
    def execute(cls, query, db='postgres'):
        result = cls.sql(query, db)
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='chasum-c1-', dir='/private/tmp')
        cls.path = Path(cls.temp.name)
        cls.addClassCleanup(cls.temp.cleanup)
        subprocess.run([str(BIN / 'initdb'), '-D', str(cls.path / 'data'), '-U', 'postgres',
                        '-A', 'trust', '--no-locale', '--encoding=UTF8'], check=True,
                       env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        subprocess.run([str(BIN / 'pg_ctl'), '-D', str(cls.path / 'data'), '-l',
                        str(cls.path / 'postgres.log'), '-o',
                        f"-k {cls.path} -p {PORT} -c listen_addresses='' -c unix_socket_permissions=0700",
                        '-w', 'start'], check=True, env=ENV, stdout=subprocess.DEVNULL, timeout=30)
        cls.addClassCleanup(lambda: subprocess.run([str(BIN / 'pg_ctl'), '-D', str(cls.path / 'data'),
                                                    '-m', 'fast', '-w', 'stop'], check=True,
                                                   env=ENV, stdout=subprocess.DEVNULL, timeout=30))
        assert cls.execute('show server_encoding') == 'UTF8'
        assert cls.execute('show listen_addresses') == ''
        assert cls.execute('show unix_socket_directories') == str(cls.path)
        assert cls.execute('select inet_server_addr() is null') == 't'
        print('LOCAL ONLY; TCP disabled; PostgreSQL', cls.execute('show server_version'), flush=True)
        print('EXACT C1 SHA256:', hashlib.sha256(BODY.encode()).hexdigest(), flush=True)
        print('Storage: SQL fixture only; provider/token enforcement NOT TESTED', flush=True)
        cls.execute('create role anon;create role authenticated;create role service_role bypassrls;')
        cls.bootstrap()

    @classmethod
    def bootstrap(cls, db='postgres', extra=''):
        cls.execute(FIXTURE + '''
          grant usage on schema public,auth to anon,authenticated,service_role;
          alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role;
          alter default privileges in schema public grant execute on functions to public,anon,authenticated,service_role;
        ''' + 'begin;\n' + B1 + '\ncommit;' + extra, db)
        cls.execute('begin;\n' + BODY + '\ncommit;', db)

    def setUp(self):
        self.execute('truncate public.businesses,auth.users cascade;')
        self.execute(f"insert into auth.users values ('{OWNER}'),('{OTHER_OWNER}'),('{ADMIN}');"
                     f"insert into public.businesses values ('{BIZ}','{OWNER}'),('{OTHER}','{OTHER_OWNER}');")
        self.source = self.create_source()

    def rejected(self, query, code='23514', db='postgres'):
        result = self.sql(query, db)
        self.assertNotEqual(result.returncode, 0, query)
        self.assertIn(code, result.stderr, result.stderr)

    def rpc_sql(self, name, *args):
        return f"set role service_role;select public.{name}({','.join(literal(a) for a in args)});"

    def rpc(self, name, *args):
        return self.execute(self.rpc_sql(name, *args))

    def create_source(self, business=BIZ, owner=OWNER, system='synthetic-source', label='Synthetic source'):
        safe = json.loads(self.rpc('c1_create_source', business, owner, system, label))
        self.assertEqual(set(safe), {'id', 'sourceSystem', 'displayLabel', 'createdAt'})
        return self.record('data_import_sources', safe['id'])

    def record(self, table, identity):
        return json.loads(self.execute(f"select row_to_json(t) from public.{table} t where id={literal(identity)}"))

    def artifact(self, source=None, business=BIZ, owner=OWNER, entity='customer'):
        identity = (source or self.source)['id']
        query = f"set role service_role;select row_to_json(t) from public.c1_create_artifact({literal(business)},{literal(owner)},{literal(identity)},{literal(entity)}) t"
        return json.loads(self.execute(query))

    def verify(self, artifact, **kwargs):
        self.rpc('c1_verify_raw', artifact['business_id'], artifact['created_by'], artifact['id'],
                 kwargs.get('sha', SHA), kwargs.get('size', 12), kwargs.get('media', 'text/csv'))

    def reserve(self, artifact):
        args = [artifact['business_id'], artifact['created_by'], artifact['id'], REVIEWED, 64, PREVIEW, SNAPSHOT]
        return json.loads(self.execute('set role service_role;select row_to_json(t) from public.c1_reserve_reviewed('
                                       + ','.join(literal(x) for x in args) + ') t'))

    def freeze(self, artifact=None):
        artifact = artifact or self.artifact()
        self.verify(artifact)
        reservation = self.reserve(artifact)
        self.rpc('c1_finish_reviewed', artifact['business_id'], artifact['created_by'], artifact['id'], reservation['lease_token'])
        return self.record('data_import_artifacts', artifact['id'])

    def claim(self, limit=25, artifact=None):
        return [json.loads(row) for row in self.rpc('c1_claim_cleanup', limit, artifact).splitlines()]

    def finish(self, claim, raw=True, reviewed=False):
        self.rpc('c1_finish_cleanup', claim['id'], claim['lease_token'], raw, reviewed)
        return self.record('data_import_artifacts', claim['id'])

    def age(self, artifact, hours):
        # Superuser fixture only. Move the clock inputs consistently, never an API.
        columns = ['created_at', 'raw_expires_at', 'upload_quiesce_at', 'raw_deleted_at',
                   'reviewed_frozen_at', 'reviewed_expires_at', 'reviewed_deleted_at',
                   'lease_expires_at', 'cleanup_after', 'deleted_at']
        assignments = ','.join(f"{c}={c}-interval '{hours} hours'" for c in columns)
        self.execute('begin;alter table public.data_import_artifacts disable trigger c1_artifact_guard;'
                     f"update public.data_import_artifacts set {assignments} where id={literal(artifact['id'])};"
                     'alter table public.data_import_artifacts enable trigger c1_artifact_guard;commit;')

    def expire_lease(self, artifact):
        self.execute(f"update public.data_import_artifacts set lease_expires_at=clock_timestamp()-interval '1 minute' where id={literal(artifact['id'])}")

    def due_retry(self, artifact):
        self.execute(f"update public.data_import_artifacts set cleanup_after=clock_timestamp()-interval '1 minute' where id={literal(artifact['id'])}")

    def create_run(self, source=None, **overrides):
        source = source or self.source
        values = dict(id=str(uuid.uuid4()), business_id=BIZ, created_by=OWNER,
                      source_system=source['source_system'], source_account_key=source['source_account_key'],
                      schema_version='1', input_checksum=SHA, source_timezone='UTC', source_currency='JPY')
        preview = overrides.pop('preview_hash', PREVIEW)
        snapshot = overrides.pop('snapshot_hash', SNAPSHOT)
        values.update(overrides)
        self.execute('insert into public.data_import_runs(' + ','.join(values) + ') values('
                     + ','.join(literal(v) for v in values.values()) + ');'
                     f"update public.data_import_runs set state='previewed',preview_hash={literal(preview)},snapshot_hash={literal(snapshot)},previewed_at=clock_timestamp() where id={literal(values['id'])}")
        return values['id']

    def bind(self, artifact, run):
        self.rpc('c1_bind_run', artifact['business_id'], artifact['created_by'], artifact['id'], run)

    def terminal(self, run, state='completed'):
        if state in ['completed', 'completed_with_errors']:
            self.execute(f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp() where id={literal(run)}")
        self.execute(f"update public.data_import_runs set state={literal(state)},finished_at=clock_timestamp() where id={literal(run)}")

    def age_run(self, run, hours):
        assignments = ','.join(f"{c}={c}-interval '{hours} hours'" for c in ['created_at', 'previewed_at', 'commit_started_at', 'finished_at'])
        self.execute('begin;alter table public.data_import_runs disable trigger data_import_runs_guard;'
                     f"update public.data_import_runs set {assignments} where id={literal(run)};"
                     'alter table public.data_import_runs enable trigger data_import_runs_guard;commit;')

    def test_rls_force_zero_policies(self):
        self.assertEqual(self.execute("select count(*) from pg_class where relname in ('data_import_sources','data_import_artifacts') and relrowsecurity and relforcerowsecurity"), '2')
        self.assertEqual(self.execute("select count(*) from pg_policies where tablename in ('data_import_sources','data_import_artifacts')"), '0')
        self.assertEqual(self.execute("select count(*) from pg_class c cross join lateral aclexplode(c.relacl) a where c.relname in ('data_import_sources','data_import_artifacts') and a.grantee=0"), '0')

    def test_table_acl_actual_read_write_denial(self):
        for table in TABLES:
            for role in ['anon', 'authenticated']:
                self.rejected(f'set role {role};select * from public.{table}', '42501')
            for role in ['anon', 'authenticated', 'service_role']:
                for operation in [f'delete from public.{table}', f'update public.{table} set created_by=created_by',
                                  f'insert into public.{table}(id) values(gen_random_uuid())', f'truncate public.{table}']:
                    self.rejected(f'set role {role};' + operation, '42501')
            self.execute(f'set role service_role;select count(*) from public.{table}')

    def test_rls_independent_of_acl(self):
        self.execute('create role c1_rls_probe;grant usage on schema public to c1_rls_probe;grant select,insert on public.data_import_sources to c1_rls_probe')
        try:
            self.assertEqual(self.execute('set role c1_rls_probe;select count(*) from public.data_import_sources'), '0')
            self.rejected(f"set role c1_rls_probe;insert into public.data_import_sources(business_id,created_by,source_system,display_label) values('{BIZ}','{OWNER}','fixture','label')", '42501')
        finally:
            self.execute('drop owned by c1_rls_probe;drop role c1_rls_probe')

    def test_rpc_allowlist_private_helpers_and_search_path(self):
        self.assertEqual(self.execute("select proname from pg_proc where proname like 'c1_%' and has_function_privilege('service_role',oid,'EXECUTE') order by proname").splitlines(), sorted(RPCS))
        for role in ['anon', 'authenticated']:
            self.assertEqual(self.execute(f"select count(*) from pg_proc where proname like 'c1_%' and has_function_privilege('{role}',oid,'EXECUTE')"), '0')
            self.rejected(f"set role {role};select public.c1_list_sources('{BIZ}','{OWNER}')", '42501')
        self.assertEqual(self.execute("select count(*) from pg_proc p cross join lateral aclexplode(p.proacl) a where p.proname like 'c1_%' and a.grantee=0"), '0')
        self.assertEqual(self.execute("select count(*) from pg_proc where proname like 'c1_%' and not ('search_path=pg_catalog, pg_temp'=any(proconfig))"), '0')
        for helper in ['c1_guard_source', 'c1_guard_artifact', 'c1_require_owner', 'c1_reviewed_deadline']:
            self.assertEqual(self.execute(f"select has_function_privilege('service_role',oid,'EXECUTE') from pg_proc where proname='{helper}'"), 'f')

    def test_source_server_random_keys_safe_projection_and_tuple_uniqueness(self):
        second = self.create_source(label='Other synthetic source')
        self.assertRegex(self.source['source_account_key'], '^' + UUID4 + '$')
        self.assertNotEqual(self.source['source_account_key'], second['source_account_key'])
        listing = json.loads(self.rpc('c1_list_sources', BIZ, OWNER))
        self.assertEqual(len(listing), 2)
        self.assertTrue(all(set(row) == {'id', 'sourceSystem', 'displayLabel', 'createdAt'} for row in listing))
        self.rejected(f"insert into public.data_import_sources(business_id,created_by,source_system,source_account_key,display_label) select business_id,created_by,source_system,source_account_key,'duplicate' from public.data_import_sources where id='{self.source['id']}'", '23505')
        self.assertEqual(self.execute("select pronargs from pg_proc where proname='c1_create_source'"), '4')

    def test_source_text_bounds_and_immutable_identity(self):
        for field in ['system', 'label']:
            for invalid in ['', ' ', ' leading', 'trailing ', 'a\nb', 'x' * (201 if field == 'system' else 121),
                            '\u00a0leading', 'trailing\u00a0', '\ufeffleading', 'trailing\u3000', '\u2003']:
                args = [BIZ, OWNER, 'fixture', 'Synthetic source']
                args[2 if field == 'system' else 3] = invalid
                self.rejected(self.rpc_sql('c1_create_source', *args))
        self.rejected(f"update public.data_import_sources set display_label='changed' where id='{self.source['id']}'", 'C1_IMMUTABLE')
        self.rejected(f"insert into public.data_import_sources(business_id,created_by,source_system,source_account_key,display_label) values('{BIZ}','{OWNER}','fixture','person@example.test','Synthetic')")

    def test_owner_authority_no_admin_or_foreign_bypass(self):
        for actor in [OTHER_OWNER, ADMIN, None]:
            self.rejected(self.rpc_sql('c1_create_source', BIZ, actor, 'fixture', 'Synthetic'), '42501')
            self.rejected(self.rpc_sql('c1_list_sources', BIZ, actor), '42501')
            self.rejected(self.rpc_sql('c1_create_artifact', BIZ, actor, self.source['id'], 'customer'), '42501')
        self.rejected('begin isolation level repeatable read;' + self.rpc_sql('c1_list_sources', BIZ, OWNER), 'C1_FRESH_TRANSACTION_REQUIRED')

    def test_cross_business_source_rejected(self):
        other = self.create_source(OTHER, OTHER_OWNER)
        self.rejected(self.rpc_sql('c1_create_artifact', BIZ, OWNER, other['id'], 'customer'), '23503')

    def test_paths_are_unique_opaque_random_and_bound(self):
        first, second = self.artifact(), self.artifact()
        for row in [first, second]:
            self.assertRegex(row['id'], '^' + UUID4 + '$')
            self.assertRegex(row['raw_object_key'], '^' + BIZ + '/' + row['id'] + '/raw/' + UUID4 + '$')
        self.assertNotEqual(first['raw_object_key'], second['raw_object_key'])
        # Both PK and object key uniqueness protect an accidental same-object insert.
        self.rejected(f"insert into public.data_import_artifacts select * from public.data_import_artifacts where id='{first['id']}'", '23505')
        self.rejected(f"update public.data_import_artifacts set raw_object_key='{second['raw_object_key']}' where id='{first['id']}'", 'C1_IMMUTABLE')

    def test_entity_scope_and_initial_shape(self):
        for entity in ['location', 'service', 'staff', 'customer', 'appointment']:
            self.assertEqual(self.artifact(entity=entity)['state'], 'upload_pending')
        for entity in ['serviceLocation', 'staffLocation', 'staffService', 'payment', '', 'country']:
            self.rejected(self.rpc_sql('c1_create_artifact', BIZ, OWNER, self.source['id'], entity))
        artifact = self.artifact()
        self.assertIsNone(artifact['raw_sha256'])
        self.assertIsNone(artifact['reviewed_object_key'])
        self.assertEqual(self.execute(f"select raw_expires_at-created_at=interval '24 hours' and upload_quiesce_at-created_at=interval '2 hours 5 minutes' from public.data_import_artifacts where id='{artifact['id']}'"), 't')

    def test_invalid_hash_size_and_media_rejected(self):
        for sha, size, media in [('bad', 12, 'text/csv'), ('A' * 64, 12, 'text/csv'),
                                 (SHA, -1, 'text/csv'), (SHA, 0, 'text/csv'),
                                 (SHA, 10485761, 'text/csv'), (SHA, 12, 'text/html')]:
            artifact = self.artifact()
            self.rejected(self.rpc_sql('c1_verify_raw', BIZ, OWNER, artifact['id'], sha, size, media))
            self.assertEqual(self.record('data_import_artifacts', artifact['id'])['state'], 'upload_pending')
        artifact = self.artifact()
        self.verify(artifact, size=10485760)
        self.assertEqual(self.record('data_import_artifacts', artifact['id'])['raw_size_bytes'], 10485760)

    def test_raw_access_owner_tenant_expiry_and_single_finalize(self):
        artifact = self.artifact()
        self.assertEqual(json.loads(self.rpc('c1_access_artifact', BIZ, OWNER, artifact['id'], 'raw'))['id'], artifact['id'])
        for business, actor in [(OTHER, OTHER_OWNER), (BIZ, ADMIN), (BIZ, OTHER_OWNER)]:
            self.rejected(self.rpc_sql('c1_access_artifact', business, actor, artifact['id'], 'raw'), '42501')
        self.verify(artifact)
        self.rejected(self.rpc_sql('c1_verify_raw', BIZ, OWNER, artifact['id'], SHA, 12, 'text/csv'), 'C1_UNAVAILABLE')
        self.age(artifact, 24.01)
        self.rejected(self.rpc_sql('c1_access_artifact', BIZ, OWNER, artifact['id'], 'raw'), 'C1_UNAVAILABLE')

    def test_owner_reassignment_revokes_old_artifact_access(self):
        artifact = self.artifact()
        self.execute(f"update public.businesses set owner_id='{OTHER_OWNER}' where id='{BIZ}'")
        for actor in [OWNER, OTHER_OWNER]:
            self.rejected(self.rpc_sql('c1_access_artifact', BIZ, actor, artifact['id'], 'raw'), '42501')

    def test_reviewed_reservation_freeze_exact_hashes_and_immutability(self):
        artifact = self.artifact()
        self.verify(artifact)
        reservation = self.reserve(artifact)
        self.assertEqual(reservation['state'], 'freezing')
        self.assertEqual(reservation['reviewed_sha256'], REVIEWED)
        self.assertEqual(reservation['reviewed_preview_hash'], PREVIEW)
        self.assertEqual(reservation['reviewed_snapshot_hash'], SNAPSHOT)
        self.assertRegex(reservation['reviewed_object_key'], '^' + BIZ + '/' + artifact['id'] + '/reviewed/' + UUID4 + '$')
        self.rejected(self.rpc_sql('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed'), 'C1_UNAVAILABLE')
        self.rejected(self.rpc_sql('c1_reserve_reviewed', BIZ, OWNER, artifact['id'], SHA, 64, PREVIEW, SNAPSHOT), 'C1_UNAVAILABLE')
        self.rejected(self.rpc_sql('c1_finish_reviewed', BIZ, OWNER, artifact['id'], str(uuid.uuid4())), 'C1_UNAVAILABLE')
        self.rpc('c1_finish_reviewed', BIZ, OWNER, artifact['id'], reservation['lease_token'])
        self.assertEqual(json.loads(self.rpc('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed'))['reviewed_sha256'], REVIEWED)
        self.assertEqual(self.execute(f"select reviewed_expires_at-reviewed_frozen_at=interval '72 hours' from public.data_import_artifacts where id='{artifact['id']}'"), 't')
        self.rejected(f"update public.data_import_artifacts set reviewed_sha256='{SHA}' where id='{artifact['id']}'", 'C1_IMMUTABLE')

    def test_reviewed_access_denies_other_owner_and_hard_expiry(self):
        artifact = self.freeze()
        self.rejected(self.rpc_sql('c1_access_artifact', OTHER, OTHER_OWNER, artifact['id'], 'reviewed'), '42501')
        self.age(artifact, 72.01)
        self.rejected(self.rpc_sql('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed'), 'C1_UNAVAILABLE')
        self.rejected(self.rpc_sql('c1_reserve_reviewed', BIZ, OWNER, artifact['id'], SHA, 64, PREVIEW, SNAPSHOT), 'C1_UNAVAILABLE')

    def test_run_binding_exact_namespace_creator_checksums_hashes(self):
        artifact = self.freeze()
        for changes in [dict(business_id=OTHER, created_by=OTHER_OWNER), dict(created_by=ADMIN),
                        dict(source_system='other'), dict(source_account_key=str(uuid.uuid4())),
                        dict(input_checksum=REVIEWED), dict(preview_hash=SHA), dict(snapshot_hash=SHA)]:
            run = self.create_run(**changes)
            self.rejected(self.rpc_sql('c1_bind_run', BIZ, OWNER, artifact['id'], run), 'C1_RUN_MISMATCH')
        run = self.create_run()
        self.bind(artifact, run)
        self.bind(artifact, run)  # Same binding is retry-safe.
        self.assertEqual(self.record('data_import_artifacts', artifact['id'])['import_run_id'], run)
        self.rejected(self.rpc_sql('c1_bind_run', BIZ, OWNER, artifact['id'], self.create_run()), 'C1_IMMUTABLE')
        self.rejected(f"delete from public.data_import_runs where id='{run}'", '23503')

    def test_one_artifact_per_run_and_no_terminal_binding(self):
        artifact, second = self.freeze(), self.freeze()
        run = self.create_run()
        self.bind(artifact, run)
        self.rejected(self.rpc_sql('c1_bind_run', BIZ, OWNER, second['id'], run), '23505')
        terminal = self.create_run()
        self.terminal(terminal)
        self.rejected(self.rpc_sql('c1_bind_run', BIZ, OWNER, second['id'], terminal), 'C1_UNAVAILABLE')

    def test_state_transition_and_identity_guards(self):
        artifact = self.artifact()
        for state in ['freezing', 'reviewed_frozen', 'deleted']:
            self.rejected(f"update public.data_import_artifacts set state='{state}' where id='{artifact['id']}'", 'C1_INVALID_STATE')
        self.verify(artifact)
        self.rejected(f"update public.data_import_artifacts set state='upload_pending' where id='{artifact['id']}'", 'C1_INVALID_STATE')
        for field, value in [('business_id', OTHER), ('created_by', ADMIN), ('source_id', str(uuid.uuid4())), ('entity_type', 'service'), ('raw_sha256', REVIEWED)]:
            self.rejected(f"update public.data_import_artifacts set {field}={literal(value)} where id='{artifact['id']}'", 'C1_IMMUTABLE')

    def test_source_and_creator_restrict_until_artifacts_cleaned(self):
        artifact = self.artifact()
        self.rejected(f"delete from public.data_import_sources where id='{self.source['id']}'", '23503')
        self.rejected(f"delete from auth.users where id='{OWNER}'", '23503')
        self.rejected(f"delete from public.data_import_artifacts where id='{artifact['id']}'", 'C1_CLEANUP_REQUIRED')
        self.rejected(f"delete from public.businesses where id='{BIZ}'", '23503')

    def test_cleanup_then_offboarding_source_survives_artifact_purge(self):
        artifact = self.artifact()
        self.age(artifact, 25)
        deleted = self.finish(self.claim()[0])
        self.assertEqual(deleted['state'], 'deleted')
        self.execute(f"delete from public.data_import_artifacts where id='{artifact['id']}'")
        self.assertEqual(self.record('data_import_sources', self.source['id'])['id'], self.source['id'])
        self.rejected(f"delete from auth.users where id='{OWNER}'", '23503')
        self.execute(f"delete from public.businesses where id='{BIZ}'")
        self.assertEqual(self.execute('select count(*) from public.data_import_sources'), '0')
        self.execute(f"delete from auth.users where id='{OWNER}'")

    def test_raw_due_after_24h_not_before(self):
        artifact = self.artifact()
        self.age(artifact, 23.9)
        self.assertEqual(self.claim(), [])
        self.age(artifact, 0.2)
        claim = self.claim()[0]
        self.assertTrue(claim['raw_due'])
        self.assertFalse(claim['reviewed_due'])
        self.assertEqual(claim['state'], 'cleanup_pending')

    def test_cleanup_failure_discoverable_retry_backoff_then_success(self):
        artifact = self.artifact()
        self.age(artifact, 25)
        first = self.claim()[0]
        failed = self.finish(first, raw=False)
        self.assertEqual(failed['state'], 'cleanup_pending')
        self.assertTrue(failed['cleanup_failed'])
        self.assertIsNone(failed['raw_deleted_at'])
        self.assertIsNone(failed['deleted_at'])
        self.assertEqual(self.claim(), [])
        self.due_retry(artifact)
        second = self.claim()[0]
        self.assertNotEqual(first['lease_token'], second['lease_token'])
        self.assertEqual(second['cleanup_attempts'], 2)
        self.assertEqual(self.finish(second)['state'], 'deleted')
        self.assertEqual(self.claim(), [])
        self.rejected(self.rpc_sql('c1_finish_cleanup', artifact['id'], first['lease_token'], True, False), 'C1_LEASE_LOST')

    def test_freeze_raw_cleanup_waits_out_upload_replay_window(self):
        artifact = self.freeze()
        claim = self.claim()[0]
        self.assertTrue(claim['raw_due'])
        self.assertFalse(claim['reviewed_due'])
        self.rejected(self.rpc_sql('c1_finish_cleanup', artifact['id'], claim['lease_token'], True, True), 'C1_INVALID_INPUT')
        early = self.finish(claim)
        self.assertIsNone(early['raw_deleted_at'])
        self.assertEqual(early['state'], 'reviewed_frozen')
        self.assertIsNotNone(early['cleanup_after'])
        self.age(artifact, 3)
        self.assertIsNotNone(self.finish(self.claim()[0])['raw_deleted_at'])
        self.assertEqual(self.claim(), [])

    def test_delayed_finish_cannot_upgrade_pre_quiescence_observation(self):
        artifact = self.freeze()
        self.age(artifact, 2.1)
        claim = self.claim()[0]
        # Fixture models an earlier claim followed by a delayed finish crossing
        # quiescence. The claim time is encoded as lease_expires_at minus 5m.
        self.execute(f"update public.data_import_artifacts set lease_expires_at=clock_timestamp()+interval '1 minute' where id='{artifact['id']}'")
        self.assertEqual(self.execute(f"select clock_timestamp()>upload_quiesce_at and lease_expires_at-interval '5 minutes'<upload_quiesce_at from public.data_import_artifacts where id='{artifact['id']}'"), 't')
        delayed = self.finish(claim, raw=True)
        self.assertIsNone(delayed['raw_deleted_at'])
        fresh = self.claim()[0]
        self.assertIsNotNone(self.finish(fresh, raw=True)['raw_deleted_at'])

    def test_deleted_tombstone_reaps_late_writes_without_rewriting_history(self):
        artifact = self.freeze()
        self.age(artifact, 73)
        initial = self.finish(self.claim()[0], raw=True, reviewed=True)
        self.assertEqual(initial['state'], 'deleted')
        self.assertEqual(self.claim(), [])
        self.assertEqual(self.execute(f"select cleanup_after-deleted_at=interval '24 hours' from public.data_import_artifacts where id='{artifact['id']}'"), 't')
        self.due_retry(artifact)
        late = self.claim()[0]
        self.assertTrue(late['raw_due'])
        self.assertTrue(late['reviewed_due'])
        # Boolean failure simulates a provider deletion attempt failing after
        # a delayed provider write. There is no Storage service in this harness.
        failed = self.finish(late, raw=False, reviewed=False)
        self.assertEqual(failed['state'], 'deleted')
        self.assertTrue(failed['cleanup_failed'])
        self.assertIsNotNone(failed['cleanup_after'])
        self.due_retry(artifact)
        confirmed = self.finish(self.claim()[0], raw=True, reviewed=True)
        self.assertFalse(confirmed['cleanup_failed'])
        for field in ['deleted_at', 'raw_deleted_at', 'reviewed_deleted_at', 'raw_object_key', 'reviewed_object_key']:
            self.assertEqual(confirmed[field], initial[field])
        self.assertEqual(self.claim(), [])
        self.rejected(self.rpc_sql('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed'), 'C1_UNAVAILABLE')

    def test_live_cleanup_prioritized_over_due_tombstones(self):
        tombstone = self.artifact()
        self.age(tombstone, 25)
        self.finish(self.claim()[0])
        self.due_retry(tombstone)
        active = self.artifact()
        self.age(active, 25)
        self.assertEqual(self.claim(1)[0]['id'], active['id'])

    def test_live_reviewed_plan_raw_tombstone_retries_late_writes(self):
        artifact = self.freeze()
        self.age(artifact, 3)
        first = self.finish(self.claim()[0])
        self.assertIsNotNone(first['raw_deleted_at'])
        self.assertEqual(self.claim(), [])
        self.due_retry(artifact)
        late = self.claim()[0]
        self.assertTrue(late['raw_due'])
        self.assertFalse(late['reviewed_due'])
        failed = self.finish(late, raw=False)
        self.assertTrue(failed['cleanup_failed'])
        self.assertEqual(failed['state'], 'reviewed_frozen')
        self.assertEqual(failed['raw_deleted_at'], first['raw_deleted_at'])
        self.assertIsNone(failed['reviewed_deleted_at'])
        self.rpc('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed')
        self.due_retry(artifact)
        retried = self.finish(self.claim()[0], raw=True)
        self.assertFalse(retried['cleanup_failed'])
        self.assertEqual(retried['raw_deleted_at'], first['raw_deleted_at'])
        self.assertEqual(retried['state'], 'reviewed_frozen')
        self.assertIsNone(retried['reviewed_deleted_at'])

    def test_terminal_raw_recheck_failure_cannot_use_old_deletion_confirmation(self):
        artifact = self.freeze()
        self.age(artifact, 3)
        self.finish(self.claim()[0])
        self.age(artifact, 70)
        final = self.claim()[0]
        self.assertTrue(final['raw_due'])
        self.assertTrue(final['reviewed_due'])
        failed = self.finish(final, raw=False, reviewed=True)
        self.assertTrue(failed['cleanup_failed'])
        self.assertEqual(failed['state'], 'cleanup_pending')
        self.assertIsNone(failed['deleted_at'])
        self.due_retry(artifact)
        retry = self.claim()[0]
        self.assertTrue(retry['raw_due'])
        self.assertTrue(retry['reviewed_due'])
        self.assertEqual(self.finish(retry, raw=True, reviewed=True)['state'], 'deleted')

    def test_active_run_retained_until_hard_72h_without_run_transition(self):
        for state in ['previewed', 'committing']:
            artifact = self.freeze()
            run = self.create_run()
            self.bind(artifact, run)
            if state == 'committing':
                self.execute(f"update public.data_import_runs set state='committing',commit_started_at=clock_timestamp() where id='{run}'")
            self.age(artifact, 3)
            self.finish(self.claim(25, artifact['id'])[0])
            self.age(artifact, 68)
            refresh = self.claim(25, artifact['id'])[0]
            self.assertTrue(refresh['raw_due'])
            self.assertFalse(refresh['reviewed_due'])
            self.finish(refresh)
            self.rpc('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed')
            self.age(artifact, 2)
            claim = self.claim(25, artifact['id'])[0]
            self.assertTrue(claim['raw_due'])
            self.assertTrue(claim['reviewed_due'])
            self.finish(claim, raw=True, reviewed=True)
            self.assertEqual(self.record('data_import_runs', run)['state'], state)

    def test_terminal_run_reviewed_due_at_one_hour(self):
        for state in ['completed', 'completed_with_errors', 'failed', 'cancelled']:
            artifact = self.freeze()
            run = self.create_run()
            self.bind(artifact, run)
            self.age(artifact, 3)
            self.finish(self.claim(25, artifact['id'])[0])
            self.terminal(run, state)
            self.age_run(run, 0.9)
            self.due_retry(artifact)
            refresh = self.claim(25, artifact['id'])[0]
            self.assertTrue(refresh['raw_due'])
            self.assertFalse(refresh['reviewed_due'])
            self.finish(refresh)
            self.age_run(run, 0.2)
            self.due_retry(artifact)
            self.rejected(self.rpc_sql('c1_access_artifact', BIZ, OWNER, artifact['id'], 'reviewed'), 'C1_UNAVAILABLE')
            claim = self.claim(25, artifact['id'])[0]
            self.assertTrue(claim['reviewed_due'])
            self.finish(claim, raw=True, reviewed=True)

    def test_interrupted_freeze_is_reaped_after_lease_expiry(self):
        artifact = self.artifact()
        self.verify(artifact)
        reservation = self.reserve(artifact)
        self.assertEqual(self.claim(), [])
        self.expire_lease(artifact)
        claim = self.claim()[0]
        self.assertEqual(claim['state'], 'cleanup_pending')
        self.assertTrue(claim['reviewed_due'])
        self.rejected(self.rpc_sql('c1_finish_reviewed', BIZ, OWNER, artifact['id'], reservation['lease_token']), 'C1_UNAVAILABLE')

    def test_partial_object_deletion_truth_and_eventual_finalization(self):
        artifact = self.freeze()
        self.age(artifact, 73)
        first = self.finish(self.claim()[0], raw=True, reviewed=False)
        self.assertEqual(first['state'], 'cleanup_pending')
        self.assertIsNotNone(first['raw_deleted_at'])
        self.assertIsNone(first['reviewed_deleted_at'])
        self.assertTrue(first['cleanup_failed'])
        self.due_retry(artifact)
        final = self.finish(self.claim()[0], raw=True, reviewed=True)
        self.assertEqual(final['state'], 'deleted')
        self.assertEqual(first['raw_deleted_at'], final['raw_deleted_at'])
        self.assertIsNotNone(final['reviewed_deleted_at'])
        self.rejected(f"update public.data_import_artifacts set state='cleanup_pending' where id='{artifact['id']}'", 'C1_IMMUTABLE')

    def test_claim_bound_and_concurrent_disjointness(self):
        for invalid in [0, -1, 26, None]:
            self.rejected(self.rpc_sql('c1_claim_cleanup', invalid, None), 'C1_INVALID_INPUT')
        for _ in range(6):
            self.age(self.artifact(), 25)
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            replies = list(pool.map(lambda _: self.claim(3), range(2)))
        ids = [[row['id'] for row in reply] for reply in replies]
        self.assertEqual([len(x) for x in ids], [3, 3])
        self.assertTrue(set(ids[0]).isdisjoint(ids[1]))
        self.assertEqual(self.claim(), [])

    def test_expired_claim_rotates_fence_old_worker_cannot_finalize(self):
        artifact = self.artifact()
        self.age(artifact, 25)
        first = self.claim()[0]
        self.expire_lease(artifact)
        second = self.claim()[0]
        self.assertNotEqual(first['lease_token'], second['lease_token'])
        self.rejected(self.rpc_sql('c1_finish_cleanup', artifact['id'], first['lease_token'], True, False), 'C1_LEASE_LOST')
        self.assertEqual(self.finish(second)['state'], 'deleted')

    def test_one_failed_claim_does_not_block_another(self):
        for _ in range(2):
            self.age(self.artifact(), 25)
        first, second = self.claim()
        self.finish(first, raw=False)
        self.assertEqual(self.finish(second)['state'], 'deleted')
        self.assertEqual(self.record('data_import_artifacts', first['id'])['state'], 'cleanup_pending')

    def test_concurrent_finish_one_winner_preserves_truth(self):
        artifact = self.artifact()
        self.age(artifact, 25)
        claim = self.claim()[0]
        query = self.rpc_sql('c1_finish_cleanup', artifact['id'], claim['lease_token'], True, False)
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results = list(pool.map(self.sql, [query, query]))
        self.assertEqual(sum(result.returncode == 0 for result in results), 1)
        self.assertIn('C1_LEASE_LOST', next(result.stderr for result in results if result.returncode))
        self.assertEqual(self.record('data_import_artifacts', artifact['id'])['state'], 'deleted')

    def test_owner_boundary_on_every_artifact_owner_rpc(self):
        artifact = self.freeze()
        run = self.create_run()
        calls = [
            ('c1_access_artifact', [artifact['id'], 'reviewed']),
            ('c1_verify_raw', [artifact['id'], SHA, 12, 'text/csv']),
            ('c1_reserve_reviewed', [artifact['id'], REVIEWED, 64, PREVIEW, SNAPSHOT]),
            ('c1_finish_reviewed', [artifact['id'], str(uuid.uuid4())]),
            ('c1_bind_run', [artifact['id'], run]),
        ]
        for name, args in calls:
            self.rejected(self.rpc_sql(name, BIZ, ADMIN, *args), '42501')
        self.assertEqual(self.record('data_import_artifacts', artifact['id'])['state'], 'reviewed_frozen')

    def test_fk_delete_contract_catalog(self):
        for table in TABLES:
            self.assertEqual(self.execute(f"select count(*) from pg_constraint where conrelid='public.{table}'::regclass and contype='f' and confrelid='auth.users'::regclass and confdeltype='r'"), '1')
        for table, behavior in [('data_import_sources', 'c'), ('data_import_artifacts', 'r')]:
            self.assertEqual(self.execute(f"select count(*) from pg_constraint where conrelid='public.{table}'::regclass and contype='f' and confrelid='public.businesses'::regclass and confdeltype='{behavior}'"), '1')

    def test_storage_fixture_private_bucket_and_no_added_policy(self):
        row = json.loads(self.execute("select row_to_json(b) from storage.buckets b where id='import-artifacts'"))
        self.assertIs(row['public'], False)
        self.assertEqual(row['file_size_limit'], 10485760)
        self.assertIn('application/json', row['allowed_mime_types'])
        self.assertEqual(self.execute("select count(*) from pg_policies where schemaname='storage'"), '0')
        self.assertNotRegex(BODY, r'(?i)create\s+policy')
        self.assertNotRegex(BODY, r'(?i)(?:update|delete\s+from|alter\s+table)\s+storage\.objects')

    def test_metadata_no_payload_filename_token_or_region_columns(self):
        names = self.execute("select column_name from information_schema.columns where table_schema='public' and table_name in ('data_import_sources','data_import_artifacts')").splitlines()
        for forbidden in ['filename', 'original_filename', 'signed_url', 'token', 'plan_json', 'raw_payload', 'email', 'phone', 'country_code', 'locale', 'currency']:
            self.assertNotIn(forbidden, names)
        self.assertEqual(self.execute("select count(*) from information_schema.columns where table_schema='public' and table_name in ('data_import_sources','data_import_artifacts') and data_type in ('json','jsonb','bytea')"), '0')

    def test_bucket_collision_rolls_back_c1(self):
        self.execute('create database c1_bucket_drift')
        try:
            self.execute(FIXTURE + 'begin;\n' + B1 + '\ncommit;'
                         "insert into storage.buckets values('import-artifacts','import-artifacts',true,10485760,null)", 'c1_bucket_drift')
            self.rejected('begin;\n' + BODY + '\ncommit;', '23505', 'c1_bucket_drift')
            self.assertEqual(self.execute("select count(*) from pg_tables where tablename in ('data_import_sources','data_import_artifacts')", 'c1_bucket_drift'), '0')
            self.assertEqual(self.execute("select public from storage.buckets where id='import-artifacts'", 'c1_bucket_drift'), 't')
        finally:
            self.execute('drop database c1_bucket_drift')

    def test_inherited_acl_drift_rolls_back_c1(self):
        self.execute('create database c1_acl_drift;create role c1_unexpected_group;grant c1_unexpected_group to service_role')
        try:
            self.execute(FIXTURE + 'begin;\n' + B1 + '\ncommit;'
                         'alter default privileges in schema public grant insert on tables to c1_unexpected_group', 'c1_acl_drift')
            self.rejected('begin;\n' + BODY + '\ncommit;', 'C1_ACL_DRIFT', 'c1_acl_drift')
            self.assertEqual(self.execute("select count(*) from pg_tables where tablename in ('data_import_sources','data_import_artifacts')", 'c1_acl_drift'), '0')
        finally:
            self.execute('drop database c1_acl_drift;revoke c1_unexpected_group from service_role;drop role c1_unexpected_group')

    def test_existing_helper_drift_fails_before_any_ddl_or_acl_mutation(self):
        self.execute('create database c1_helper_drift')
        try:
            self.execute(FIXTURE + 'begin;\n' + B1 + '\ncommit;'
                         "create function public.c1_unrelated_probe() returns boolean language sql immutable as $$select true$$;"
                         'grant execute on function public.c1_unrelated_probe() to authenticated', 'c1_helper_drift')
            snapshot = "select pg_get_functiondef(oid)||coalesce(proacl::text,'') from pg_proc where proname='c1_unrelated_probe'"
            before = self.execute(snapshot, 'c1_helper_drift')
            self.rejected('begin;\n' + BODY + '\ncommit;', 'C1_EXISTING_HELPER_REVIEW_REQUIRED', 'c1_helper_drift')
            self.assertEqual(self.execute(snapshot, 'c1_helper_drift'), before)
            self.assertEqual(self.execute("select count(*) from pg_tables where tablename in ('data_import_sources','data_import_artifacts')", 'c1_helper_drift'), '0')
            self.assertEqual(self.execute("select count(*) from storage.buckets where id='import-artifacts'", 'c1_helper_drift'), '0')
        finally:
            self.execute('drop database c1_helper_drift')

    def test_reapply_fails_closed_and_preserves_existing_state(self):
        artifact = self.freeze()
        acl = "select proname||proacl::text from pg_proc where proname like 'c1_%' order by proname"
        before = self.execute(acl)
        self.rejected('begin;\n' + BODY + '\ncommit;', 'C1_EXISTING_HELPER_REVIEW_REQUIRED')
        self.assertEqual(self.execute(acl), before)
        self.assertEqual(self.record('data_import_artifacts', artifact['id']), artifact)
        self.assertEqual(self.record('data_import_sources', self.source['id']), self.source)

    def test_state_shape_constraints_independent_of_trigger(self):
        raw = self.artifact()
        frozen = self.freeze()
        self.execute('alter table public.data_import_artifacts disable trigger c1_artifact_guard')
        try:
            self.rejected(f"update public.data_import_artifacts set raw_sha256='{SHA}',raw_size_bytes=12,raw_media_type='text/csv' where id='{raw['id']}'")
            self.rejected(f"update public.data_import_artifacts set state='raw_verified' where id='{frozen['id']}'")
            self.rejected(f"update public.data_import_artifacts set reviewed_deleted_at=clock_timestamp() where id='{frozen['id']}'")
        finally:
            self.execute('alter table public.data_import_artifacts enable trigger c1_artifact_guard')


if __name__ == '__main__':
    unittest.main(verbosity=2)
