"""Offline package tests only. No HTTP, credentials, database, or positive CLI run."""
import ast
import copy
import socket
import ssl
import hashlib
import importlib.util
import io
import json
import re
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('connected_prepared', ROOT / 'hosted_validation.py')
h = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(h)
F = json.loads((ROOT / 'fixture.json').read_text())
M = json.loads((ROOT / 'manifest.json').read_text())
B = '00000000-0000-4000-8000-000000000001'
A = '00000000-0000-4000-8000-000000000002'
L = '00000000-0000-4000-8000-000000000003'
T = '00000000-0000-4000-8000-000000000004'
AP = '00000000-0000-4000-8000-000000000005'
TX = '00000000-0000-4000-8000-000000000006'
INV = '00000000-0000-4000-8000-000000000007'
IDS = dict(business_id=B, actor_id=A, location_id=L, attempt_id=T, appointment_id=AP, transaction_id=TX)
WATERMARK = '2026-10-10T00:00:00+00:00'
CREATED = '2026-10-10T00:00:00.001+00:00'
BASELINE = {t: {'count': 7, 'sha256': 'a'*64} for t in h.FINANCIAL+h.COMMUNICATION+h.PARENTS}
CENSUS = dict(attempts=6, accepted=4, requested=2, obligations=16, pending=15, not_required=1,
              links=0, operations=0, admission=0, receipt_sequences=0)


def durable(stage, enabled=True):
    """Independent response fixture, not SQL execution or financial-math emulation."""
    rows = {t: [] for t in h.FINANCIAL}
    if stage == 'empty':
        return rows
    rows['commerce_projection_admission'] = [dict(business_id=B, enabled=enabled, admit_attempts_created_after=WATERMARK)]
    rows['commerce_booking_operations'] = [dict(business_id=B, id=F['ids']['operation'], actor_id=A,
        source='booking_sheet', payment_mode='deposit', customer_id=F['ids']['customer'])]
    rows['commerce_payment_attempts'] = [dict(business_id=B, id=T, attempt_key=F['ids']['attempt_key'],
        customer_id=F['ids']['customer'], appointment_id=AP, booking_operation_id=F['ids']['operation'],
        execution_state='REQUESTED' if stage=='before' else 'ACCEPTED', amount_cents=5000, currency='cad',
        method='e_transfer', payment_kind='deposit', provider_route='manual', recovery_disposition='RECOVER',
        failure_class=None, failure_code=None, created_at=CREATED)]
    rows['appointments'] = [dict(business_id=B, id=AP, booking_operation_id=F['ids']['operation'],
        customer_id=F['ids']['customer'], location_id=L, service_id=F['ids']['service'], staff_id=F['ids']['staff'],
        price_cents=10000, tax_cents=0, deposit_cents=5000, amount_paid_cents=5000 if stage=='complete' else 0,
        amount_refunded_cents=0, payment_status='deposit_paid' if stage=='complete' else 'deposit_required')]
    rows['commerce_payment_attempt_events'] = [dict(business_id=B, attempt_id=T, event_type='REQUESTED',
        failure_class=None, failure_code=None)]
    if stage == 'before':
        return rows
    rows['commerce_payment_attempt_events'].append(dict(business_id=B, attempt_id=T, event_type='ACCEPTED',failure_class=None,failure_code=None))
    rows['commerce_transactions'] = [dict(business_id=B, id=TX, payment_attempt_id=T, customer_id=F['ids']['customer'],
        appointment_id=AP, amount_cents=5000, currency='cad', kind='deposit', method='e_transfer', provider='manual',
        status='succeeded', provider_reference='manual-booking-operation:'+T, provider_payment_intent_id=None,
        created_by=A, invoice_id=INV if stage=='complete' else None, occurred_at=CREATED)]
    rows['commerce_payment_reconciliation'] = [dict(business_id=B,attempt_id=T,projection_kind=k,state='COMPLETE' if stage=='complete' else 'PENDING') for k in h.PROJECTORS]
    if stage != 'complete':
        return rows
    rows['commerce_payment_attempt_events'] += [dict(business_id=B,attempt_id=T,event_type='PROJECTION_CHANGED',projection_kind=k,failure_class=None,failure_code=None) for k in h.PROJECTORS]
    rows['commerce_invoices'] = [dict(business_id=B,id=INV,appointment_id=AP,customer_id=F['ids']['customer'],
        invoice_number='INV-0001',currency='cad',subtotal_cents=10000,tax_cents=0,total_cents=10000,
        amount_paid_cents=5000,amount_refunded_cents=0,balance_cents=5000,status='partial')]
    rows['commerce_invoice_lines'] = [dict(business_id=B,invoice_id=INV,description='Appointment',quantity=1,
        unit_amount_cents=10000,tax_cents=0,discount_cents=0,total_cents=10000)]
    rows['customer_payment_events'] = [dict(business_id=B,transaction_id=TX,customer_id=F['ids']['customer'],
        appointment_id=AP,amount_cents=5000,currency='cad',method='e_transfer',provider='manual',status='paid',occurred_at=CREATED)]
    rows['commerce_receipts'] = [dict(business_id=B,transaction_id=TX,customer_id=F['ids']['customer'],
        receipt_number='RCT-0001',amount_cents=5000,currency='cad',method='e_transfer',email_status='not_sent',
        emailed_at=None,invoice_id=None,body_text=f'Transaction {TX}: 5000 CAD cents; e_transfer')]
    rows['commerce_invoice_sequences'] = [dict(business_id=B,next_number=2,prefix='INV')]
    rows['commerce_receipt_sequences'] = [dict(business_id=B,next_number=2,prefix='RCT')]
    return rows


