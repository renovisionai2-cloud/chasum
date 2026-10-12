#!/usr/bin/env python3
"""Prepared connected backend proof. Import/help perform no I/O or credential access."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import secrets
import socket
import ssl
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

REF = 'wnfahklzaxirftyskctd'
QUERY_URL = f'https://api.supabase.com/v1/projects/{REF}/database/query'
PROJECT_URL = f'https://api.supabase.com/v1/projects/{REF}'
AUTH_URL = f'https://{REF}.supabase.co/auth/v1/admin/users'
MEMBERS = ('PLAN.md', 'fixture.json', 'hosted_validation.py', 'tests/test_hosted_validation.py')
FINANCIAL = ('appointments', 'commerce_booking_operations', 'commerce_payment_attempts',
             'commerce_payment_attempt_events', 'commerce_payment_reconciliation', 'commerce_transactions',
             'commerce_invoices', 'commerce_invoice_lines', 'commerce_invoice_sequences', 'commerce_receipts',
             'commerce_receipt_sequences', 'commerce_projection_admission', 'commerce_refunds', 'customer_payment_events')
COMMUNICATION = ('background_jobs', 'communication_follow_ups', 'communication_send_intents',
                 'communications_audit_log', 'notification_logs', 'communication_history', 'notifications',
                 'calendar_connections', 'webhook_endpoints')
PARENTS = ('businesses', 'business_members', 'locations', 'customers', 'services', 'staff', 'business_hours', 'business_slug_aliases')
PROJECTORS = ('appointment_cache', 'invoice_settlement', 'customer_payment_events', 'receipt')
MAX_BYTES = 4_000_000


class Stop(Exception):
    """Bounded failure text only; never interpolate remote bodies or credentials."""


class ProjectIdentityStop(Stop):
    """Allowlisted zero-write diagnostics; never retain remote exception content."""
    CODES = frozenset({
        'PROJECT_IDENTITY_HTTP_401', 'PROJECT_IDENTITY_HTTP_403',
        'PROJECT_IDENTITY_HTTP_429', 'PROJECT_IDENTITY_HTTP_5XX',
        'PROJECT_IDENTITY_HTTP_OTHER', 'PROJECT_IDENTITY_TIMEOUT',
        'PROJECT_IDENTITY_TLS_ERROR', 'PROJECT_IDENTITY_NETWORK_ERROR',
        'PROJECT_IDENTITY_INVALID_JSON', 'PROJECT_IDENTITY_WRONG_PROJECT',
        'PROJECT_IDENTITY_UNHEALTHY', 'PROJECT_IDENTITY_RESPONSE_REJECTED',
    })

    def __init__(self, code):
        if code not in self.CODES:
            code = 'PROJECT_IDENTITY_RESPONSE_REJECTED'
        self.reason_code = code
        super().__init__(code)


def project_identity_error(error):
    # Inspect only numeric HTTP status or exception types, never str/repr, headers,
    # response bodies, URLs, or URLError.reason text. HTTPError precedes URLError.
    if isinstance(error, urllib.error.HTTPError):
        status = error.code
        if type(status) is int:
            if status in (401, 403, 429):
                return ProjectIdentityStop('PROJECT_IDENTITY_HTTP_' + str(status))
            if 500 <= status <= 599:
                return ProjectIdentityStop('PROJECT_IDENTITY_HTTP_5XX')
        return ProjectIdentityStop('PROJECT_IDENTITY_HTTP_OTHER')
    reason = error.reason if isinstance(error, urllib.error.URLError) else error
    if isinstance(reason, (TimeoutError, socket.timeout)):
        return ProjectIdentityStop('PROJECT_IDENTITY_TIMEOUT')
    if isinstance(reason, ssl.SSLError):
        return ProjectIdentityStop('PROJECT_IDENTITY_TLS_ERROR')
    if isinstance(error, (json.JSONDecodeError, UnicodeDecodeError)):
        return ProjectIdentityStop('PROJECT_IDENTITY_INVALID_JSON')
    if isinstance(error, Stop):
        return ProjectIdentityStop('PROJECT_IDENTITY_RESPONSE_REJECTED')
    return ProjectIdentityStop('PROJECT_IDENTITY_NETWORK_ERROR')


def canon(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, label):
    if not condition:
        raise Stop(label)


def q(value):
    if value is None:
        return 'null'
    if type(value) is bool:
        return 'true' if value else 'false'
    if type(value) is int:
        return str(value)
    require(isinstance(value, str) and '\x00' not in value, 'SQL literal type')
    return "'" + value.replace("'", "''") + "'"


def uid(value):
    require(isinstance(value, str) and str(uuid.UUID(value)) == value, 'UUID shape')
    return value


def seal(core):
    """Manifest envelope binds every metadata field and file hash; no self-hash cycle."""
    return sha(('CHASUM-CONNECTED-STAGING-v1\n' + canon(core)).encode())


def load_package(root, expected_sha, run_id, project):
    require(project == REF, 'wrong project')
    manifest = json.loads((root / 'manifest.json').read_text())
    require(manifest['status'] == 'PREPARED_ONLY_NOT_RUN', 'manifest status')
    require(manifest['project_ref'] == REF and manifest['run_id'] == run_id, 'run binding')
    core = {k: v for k, v in manifest.items() if k != 'aggregate_sha256'}
    require(seal(core) == manifest['aggregate_sha256'] == expected_sha, 'package binding')
    require(set(manifest['members']) == set(MEMBERS), 'member inventory')
    for name in MEMBERS:
        data = (root / name).read_bytes()
        require(manifest['members'][name] == {'bytes': len(data), 'sha256': sha(data)}, 'member drift')
    repo = root.parents[2]
    for name, digest in manifest['source_pins'].items():
        require(sha((repo / name).read_bytes()) == digest, 'source drift')
    fixture = json.loads((root / 'fixture.json').read_text())
    require(fixture['project_ref'] == REF and fixture['run_id'] == run_id, 'fixture binding')
    for value in fixture['ids'].values():
        uid(value)
    require(len(set(fixture['ids'].values())) == len(fixture['ids']), 'fixture duplicate IDs')
    return manifest, fixture


class Evidence:
    def __init__(self, path, credentials):
        # Exclusive run directory prevents silent local resume/reuse. Never remove it.
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        path.mkdir(mode=0o700, exist_ok=False)
        self.path = path / 'evidence.jsonl'
        self.secrets = tuple(x for x in credentials if x)
        self.sequence = 0
        self.previous = '0' * 64

    def record(self, phase, payload):
        self.sequence += 1
        text = canon(payload)
        for secret in self.secrets:
            text = text.replace(secret, '[REDACTED]')
        row = {'sequence': self.sequence, 'phase': phase, 'previous_sha256': self.previous,
               'observed_at': datetime.now(timezone.utc).isoformat(), 'payload': json.loads(text)}
        self.previous = sha(canon(row).encode())
        row['sha256'] = self.previous
        fd = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        with os.fdopen(fd, 'a') as out:
            out.write(canon(row) + '\n')
            out.flush()
            os.fsync(out.fileno())


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Stop('redirect refused')


class Transport:
    def __init__(self, management_token, service_key):
        self.management_token = management_token
        self.service_key = service_key
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect(),
                      urllib.request.HTTPSHandler(context=ssl.create_default_context()))

    def request(self, url, data, auth=False):
        require(url in (QUERY_URL, AUTH_URL, PROJECT_URL), 'endpoint refused')
        require(auth == (url == AUTH_URL), 'credential endpoint binding')
        key = self.service_key if auth else self.management_token
        headers = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Accept': 'application/json'}
        if auth:
            headers['apikey'] = key
        req = urllib.request.Request(url, data=None if url == PROJECT_URL else canon(data).encode(), headers=headers,
                                     method='GET' if url == PROJECT_URL else 'POST')
        try:
            with self.opener.open(req, timeout=45) as response:
                require(response.status in (200, 201) and response.geturl() == url, 'HTTP response')
                raw = response.read(MAX_BYTES + 1)
            require(len(raw) <= MAX_BYTES, 'response size')
            return json.loads(raw)
        except Stop as error:
            if url == PROJECT_URL:
                raise project_identity_error(error) from None
            raise
        except Exception as error:
            if url == PROJECT_URL:
                raise project_identity_error(error) from None
            raise Stop('transport failure; response may be lost; no retry') from None

    def sql(self, sql):
        # Privileged Management route; SQL itself enforces READ ONLY for every probe.
        value = self.request(QUERY_URL, {'query': sql, 'read_only': False})
        require(isinstance(value, list) and len(value) == 1 and set(value[0]) == {'evidence'}, 'SQL envelope')
        result = value[0]['evidence']
        if isinstance(result, str):
            result = json.loads(result)
        require(isinstance(result, dict), 'SQL evidence type')
        return result

    def project_identity(self):
        result = self.request(PROJECT_URL, None)
        if not isinstance(result, dict):
            raise ProjectIdentityStop('PROJECT_IDENTITY_INVALID_JSON')
        if result.get('id') != REF:
            raise ProjectIdentityStop('PROJECT_IDENTITY_WRONG_PROJECT')
        if result.get('status') != 'ACTIVE_HEALTHY':
            raise ProjectIdentityStop('PROJECT_IDENTITY_UNHEALTHY')
        return {'id': result['id'], 'status': result['status']}

    def create_owner(self, fixture):
        password = secrets.token_urlsafe(48)
        try:
            result = self.request(AUTH_URL, {'email': fixture['owner_email'], 'password': password,
                'email_confirm': True, 'user_metadata': {'governed_run': fixture['run_id']}}, auth=True)
        finally:
            password = ''
        user = result.get('user', result)
        require(user.get('email') == fixture['owner_email'] and user.get('email_confirmed_at'), 'Auth owner mismatch')
        # Discard raw Auth response. No sessions, login, invite or email endpoint.
        return {'actor_id': uid(user.get('id')), 'email_confirmed': True}


def transaction(expression, readonly=True, role=None):
    return (('begin isolation level repeatable read read only;' if readonly else 'begin;') +
            "\nset local lock_timeout='5s'; set local statement_timeout='30s'; set local timezone='UTC';\n" +
            (f'set local role {role};\n' if role else '') +
            'select ' + expression + ' as evidence;\n' + ('rollback;' if readonly else 'commit;'))


def scalar_rpc(name, args):
    return f'public.{name}(' + ','.join(q(x) for x in args) + ')'


def row_rpc(name, args):
    return '(select to_jsonb(response) from ' + scalar_rpc(name, args) + ' response)'


def digest_query(table, predicate):
    return f"(select jsonb_build_object('count',count(*),'sha256',encode(sha256(convert_to(coalesce(string_agg(to_jsonb(r)::text,E'\\n' order by to_jsonb(r)::text collate \"C\"),''),'UTF8')),'hex')) from public.{table} r where {predicate})"


def preserved(business=None):
    pairs = []
    for table in FINANCIAL + COMMUNICATION + PARENTS:
        column = 'id' if table == 'businesses' else 'business_id'
        where = 'true' if business is None else f'{column} is distinct from {q(business)}::uuid'
        pairs += [q(table), digest_query(table, where)]
    for table, parent, key in [('location_settings','locations','location_id'), ('location_hours','locations','location_id'),
                               ('staff_working_hours','staff','staff_id'), ('staff_locations','staff','staff_id'),
                               ('staff_services','staff','staff_id'), ('service_locations','services','service_id'),
                               ('appointment_resources','appointments','appointment_id'), ('external_events','calendar_connections','calendar_connection_id')]:
        where = 'true' if business is None else f'not exists(select 1 from public.{parent} p where p.id=r.{key} and p.business_id={q(business)}::uuid)'
        pairs += [q(table), digest_query(table, where)]
    return 'jsonb_build_object(' + ','.join(pairs) + ')'


def cohort_census():
    return """jsonb_build_object(
      'attempts',(select count(*) from public.commerce_payment_attempts),
      'accepted',(select count(*) from public.commerce_payment_attempts where execution_state='ACCEPTED'),
      'requested',(select count(*) from public.commerce_payment_attempts where execution_state='REQUESTED'),
      'obligations',(select count(*) from public.commerce_payment_reconciliation),
      'pending',(select count(*) from public.commerce_payment_reconciliation where state='PENDING'),
      'not_required',(select count(*) from public.commerce_payment_reconciliation where state='NOT_REQUIRED'),
      'links',(select count(*) from public.commerce_payment_attempts where booking_operation_id is not null),
      'operations',(select count(*) from public.commerce_booking_operations),
      'admission',(select count(*) from public.commerce_projection_admission),
      'receipt_sequences',(select count(*) from public.commerce_receipt_sequences))"""


def identity_is_clear(item) -> str:
    # This is the complete candidate predicate from decide_business_identity:
    # business/location phone, email, website/subdomain, name+location,
    # brand+location, and business/alias requested slug.
    name = f"public.tenant_identity_key({q(item['business_name'])},'name')"
    legal = f"public.tenant_identity_key({q(item['business_name'])},'name')"
    phone = f"public.tenant_identity_key({q(item['phone'])},'phone')"
    email = f"public.tenant_identity_key({q(item['business_email'])},'email')"
    host = f"public.tenant_identity_key({q(item['website'])},'website')"
    city = f"public.tenant_identity_key({q(item['city'])},'name')"
    region = f"public.tenant_identity_key({q('ON')},'name')"
    slug = q(item["slug"])
    return f"""not exists (
      select 1 from public.businesses b where
        public.tenant_identity_key(b.phone,'phone')={phone}
        or exists (select 1 from public.locations l where l.business_id=b.id
          and public.tenant_identity_key(l.phone,'phone')={phone})
        or public.tenant_identity_key(b.email,'email')={email}
        or ({host} is not null and (
          public.tenant_identity_key(b.website,'website')={host}
          or {host} like '%.'||public.tenant_identity_key(b.website,'website')
          or public.tenant_identity_key(b.website,'website') like '%.'||{host}))
        or ((public.tenant_identity_key(b.name,'name') in ({name},{legal})
          or public.tenant_identity_key(b.legal_name,'name') in ({name},{legal}))
          and ((public.tenant_identity_key(b.city,'name')={city}
            and public.tenant_identity_key(b.state,'name')={region})
            or exists (select 1 from public.locations l where l.business_id=b.id
              and public.tenant_identity_key(l.city,'name')={city}
              and public.tenant_identity_key(l.state,'name')={region})))
        or (length({name})>=4 and length(public.tenant_identity_key(b.name,'name'))>=4
          and (position(public.tenant_identity_key(b.name,'name') in {name})>0
            or position({name} in public.tenant_identity_key(b.name,'name'))>0)
          and ((public.tenant_identity_key(b.city,'name')={city}
            and public.tenant_identity_key(b.state,'name')={region})
            or exists (select 1 from public.locations l where l.business_id=b.id
              and public.tenant_identity_key(l.city,'name')={city}
              and public.tenant_identity_key(l.state,'name')={region})))
        or (b.slug={slug} or exists (select 1 from public.business_slug_aliases a
          where a.business_id=b.id and a.slug={slug}))
    )"""


def preflight(manifest, f):
    migrations = []
    for m in manifest['hosted_migrations']:
        migrations.append(f"(select count(*)=1 from supabase_migrations.schema_migrations where (version={q(m['version'])} or name={q(m['name'])})) and exists(select 1 from supabase_migrations.schema_migrations where version={q(m['version'])} and name={q(m['name'])} and cardinality(statements)=1 and octet_length(statements[1])={m['bytes']} and encode(sha256(convert_to(statements[1],'UTF8')),'hex')={q(m['sha256'])})")
    functions = []
    for p in manifest['functions']:
        functions.append(f"exists(select 1 from pg_proc p where p.oid=to_regprocedure({q(p['signature'])}) and (select count(*) from pg_proc other where other.pronamespace=p.pronamespace and other.proname=p.proname)=1 and p.prosecdef={q(p['security_definer'])} and p.proconfig @> array[{q(p['search_path'])}] and (not p.prosecdef or exists(select 1 from pg_roles r where r.oid=p.proowner and (r.rolsuper or r.rolbypassrls))) and encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')={q(p['body_sha256'])} and (has_function_privilege('service_role',p.oid,'EXECUTE')={q(p['service_execute'])} or {q(p['service_execute'] is None)}) and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('authenticated',p.oid,'EXECUTE'))")
    privileges = []
    for table in FINANCIAL + COMMUNICATION + PARENTS:
        privileges.append(f"has_table_privilege('service_role','public.{table}','SELECT')")
    for table, cols in manifest['required_writes'].items():
        for privilege, columns in cols.items():
            for col in columns:
                privileges.append(f"has_column_privilege('service_role','public.{table}',{q(col)},{q(privilege)})")
    for table, columns in {
        'public.businesses': ('stripe_customer_id','stripe_subscription_id'),
        'public.customers': ('payment_provider_customer_id',),
        'auth.users': ('id','email','email_confirmed_at','is_anonymous','banned_until'),
        'auth.sessions': ('user_id',),
    }.items():
        for column in columns:
            privileges.append(f"has_column_privilege(current_user,{q(table)},{q(column)},'SELECT')")
    for table in ('staff_working_hours','staff_services','staff_locations','service_locations','location_settings','location_hours','appointment_resources','booking_resources'):
        privileges.append(f"has_table_privilege('service_role','public.{table}','SELECT')")
    identities = list(f['ids'].values())
    collision = []
    for table in ('customers','services','staff','commerce_booking_operations','commerce_payment_attempts'):
        collision.append(f"not exists(select 1 from public.{table} where id::text=any(array[{','.join(q(x) for x in identities)}]))")
    collision += [identity_is_clear(f), f"not exists(select 1 from public.customers where lower(email)={q(f['customer_email'])})",f"not exists(select 1 from public.commerce_payment_attempts where attempt_key={q(f['ids']['attempt_key'])}::uuid)",
        f"not exists(select 1 from auth.users where lower(email)={q(f['owner_email'])} or id={q(f['ids']['nonmember'])}::uuid)",
        f"not exists(select 1 from public.businesses where slug={q(f['slug'])} or lower(email)={q(f['business_email'])} or name={q(f['business_name'])} or phone={q(f['phone'])})",
        f"not exists(select 1 from public.business_slug_aliases where slug={q(f['slug'])})"]
    targets = FINANCIAL + PARENTS + ('location_settings','location_hours','staff_working_hours','staff_services','staff_locations','service_locations')
    signatures = ','.join('to_regprocedure('+q(p['signature'])+')' for p in manifest['functions'])
    function_evidence = f"(select jsonb_agg(jsonb_build_object('identity',p.oid::regprocedure::text,'definer',p.prosecdef,'config',p.proconfig,'owner',r.rolname,'owner_bypass',r.rolbypassrls or r.rolsuper,'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE'),'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')) order by p.oid::regprocedure::text) from pg_proc p join pg_roles r on r.oid=p.proowner where p.oid in ({signatures}))"
    versions = ','.join(q(m['version']) for m in manifest['hosted_migrations'])
    migration_evidence = f"(select jsonb_agg(jsonb_build_object('version',version,'name',name,'statement_count',cardinality(statements),'bytes',octet_length(statements[1]),'sha256',encode(sha256(convert_to(statements[1],'UTF8')),'hex')) order by version) from supabase_migrations.schema_migrations where version in ({versions}))"
    return transaction("jsonb_build_object(" +
        "'project_ref',current_setting('app.settings.project_ref',true),'database',current_database(),'session_role',session_user," +
        "'function_posture',"+function_evidence+",'hosted_migrations',"+migration_evidence+",'future_slot',("+q(f['start'])+"::timestamptz > clock_timestamp()+interval '1 hour'),"+
        "'migrations_ok',("+' and '.join(migrations)+"),'functions_ok',("+' and '.join(functions)+"),"+
        "'privileges_ok',("+' and '.join(privileges)+"),'collision_free',("+' and '.join(collision)+"),"+
        "'service_role_ok',(select not rolsuper and rolbypassrls from pg_roles where rolname='service_role'),"+
        "'browser_roles_ok',(select count(*)=3 and bool_and(not rolsuper and not rolbypassrls) from pg_roles where rolname in ('anon','authenticated','authenticator')),"+
        "'no_pg_cron',to_regclass('cron.job') is null,"+
        "'no_dispatch_trigger',not exists(select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid where not t.tgisinternal and t.tgenabled<>'D' and t.tgrelid in ("+
        ','.join(q('public.'+x)+'::regclass' for x in targets)+",'auth.users'::regclass) and lower(p.prosrc) ~ '(background_jobs|communication_send_intents|communication_follow_ups|notification_logs|communications_audit_log|communication_history|notifications|calendar_connections|external_events|http_|net\\.|webhook|resend|twilio)'),"+
        "'event_sequence_privilege',has_sequence_privilege('service_role','public.commerce_payment_attempt_events_event_sequence_seq','USAGE'),"+
        "'retained',"+cohort_census()+",'baseline',"+preserved()+")")


def capability():
    return transaction("jsonb_build_object('literal_role',current_user,'read_only',current_setting('transaction_read_only'))", role='service_role')


def provision(f, actor):
    identity = scalar_rpc('decide_business_identity', [actor,'create_new',f['business_name'],f['business_name'],
                    f['business_email'],f['phone'],f['website'],f['city'],'ON','CA',f['slug']])
    # Only normal tenant RPC creates Business/location. Containment and parents commit atomically.
    return """begin; set local lock_timeout='5s'; set local statement_timeout='30s'; set local role service_role;
