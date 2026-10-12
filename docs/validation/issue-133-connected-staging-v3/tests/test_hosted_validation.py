"""Offline access-gate/source tests only; no entry point, SQL or financial workflow."""
import ast
import copy
import importlib.util
import io
import json
from pathlib import Path
import re
import socket
import ssl
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]
OLD = ROOT.parent / 'issue-133-connected-staging-v2'
SOURCE = (ROOT / 'hosted_validation.py').read_text()
BEFORE = (OLD / 'hosted_validation.py').read_text()
M = json.loads((ROOT / 'manifest.json').read_text())
F = json.loads((ROOT / 'fixture.json').read_text())
BAIT = 'NEVER_RETAIN_BODY_HEADER_ACCOUNT_EXCEPTION_OR_CREDENTIAL'
PHASE = 'management-database-read-write-capability'
CODE = 'MANAGEMENT_DATABASE_RW_CAPABILITY_UNPROVEN'
PRECHECKS = ('future_slot', 'migrations_ok', 'functions_ok', 'privileges_ok', 'collision_free',
             'service_role_ok', 'browser_roles_ok', 'no_pg_cron', 'no_dispatch_trigger', 'event_sequence_privilege')
CENSUS = dict(attempts=6, accepted=4, requested=2, obligations=16, pending=15,
              not_required=1, links=0, operations=0, admission=0, receipt_sequences=0)


def no_environment(key, default=None):
    if key.startswith('HV133_'):
        raise AssertionError('credential access forbidden')
    return default  # Do not consult the real environment, even for stdlib probes.


# Install traps before import; keep them active for the entire unittest module.
TRAPS = [patch('os.environ.get', side_effect=no_environment),
         patch('socket.socket', side_effect=AssertionError('network forbidden')),
         patch('socket.create_connection', side_effect=AssertionError('network forbidden')),
         patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('HTTP forbidden'))]
for trap in TRAPS:
    trap.start()
SPEC = importlib.util.spec_from_file_location('c03_inert', ROOT / 'hosted_validation.py')
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)


def tearDownModule():
    for trap in reversed(TRAPS):
        trap.stop()


def definitions(source):
    result = {}
    for node in ast.parse(source).body:
        if isinstance(node, ast.FunctionDef):
            result[node.name] = ast.get_source_segment(source, node)
        elif isinstance(node, ast.ClassDef):
            for method in node.body:
                if isinstance(method, ast.FunctionDef):
                    result[node.name + '.' + method.name] = ast.get_source_segment(source, method)
    return result


class BoundaryReached(BaseException):
    """Escape before owner:dispatch; do not enter Auth or any financial routine."""


class MemoryEvidence:
    def __init__(self):
        self.records = []
        self.phase = None
        self.runner = None
    def record(self, phase, payload):
        if phase == 'owner:dispatch':
            assert self.runner.writes is False
            raise BoundaryReached()
        self.records.append((phase, copy.deepcopy(payload)))
        if phase.endswith(':dispatch'):
            self.phase = phase[:-9]


class Response:
    def __init__(self, value=None, raw=None, url=h.QUERY_URL, status=201):
        self.body = json.dumps(value).encode() if raw is None else raw
        self.url = url
        self.status = status
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def geturl(self): return self.url
    def read(self, limit): return self.body[:limit]


class Opener:
    def __init__(self, value): self.value = value; self.calls = []
    def open(self, request, timeout):
        self.calls.append((request, timeout))
        if isinstance(self.value, Exception): raise self.value
        return self.value


def transport(value):
    result = h.Transport('FICTIONAL_MANAGEMENT_SENTINEL', 'FICTIONAL_AUTH_SENTINEL')
    result.opener = Opener(value)
    return result


