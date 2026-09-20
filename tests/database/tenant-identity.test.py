"""Disposable PostgreSQL only: creates a fresh cluster, Unix socket, no TCP.
Run: python3 tests/database/tenant-identity.test.py
Requires local PostgreSQL 17 binaries (PG_TEST_BIN may select the binary directory).
No existing database URL, credentials, linked Supabase or PG* connection variables used.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[2]
BIN = Path(os.environ.get('PG_TEST_BIN', '/opt/homebrew/opt/postgresql@17/bin'))
RUN = Path(tempfile.mkdtemp(prefix='chasum-issue72-local-'))
ENV = {k:v for k,v in os.environ.items() if not k.startswith('PG')}
ENV['LC_ALL'] = 'C'
PORT = '57272'
USER_ID = '00000000-0000-0000-0000-000000000001'
OTHER = '00000000-0000-0000-0000-000000000002'
CANDIDATE = 'a04e1d65-eeb9-4d72-a5bf-739a9038bb91'

def sql(query, fail=False):
    result = subprocess.run([str(BIN/'psql'), '-X', '-v', 'ON_ERROR_STOP=1', '-h', str(RUN), '-p', PORT, '-U', 'postgres', '-d', 'postgres', '-At'], input=query, text=True, capture_output=True, env=ENV)
    if not fail and result.returncode: raise AssertionError(result.stderr)
    return result

def extract(path, name):
    body=(ROOT/path).read_text()
    start=body.index('create or replace function '+name+'(')
    return body[start:body.index('$$;',start)+3]

def call(actor=USER_ID, intent='create_new', **changes):
    data=dict(name='New Studio', legal=None, email='new@example.test', phone='+1 416 555 0123', website='https://new.example.test', city='Toronto', region='Ontario', country='CA', slug=None)
    data.update(changes)
    values=[actor,intent]+list(data.values())
    args=','.join('null' if v is None else "'"+str(v).replace("'","''")+"'" for v in values)
    return 'select public.decide_business_identity('+args+');'

def outcome(**kwargs):
    return json.loads(sql('set role service_role;'+call(**kwargs)).stdout.splitlines()[-1])

class IdentityGate(unittest.TestCase):
    def setUp(self):
        sql("truncate public.tenant_identity_decisions, public.business_slug_aliases, public.location_hours, public.location_settings, public.locations, public.business_hours, public.business_members, public.businesses, public.platform_admins, auth.users cascade;"
            f"insert into auth.users(id,email_confirmed_at) values ('{USER_ID}',now()),('{OTHER}',now());")

    def existing(self, **fields):
        values=dict(id=CANDIDATE,owner_id=OTHER,name='Existing Studio',slug='existing-studio',email='existing@example.test',phone='9055550199',website='https://existing.test',city='Ottawa',state='Ontario')
        values.update(fields)
        sql('insert into public.businesses('+','.join(values)+') values ('+','.join("'"+v.replace("'","''")+"'" for v in values.values())+');')

    def test_create_seed_audit(self):
        result=outcome(); self.assertEqual(result['status'],'created')
        self.assertEqual(sql('select count(*) from business_hours').stdout.strip(),'7')
        self.assertEqual(sql('select count(*) from location_hours').stdout.strip(),'7')
        self.assertEqual(sql('select appointment_interval_minutes from location_settings').stdout.strip(),'15')
        self.assertEqual(sql('select subscription_plan_key from businesses').stdout.strip(),'starter')
        audit=sql('select row_to_json(d) from tenant_identity_decisions d').stdout
        self.assertIn('create_new',audit)
        self.assertNotIn('example.test',audit);self.assertNotIn('New Studio',audit);self.assertNotIn('416',audit)

    def test_join_no_creation(self):
        self.assertEqual(outcome(intent='join_existing')['status'],'join_existing')
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')
        self.assertEqual(sql('select decision from tenant_identity_decisions').stdout.strip(),'join_existing')

    def test_strong_signals(self):
        for field,value in [('phone','(416) 555-0123'),('email','NEW@EXAMPLE.TEST'),('website','http://www.new.example.test/path'),('name','New Studio')]:
            with self.subTest(field=field):
                self.setUp(); self.existing(**{field:value},city='Toronto')
                self.assertEqual(outcome()['status'],'ambiguous')
                self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'1')
                self.assertEqual(sql('select decision from tenant_identity_decisions').stdout.strip(),'ambiguous_stop')

    def test_name_other_city_and_weak_slug(self):
        self.existing(name='New Studio',slug='new-studio')
        result=outcome();self.assertEqual(result['status'],'created');self.assertEqual(result['business']['slug'],'new-studio-1')

    def test_weak_email_domain(self):
        self.existing(email='someone@example.test');self.assertEqual(outcome()['status'],'created')

    def test_location_phone(self):
        self.existing(); sql(f"insert into locations(business_id,name,slug,phone) values ('{CANDIDATE}','Branch','branch','4165550123');")
        self.assertEqual(outcome()['status'],'ambiguous')

    def test_location_name_and_franchise(self):
        self.existing(name='New Studio North');sql(f"insert into locations(business_id,name,slug,city,state) values ('{CANDIDATE}','Branch','branch','Toronto','Ontario');")
        self.assertEqual(outcome()['status'],'ambiguous')

    def test_shared_domain(self):
        self.existing(website='https://example.test');self.assertEqual(outcome()['status'],'ambiguous')

    def test_current_and_alias_slug(self):
        self.existing();self.assertEqual(outcome(slug='existing-studio')['status'],'ambiguous')
        sql(f"update businesses set slug='renamed' where id='{CANDIDATE}';")
        self.assertEqual(outcome(slug='existing-studio')['status'],'ambiguous')

    def test_direct_insert_denied(self):
        for role in ['anon','authenticated']:
            result=sql(f"set role {role};set request.jwt.claim.sub='{USER_ID}';insert into businesses(owner_id,name,slug) values ('{USER_ID}','Bypass','bypass');",True)
            self.assertNotEqual(result.returncode,0)

    def test_legacy_resolve_only(self):
        result=sql(f"set role authenticated;set request.jwt.claim.sub='{USER_ID}';select ensure_business_for_owner('Bypass','bypass');")
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')
        self.assertEqual(result.stdout.splitlines()[-1],'')

    def test_rpc_denied_clients(self):
        for role in ['anon','authenticated']:
            self.assertNotEqual(sql('set role '+role+';'+call(actor=OTHER),True).returncode,0)

    def test_client_cannot_attach_membership(self):
        self.existing()
        self.assertNotEqual(sql(f"set role authenticated;set request.jwt.claim.sub='{USER_ID}';insert into business_members(business_id,user_id,role) values ('{CANDIDATE}','{USER_ID}','admin');",True).returncode,0)

    def test_invalid_override_intent(self):
        self.assertNotEqual(sql('set role service_role;'+call(intent='private_alpha_override'),True).returncode,0)
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')

    def test_rate_limit_requires_review(self):
        for _ in range(10): self.assertEqual(outcome(intent='join_existing')['status'],'join_existing')
        self.assertEqual(outcome()['status'],'review_required')
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')

    def test_existing_owner_and_member(self):
        self.existing(owner_id=USER_ID)
        self.assertEqual(outcome()['status'],'existing')
        sql(f"insert into business_members(business_id,user_id,role) values ('{CANDIDATE}','{OTHER}','admin');")
        self.assertEqual(outcome(actor=OTHER)['status'],'existing')

    def test_owner_member_update_and_foreign_denial(self):
        self.existing(owner_id=USER_ID)
        sql(f"set role authenticated;set request.jwt.claim.sub='{USER_ID}';update businesses set name='GVM',slug='gvm-renamed' where id='{CANDIDATE}';")
        sql(f"set role authenticated;set request.jwt.claim.sub='{OTHER}';update businesses set name='Foreign' where id='{CANDIDATE}';")
        self.assertEqual(sql('select name from businesses').stdout.strip(),'GVM')
        sql(f"insert into business_members(business_id,user_id,role) values ('{CANDIDATE}','{OTHER}','admin');")
        sql(f"set role authenticated;set request.jwt.claim.sub='{OTHER}';update businesses set name='Admin save' where id='{CANDIDATE}';")
        self.assertEqual(sql('select name from businesses').stdout.strip(),'Admin save')
        self.assertEqual(sql("select count(*) from business_slug_aliases where slug='existing-studio'").stdout.strip(),'1')

    def test_owner_identity_transfer_denied(self):
        self.existing(owner_id=USER_ID)
        self.assertNotEqual(sql(f"set role authenticated;set request.jwt.claim.sub='{USER_ID}';update businesses set owner_id='{OTHER}';",True).returncode,0)

    def test_operator_unverified_banned(self):
        for update in ["raw_app_meta_data='{}'::jsonb || jsonb_build_object('chasum_operator',null)","email_confirmed_at=null","banned_until=now()+interval '1 day'","is_anonymous=true"]:
            with self.subTest(update=update):
                self.setUp();sql(f"update auth.users set {update} where id='{USER_ID}';")
                self.assertNotEqual(sql('set role service_role;'+call(),True).returncode,0)
                self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')

    def test_audit_private_and_override_protected(self):
        outcome()
        for role in ['anon','authenticated']:
            self.assertNotEqual(sql('set role '+role+';select * from tenant_identity_decisions;',True).returncode,0)
            self.assertNotEqual(sql('set role '+role+f";insert into tenant_identity_decisions(actor_user_id,decision,reason_code) values ('{USER_ID}','private_alpha_override','reviewed_separate_business');",True).returncode,0)
        self.assertNotEqual(sql(f"insert into tenant_identity_decisions(actor_user_id,decision,reason_code) values ('{USER_ID}','private_alpha_override','reviewed_separate_business');",True).returncode,0)

    def test_concurrent_same_owner(self):
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            states=list(pool.map(lambda _:outcome()['status'],range(2)))
        self.assertCountEqual(states,['created','existing'])
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'1')

    def test_concurrent_different_owners_same_identity(self):
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            states=list(pool.map(lambda actor:outcome(actor=actor)['status'],[USER_ID,OTHER]))
        self.assertCountEqual(states,['created','ambiguous'])
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'1')

    def test_lock_timeout_fails_closed(self):
        blocker=subprocess.Popen([str(BIN/'psql'),'-X','-h',str(RUN),'-p',PORT,'-U','postgres','-d','postgres','-c',"set application_name='issue72-blocker';begin;lock table businesses in access exclusive mode;select pg_sleep(7);rollback;"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env=ENV)
        try:
            for _ in range(100):
                if sql("select count(*) from pg_locks l join pg_stat_activity a using(pid) where a.application_name='issue72-blocker' and l.relation='public.businesses'::regclass and l.granted").stdout.strip()=='1': break
                time.sleep(0.02)
            else: self.fail('local blocker did not acquire its lock')
            result=sql('set role service_role;'+call(),True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('lock timeout',result.stderr)
        finally: blocker.wait(timeout=10)
        self.assertEqual(sql('select count(*) from businesses').stdout.strip(),'0')
        self.assertEqual(sql('select count(*) from tenant_identity_decisions').stdout.strip(),'0')

    def test_audit_failure_rolls_back_creation(self):
        sql("create function public.fail_audit() returns trigger language plpgsql as $$begin raise exception 'synthetic audit failure';end$$;create trigger fail_audit before insert on tenant_identity_decisions for each row execute function fail_audit();")
        try:
            self.assertNotEqual(sql('set role service_role;'+call(),True).returncode,0)
            for table in ['businesses','business_hours','locations','location_settings','tenant_identity_decisions']:
                self.assertEqual(sql('select count(*) from '+table).stdout.strip(),'0')
        finally: sql('drop trigger fail_audit on tenant_identity_decisions;drop function fail_audit();')

    def test_seed_failure_rolls_back_business_and_audit(self):
        sql("create function public.fail_seed() returns trigger language plpgsql as $$begin raise exception 'synthetic seed failure';end$$;create trigger fail_seed before insert on location_hours for each row execute function fail_seed();")
        try:
            self.assertNotEqual(sql('set role service_role;'+call(),True).returncode,0)
            for table in ['businesses','business_hours','locations','location_settings','tenant_identity_decisions']:
                self.assertEqual(sql('select count(*) from '+table).stdout.strip(),'0')
        finally: sql('drop trigger fail_seed on location_hours;drop function fail_seed();')

if __name__=='__main__':
    subprocess.run([str(BIN/'initdb'),'-D',str(RUN/'data'),'-U','postgres','-A','trust','--no-locale'],check=True,env=ENV,stdout=subprocess.DEVNULL)
    subprocess.run([str(BIN/'pg_ctl'),'-D',str(RUN/'data'),'-l',str(RUN/'postgres.log'),'-o',f"-k {RUN} -p {PORT} -c listen_addresses=''",'-w','start'],check=True,env=ENV,stdout=subprocess.DEVNULL)
    try:
        assert sql('show listen_addresses').stdout.strip()==''
        assert sql('show unix_socket_directories').stdout.strip()==str(RUN)
        print('ISOLATED LOCAL CLUSTER:',RUN, 'TCP DISABLED')
        sql((ROOT/'tests/database/tenant-identity-fixture.sql').read_text())
        sql(extract('supabase/migrations/032_private_alpha_co_owners.sql','is_business_owner'))
        sql("alter table business_members enable row level security;create policy members_read on business_members for select using(user_id=auth.uid() or is_business_owner(business_id));")
        sql(extract('supabase/migrations/008_phase5_multi_location.sql','create_default_location'))
        sql(extract('supabase/migrations/032_private_alpha_co_owners.sql','ensure_business_for_owner'))
        sql('create policy "Owners manage their businesses" on businesses for all using (owner_id=auth.uid() or is_business_owner(id)) with check (owner_id=auth.uid() or is_business_owner(id));')
        sql((ROOT/'supabase/migrations/039_business_slug_aliases.sql').read_text())
        sql('begin;'+(ROOT/'supabase/migrations/20260920230358_tenant_identity_gate.sql').read_text()+'commit;')
        unittest.main(verbosity=2)
    finally:
        subprocess.run([str(BIN/'pg_ctl'),'-D',str(RUN/'data'),'-m','fast','-w','stop'],check=True,env=ENV,stdout=subprocess.DEVNULL)