do $package$
declare identity jsonb; bid uuid; loc uuid;
begin
 identity := """ + identity + f""";
 if identity->>'status' is distinct from 'created' then raise exception 'IDENTITY_NOT_CREATED'; end if;
 bid := (identity->'business'->>'id')::uuid;
 update public.businesses set currency='cad',timezone='America/Toronto',email_notifications_enabled=false,
 sms_notifications_enabled=false,owner_notifications_enabled=false,staff_notifications_enabled=false,
 marketing_email_enabled=false,online_booking_enabled=false,public_booking_mode='staff_only',notification_email=null
 where id=bid and owner_id={q(actor)}::uuid;
 if not found then raise exception 'CONTAINMENT_FAILED'; end if;
 select id into strict loc from public.locations where business_id=bid and is_default;
 update public.locations set timezone='America/Toronto',phone=null where id=loc and business_id=bid;
 insert into public.customers(id,business_id,name,email,phone) values({q(f['ids']['customer'])},bid,'Governed synthetic customer',{q(f['customer_email'])},null);
 insert into public.services(id,business_id,location_id,name,duration_minutes,price,tax_rate_bps,deposit_cents,deposit_required,is_active,online_booking,booking_visibility,commercial_settings_reviewed)
 values({q(f['ids']['service'])},bid,loc,'Governed CAD100 service',60,100,0,5000,true,true,false,'internal',true);
 insert into public.staff(id,business_id,location_id,default_location_id,name,email,phone,user_id,is_active,employment_status,accept_online_bookings,accept_new_clients,accept_walk_ins)
 values({q(f['ids']['staff'])},bid,loc,loc,'Governed synthetic staff',null,null,null,true,'active',false,false,false);
 insert into public.service_locations(service_id,location_id,is_primary) values({q(f['ids']['service'])},loc,true);
 insert into public.staff_locations(staff_id,location_id,is_primary) values({q(f['ids']['staff'])},loc,true);
 insert into public.staff_services(staff_id,service_id) values({q(f['ids']['staff'])},{q(f['ids']['service'])});
 if (select count(*) from public.business_hours where business_id=bid)<>7 or
    (select count(*) from public.location_hours where location_id=loc)<>7 or
    (select count(*) from public.location_settings where location_id=loc)<>1 or
    (select count(*) from public.staff_working_hours where staff_id={q(f['ids']['staff'])}::uuid)<>7 then
    raise exception 'NORMAL_SEED_SHAPE'; end if;