class PreAuthOnly:
    def __init__(self, evidence, actual, identity=None, failure=None):
        self.e = evidence; self.actual = actual; self.identity = identity
        self.failure = failure; self.calls = []
    def sql(self, sql):
        phase = self.e.phase
        self.calls.append(phase)
        if phase == self.failure: raise h.Stop('offline gate rejection')
        if phase == 'zero-write-preflight':
            return dict(**{k: True for k in PRECHECKS}, project_ref=h.REF,
                        database='postgres', retained=CENSUS, baseline={})
        if phase == 'literal-service-role':
            return {'literal_role': 'service_role', 'read_only': 'on'}
        raise AssertionError('post-gate SQL forbidden')
    def project_identity(self):
        self.calls.append('project-identity')
        if self.failure == 'project-identity': raise h.Stop('offline gate rejection')
        if self.identity: return self.identity.project_identity()
        return {'id': h.REF, 'status': 'ACTIVE_HEALTHY'}
    def management_database_read_write_capability(self):
        self.calls.append(PHASE)
        return self.actual.management_database_read_write_capability()
    def create_owner(self, fixture):
        raise AssertionError('Auth creation forbidden')


class Package(unittest.TestCase):
    def test_inert_import_and_no_entry_point_call(self):
        with patch('urllib.request.build_opener', side_effect=AssertionError('transport on import')):
            spec = importlib.util.spec_from_file_location('c03_again', ROOT / 'hosted_validation.py')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
        self.assertNotIn('token', vars(module))
        self.assertEqual(definitions(BEFORE)['main'], definitions(SOURCE)['main'])

    def test_manifest_binding_and_source_pins(self):
        self.assertEqual(h.load_package(ROOT, M['aggregate_sha256'], F['run_id'], h.REF), (M, F))
        self.assertEqual(set(M['package_files']), {*h.MEMBERS, 'manifest.json'})
        self.assertEqual({str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file()}, set(M['package_files']))

    def test_wrong_binding_refused(self):
        for digest, run, ref in [('0'*64, F['run_id'], h.REF), (M['aggregate_sha256'], 'C02', h.REF),
                                  (M['aggregate_sha256'], F['run_id'], 'wrong')]:
            with self.subTest(ref=ref, run=run), self.assertRaises(h.Stop):
                h.load_package(ROOT, digest, run, ref)

    def test_fresh_identities_and_unchanged_commercial_contract(self):
        self.assertRegex(F['run_id'], r'^HV133-158-20261009-C03-[0-9a-f]{8}$')
        self.assertEqual(F['project_ref'], 'wnfahklzaxirftyskctd')
        self.assertEqual(len(F['ids']), 6)
        self.assertEqual(len(set(F['ids'].values())), 6)
        for value in F['ids'].values(): self.assertEqual(h.uid(value), value)
        for predecessor in M['predecessors']:
            prior = json.loads((REPO / predecessor['package_path'] / 'fixture.json').read_text())
            for key in ('run_id', 'business_name', 'slug', 'business_email', 'owner_email', 'customer_email', 'phone', 'website'):
                self.assertNotEqual(prior[key], F[key], key)
            self.assertFalse(set(prior['ids'].values()) & set(F['ids'].values()))
            for key in ('commercial', 'start', 'end', 'city', 'generated_id_contract'):
                self.assertEqual(prior[key], F[key], key)
        for key in ('business_email', 'owner_email', 'customer_email', 'website'):
            self.assertTrue(F[key].endswith('.invalid'))
        self.assertRegex(F['phone'], r'^\+141655501\d\d$')

    def test_both_predecessors_immutable_sealed_read_only_inputs(self):
        self.assertEqual([p['run_id'] for p in M['predecessors']],
                         ['HV133-158-20261009-C01-72d9f02a', 'HV133-158-20261009-C02-5776d6c8'])
        self.assertEqual(M['predecessor'], M['predecessors'][1])
        for predecessor in M['predecessors']:
            root = REPO / predecessor['package_path']
            prior = json.loads((root / 'manifest.json').read_text())
            core = {k: v for k, v in prior.items() if k != 'aggregate_sha256'}
            self.assertEqual(h.seal(core), predecessor['aggregate_sha256'])
            for name, expected in predecessor['package_members'].items():
                data = (root / name).read_bytes()
                self.assertEqual(dict(bytes=len(data), sha256=h.sha(data)), expected)
            data = Path(predecessor['evidence_path']).read_bytes()
            self.assertEqual(len(data), predecessor['evidence_bytes'])
            self.assertEqual(h.sha(data), predecessor['evidence_sha256'])
            rows = [json.loads(line) for line in data.splitlines()]
            self.assertEqual(len(rows), 6)
            previous = '0'*64
            for i, row in enumerate(rows, 1):
                digest = row.pop('sha256')
                self.assertEqual(row['sequence'], i)
                self.assertEqual(row['previous_sha256'], previous)
                self.assertEqual(h.sha(h.canon(row).encode()), digest)
                previous = digest
            self.assertEqual(rows[-1]['payload']['status'], 'STOP_ZERO_WRITES')
            self.assertFalse(rows[-1]['payload']['admission_may_remain_enabled'])
            self.assertEqual(rows[0]['payload']['aggregate_sha256'], predecessor['aggregate_sha256'])
        self.assertEqual(rows[-1]['payload']['reason_code'], 'PROJECT_IDENTITY_HTTP_403')

    def test_all_existing_definitions_preserved_except_exact_gate_insertion(self):
        old, new = definitions(BEFORE), definitions(SOURCE)
        allowed = {'Run._execute', 'Run.execute', 'Transport.sql'}
        for name, source in old.items():
            if name not in allowed: self.assertEqual(source, new[name], name)
        self.assertEqual(ast.dump(ast.parse(old['Transport.sql'])), ast.dump(ast.parse(new['Transport.sql'])))
        inserted = """        self.last_phase=RW_CAPABILITY_PHASE
        require(RW_CAPABILITY_PHASE not in self.calls,'phase re-entry refused')
        self.calls.add(RW_CAPABILITY_PHASE)
        self.e.record(RW_CAPABILITY_PHASE+':dispatch',{
            'sql_sha256':sha(management_database_read_write_probe().encode()),'mutation_possible':False})
        self.e.record(RW_CAPABILITY_PHASE+':response',self.db.management_database_read_write_capability())
"""
        self.assertEqual(new['Run._execute'].replace(inserted, ''), old['Run._execute'])
        stop_insert = """            if isinstance(error, ManagementDatabaseCapabilityStop) and self.last_phase == RW_CAPABILITY_PHASE and not self.writes:
                diagnostic = {'reason_code': error.reason_code}
"""
        self.assertEqual(new['Run.execute'].replace(stop_insert, ''), old['Run.execute'])
        self.assertEqual(set(new) - set(old), {'ManagementDatabaseCapabilityStop.__init__',
                         'management_database_read_write_probe', 'Transport.management_database_read_write_capability'})

    def test_whole_runner_ast_has_only_approved_delta(self):
        before, after = ast.parse(BEFORE), ast.parse(SOURCE)
        old_classes = {n.name: n for n in before.body if isinstance(n, ast.ClassDef)}
        after.body = [n for n in after.body if not (
            isinstance(n, (ast.ClassDef, ast.FunctionDef)) and n.name in
            ('ManagementDatabaseCapabilityStop', 'management_database_read_write_probe')) and not (
            isinstance(n, ast.Assign) and n.targets[0].id == 'RW_CAPABILITY_PHASE')]
        for node in after.body:
            if not isinstance(node, ast.ClassDef): continue
            if node.name == 'Transport':
                node.body = [n for n in node.body if not (isinstance(n, ast.FunctionDef) and
                             n.name == 'management_database_read_write_capability')]
            if node.name == 'Run':
                old = {n.name: n for n in old_classes['Run'].body if isinstance(n, ast.FunctionDef)}
                node.body = [old[n.name] if isinstance(n, ast.FunctionDef) and n.name in
                             ('execute', '_execute') else n for n in node.body]
        # Exact insertion-only tests separately constrain both replaced Run methods.
        self.assertEqual(ast.dump(before), ast.dump(after))

    def test_constants_and_pins_preserved(self):
        def assignments(source):
            return {n.targets[0].id: ast.dump(n) for n in ast.parse(source).body if isinstance(n, ast.Assign)}
        old, new = assignments(BEFORE), assignments(SOURCE)
        self.assertEqual({k: v for k, v in new.items() if k != 'RW_CAPABILITY_PHASE'}, old)
        prior = json.loads((OLD / 'manifest.json').read_text())
        for key in ('source_pins', 'functions', 'hosted_migrations', 'required_writes', 'evidence_parent'):
            self.assertEqual(prior[key], M[key], key)
        for item in M['hosted_migrations']:
            data = (REPO / item['local_path']).read_bytes()
            self.assertEqual((len(data), h.sha(data)), (item['bytes'], item['sha256']))

    def test_old_read_only_probes_unchanged(self):
        old, new = definitions(BEFORE), definitions(SOURCE)
        for name in ('preflight', 'capability', 'transaction', 'cohort_census', 'preserved'):
            self.assertEqual(new[name], old[name])
        for sql in (h.preflight(M, F), h.capability()):
            self.assertTrue(sql.startswith('begin isolation level repeatable read read only;'))
            self.assertTrue(sql.endswith('rollback;'))
        self.assertIn('set local role service_role;', h.capability())

    def test_plan_corrections_and_no_execution_command(self):
        plan = (ROOT / 'PLAN.md').read_text()
        report = (REPO / 'docs/reviews/issue-133-connected-staging-v3-preparation.md').read_text()
        for document in (plan, report):
            for fact in ('created manually by Product Owner Darshan via Supabase Dashboard',
                         'creation date: 2026-10-09',
                         'exact creation minute was not independently retained',
                         'no exact minute is asserted', 'scoped PAT',
                         '`wnfahklzaxirftyskctd` / Chasum Staging only',
                         'Database Read-write', 'Project Settings Read', '7-day expiry at creation',
                         'no other Management capabilities', 'no Production project scope',
                         'same-token identity GET mandatory'):
                self.assertIn(fact, document)
        for text in ('scoped PAT', 'Database Read-write', 'Project Settings Read', '7-day expiry at creation',
                     'no other Management capabilities', 'no Production project scope',
                     'same-token identity GET mandatory', 'missing_permissions', 'accepted privacy trade',
                     'NO Product Owner C03 execution approval yet', 'NOT_APPLICABLE'):
            self.assertIn(text, plan)
        self.assertNotIn('--execute', plan)
        self.assertNotIn('python3 ', plan)

    def test_no_fallback_or_retry_and_post_write_rules_preserved(self):
        old, new = definitions(BEFORE), definitions(SOURCE)
        self.assertEqual(new['main'], old['main'])
        self.assertEqual(new['Run.sql'], old['Run.sql'])
        self.assertNotIn('finally', new['Run.execute'])
        self.assertIn("'STOP_AFTER_WRITES' if self.writes else 'STOP_ZERO_WRITES'", new['Run.execute'])
        self.assertIn("'automatic_retry':False", new['Run.execute'])
        gate = new['Transport.management_database_read_write_capability']
        self.assertFalse(any(isinstance(n, (ast.For, ast.While)) for n in ast.walk(ast.parse(gate))))
        self.assertEqual(len(re.findall(r'https://[^\s\'\"]+', SOURCE)), 3)
        self.assertNotIn('mcp', SOURCE.lower())