def reader(stage):
    return {'payment':{'business_id':B,'rows':[{'attempt_id':T,'attempt_key':F['ids']['attempt_key'],
        'booking_operation_id':F['ids']['operation'],'appointment_id':AP,'amount_cents':5000,'currency':'cad',
        'method':'e_transfer','payment_kind':'deposit','provider_route':'manual','communication_eligibility':'NOT_IMPLEMENTED',
        'ledger':{'id':TX} if stage!='before' else None,'operator_state':{'before':'PAYMENT_RECOVERY_REQUIRED',
        'money':'RECORDED_BUT_NOT_FULLY_SYNCHRONIZED','complete':'RECORDED'}[stage]}]},
        'booking':{'payload':{'found':True,'operation':{'id':F['ids']['operation']},'attempt':{'id':T,'execution_state':'ACCEPTED' if stage!='before' else 'REQUESTED','recovery_disposition':'RECOVER','appointment_id':AP,'booking_operation_id':F['ids']['operation']},
        'appointment_count':1,'attempt_count':1,'ledger':{'id':TX} if stage!='before' else None,'appointment':{'id':AP},'ledger_count':int(stage!='before')}}}


class MemoryEvidence:
    def __init__(self): self.records=[]; self.phase=None
    def record(self, phase, payload):
        self.records.append((phase,copy.deepcopy(payload)))
        if phase.endswith(':dispatch'): self.phase=phase[:-9]


class FakeTransport:
    """All replies are in memory; cannot instantiate or reach the live Transport."""
    def __init__(self,evidence,fail=None,change=None):
        self.e=evidence; self.fail=fail; self.change=change; self.calls=[]
    def project_identity(self):
        self.calls.append('project-identity')
        if self.fail=='project-identity': raise h.Stop('fixture identity rejection')
        return {'id':h.REF,'status':'ACTIVE_HEALTHY'}
    def create_owner(self,fixture):
        self.calls.append('owner')
        if self.fail=='owner': raise h.Stop('fixture lost Auth response')
        return {'actor_id':A,'email_confirmed':True}
    def sql(self,sql):
        phase=self.e.phase; self.calls.append(phase)
        if self.fail==phase: raise h.Stop('fixture uncertain failure')
        if phase=='zero-write-preflight':
            result={k:True for k in ('future_slot','migrations_ok','functions_ok','privileges_ok','collision_free',
                'service_role_ok','browser_roles_ok','no_pg_cron','no_dispatch_trigger','event_sequence_privilege')}
            result.update(project_ref=h.REF,database='postgres',retained=CENSUS,baseline=BASELINE)
        elif phase=='literal-service-role': result={'literal_role':'service_role','read_only':'on'}
        elif phase=='owner:verify': result={'valid':True,'sessions':0,'memberships':0}
        elif phase=='provision-contained': result=dict(business_id=B,location_id=L,actor_id=A,slug=F['slug'])
        elif phase.startswith('admission-'): result=dict(business_id=B,enabled=phase=='admission-enable',watermark=WATERMARK)
        elif phase in ('bootstrap','replay-bootstrap'):
            result=dict(outcome='ADMITTED' if phase=='bootstrap' else 'EXISTING',operation_id=F['ids']['operation'],
                customer_id=F['ids']['customer'],attempt_id=T,execution_state='REQUESTED' if phase=='bootstrap' else 'ACCEPTED')
        elif phase in ('persist','replay-persist'): result=dict(outcome='CREATED' if phase=='persist' else 'EXISTING',operation_id=F['ids']['operation'],appointment_id=AP)
        elif phase in ('bind','replay-bind'): result=dict(outcome='BOUND' if phase=='bind' else 'EXISTING',operation_id=F['ids']['operation'],appointment_id=AP,attempt_id=T)
        elif phase in ('money-commit','replay-money'): result=dict(outcome='RECORDED' if phase=='money-commit' else 'REPLAY',attempt_id=T,transaction_id=TX,recorded=True,synchronization='PENDING')
        elif phase.startswith(('project:','verify:')): result=dict(outcome='APPLIED' if phase.startswith('project:') else 'VERIFIED',state='COMPLETE',attempt_id=T,business_id=B)
        elif phase.startswith('read-'): result=reader('before' if phase=='read-before-money' else 'money' if phase=='read-after-money' else 'complete')
        elif phase=='authorization-negative': result=dict(both_denied=True,sqlstate='42501')
        else:
            stage={'pre-admission-baseline':'empty','before-money':'before','after-money':'money'}.get(phase,'complete')
            result={'baseline':BASELINE,'rows':durable(stage,phase!='final-reconciliation'),'contained':True,
                'customer_provider_absent':True,'communication':{t:0 for t in h.COMMUNICATION},
                'sessions':0,'other_members':0,'other_admission':0,'other_writers':0}
        result=copy.deepcopy(result)
        if self.change: self.change(phase,result)
        return result