end $package$;
select jsonb_build_object('business_id',b.id,'location_id',l.id,'actor_id',b.owner_id,'slug',b.slug)
as evidence from public.businesses b join public.locations l on l.business_id=b.id and l.is_default
where b.owner_id={q(actor)}::uuid and b.slug={q(f['slug'])};
commit;"""


def snapshots(business, actor, f):
    rows = []
    for table in FINANCIAL:
        rows += [q(table), f"(select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text collate \"C\"),'[]') from public.{table} r where business_id={q(business)}::uuid)"]
    communication = ','.join(q(t)+f",(select count(*) from public.{t} where business_id={q(business)}::uuid)" for t in COMMUNICATION)
    return transaction(f"jsonb_build_object('baseline',{preserved(business)},'rows',jsonb_build_object({','.join(rows)}),"+
        f"'communication',jsonb_build_object({communication}),"+
        f"'contained',exists(select 1 from public.businesses where id={q(business)}::uuid and owner_id={q(actor)}::uuid and currency='cad' and timezone='America/Toronto' and not email_notifications_enabled and not sms_notifications_enabled and not owner_notifications_enabled and not staff_notifications_enabled and not marketing_email_enabled and not online_booking_enabled and notification_email is null and stripe_customer_id is null and stripe_subscription_id is null),"+
        f"'sessions',(select count(*) from auth.sessions where user_id={q(actor)}::uuid),"+
        f"'other_members',(select count(*) from public.business_members where business_id={q(business)}::uuid and user_id<>{q(actor)}::uuid),"+
        f"'other_admission',(select count(*) from public.commerce_projection_admission where business_id<>{q(business)}::uuid),"+
        f"'other_writers',(select count(*) from pg_stat_activity where pid<>pg_backend_pid() and state<>'idle' and (query like '%'||{q(business)}||'%' or query like '%'||{q(actor)}||'%')),"+
        f"'customer_provider_absent',exists(select 1 from public.customers where id={q(f['ids']['customer'])}::uuid and business_id={q(business)}::uuid and payment_provider_customer_id is null))")


def check_snapshot(result, baseline):
    require(result['baseline'] == baseline, 'non-synthetic retained rows changed')
    require(result['contained'] is True and result['customer_provider_absent'] is True, 'containment flags')
    require(result['sessions'] == result['other_members'] == result['other_admission'] == result['other_writers'] == 0, 'writer/admission isolation')
    require(all(value == 0 for value in result['communication'].values()), 'communication side effects')


def fingerprints(f, ids):
    # Exact accepted canonical arrays: UTF-8 compact JSON, array order preserved.
    customer = ['chasum.booking-customer-input',1,'existing',f['ids']['customer'],None,None,None]
    booking = ['chasum.booking-operation',1,ids['business_id'],f['ids']['customer'],ids['location_id'],
               f['ids']['service'],f['ids']['staff'],f['start'],f['end'],'confirmed',60,None,[],None,None,
               10000,0,5000,'deposit',None,None,False]
    payment = ['chasum.payment-attempt',1,ids['business_id'],f['ids']['customer'],'booking_operation',
               f['ids']['operation'],5000,'cad','e_transfer','deposit','manual',None]
    return ['v1:'+sha(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()) for x in (booking,payment,customer)]


def booking_args(f, ids):
    return [ids['business_id'], f['ids']['operation'], f['ids']['attempt_key'], ids['actor_id'], 'booking_sheet',
            *fingerprints(f,ids), 'existing', f['ids']['customer'],None,None,None,None,ids['location_id'],
            f['ids']['service'],f['ids']['staff'],f['start'],f['end'],'confirmed',60,None, # resources injected below
            ]


def bootstrap(f, ids):
    args = booking_args(f,ids)
    # Empty typed UUID array is SQL syntax, never user-controlled SQL.
    tail = [None,None,10000,0,5000,'deposit',None,None,False,'deposit',5000,'cad','e_transfer','manual']
    call = 'public.bootstrap_booking_operation_v1(' + ','.join(q(x) for x in args) + ",array[]::uuid[]," + ','.join(q(x) for x in tail)+')'
    return transaction('(select to_jsonb(r) from '+call+' r)',False,'service_role')


def persist(f, ids):
    args = [ids['business_id'],f['ids']['operation'],ids['actor_id'],f['ids']['customer'],ids['location_id'],
            f['ids']['service'],f['ids']['staff'],f['start'],f['end'],'confirmed',60,None,None]
    tail = [None,None,10000,0,5000]
    call = 'public.persist_booking_operation_appointment_v1('+','.join(q(x) for x in args)+',array[]::uuid[],'+','.join(q(x) for x in tail)+')'
    return transaction('(select to_jsonb(r) from '+call+' r)',False,'service_role')


def readers(f, ids):
    return transaction("jsonb_build_object('payment',"+scalar_rpc('read_payment_observability_v1',
        [ids['business_id'],ids['actor_id'],'one',ids['attempt_id'],None,1])+",'booking',"+
        row_rpc('read_booking_operations_v1',[ids['business_id'],ids['actor_id'],'one',f['ids']['operation'],None,None,None,1])+")",role='service_role')


def check_readers(result, f, ids, state, recorded):
    payment = result['payment']; require(payment['business_id']==ids['business_id'] and len(payment['rows'])==1,'reader scope')
    row = payment['rows'][0]
    require(row['attempt_id']==ids['attempt_id'] and row['operator_state']==state, 'operator truth')
    require(row['attempt_key']==f['ids']['attempt_key'] and row['booking_operation_id']==f['ids']['operation'], 'reader identity')
    payload = result['booking']['payload']
    require(payload['found'] is True and payload['operation']['id']==f['ids']['operation'] and payload['attempt']['id']==ids['attempt_id'], 'booking reader identity')
    require(payload['appointment']['id']==ids['appointment_id'] and payload['ledger_count']==int(recorded),'booking reader ledger')
    require(payload['appointment_count']==payload['attempt_count']==1,'reader cardinality')
    expect_fields(payload['attempt'],{'execution_state':'ACCEPTED' if recorded else 'REQUESTED','recovery_disposition':'RECOVER','appointment_id':ids['appointment_id'],'booking_operation_id':f['ids']['operation']},'reader recoverability')
    expect_fields(row,{'appointment_id':ids['appointment_id'],'amount_cents':5000,'currency':'cad','method':'e_transfer','payment_kind':'deposit','provider_route':'manual','communication_eligibility':'NOT_IMPLEMENTED'},'reader commercial truth')
    if recorded:
        require(row['ledger']['id']==payload['ledger']['id']==ids['transaction_id'],'reader canonical ledger')
    encoded=canon(result)
    for value in (f['owner_email'],f['business_email'],f['customer_email'],f['business_name'],f['phone']):
        require(value not in encoded,'reader PII value')
    for forbidden in ('email','phone','name','metadata','body_text','request_fingerprint','provider_reference','provider_payment_intent_id','customer_email','customer_name','appointment_notes','payment_note'):
        require('"'+forbidden+'"' not in canon(result),'reader private field')


def expect_fields(row, expected, label):
    require(all(row.get(k)==v for k,v in expected.items()),label)


def truth(rows, f, ids, complete):
    def one(table):
        require(len(rows[table])==1,'singleton '+table)
        return rows[table][0]
    for table, values in rows.items():
        require(all(x['business_id']==ids['business_id'] for x in values),'synthetic tenant boundary '+table)
    ap = one('appointments'); attempt=one('commerce_payment_attempts'); tx=one('commerce_transactions')
    op=one('commerce_booking_operations')
    expect_fields(op,{'id':f['ids']['operation'],'actor_id':ids['actor_id'],'source':'booking_sheet','payment_mode':'deposit','customer_id':f['ids']['customer']},'operation truth')
    expect_fields(attempt,{'id':ids['attempt_id'],'execution_state':'ACCEPTED','attempt_key':f['ids']['attempt_key'],'booking_operation_id':op['id'],'amount_cents':5000,'currency':'cad','method':'e_transfer','payment_kind':'deposit','provider_route':'manual','appointment_id':ids['appointment_id'],'customer_id':f['ids']['customer'],'recovery_disposition':'RECOVER','failure_class':None,'failure_code':None},'attempt truth')
    expect_fields(tx,{'id':ids['transaction_id'],'payment_attempt_id':ids['attempt_id'],'business_id':ids['business_id'],'customer_id':f['ids']['customer'],'appointment_id':ids['appointment_id'],'amount_cents':5000,'currency':'cad','kind':'deposit','method':'e_transfer','provider':'manual','status':'succeeded','provider_reference':'manual-booking-operation:'+ids['attempt_id'],'provider_payment_intent_id':None,'created_by':ids['actor_id']},'ledger truth')
    expect_fields(ap,{'id':ids['appointment_id'],'booking_operation_id':op['id'],'business_id':ids['business_id'],'customer_id':f['ids']['customer'],'location_id':ids['location_id'],'service_id':f['ids']['service'],'staff_id':f['ids']['staff'],'price_cents':10000,'tax_cents':0,'deposit_cents':5000,'amount_paid_cents':5000 if complete else 0,'amount_refunded_cents':0,'payment_status':'deposit_paid' if complete else 'deposit_required'},'appointment truth')
    obligations=rows['commerce_payment_reconciliation']
    require(len(obligations)==4 and {x['projection_kind'] for x in obligations}==set(PROJECTORS),'obligation identities')
    require(all(x['attempt_id']==ids['attempt_id'] and x['state']==('COMPLETE' if complete else 'PENDING') for x in obligations),'obligation state')
    events=rows['commerce_payment_attempt_events']
    require(all(e['attempt_id']==ids['attempt_id'] and e['failure_class'] is None and e['failure_code'] is None for e in events),'event scope')
    require(len(events)==(6 if complete else 2) and sum(x['event_type']=='REQUESTED' for x in events)==1 and sum(x['event_type']=='ACCEPTED' for x in events)==1,'event census')
    require(not rows['commerce_refunds'],'no refunds')
    if not complete:
        require(all(not rows[t] for t in ('commerce_invoices','commerce_invoice_lines','commerce_invoice_sequences','commerce_receipts','commerce_receipt_sequences','customer_payment_events')),'no premature projections')
        return
    invoice=one('commerce_invoices'); line=one('commerce_invoice_lines'); crm=one('customer_payment_events'); receipt=one('commerce_receipts')
    expect_fields(invoice,{'appointment_id':ap['id'],'customer_id':f['ids']['customer'],'invoice_number':'INV-0001','currency':'cad','subtotal_cents':10000,'tax_cents':0,'total_cents':10000,'amount_paid_cents':5000,'amount_refunded_cents':0,'balance_cents':5000,'status':'partial'},'invoice truth')
    expect_fields(line,{'invoice_id':invoice['id'],'description':'Appointment','quantity':1,'unit_amount_cents':10000,'tax_cents':0,'discount_cents':0,'total_cents':10000},'invoice line')
    require(tx['invoice_id']==invoice['id'],'transaction invoice link')
    expect_fields(crm,{'transaction_id':tx['id'],'customer_id':tx['customer_id'],'appointment_id':ap['id'],'amount_cents':5000,'currency':'cad','method':'e_transfer','provider':'manual','status':'paid','occurred_at':tx['occurred_at']},'CRM truth')
    expect_fields(receipt,{'transaction_id':tx['id'],'customer_id':tx['customer_id'],'receipt_number':'RCT-0001','amount_cents':5000,'currency':'cad','method':'e_transfer','email_status':'not_sent','emailed_at':None,'invoice_id':None,'body_text':f"Transaction {tx['id']}: 5000 CAD cents; e_transfer"},'receipt truth')
    expect_fields(one('commerce_invoice_sequences'),{'next_number':2,'prefix':'INV'},'invoice sequence')
    expect_fields(one('commerce_receipt_sequences'),{'next_number':2,'prefix':'RCT'},'receipt sequence')
    require({e['projection_kind'] for e in events if e['event_type']=='PROJECTION_CHANGED'}==set(PROJECTORS),'projection events')


def negatives(f, ids):
    # Expected denial is caught inside a READ ONLY transaction. No full error text retained.
    calls=[scalar_rpc('read_payment_observability_v1',[ids['business_id'],f['ids']['nonmember'],'one',ids['attempt_id'],None,1]),
           scalar_rpc('read_booking_operations_v1',[ids['business_id'],f['ids']['nonmember'],'one',f['ids']['operation'],None,None,None,1])]
    blocks=[]
    for call in calls:
        blocks.append("begin perform "+call+"; raise exception 'EXPECTED_AUTHORIZATION_DENIAL'; exception when insufficient_privilege then null; end;")
    return "begin read only; set local statement_timeout='15s'; set local role service_role; do $negative$ begin "+''.join(blocks)+" end $negative$; select jsonb_build_object('both_denied',true,'sqlstate','42501') as evidence; rollback;"


class Run:
    def __init__(self, manifest, fixture, transport, evidence):
        self.m=manifest; self.f=fixture; self.db=transport; self.e=evidence
        self.writes=False; self.calls=set(); self.baseline=None; self.ids={}; self.last_phase=None

    def sql(self,label,sql,write=False):
        require(label not in self.calls,'phase re-entry refused'); self.calls.add(label); self.last_phase=label
        self.e.record(label+':dispatch',{'sql_sha256':sha(sql.encode()),'mutation_possible':write})
        if write:
            self.writes=True  # Before sending: timeouts and lost replies are uncertain writes.
        result=self.db.sql(sql)
        self.e.record(label+':response',result)
        return result

    def snapshot(self,label):
        result=self.sql(label,snapshots(self.ids['business_id'],self.ids['actor_id'],self.f))
        check_snapshot(result,self.baseline)
        return result

    def execute(self):
        try:
            self._execute()
            self.e.record('final',{'status':'CONNECTED_BACKEND_PASS','hosted_validation_run':True})
            return 'CONNECTED_BACKEND_PASS'
        except Exception as error:
            status='STOP_AFTER_WRITES' if self.writes else 'STOP_ZERO_WRITES'
            diagnostic = ({'reason_code': error.reason_code} if isinstance(error, ProjectIdentityStop)
                          and self.last_phase == 'project-identity' and not self.writes else {})
            self.e.record('stop',{**diagnostic,'status':status,'last_phase':self.last_phase,'reason':str(error) if isinstance(error,Stop) else 'unexpected response/transport/schema error',
                'admission_may_remain_enabled':self.writes,'automatic_retry':False,
                'action':'Preserve state. Separate governed containment/reconciliation required. No automatic repair.'})
            return status

    def _execute(self):
        f=self.f
        p=self.sql('zero-write-preflight',preflight(self.m,f))
        # Some Supabase installations omit the optional GUC. Fixed project route plus
        # exact hosted chain is mandatory; a present contradictory GUC always aborts.
        require(p['project_ref'] in (None,'',REF) and p['database']=='postgres','project identity')
        for key in ('future_slot','migrations_ok','functions_ok','privileges_ok','collision_free','service_role_ok','browser_roles_ok','no_pg_cron','no_dispatch_trigger','event_sequence_privilege'):
            require(p[key] is True,'preflight '+key)
        require(p['retained']=={'attempts':6,'accepted':4,'requested':2,'obligations':16,'pending':15,'not_required':1,'links':0,'operations':0,'admission':0,'receipt_sequences':0},'retained census')
        self.baseline=p['baseline']
        require(self.sql('literal-service-role',capability())=={'literal_role':'service_role','read_only':'on'},'literal role')
        self.last_phase='project-identity'
        self.e.record('project-identity', self.db.project_identity())
        self.last_phase='owner'
        self.e.record('owner:dispatch',{'email':f['owner_email']})
        self.writes=True
        owner=self.db.create_owner(f); self.e.record('owner:response',owner)
        actor=uid(owner['actor_id'])
        # Auth SQL confirmation is independent of the Auth API response, before tenant create.
        check=self.sql('owner:verify',transaction(f"jsonb_build_object('valid',exists(select 1 from auth.users where id={q(actor)}::uuid and email={q(f['owner_email'])} and email_confirmed_at is not null and not is_anonymous and (banned_until is null or banned_until<now())),'sessions',(select count(*) from auth.sessions where user_id={q(actor)}::uuid),'memberships',(select count(*) from public.business_members where user_id={q(actor)}::uuid))"))
        require(check=={'valid':True,'sessions':0,'memberships':0},'new owner not isolated')
        self.ids=self.sql('provision-contained',provision(f,actor),True)
        for k in ('business_id','location_id','actor_id'): uid(self.ids[k])
        require(self.ids['actor_id']==actor and self.ids['slug']==f['slug'],'provision identity')
        initial=self.snapshot('pre-admission-baseline')
        require(all(not rows for rows in initial['rows'].values()),'synthetic financial prestate nonempty')
        # The just-recorded non-synthetic baseline equals the zero-write baseline.
        enabled=self.sql('admission-enable',transaction(scalar_rpc('set_payment_projection_admission_v1',[self.ids['business_id'],True]),False,'service_role'),True)
        require(enabled['business_id']==self.ids['business_id'] and enabled['enabled'] is True and enabled['watermark'],'admission enable')
        boot=self.sql('bootstrap',bootstrap(f,self.ids),True)
        require(boot['outcome']=='ADMITTED' and boot['operation_id']==f['ids']['operation'] and boot['customer_id']==f['ids']['customer'] and boot['execution_state']=='REQUESTED','bootstrap result')
        self.ids['attempt_id']=uid(boot['attempt_id'])
        ap=self.sql('persist',persist(f,self.ids),True)
        require(ap['outcome']=='CREATED' and ap['operation_id']==f['ids']['operation'],'persist result')
        self.ids['appointment_id']=uid(ap['appointment_id'])
        bound=self.sql('bind',transaction(row_rpc('bind_booking_operation_appointment_v1',[self.ids['business_id'],f['ids']['operation'],actor,self.ids['appointment_id']]),False,'service_role'),True)
        require(bound=={'outcome':'BOUND','operation_id':f['ids']['operation'],'appointment_id':self.ids['appointment_id'],'attempt_id':self.ids['attempt_id']},'bind result')
        before=self.snapshot('before-money')
        require(len(before['rows']['commerce_payment_attempts'])==1 and not before['rows']['commerce_transactions'] and not before['rows']['commerce_payment_reconciliation'],'pre-money durable truth')
        pending=before['rows']['commerce_payment_attempts'][0]
        expect_fields(pending,{'id':self.ids['attempt_id'],'business_id':self.ids['business_id'],'booking_operation_id':f['ids']['operation'],'appointment_id':self.ids['appointment_id'],'execution_state':'REQUESTED','recovery_disposition':'RECOVER','amount_cents':5000,'currency':'cad','failure_class':None,'failure_code':None},'recoverable pre-money attempt')
        require(len(before['rows']['appointments'])==len(before['rows']['commerce_booking_operations'])==len(before['rows']['commerce_payment_attempt_events'])==1,'pre-money identity cardinality')
        require(all(not before['rows'][t] for t in ('commerce_invoices','commerce_invoice_lines','commerce_invoice_sequences','commerce_receipts','commerce_receipt_sequences','customer_payment_events','commerce_refunds')),'pre-money projections absent')
        created=pending['created_at']
        require(datetime.fromisoformat(created.replace('Z','+00:00'))>datetime.fromisoformat(enabled['watermark'].replace('Z','+00:00')),'attempt not strictly after watermark')
        check_readers(self.sql('read-before-money',readers(f,self.ids)),f,self.ids,'PAYMENT_RECOVERY_REQUIRED',False)
        commit_args=[self.ids['business_id'],f['ids']['operation'],actor,self.ids['attempt_id']]
        money=self.sql('money-commit',transaction(row_rpc('commit_booking_operation_manual_payment_v1',commit_args),False,'service_role'),True)
        require(money['outcome']=='RECORDED' and money['recorded'] is True and money['attempt_id']==self.ids['attempt_id'] and money['synchronization']=='PENDING','money result')
        self.ids['transaction_id']=uid(money['transaction_id'])
        truth(self.snapshot('after-money')['rows'],f,self.ids,False)
        check_readers(self.sql('read-after-money',readers(f,self.ids)),f,self.ids,'RECORDED_BUT_NOT_FULLY_SYNCHRONIZED',True)
        for kind in PROJECTORS:
            result=self.sql('project:'+kind,transaction(scalar_rpc('project_payment_'+kind+'_v1',[self.ids['business_id'],self.ids['attempt_id']]),False,'service_role'),True)
            require(result['outcome']=='APPLIED' and result['state']=='COMPLETE' and result['attempt_id']==self.ids['attempt_id'] and result['business_id']==self.ids['business_id'],'project result')
            self.snapshot('containment:'+kind)
        complete=self.snapshot('complete'); truth(complete['rows'],f,self.ids,True)
        check_readers(self.sql('read-complete',readers(f,self.ids)),f,self.ids,'RECORDED',True)
        self.e.record('replay:before-digest',{'sha256':sha(canon(complete['rows']).encode())})
        replay=self.sql('replay-bootstrap',bootstrap(f,self.ids),True)
        require(replay['outcome']=='EXISTING' and replay['operation_id']==f['ids']['operation'] and replay['attempt_id']==self.ids['attempt_id'],'bootstrap replay')
        replay=self.sql('replay-persist',persist(f,self.ids),True)
        require(replay=={'outcome':'EXISTING','operation_id':f['ids']['operation'],'appointment_id':self.ids['appointment_id']},'persist replay')
        replay=self.sql('replay-bind',transaction(row_rpc('bind_booking_operation_appointment_v1',commit_args[:3]+[self.ids['appointment_id']]),False,'service_role'),True)
        require(replay=={'outcome':'EXISTING','operation_id':f['ids']['operation'],'appointment_id':self.ids['appointment_id'],'attempt_id':self.ids['attempt_id']},'bind replay')
        replay=self.sql('replay-money',transaction(row_rpc('commit_booking_operation_manual_payment_v1',commit_args),False,'service_role'),True)
        require(replay=={**money,'outcome':'REPLAY'},'money replay identity')
        for kind in PROJECTORS:
            result=self.sql('verify:'+kind,transaction(scalar_rpc('project_payment_'+kind+'_v1',[self.ids['business_id'],self.ids['attempt_id']]),False,'service_role'),True)
            require(result['outcome']=='VERIFIED' and result['state']=='COMPLETE','terminal verification')
        replayed=self.snapshot('replayed')
        require(replayed['rows']==complete['rows'],'replay mutated synthetic targets')
        self.e.record('replay:after-digest',{'sha256':sha(canon(replayed['rows']).encode())})
        require(self.sql('authorization-negative',negatives(f,self.ids))=={'both_denied':True,'sqlstate':'42501'},'negative result')
        check_readers(self.sql('read-final',readers(f,self.ids)),f,self.ids,'RECORDED',True)
        disabled=self.sql('admission-disable',transaction(scalar_rpc('set_payment_projection_admission_v1',[self.ids['business_id'],False]),False,'service_role'),True)
        require(disabled=={**enabled,'enabled':False},'disable/watermark preservation')
        final=self.snapshot('final-reconciliation'); truth(final['rows'],f,self.ids,True)
        admission=final['rows'].pop('commerce_projection_admission')
        require(len(admission)==1 and admission[0]['enabled'] is False and admission[0]['admit_attempts_created_after']==enabled['watermark'],'durable admission containment')
        require(final['rows']=={k:v for k,v in complete['rows'].items() if k!='commerce_projection_admission'},'final financial preservation')


def main(argv=None):
    parser=argparse.ArgumentParser(description='PREPARED ONLY. Separate exact-package PO execution approval required.')
    parser.add_argument('--execute',action='store_true')
    parser.add_argument('--package-sha'); parser.add_argument('--run-id'); parser.add_argument('--project-ref')
    parser.add_argument('--writer-quiescence-confirmed',action='store_true')
    args=parser.parse_args(argv)
    if not args.execute:
        print('REFUSED: explicit execution gate absent'); return 2
    runner=None
    try:
        require(args.writer_quiescence_confirmed,'external writer hold attestation absent')
        root=Path(__file__).resolve().parent
        manifest,fixture=load_package(root,args.package_sha,args.run_id,args.project_ref)
        # Credentials are read only after all offline gates; never from files.
        token=os.environ.get('HV133_STAGING_MANAGEMENT_TOKEN','')
        key=os.environ.get('HV133_STAGING_SERVICE_ROLE_KEY','')
        require(len(token)>=20 and len(key)>=20,'required scoped credentials absent')
        evidence=Evidence(Path(manifest['evidence_parent'])/manifest['run_id'],(token,key))
        evidence.record('package',{'aggregate_sha256':args.package_sha,'run_id':args.run_id,'project_ref':REF,'manifest':manifest})
        runner=Run(manifest,fixture,Transport(token,key),evidence)
        result=runner.execute()
        print(result)
        return 0 if result=='CONNECTED_BACKEND_PASS' else 1
    except Exception:
        if runner is not None:
            print('STOP_AFTER_WRITES' if runner.writes else 'STOP_ZERO_WRITES')
            print('Evidence recording may be incomplete. Preserve state; do not retry.')
        else:
            print('REFUSED: offline binding/credential/evidence gate failed; no hosted execution started')
        return 2


if __name__=='__main__':
    sys.exit(main())