class AccessGate(unittest.TestCase):
    def exercise(self, value, identity=None, earlier_failure=None):
        evidence = MemoryEvidence(); actual = transport(value)
        db = PreAuthOnly(evidence, actual, identity, earlier_failure)
        runner = h.Run(M, F, db, evidence); evidence.runner = runner
        try:
            status = runner.execute()
        except BoundaryReached:
            status = 'AUTH_BOUNDARY_NOT_DISPATCHED'
        self.assertFalse(runner.writes)
        serialized = json.dumps(evidence.records)
        for forbidden in (BAIT, 'FICTIONAL_MANAGEMENT_SENTINEL', 'FICTIONAL_AUTH_SENTINEL'):
            self.assertNotIn(forbidden, serialized)
        self.assertNotIn('owner:dispatch', [label for label, _ in evidence.records])
        self.assertFalse(any(label.startswith('admission') for label, _ in evidence.records))
        return status, runner, db, evidence, actual

    def assert_failure(self, value):
        status, runner, db, evidence, actual = self.exercise(value)
        self.assertEqual(status, 'STOP_ZERO_WRITES')
        self.assertEqual(db.calls, ['zero-write-preflight', 'literal-service-role', 'project-identity', PHASE])
        self.assertEqual(len(actual.opener.calls), 1)
        stop = evidence.records[-1][1]
        self.assertEqual((stop['reason'], stop['reason_code'], stop['last_phase']), (CODE, CODE, PHASE))
        self.assertFalse(stop['automatic_retry']); self.assertFalse(stop['admission_may_remain_enabled'])
        self.assertEqual([label for label, _ in evidence.records if label.startswith(PHASE)], [PHASE+':dispatch'])
        self.assertEqual(evidence.records[-2][1], {'sql_sha256': h.sha(h.management_database_read_write_probe().encode()),
                                                  'mutation_possible': False})

    def test_probe_exact_bounded_no_data_or_ddl_mutation(self):
        sql = h.management_database_read_write_probe()
        self.assertEqual(sql, """begin;
set local lock_timeout='5s'; set local statement_timeout='30s';
select pg_catalog.jsonb_build_object(
    'transaction_read_only',pg_catalog.current_setting('transaction_read_only')) as evidence;
rollback;""")
        self.assertNotRegex(sql.lower(), r'\b(insert|update|delete|create|alter|drop|truncate|commit|nextval|setval|from|join|call|do)\b')
        self.assertNotIn('read only', sql.lower()); self.assertNotIn('read write', sql.lower())
        self.assertNotIn('public.', sql.lower()); self.assertNotIn('set local role', sql.lower())

    def test_success_exact_order_same_management_route_and_bearer(self):
        identity = transport(Response({'id': h.REF, 'status': 'ACTIVE_HEALTHY', 'account': BAIT}, url=h.PROJECT_URL, status=200))
        status, runner, db, evidence, actual = self.exercise(Response([{'evidence': {'transaction_read_only': 'off'}}]), identity)
        self.assertEqual(status, 'AUTH_BOUNDARY_NOT_DISPATCHED')
        self.assertEqual(db.calls, ['zero-write-preflight', 'literal-service-role', 'project-identity', PHASE])
        self.assertEqual(evidence.records[-1], (PHASE+':response', {'transaction_read_only': 'off'}))
        self.assertEqual(len(actual.opener.calls), 1)
        for t, url, method in ((identity, h.PROJECT_URL, 'GET'), (actual, h.QUERY_URL, 'POST')):
            req, timeout = t.opener.calls[0]
            self.assertEqual(req.full_url, url); self.assertEqual(req.get_method(), method)
            self.assertEqual(req.get_header('Authorization'), 'Bearer FICTIONAL_MANAGEMENT_SENTINEL')
            self.assertIsNone(req.get_header('Apikey')); self.assertEqual(timeout, 45)
        self.assertEqual(json.loads(actual.opener.calls[0][0].data),
                         {'query': h.management_database_read_write_probe(), 'read_only': False})

    def test_json_string_evidence_validates_before_recording(self):
        result = self.exercise(Response([{'evidence': '{"transaction_read_only":"off"}'}]))
        self.assertEqual(result[0], 'AUTH_BOUNDARY_NOT_DISPATCHED')

    def test_on_missing_extra_and_wrong_types_fail_closed(self):
        for value in ({'transaction_read_only': 'on'}, {}, {'transaction_read_only': 'off', 'account': BAIT},
                      {'transaction_read_only': False}, {'transaction_read_only': None}, {'transaction_read_only': 'OFF'},
                      {'transaction_read_only': BAIT}, None, [], BAIT):
            with self.subTest(value=value): self.assert_failure(Response([{'evidence': value}]))

    def test_invalid_envelopes_and_json_fail_closed(self):
        for value in ([], {}, None, [None], [BAIT], [{'evidence': {}, 'account': BAIT}],
                      [{'evidence': {}}, {'evidence': {}}], [{'wrong': BAIT}]):
            with self.subTest(value=value): self.assert_failure(Response(value))
        for raw in (b'not-json', b'\xff', b'x'*(h.MAX_BYTES+1)):
            self.assert_failure(Response(raw=raw))

    def test_transport_errors_discard_every_raw_detail(self):
        for error in (TimeoutError(BAIT), socket.timeout(BAIT), ssl.SSLError(BAIT),
                      h.urllib.error.URLError(BAIT), ValueError(BAIT), h.Stop(BAIT)):
            with self.subTest(kind=type(error).__name__): self.assert_failure(error)
        self.assert_failure(Response({}, url='https://wrong.invalid'))
        self.assert_failure(Response({}, status=202))

    def test_http_403_missing_permissions_body_never_read(self):
        class NeverRead(io.BytesIO):
            reads = 0
            def read(self, *args):
                self.reads += 1
                raise AssertionError('HTTP error body read')
        for status in (401, 403, 429, 500, 503, 404):
            body = NeverRead(json.dumps({'missing_permissions': [BAIT]}).encode())
            error = h.urllib.error.HTTPError(h.QUERY_URL, status, BAIT, {'Set-Cookie': BAIT}, body)
            self.assert_failure(error)
            self.assertEqual(body.reads, 0)

    def test_prior_gates_cannot_be_skipped(self):
        for phase in ('zero-write-preflight', 'literal-service-role', 'project-identity'):
            status, runner, db, evidence, actual = self.exercise(Response([]), earlier_failure=phase)
            self.assertEqual(status, 'STOP_ZERO_WRITES'); self.assertNotIn(PHASE, db.calls)
            self.assertEqual(actual.opener.calls, [])

    def test_project_identity_403_still_bounded_before_rw(self):
        class NeverRead(io.BytesIO):
            reads = 0
            def read(self, *args):
                self.reads += 1
                raise AssertionError('HTTP error body read')
        body = NeverRead(json.dumps({'missing_permissions': [BAIT]}).encode())
        identity = transport(h.urllib.error.HTTPError(h.PROJECT_URL, 403, BAIT, {'header': BAIT}, body))
        status, runner, db, evidence, actual = self.exercise(Response([]), identity)
        self.assertEqual(status, 'STOP_ZERO_WRITES'); self.assertEqual(actual.opener.calls, [])
        self.assertEqual(len(identity.opener.calls), 1)
        self.assertEqual(evidence.records[-1][1]['reason_code'], 'PROJECT_IDENTITY_HTTP_403')
        self.assertEqual(body.reads, 0)

    def test_gate_reentry_refused_before_transport(self):
        e = MemoryEvidence(); t = transport(Response([])); db = PreAuthOnly(e, t)
        run = h.Run(M, F, db, e); e.runner = run; run.calls.add(PHASE)
        self.assertEqual(run.execute(), 'STOP_ZERO_WRITES')
        self.assertEqual(t.opener.calls, []); self.assertFalse(run.writes)

    def test_credentials_endpoint_bound_and_other_hosts_refused(self):
        t = transport(Response({}))
        for url, auth in ((h.QUERY_URL, True), (h.PROJECT_URL, True), (h.AUTH_URL, False), ('https://example.invalid', False)):
            with self.assertRaises(h.Stop): t.request(url, {}, auth)
        self.assertEqual(t.opener.calls, [])
        # Exercise request construction only, with an inert in-memory opener.
        t.opener = Opener(Response({}, url=h.AUTH_URL))
        t.request(h.AUTH_URL, {}, auth=True)
        req = t.opener.calls[0][0]
        self.assertEqual(req.get_header('Authorization'), 'Bearer FICTIONAL_AUTH_SENTINEL')
        self.assertEqual(req.get_header('Apikey'), 'FICTIONAL_AUTH_SENTINEL')
        with self.assertRaises(h.Stop): h.NoRedirect().redirect_request(None, None, 302, None, None, h.AUTH_URL)


class EvidenceControls(unittest.TestCase):
    def test_exclusive_directory_redaction_chain_and_modes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'fictional-offline-run'
            evidence = h.Evidence(path, ('FICTIONAL_CREDENTIAL',))
            evidence.record('test', {'value': 'FICTIONAL_CREDENTIAL'})
            evidence.record('end', {'ok': True})
            data = evidence.path.read_text()
            self.assertNotIn('FICTIONAL_CREDENTIAL', data)
            previous = '0'*64
            for i, row in enumerate(map(json.loads, data.splitlines()), 1):
                digest = row.pop('sha256')
                self.assertEqual(row['sequence'], i); self.assertEqual(row['previous_sha256'], previous)
                self.assertEqual(h.sha(h.canon(row).encode()), digest); previous = digest
            self.assertEqual(path.stat().st_mode & 0o777, 0o700)
            self.assertEqual(evidence.path.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(FileExistsError): h.Evidence(path, ())


if __name__ == '__main__':
    unittest.main()