def no_credentials(key, default=None):
    if key.startswith('HV133_'):
        raise AssertionError('credential read')
    return default  # Standard-library locale/terminal probes use no real environment.


class Gates(unittest.TestCase):
    def test_import_has_no_io_or_credentials(self):
        with patch('urllib.request.build_opener',side_effect=AssertionError('network')), patch('os.environ.get',side_effect=no_credentials), patch('socket.socket',side_effect=AssertionError('socket')):
            spec=importlib.util.spec_from_file_location('inert',ROOT/'hosted_validation.py')
            module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
            self.assertNotIn('token',vars(module))
    def test_help_without_credentials(self):
        with patch('os.environ.get',side_effect=no_credentials), redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit) as cm: h.main(['--help'])
            self.assertEqual(cm.exception.code,0)
    def test_missing_execute(self):
        with patch('os.environ.get',side_effect=no_credentials), redirect_stdout(io.StringIO()):
            self.assertEqual(h.main([]),2)
    def test_exact_manifest_binding(self):
        m,f=h.load_package(ROOT,M['aggregate_sha256'],F['run_id'],h.REF)
        self.assertEqual(f,F); self.assertEqual(m,M)
    def test_wrong_bindings(self):
        cases=[('0'*64,F['run_id'],h.REF),(M['aggregate_sha256'],'wrong',h.REF),
               (M['aggregate_sha256'],F['run_id'],'wrong'),(M['aggregate_sha256'],F['run_id'],'production')]
        for args in cases:
            with self.subTest(args=args),self.assertRaises(h.Stop): h.load_package(ROOT,*args)
    def test_core_and_members_bound(self):
        core={k:v for k,v in M.items() if k!='aggregate_sha256'}
        self.assertEqual(h.seal(core),M['aggregate_sha256'])
        for name in h.MEMBERS:
            data=(ROOT/name).read_bytes()
            self.assertEqual(M['members'][name],dict(bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
        core['status']='CHANGED'; self.assertNotEqual(h.seal(core),M['aggregate_sha256'])
    def test_identifiers_and_contacts(self):
        self.assertEqual(len(F['ids']),len(set(F['ids'].values())))
        self.assertTrue(all(x.endswith('.invalid') for x in (F['owner_email'],F['business_email'],F['customer_email'])))
        self.assertFalse(any(x in json.dumps(F) for x in ('GVM','Chasum HQ','chasum-test-studio')))
    def test_allowed_endpoints_and_no_redirect(self):
        t=h.Transport('fake-token','fake-key')
        with self.assertRaises(h.Stop): t.request('https://example.invalid',{})
        with self.assertRaises(h.Stop): t.request(h.QUERY_URL,{},auth=True)
        with self.assertRaises(h.Stop): h.NoRedirect().redirect_request(None,None,302,None,None,h.AUTH_URL)
        self.assertTrue(any(isinstance(x,h.urllib.request.ProxyHandler) and x.proxies=={} for x in t.opener.handlers)
                        or not any(isinstance(x,h.urllib.request.ProxyHandler) for x in t.opener.handlers))
    def test_http_failure_is_single_shot_and_opaque(self):
        class Opener:
            count=0
            def open(self,*args,**kwargs):
                self.count+=1; raise ValueError('DO_NOT_LOG_CREDENTIAL')
        t=h.Transport('not-a-real-token','not-a-real-key'); t.opener=Opener()
        with self.assertRaises(h.Stop) as cm: t.sql('read only synthetic input')
        self.assertEqual(t.opener.count,1); self.assertNotIn('DO_NOT_LOG_CREDENTIAL',str(cm.exception))
    def test_evidence_redaction_exclusive_and_hash_chain(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'unique-run'; e=h.Evidence(p,('FAKE_SECRET_1','FAKE_SECRET_2'))
            e.record('test',{'value':'FAKE_SECRET_1 FAKE_SECRET_2'}); e.record('end',{'value':1})
            content=e.path.read_text(); self.assertNotIn('FAKE_SECRET',content)
            records=[json.loads(line) for line in content.splitlines()]
            self.assertEqual(records[1]['previous_sha256'],records[0]['sha256'])
            for row in records:
                expected=row.pop('sha256'); self.assertEqual(expected,h.sha(h.canon(row).encode()))
            self.assertEqual(e.path.stat().st_mode & 0o777,0o600)
            with self.assertRaises(FileExistsError): h.Evidence(p,())


class SQLContract(unittest.TestCase):
    def test_readonly_zero_preflight(self):
        sql=h.preflight(M,F)
        self.assertTrue(sql.startswith('begin isolation level repeatable read read only;'))
        self.assertTrue(sql.endswith('rollback;'))
        self.assertIn("'hosted_migrations'",sql); self.assertIn("'function_posture'",sql)
        self.assertIn('cardinality(statements)=1',sql)
        self.assertIn("has_function_privilege('anon'",sql)
        self.assertIn('tenant_identity_key(l.phone',sql)
        self.assertIn('tenant_identity_key(b.legal_name',sql)
        self.assertIn('business_slug_aliases',sql)
        self.assertIn('no_dispatch_trigger',sql)
    def test_retention_is_ordered_full_row_hash_not_counts(self):
        sql=h.preserved(B)
        for table in h.FINANCIAL: self.assertIn('public.'+table+' r',sql)
        self.assertIn('to_jsonb(r)::text',sql); self.assertIn('order by to_jsonb(r)::text collate "C"',sql)
        self.assertIn('business_id is distinct from',sql); self.assertNotIn('created_at >',sql)
    def test_provision_normal_and_contained_atomically(self):
        sql=h.provision(F,A)
        self.assertIn('public.decide_business_identity(',sql)
        self.assertNotIn('insert into public.businesses',sql.lower())
        self.assertLess(sql.index('email_notifications_enabled=false'),sql.index('commit;'))
        self.assertIn('NORMAL_SEED_SHAPE',sql)
        self.assertNotIn('insert into public.appointments',sql)
    def test_bootstrap_and_persist_argument_positions(self):
        def args(sql,name):
            call=sql.split('public.'+name+'(',1)[1].split(') r)',1)[0]
            return re.findall(r"'(?:[^']|'')*'|array\[\]::uuid\[\]|null|true|false|\d+",call)
        for name,sql in [('bootstrap_booking_operation_v1',h.bootstrap(F,IDS)),('persist_booking_operation_appointment_v1',h.persist(F,IDS))]:
            params=next(p['parameters'] for p in M['functions'] if p['name']==name); values=args(sql,name)
            self.assertEqual(len(values),len(params))
            bound=dict(zip([p['name'] for p in params],values))
            self.assertEqual(bound['p_business_id'],h.q(B)); self.assertEqual(bound['p_staff_id'],h.q(F['ids']['staff']))
            self.assertEqual(bound['p_resource_ids'],'array[]::uuid[]'); self.assertEqual(bound['p_subtotal_cents'],'10000')
        self.assertEqual(len(next(p['parameters'] for p in M['functions'] if p['name']=='bootstrap_booking_operation_v1')),37)
    def test_fingerprints_stable_and_scoped(self):
        a=h.fingerprints(F,IDS); self.assertEqual(a,h.fingerprints(F,IDS))
        changed={**IDS,'business_id':A}; self.assertNotEqual(a[:2],h.fingerprints(F,changed)[:2])
        self.assertTrue(all(re.fullmatch('v1:[0-9a-f]{64}',x) for x in a))
    def test_no_financial_cleanup_or_worker_calls(self):
        source=(ROOT/'hosted_validation.py').read_text()
        for pattern in (r'\bdelete\s+from\b',r'\btruncate\s+',r'\bsetval\s*\(',r'\balter\s+(table|role|policy)\b',r'/api/cron',r'processPendingJobs',r'api\.stripe\.com',r'/invite',r'/token'):
            self.assertIsNone(re.search(pattern,source,re.I),pattern)
        urls=re.findall(r'https://[^\s\'\"]+',source)
        self.assertEqual(len(urls),3)
    def test_source_functions_and_hashes(self):
        repo=ROOT.parents[2]
        for entry in M['hosted_migrations']:
            data=(repo/entry['local_path']).read_bytes()
            self.assertEqual(len(data),entry['bytes']); self.assertEqual(h.sha(data),entry['sha256'])
        for function in M['functions']:
            text=(repo/function['source_path']).read_text()
            m=re.search(r'create\s+(?:or\s+replace\s+)?function\s+public\.'+function['name']+r'\s*\((.*?)\)(.*?)\bas\s+\$\$(.*?)\$\$\s*;',text,re.I|re.S)
            self.assertIsNotNone(m,function['name']); self.assertEqual(h.sha(m[3].encode()),function['body_sha256'])
        attempts=M['required_writes']['commerce_payment_attempts']['INSERT']
        self.assertNotIn('payment_mode',attempts)
    def test_explicit_function_service_acl_matches_latest_source(self):
        # Validate final grant/revoke order, including trigger funcs re-granted after revoke.
        repo=ROOT.parents[2]
        sources='\n'.join((repo/item['local_path']).read_text() for item in M['hosted_migrations'])
        for function in M['functions']:
            if function['source_path'].endswith('tenant_identity_gate.sql'):
                continue
            pattern=r'(grant|revoke)\s+(?:execute|all)\s+on\s+function\s+public\.'+function['name']+r'\s*\([^;]*?\)\s+(?:to|from)\s+([^;]+);'
            changes=[m[1].lower()=='grant' for m in re.finditer(pattern,sources,re.I|re.S) if 'service_role' in m[2]]
            self.assertTrue(changes,function['name'])
            self.assertEqual(function['service_execute'],changes[-1],function['name'])

    def test_synthetic_input_is_never_loaded_from_retained_rows(self):
        source=(ROOT/'hosted_validation.py').read_text()
        self.assertNotIn("p['retained'][",source)
        self.assertNotIn("baseline['attempt_id']",source)
        sql=h.bootstrap(F,IDS)
        self.assertIn(h.q(F['ids']['attempt_key']),sql)
        self.assertIn(h.q(F['ids']['operation']),sql)
        self.assertIn(h.q(F['ids']['customer']),sql)
        self.assertIn('retained census',source)

    def test_negative_is_readonly_specific_denial(self):
        sql=h.negatives(F,IDS)
        self.assertIn('begin read only;',sql); self.assertTrue(sql.endswith('rollback;'))
        self.assertEqual(sql.count('when insufficient_privilege'),2)
        self.assertNotIn('when others',sql)


class Sequence(unittest.TestCase):
    def run_fake(self,fail=None,change=None):
        e=MemoryEvidence(); db=FakeTransport(e,fail,change)
        with patch('socket.socket',side_effect=AssertionError('No network permitted in test')):
            result=h.Run(M,F,db,e).execute()
        return result,db,e
    def test_full_sequence_and_disable_success(self):
        status,db,e=self.run_fake()
        self.assertEqual(status,'CONNECTED_BACKEND_PASS')
        self.assertEqual(db.calls[0],'zero-write-preflight')
        ordered=['zero-write-preflight','literal-service-role','project-identity','owner','provision-contained',
            'pre-admission-baseline','admission-enable','bootstrap','persist','bind','before-money',
            'read-before-money','money-commit','after-money','read-after-money',
            *['project:'+k for k in h.PROJECTORS],'complete','read-complete','replay-bootstrap','replay-persist',
            'replay-bind','replay-money',*['verify:'+k for k in h.PROJECTORS],'replayed','authorization-negative',
            'read-final','admission-disable','final-reconciliation']
        indices=[db.calls.index(x) for x in ordered]; self.assertEqual(indices,sorted(indices))
        self.assertEqual(len(db.calls),len(set(db.calls)))
        digest=[p['sha256'] for label,p in e.records if label in ('replay:before-digest','replay:after-digest')]
        self.assertEqual(len(digest),2); self.assertEqual(digest[0],digest[1])
    def test_each_preflight_failure_has_zero_writes(self):
        for key in ('future_slot','migrations_ok','functions_ok','privileges_ok','collision_free','service_role_ok','browser_roles_ok','no_pg_cron','no_dispatch_trigger','event_sequence_privilege'):
            def change(phase,result):
                if phase=='zero-write-preflight': result[key]=False
            with self.subTest(key=key):
                status,db,e=self.run_fake(change=change)
                self.assertEqual(status,'STOP_ZERO_WRITES'); self.assertEqual(db.calls,['zero-write-preflight'])
    def test_identity_and_role_fail_before_auth(self):
        for phase in ('zero-write-preflight','literal-service-role','project-identity'):
            with self.subTest(phase=phase):
                status,db,e=self.run_fake(fail=phase)
                self.assertEqual(status,'STOP_ZERO_WRITES'); self.assertNotIn('owner',db.calls)
    def test_every_uncertain_write_stops_without_retry(self):
        for phase in ('owner','provision-contained','admission-enable','bootstrap','persist','bind','money-commit',
                      *['project:'+k for k in h.PROJECTORS],'replay-money','admission-disable'):
            with self.subTest(phase=phase):
                status,db,e=self.run_fake(fail=phase)
                self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertEqual(db.calls[-1],phase)
                self.assertEqual(db.calls.count(phase),1); self.assertEqual(e.records[-1][0],'stop')
    def test_retained_same_count_changed_digest_stops(self):
        def change(phase,result):
            if phase=='pre-admission-baseline': result['baseline']['commerce_payment_attempts']['sha256']='b'*64
        status,db,e=self.run_fake(change=change)
        self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('admission-enable',db.calls)
    def test_nonempty_synthetic_prestate_stops_before_admission(self):
        def change(phase,result):
            if phase=='pre-admission-baseline': result['rows']['commerce_transactions']=[{'business_id':B}]
        status,db,e=self.run_fake(change=change)
        self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('admission-enable',db.calls)
    def test_watermark_must_strictly_precede_attempt(self):
        for created in (WATERMARK,'2026-10-09T00:00:00+00:00'):
            def change(phase,result):
                if phase=='before-money': result['rows']['commerce_payment_attempts'][0]['created_at']=created
            status,db,e=self.run_fake(change=change)
            self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('money-commit',db.calls)
    def test_communication_or_concurrent_writer_stops(self):
        for key in ('sessions','other_members','other_admission','other_writers'):
            def change(phase,result):
                if phase=='pre-admission-baseline': result[key]=1
            status,db,e=self.run_fake(change=change)
            self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('admission-enable',db.calls)
        def change(phase,result):
            if phase=='containment:appointment_cache': result['communication']['background_jobs']=1
        status,db,e=self.run_fake(change=change)
        self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('project:invoice_settlement',db.calls)
    def test_replay_mutation_cannot_pass(self):
        def change(phase,result):
            if phase=='replayed': result['rows']['commerce_receipt_sequences'][0]['next_number']=3
        status,db,e=self.run_fake(change=change)
        self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('authorization-negative',db.calls)
    def test_disable_failure_cannot_pass(self):
        def change(phase,result):
            if phase=='admission-disable': result['enabled']=True
        status,db,e=self.run_fake(change=change)
        self.assertEqual(status,'STOP_AFTER_WRITES'); self.assertNotIn('final-reconciliation',db.calls)
    def test_truth_rejects_financial_and_tenant_drift(self):
        cases=[('appointments','price_cents',1),('commerce_transactions','provider','stripe'),
               ('commerce_receipts','invoice_id',INV),('commerce_receipts','email_status','sent'),
               ('commerce_invoice_sequences','next_number',3),('customer_payment_events','business_id',A)]
        for table,key,value in cases:
            rows=durable('complete'); rows[table][0][key]=value
            with self.subTest(table=table,key=key),self.assertRaises(h.Stop): h.truth(rows,F,IDS,True)
    def test_readers_reject_pii_and_wrong_state(self):
        r=reader('complete'); r['payment']['rows'][0]['provider_reference']='internal'
        with self.assertRaises(h.Stop): h.check_readers(r,F,IDS,'RECORDED',True)
        with self.assertRaises(h.Stop): h.check_readers(reader('money'),F,IDS,'RECORDED',True)


class IdentityDiagnostics(unittest.TestCase):
    BAIT = 'NEVER_PERSIST_REMOTE_BODY_ACCOUNT_COOKIE_OR_TOKEN'

    class Response:
        status = 200
        def __init__(self, body, url=h.PROJECT_URL): self.body=body; self.url=url
        def __enter__(self): return self
        def __exit__(self,*args): return False
        def geturl(self): return self.url
        def read(self,limit): return self.body[:limit]

    class Opener:
        def __init__(self,value): self.value=value; self.calls=[]
        def open(self,request,timeout):
            self.calls.append((request,timeout))
            if isinstance(self.value,Exception): raise self.value
            return self.value

    def exercise(self,value,expected=None):
        evidence=MemoryEvidence()
        actual=h.Transport('FAKE_MANAGEMENT_CREDENTIAL','FAKE_SERVICE_CREDENTIAL')
        actual.opener=self.Opener(value)
        class Mixed(FakeTransport):
            def project_identity(self):
                self.calls.append('project-identity')
                return actual.project_identity()
        db=Mixed(evidence)
        with patch('socket.socket',side_effect=AssertionError('Offline only')):
            status=h.Run(M,F,db,evidence).execute()
        self.assertEqual(len(actual.opener.calls),1)
        request,timeout=actual.opener.calls[0]
        self.assertEqual(request.full_url,h.PROJECT_URL)
        self.assertEqual(request.get_method(),'GET');self.assertIsNone(request.data)
        self.assertEqual(request.get_header('Authorization'),'Bearer FAKE_MANAGEMENT_CREDENTIAL')
        self.assertIsNone(request.get_header('Apikey'));self.assertEqual(timeout,45)
        serialized=json.dumps(evidence.records)
        for forbidden in (self.BAIT,'FAKE_MANAGEMENT_CREDENTIAL','FAKE_SERVICE_CREDENTIAL'):
            self.assertNotIn(forbidden,serialized)
        if expected:
            self.assertEqual(status,'STOP_ZERO_WRITES')
            self.assertEqual(db.calls,['zero-write-preflight','literal-service-role','project-identity'])
            phase,stop=evidence.records[-1];self.assertEqual(phase,'stop')
            self.assertEqual(stop['last_phase'],'project-identity');self.assertEqual(stop['reason_code'],expected)
            self.assertEqual(stop['reason'],expected);self.assertFalse(stop['automatic_retry'])
            self.assertFalse(stop['admission_may_remain_enabled'])
        else:
            self.assertEqual(status,'CONNECTED_BACKEND_PASS')
            self.assertLess(db.calls.index('project-identity'),db.calls.index('owner'))
        return evidence

    def http(self,code):
        # HTTP-error bodies must never be read, even if they contain secrets.
        class NeverRead(io.BytesIO):
            def read(self,*args): raise AssertionError('HTTP error body accessed')
        error=h.urllib.error.HTTPError(h.PROJECT_URL,code,self.BAIT,{'Set-Cookie':self.BAIT},NeverRead(self.BAIT.encode()))
        self.exercise(error,'PROJECT_IDENTITY_HTTP_'+(str(code) if code in (401,403,429) else '5XX' if 500<=code<=599 else 'OTHER'))

    def test_http_401(self): self.http(401)
    def test_http_403(self): self.http(403)
    def test_http_429(self): self.http(429)
    def test_http_500(self): self.http(500)
    def test_http_503(self): self.http(503)
    def test_other_http(self): self.http(404)
    def test_timeout(self): self.exercise(TimeoutError(self.BAIT),'PROJECT_IDENTITY_TIMEOUT')
    def test_socket_timeout(self): self.exercise(socket.timeout(self.BAIT),'PROJECT_IDENTITY_TIMEOUT')
    def test_wrapped_timeout(self): self.exercise(h.urllib.error.URLError(socket.timeout(self.BAIT)),'PROJECT_IDENTITY_TIMEOUT')
    def test_tls(self): self.exercise(ssl.SSLError(self.BAIT),'PROJECT_IDENTITY_TLS_ERROR')
    def test_wrapped_tls(self): self.exercise(h.urllib.error.URLError(ssl.SSLCertVerificationError(self.BAIT)),'PROJECT_IDENTITY_TLS_ERROR')
    def test_network(self): self.exercise(h.urllib.error.URLError(self.BAIT),'PROJECT_IDENTITY_NETWORK_ERROR')
    def test_dns(self): self.exercise(socket.gaierror(self.BAIT),'PROJECT_IDENTITY_NETWORK_ERROR')
    def test_invalid_json(self): self.exercise(self.Response(self.BAIT.encode()),'PROJECT_IDENTITY_INVALID_JSON')
    def test_invalid_encoding(self): self.exercise(self.Response(b'\xff'),'PROJECT_IDENTITY_INVALID_JSON')
    def test_wrong_json_shape(self): self.exercise(self.Response(json.dumps([self.BAIT]).encode()),'PROJECT_IDENTITY_INVALID_JSON')
    def test_wrong_project(self): self.exercise(self.Response(json.dumps({'id':self.BAIT,'status':'ACTIVE_HEALTHY'}).encode()),'PROJECT_IDENTITY_WRONG_PROJECT')
    def test_unhealthy(self): self.exercise(self.Response(json.dumps({'id':h.REF,'status':self.BAIT}).encode()),'PROJECT_IDENTITY_UNHEALTHY')
    def test_redirect_rejection(self): self.exercise(h.Stop('redirect refused'),'PROJECT_IDENTITY_RESPONSE_REJECTED')
    def test_response_url_rejection(self): self.exercise(self.Response(b'{}','https://not-approved.invalid'),'PROJECT_IDENTITY_RESPONSE_REJECTED')
    def test_response_size_cap(self): self.exercise(self.Response(b'x'*(h.MAX_BYTES+1)),'PROJECT_IDENTITY_RESPONSE_REJECTED')
    def test_success_returns_only_safe_identity(self):
        self.exercise(self.Response(json.dumps({'id':h.REF,'status':'ACTIVE_HEALTHY','account':self.BAIT,'headers':self.BAIT}).encode()))
    def test_untrusted_code_is_not_retained(self):
        error=h.ProjectIdentityStop(self.BAIT)
        self.assertEqual(error.reason_code,'PROJECT_IDENTITY_RESPONSE_REJECTED')
        self.assertNotIn(self.BAIT,str(error))
    def test_write_errors_remain_opaque(self):
        for url,auth in ((h.QUERY_URL,False),(h.AUTH_URL,True)):
            transport=h.Transport('FAKE_MANAGEMENT_CREDENTIAL','FAKE_SERVICE_CREDENTIAL')
            transport.opener=self.Opener(h.urllib.error.HTTPError(url,403,self.BAIT,{},None))
            with self.assertRaises(h.Stop) as cm: transport.request(url,{},auth)
            self.assertNotIsInstance(cm.exception,h.ProjectIdentityStop)
            self.assertEqual(str(cm.exception),'transport failure; response may be lost; no retry')
            self.assertEqual(len(transport.opener.calls),1)
    def test_financial_and_gate_source_is_unchanged(self):
        old=ROOT.parent/'issue-133-connected-staging'
        before=(old/'hosted_validation.py').read_text(); after=(ROOT/'hosted_validation.py').read_text()
        def definitions(source):
            result={}
            for node in ast.parse(source).body:
                if isinstance(node,(ast.FunctionDef,ast.ClassDef)):
                    if isinstance(node,ast.FunctionDef): result[node.name]=ast.get_source_segment(source,node)
                    else:
                        for method in node.body:
                            if isinstance(method,ast.FunctionDef): result[node.name+'.'+method.name]=ast.get_source_segment(source,method)
            return result
        a,b=definitions(before),definitions(after)
        allowed={'Transport.request','Transport.project_identity','Run.execute'}
        for name,text in a.items():
            if name not in allowed: self.assertEqual(text,b[name],name)
        original=json.loads((old/'manifest.json').read_text())
        for key in ('source_pins','functions','hosted_migrations','required_writes'):
            self.assertEqual(original[key],M[key],key)
    def test_fixture_is_fresh(self):
        original=json.loads((ROOT.parent/'issue-133-connected-staging'/'fixture.json').read_text())
        for key in ('run_id','business_name','slug','business_email','owner_email','customer_email','phone','website'):
            self.assertNotEqual(original[key],F[key],key)
        self.assertFalse(set(original['ids'].values()) & set(F['ids'].values()))
        self.assertEqual(original['commercial'],F['commercial'])


if __name__=='__main__':
    unittest.main()
