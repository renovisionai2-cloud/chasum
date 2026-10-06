"""SQL builders for the prepared-only HV134 retained-cohort continuation."""

from __future__ import annotations

import hashlib
import json
from typing import Any

SEQUENCE = "public.commerce_payment_attempt_events_event_sequence_seq"


def q(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if not isinstance(value, str) or "\x00" in value:
        raise ValueError("unsupported SQL literal")
    return "'" + value.replace("'", "''") + "'"


def intent_fingerprint(
    business_id: str, customer_id: str, appointment_id: str | None, item: dict[str, Any]
) -> str:
    value = [
        "chasum.payment-attempt",
        1,
        business_id,
        customer_id,
        "appointment" if appointment_id else "customer",
        appointment_id,
        item["amount_cents"],
        item["currency"],
        item["method"],
        item["payment_kind"],
        item["provider_route"],
        None,
    ]
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return "v1:" + hashlib.sha256(encoded).hexdigest()


def _ids(manifest: dict[str, Any]) -> dict[str, str]:
    scope = manifest["scope"]
    return {
        "actor_a": scope["actors"]["a"],
        "actor_b": scope["actors"]["b"],
        "business_a": scope["businesses"]["a"],
        "business_b": scope["businesses"]["b"],
        "location_a": scope["locations"]["a"],
        "location_b": scope["locations"]["b"],
        "customer_a1": scope["customers"]["a1"],
        "customer_a2": scope["customers"]["a2"],
        "customer_b1": scope["customers"]["b1"],
        "appointment_a1": scope["appointments"]["a1"],
        "appointment_a2": scope["appointments"]["a2"],
        "service": scope["service"],
        "staff": scope["staff"],
    }


def _attempt_keys(manifest: dict[str, Any], include_new: bool = True) -> list[str]:
    keys = [row["attempt_key"] for row in manifest["retained_financial"].values()]
    if include_new:
        keys.extend(row["attempt_key"] for row in manifest["new_scope"].values())
    return keys


def _digest(query: str, order_by: str = "row_to_json(x)::text") -> str:
    return (
        "(select jsonb_build_array(count(*)::text,"
        "md5(coalesce(string_agg(row_to_json(x)::text,'|' "
        f"order by {order_by}),''))) "
        f"from ({query}) x)"
    )


def snapshot_expression(manifest: dict[str, Any]) -> str:
    i = _ids(manifest)
    businesses = f"{q(i['business_a'])}::uuid,{q(i['business_b'])}::uuid"
    actors = f"{q(i['actor_a'])}::uuid,{q(i['actor_b'])}::uuid"
    locations = f"{q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid"
    customers = (
        f"{q(i['customer_a1'])}::uuid,{q(i['customer_a2'])}::uuid,"
        f"{q(i['customer_b1'])}::uuid"
    )
    appointments = f"{q(i['appointment_a1'])}::uuid,{q(i['appointment_a2'])}::uuid"
    retained_keys = ",".join(
        q(row["attempt_key"]) for row in manifest["retained_financial"].values()
    )
    parts = {
        "businesses": _digest(f"select * from public.businesses where id in ({businesses})"),
        "business_hours": _digest(
            f"select * from public.business_hours where business_id in ({businesses})"
        ),
        "locations": _digest(f"select * from public.locations where id in ({locations})"),
        "location_settings": _digest(
            f"select * from public.location_settings where location_id in ({locations})"
        ),
        "location_hours": _digest(
            f"select * from public.location_hours where location_id in ({locations})"
        ),
        "identity_decisions": _digest(
            f"select * from public.tenant_identity_decisions where actor_user_id in ({actors})"
        ),
        "customers": _digest(f"select * from public.customers where id in ({customers})"),
        "services": _digest(f"select * from public.services where id={q(i['service'])}::uuid"),
        "staff": _digest(f"select * from public.staff where id={q(i['staff'])}::uuid"),
        "staff_working_hours": _digest(
            f"select * from public.staff_working_hours where staff_id={q(i['staff'])}::uuid"
        ),
        "service_locations": _digest(
            f"select * from public.service_locations where service_id={q(i['service'])}::uuid"
        ),
        "staff_locations": _digest(
            f"select * from public.staff_locations where staff_id={q(i['staff'])}::uuid"
        ),
        "staff_services": _digest(
            f"select * from public.staff_services where staff_id={q(i['staff'])}::uuid"
        ),
        "appointments": _digest(
            f"select * from public.appointments where id in ({appointments})"
        ),
        "attempts": _digest(
            "select * from public.commerce_payment_attempts "
            f"where business_id={q(i['business_a'])}::uuid and attempt_key in ({retained_keys})"
        ),
        "events": _digest(
            "select event_row.* from public.commerce_payment_attempt_events event_row "
            "join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id "
            f"where attempt.business_id={q(i['business_a'])}::uuid "
            f"and attempt.attempt_key in ({retained_keys})"
        ),
        "ledgers": _digest(
            "select tx.* from public.commerce_transactions tx "
            "join public.commerce_payment_attempts attempt on attempt.id=tx.payment_attempt_id "
            f"where attempt.business_id={q(i['business_a'])}::uuid "
            f"and attempt.attempt_key in ({retained_keys})"
        ),
        "obligations": _digest(
            "select obligation.* from public.commerce_payment_reconciliation obligation "
            "join public.commerce_payment_attempts attempt on attempt.id=obligation.attempt_id "
            f"where attempt.business_id={q(i['business_a'])}::uuid "
            f"and attempt.attempt_key in ({retained_keys})"
        ),
    }
    args: list[str] = []
    for name, expression in parts.items():
        args.extend((q(name), expression))
    return "jsonb_build_object(" + ",".join(args) + ")"


def noncohort_expression(manifest: dict[str, Any]) -> str:
    i = _ids(manifest)
    businesses = f"{q(i['business_a'])}::uuid,{q(i['business_b'])}::uuid"
    customers = (
        f"{q(i['customer_a1'])}::uuid,{q(i['customer_a2'])}::uuid,"
        f"{q(i['customer_b1'])}::uuid"
    )
    appointments = f"{q(i['appointment_a1'])}::uuid,{q(i['appointment_a2'])}::uuid"
    keys = ",".join(q(value) for value in _attempt_keys(manifest))
    parts = {
        "businesses": _digest(
            f"select * from public.businesses where id not in ({businesses})", "x.id"
        ),
        "customers": _digest(
            f"select * from public.customers where id not in ({customers})", "x.id"
        ),
        "appointments": _digest(
            f"select * from public.appointments where id not in ({appointments})", "x.id"
        ),
        "commerce_transactions": _digest(
            "select tx.* from public.commerce_transactions tx where not exists ("
            "select 1 from public.commerce_payment_attempts attempt "
            "where attempt.id=tx.payment_attempt_id "
            f"and attempt.business_id={q(i['business_a'])}::uuid "
            f"and attempt.attempt_key in ({keys}))",
            "x.id",
        ),
    }
    args: list[str] = []
    for name, expression in parts.items():
        args.extend((q(name), expression))
    return "jsonb_build_object(" + ",".join(args) + ")"


def preflight_sql(manifest: dict[str, Any]) -> str:
    i = _ids(manifest)
    applied = manifest["applied_identity"]
    retained = manifest["retained_financial"]
    c1_key = manifest["new_scope"]["c1"]["attempt_key"]
    n1_key = manifest["new_scope"]["n1"]["attempt_key"]
    retained_keys = ",".join(q(row["attempt_key"]) for row in retained.values())
    retained_ids = ",".join(q(row["attempt_id"]) + "::uuid" for row in retained.values())
    ledger_ids = ",".join(
        q(row["ledger_id"]) + "::uuid" for row in retained.values() if row["ledger_id"]
    )
    expected_rows = []
    for row in retained.values():
        expected_rows.append(
            "("
            + ",".join(
                (
                    q(row["attempt_id"]) + "::uuid",
                    q(row["attempt_key"]) + "::uuid",
                    q(row["source"]),
                    q(i["customer_" + row["customer"]]) + "::uuid",
                    q(i["appointment_" + row["appointment"]]) + "::uuid",
                    q(row["payment_kind"]),
                    str(row["amount_cents"]),
                    q(row["method"]),
                    q(row["state"]),
                    (q(row["ledger_id"]) + "::uuid") if row["ledger_id"] else "NULL::uuid",
                )
            )
            + ")"
        )
    expected_values = ",".join(expected_rows)
    businesses = f"{q(i['business_a'])}::uuid,{q(i['business_b'])}::uuid"
    actors = f"{q(i['actor_a'])}::uuid,{q(i['actor_b'])}::uuid"
    return f"""
begin;
set transaction read only;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local timezone='UTC';
select jsonb_build_object(
 'protocol','hv134-c01-v1',
 'backend_identity',jsonb_build_object(
   'pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user),
 'transaction_read_only',current_setting('transaction_read_only')='on',
 'server17',current_setting('server_version_num')::integer between 170000 and 179999,
 'observer_exact',session_user={q(manifest['project']['observer_role'])}
   and current_user={q(manifest['project']['observer_role'])},
 'observer_capable',(
   select rolsuper or pg_has_role(oid,'pg_read_all_stats','USAGE')
   from pg_roles where rolname=current_user
 ),
 'writer_set_capable',pg_has_role(current_user,{q(manifest['project']['writer_role'])},'SET'),
 'foundation_identity',exists(
   select 1 from supabase_migrations.schema_migrations
   where version={q(applied['foundation']['version'])}
     and name={q(applied['foundation']['name'])}
     and octet_length(statements[1])=15667
     and encode(sha256(convert_to(statements[1],'UTF8')),'hex')
       ={q(applied['foundation']['sql_sha256'])}
 ),
 'r1a_identity',exists(
   select 1 from supabase_migrations.schema_migrations
   where version={q(applied['r1a']['version'])}
     and name={q(applied['r1a']['name'])}
     and octet_length(statements[1])=16151
     and encode(sha256(convert_to(statements[1],'UTF8')),'hex')
       ={q(applied['r1a']['sql_sha256'])}
 ),
 'admit_body_identity',(
   select encode(sha256(convert_to(prosrc,'UTF8')),'hex')
     ={q(applied['r1a']['admit_body_sha256'])}
     and not prosecdef and proconfig=array['search_path=pg_catalog, pg_temp']
   from pg_proc where oid=
     'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)'::regprocedure
 ),
 'commit_body_identity',(
   select encode(sha256(convert_to(prosrc,'UTF8')),'hex')
     ={q(applied['r1a']['commit_body_sha256'])}
     and not prosecdef and proconfig=array['search_path=pg_catalog, pg_temp']
   from pg_proc where oid=
     'public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure
 ),
 'function_acl',
   has_function_privilege('service_role',
     'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)',
     'EXECUTE')
   and has_function_privilege('service_role',
     'public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE')
   and not has_function_privilege('public',
     'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)',
     'EXECUTE')
   and not has_function_privilege('anon',
     'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)',
     'EXECUTE')
   and not has_function_privilege('authenticated',
     'public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)',
     'EXECUTE')
   and not has_function_privilege('public',
     'public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE')
   and not has_function_privilege('anon',
     'public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE')
   and not has_function_privilege('authenticated',
     'public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE'),
 'rls_enabled',(
   select count(*)=3 from pg_class
   where oid in (
     'public.commerce_payment_attempts'::regclass,
     'public.commerce_payment_attempt_events'::regclass,
     'public.commerce_payment_reconciliation'::regclass)
     and relrowsecurity
 ),
 'writer_acl',
   has_table_privilege('service_role','public.commerce_payment_attempts','SELECT')
   and has_table_privilege('service_role','public.commerce_payment_attempts','INSERT')
   and has_column_privilege('service_role','public.commerce_payment_attempts','execution_state','UPDATE')
   and has_table_privilege('service_role','public.commerce_payment_attempt_events','SELECT')
   and has_table_privilege('service_role','public.commerce_payment_attempt_events','INSERT')
   and has_sequence_privilege('service_role',{q(SEQUENCE)},'USAGE')
   and has_table_privilege('service_role','public.commerce_transactions','SELECT')
   and has_table_privilege('service_role','public.commerce_transactions','INSERT')
   and has_table_privilege('service_role','public.commerce_payment_reconciliation','SELECT')
   and has_table_privilege('service_role','public.commerce_payment_reconciliation','INSERT'),
 'exact_auth',(
   select count(*)=2 from auth.users where id in ({actors})
 ) and (
   select count(*)=2 from auth.identities where user_id in ({actors}) and provider='email'
 ),
 'exact_parent_counts',jsonb_build_object(
   'businesses',(select count(*) from public.businesses where id in ({businesses})),
   'business_hours',(select count(*) from public.business_hours where business_id in ({businesses})),
   'locations',(select count(*) from public.locations where id in ({q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid)),
   'location_settings',(select count(*) from public.location_settings where location_id in ({q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid)),
   'location_hours',(select count(*) from public.location_hours where location_id in ({q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid)),
   'identity_decisions',(select count(*) from public.tenant_identity_decisions where actor_user_id in ({actors})),
   'customers',(select count(*) from public.customers where id in ({q(i['customer_a1'])}::uuid,{q(i['customer_a2'])}::uuid,{q(i['customer_b1'])}::uuid)),
   'services',(select count(*) from public.services where id={q(i['service'])}::uuid),
   'staff',(select count(*) from public.staff where id={q(i['staff'])}::uuid),
   'staff_hours',(select count(*) from public.staff_working_hours where staff_id={q(i['staff'])}::uuid),
   'service_locations',(select count(*) from public.service_locations where service_id={q(i['service'])}::uuid),
   'staff_locations',(select count(*) from public.staff_locations where staff_id={q(i['staff'])}::uuid),
   'staff_services',(select count(*) from public.staff_services where staff_id={q(i['staff'])}::uuid),
   'appointments',(select count(*) from public.appointments where id in ({q(i['appointment_a1'])}::uuid,{q(i['appointment_a2'])}::uuid))
 ),
 'retained_attempts_exact',(
   select count(*)=4
     and count(*) filter(where id in ({retained_ids}))=4
     and count(*) filter(where execution_state='ACCEPTED')=3
     and count(*) filter(where execution_state='REQUESTED')=1
     and sum(amount_cents)=19300
   from public.commerce_payment_attempts
   where business_id={q(i['business_a'])}::uuid and attempt_key in ({retained_keys})
 ),
 'retained_tuples_exact',not exists(
   select 1 from (values {expected_values}) expected(
     attempt_id,attempt_key,source,customer_id,appointment_id,payment_kind,
     amount_cents,method,execution_state,ledger_id)
   left join public.commerce_payment_attempts attempt on attempt.id=expected.attempt_id
   left join public.commerce_transactions tx on tx.id=expected.ledger_id
   where attempt.id is null
      or row(attempt.business_id,attempt.attempt_key,attempt.source,attempt.customer_id,
             attempt.appointment_id,attempt.actor_id,attempt.payment_kind,attempt.amount_cents,
             attempt.currency,attempt.method,attempt.provider_route,attempt.execution_state)
         is distinct from
         row({q(i['business_a'])}::uuid,expected.attempt_key,expected.source,
             expected.customer_id,expected.appointment_id,{q(i['actor_a'])}::uuid,
             expected.payment_kind,expected.amount_cents,'cad'::text,expected.method,
             'manual'::text,expected.execution_state)
      or (expected.ledger_id is null and tx.id is not null)
      or (expected.ledger_id is not null and (
           tx.id is null
           or row(tx.business_id,tx.customer_id,tx.appointment_id,tx.kind,tx.status,
                  tx.method,tx.amount_cents,tx.currency,tx.provider,tx.payment_attempt_id)
              is distinct from
              row({q(i['business_a'])}::uuid,expected.customer_id,expected.appointment_id,
                  expected.payment_kind,'succeeded'::text,expected.method,
                  expected.amount_cents,'cad'::text,'manual'::text,expected.attempt_id)
      ))
 ),
 'retained_ledgers_exact',(
   select count(*)=3 and count(*) filter(where id in ({ledger_ids}))=3
     and sum(amount_cents)=18000 and min(currency)=max(currency) and min(currency)='cad'
   from public.commerce_transactions where payment_attempt_id in ({retained_ids})
 ),
 'retained_event_obligation_exact',
   (select count(*)=8 from public.commerce_payment_attempt_events where attempt_id in ({retained_ids}))
   and (select count(*)=12 and count(*) filter(where state='PENDING')=12
        from public.commerce_payment_reconciliation where attempt_id in ({retained_ids})),
 'global_financial_counts_exact',
   (select count(*)=4 from public.commerce_payment_attempts)
   and (select count(*)=8 from public.commerce_payment_attempt_events)
   and (select count(*)=3 from public.commerce_transactions where payment_attempt_id is not null)
   and (select count(*)=12 from public.commerce_payment_reconciliation),
 'parent_scope_total_exact',(
   (select count(*) from public.businesses where id in ({businesses}))
   +(select count(*) from public.business_hours where business_id in ({businesses}))
   +(select count(*) from public.locations where business_id in ({businesses}))
   +(select count(*) from public.location_settings where location_id in ({q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid))
   +(select count(*) from public.location_hours where location_id in ({q(i['location_a'])}::uuid,{q(i['location_b'])}::uuid))
   +(select count(*) from public.tenant_identity_decisions where actor_user_id in ({actors}))
   +(select count(*) from public.customers where business_id in ({businesses}))
   +(select count(*) from public.services where business_id in ({businesses}))
   +(select count(*) from public.staff where business_id in ({businesses}))
   +(select count(*) from public.staff_working_hours where staff_id={q(i['staff'])}::uuid)
   +(select count(*) from public.service_locations where service_id={q(i['service'])}::uuid)
   +(select count(*) from public.staff_locations where staff_id={q(i['staff'])}::uuid)
   +(select count(*) from public.staff_services where staff_id={q(i['staff'])}::uuid)
   +(select count(*) from public.appointments where business_id in ({businesses}))
 )=53,
 'c1_n1_absent',not exists(
   select 1 from public.commerce_payment_attempts
   where business_id={q(i['business_a'])}::uuid
     and attempt_key in ({q(c1_key)},{q(n1_key)})
 ),
 'r1_unchanged',exists(
   select 1 from public.commerce_payment_attempts
   where id={q(retained['r1']['attempt_id'])}::uuid
     and attempt_key={q(retained['r1']['attempt_key'])}
     and execution_state='REQUESTED' and amount_cents=1300
 ),
 'no_active_scope_sessions',not exists(
   select 1 from pg_stat_activity
   where pid<>pg_backend_pid() and application_name like 'hv134_c01_%'
 ),
 'cohort_jobs_send_intents_zero',
   (select count(*)=0 from public.background_jobs where business_id in ({businesses}))
   and (select count(*)=0 from public.communication_send_intents where business_id in ({businesses})),
 'sequence',(
   select jsonb_build_object(
     'last_value',(select last_value::text from {SEQUENCE}),
     'is_called',(select is_called from {SEQUENCE}),
     'increment',seqincrement::text,'cache',seqcache::text,'cycle',seqcycle)
   from pg_sequence where seqrelid={q(SEQUENCE)}::regclass
 ),
 'cohort_snapshot',{snapshot_expression(manifest)},
 'noncohort_snapshot',{noncohort_expression(manifest)}
)::text;
rollback;
"""


def observer_probe_sql(kind: str, nonce: str, holder_pid: int | None = None) -> str:
    lock_key = 134_202_610
    if kind == "holder":
        return f"""
begin read only;
set local statement_timeout='12s';
set local application_name={q('hv134_c01_vh_' + nonce)};
select pg_advisory_xact_lock({lock_key});
select pg_sleep(6);
commit;
select jsonb_build_object(
 'protocol','hv134-c01-v1','probe','holder','backend_identity',
 jsonb_build_object('pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user),
 'commit_ack',true)::text;
"""
    if kind == "waiter":
        return f"""
begin read only;
set local lock_timeout='8s';
set local statement_timeout='10s';
set local application_name={q('hv134_c01_vw_' + nonce)};
set local role service_role;
do $hv$ begin
 perform set_config('hv134_c01.writer_role',current_user,false);
end $hv$;
select pg_advisory_xact_lock({lock_key});
commit;
select jsonb_build_object(
 'protocol','hv134-c01-v1','probe','waiter','backend_identity',
 jsonb_build_object('pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user,
   'writer_role',current_setting('hv134_c01.writer_role')),
 'commit_ack',true)::text;
reset hv134_c01.writer_role;
"""
    if kind == "read":
        if not isinstance(holder_pid, int) or holder_pid <= 0:
            raise ValueError("observer probe holder PID is required")
        return f"""
begin read only;
set local statement_timeout='3s';
select pg_stat_clear_snapshot();
select jsonb_build_object(
 'protocol','hv134-c01-v1',
 'visible',count(*)=1
   and bool_and(state='active')
   and bool_and(wait_event_type='Lock')
   and bool_and(wait_event='advisory')
   and bool_and(query is not null)
   and bool_and(usename is not null)
   and bool_and(pg_blocking_pids(pid)=array[{holder_pid}]::integer[]),
 'observed',coalesce(jsonb_agg(jsonb_build_object(
   'pid',pid,'usename',usename,'state',state,
   'wait_event_type',wait_event_type,'wait_event',wait_event,
   'blocking_pids',pg_blocking_pids(pid)
 )),'[]'::jsonb)
)::text
from pg_stat_activity where application_name={q('hv134_c01_vw_' + nonce)};
rollback;
"""
    raise ValueError("unknown observer probe kind")


def activity_ready_sql(application_name: str) -> str:
    return f"""
begin read only;
set local statement_timeout='3s';
select pg_stat_clear_snapshot();
select jsonb_build_object(
 'protocol','hv134-c01-v1','ready',count(*)=1,
 'backend_pid',min(pid)
)::text from pg_stat_activity where application_name={q(application_name)};
rollback;
"""


def admit_sql(manifest: dict[str, Any], name: str) -> str:
    i = _ids(manifest)
    item = manifest["new_scope"][name]
    customer = i["customer_" + item["customer"]]
    appointment = None if item["appointment"] is None else i["appointment_" + item["appointment"]]
    actor = i["actor_" + item["actor"]]
    business = i["business_" + item["business"]]
    fingerprint = intent_fingerprint(business, customer, appointment, item)
    return f"""
begin;
set local lock_timeout='5s';
set local statement_timeout='15s';
set local role service_role;
do $hv$
declare result record;
begin
 select * into result from public.admit_payment_attempt_v1(
   {q(business)},{q(item['attempt_key'])},{q(fingerprint)},{q(item['source'])},
   {q(customer)},{q(appointment)},{q(actor)},{q(item['payment_kind'])},
   {item['amount_cents']},{q(item['currency'])},{q(item['method'])},{q(item['provider_route'])}
 );
 perform set_config('hv134_c01.result',row_to_json(result)::text,false);
 perform set_config('hv134_c01.writer_role',current_user,false);
end $hv$;
commit;
select jsonb_build_object(
 'protocol','hv134-c01-v1','request',{q(name + '-admit')},
 'backend_identity',jsonb_build_object(
   'pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user,
   'writer_role',current_setting('hv134_c01.writer_role')),
 'result',current_setting('hv134_c01.result')::jsonb,'commit_ack',true
)::text;
reset hv134_c01.result;
reset hv134_c01.writer_role;
"""


def holder_sql(manifest: dict[str, Any], attempt_id: str, nonce: str) -> str:
    business = manifest["scope"]["businesses"]["a"]
    waiter1 = "hv134_c01_w1_" + nonce
    waiter2 = "hv134_c01_w2_" + nonce
    return f"""
begin;
set local lock_timeout='5s';
set local statement_timeout='15s';
set local application_name={q('hv134_c01_hp_' + nonce)};
set local role service_role;
select id from public.commerce_payment_attempts
 where id={q(attempt_id)}::uuid and business_id={q(business)}::uuid for update;
set local application_name={q('hv134_c01_hr_' + nonce)};
reset role;
do $hv$
declare i integer; visible boolean:=false; witness jsonb; holder integer:=pg_backend_pid();
begin
 if current_user<>{q(manifest['project']['observer_role'])}
    or session_user<>{q(manifest['project']['observer_role'])} then
   raise exception 'HV134_C01_OBSERVER_ROLE_DRIFT';
 end if;
 for i in 1..100 loop
   perform pg_stat_clear_snapshot();
   with recursive waiters as (
     select pid,application_name,usename,state,wait_event_type,wait_event
     from pg_stat_activity
     where application_name in ({q(waiter1)},{q(waiter2)})
   ), chain(root,pid,path) as (
     select pid,pid,array[pid] from waiters where wait_event_type='Lock'
     union all
     select chain.root,blocker.pid,chain.path||blocker.pid
     from chain
     cross join lateral unnest(pg_blocking_pids(chain.pid)) blocker(pid)
     where not blocker.pid=any(chain.path)
   ), roots as (
     select root,bool_or(pid=holder) reaches_holder from chain group by root
   )
   select
     (select count(*)=2
        and bool_and(state='active')
        and bool_and(wait_event_type='Lock')
        and bool_and(wait_event is not null)
      from waiters)
     and
     (select count(*)=2 and bool_and(reaches_holder) from roots),
     jsonb_build_object(
       'holder_pid',holder,
       'workers',(select coalesce(jsonb_agg(jsonb_build_object(
         'application_name',application_name,'pid',pid,'usename',usename,
         'state',state,'wait_event_type',wait_event_type,'wait_event',wait_event,
         'blocking_pids',pg_blocking_pids(pid)
       ) order by application_name),'[]'::jsonb) from waiters),
       'blocker_chain',(select coalesce(jsonb_agg(jsonb_build_object(
         'worker_pid',root,'pid',pid,'path',path
       ) order by root,array_length(path,1)),'[]'::jsonb) from chain)
     )
   into visible,witness
   ;
   if coalesce(visible,false) then exit; end if;
   perform pg_sleep(0.1);
 end loop;
 if not coalesce(visible,false) then
   raise exception 'HV134_C01_CONCURRENCY_WITNESS_TIMEOUT';
 end if;
 perform set_config('hv134_c01.witness',witness::text,false);
end $hv$;
commit;
select jsonb_build_object(
 'protocol','hv134-c01-v1','request','c1-holder',
 'backend_identity',jsonb_build_object(
   'pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user),
 'witness',current_setting('hv134_c01.witness')::jsonb,'commit_ack',true
)::text;
reset hv134_c01.witness;
"""


def worker_sql(manifest: dict[str, Any], attempt_id: str, nonce: str, index: int) -> str:
    business = manifest["scope"]["businesses"]["a"]
    return f"""
begin;
set local lock_timeout='20s';
set local statement_timeout='20s';
set local application_name={q(f'hv134_c01_w{index}_{nonce}')};
set local role service_role;
do $hv$
declare result record;
begin
 select * into result from public.commit_manual_payment_attempt_v1(
   {q(business)},{q(attempt_id)}
 );
 perform set_config('hv134_c01.result',row_to_json(result)::text,false);
 perform set_config('hv134_c01.writer_role',current_user,false);
end $hv$;
commit;
select jsonb_build_object(
 'protocol','hv134-c01-v1','request',{q(f'c1-worker-{index}')},
 'backend_identity',jsonb_build_object(
   'pid',pg_backend_pid(),'session_user',session_user,'effective_role',current_user,
   'writer_role',current_setting('hv134_c01.writer_role')),
 'result',current_setting('hv134_c01.result')::jsonb,'commit_ack',true
)::text;
reset hv134_c01.result;
reset hv134_c01.writer_role;
"""


def reconcile_sql(manifest: dict[str, Any], stage: str, attempt_id: str | None = None) -> str:
    i = _ids(manifest)
    keys = ",".join(q(value) for value in _attempt_keys(manifest))
    initial_snapshot = snapshot_expression(manifest)
    noncohort = noncohort_expression(manifest)
    c1_key = manifest["new_scope"]["c1"]["attempt_key"]
    n1_key = manifest["new_scope"]["n1"]["attempt_key"]
    attempt_filter = (
        f"id={q(attempt_id)}::uuid"
        if attempt_id
        else f"business_id={q(i['business_a'])}::uuid and attempt_key={q(c1_key)}"
    )
    attempt_check = f"""
jsonb_build_object(
 'attempt_id',(select id from public.commerce_payment_attempts
   where business_id={q(i['business_a'])}::uuid and attempt_key={q(c1_key)}),
 'execution_state',(select execution_state from public.commerce_payment_attempts
   where business_id={q(i['business_a'])}::uuid and attempt_key={q(c1_key)}),
 'ledger_id',(select id from public.commerce_transactions where payment_attempt_id=(
   select id from public.commerce_payment_attempts where {attempt_filter})),
 'ledger_count',(select count(*) from public.commerce_transactions where payment_attempt_id=(
   select id from public.commerce_payment_attempts where {attempt_filter})),
 'event_count',(select count(*) from public.commerce_payment_attempt_events where attempt_id=(
   select id from public.commerce_payment_attempts where {attempt_filter})),
 'obligation_count',(select count(*) from public.commerce_payment_reconciliation where attempt_id=(
   select id from public.commerce_payment_attempts where {attempt_filter})),
 'pending_count',(select count(*) from public.commerce_payment_reconciliation where attempt_id=(
   select id from public.commerce_payment_attempts where {attempt_filter}) and state='PENDING'),
 'not_required_appointment_cache',(select count(*)=1 from public.commerce_payment_reconciliation
   where attempt_id=(select id from public.commerce_payment_attempts where {attempt_filter})
     and projection_kind='appointment_cache'
     and state='NOT_REQUIRED' and completed_at is not null)
)"""
    return f"""
begin read only;
set local statement_timeout='30s';
set local timezone='UTC';
select jsonb_build_object(
 'protocol','hv134-c01-v1','stage',{q(stage)},
 'counts',jsonb_build_object(
   'attempts',(select count(*) from public.commerce_payment_attempts
      where business_id={q(i['business_a'])}::uuid and attempt_key in ({keys})),
   'accepted_attempts',(select count(*) from public.commerce_payment_attempts
      where business_id={q(i['business_a'])}::uuid and attempt_key in ({keys}) and execution_state='ACCEPTED'),
   'requested_attempts',(select count(*) from public.commerce_payment_attempts
      where business_id={q(i['business_a'])}::uuid and attempt_key in ({keys}) and execution_state='REQUESTED'),
   'events',(select count(*) from public.commerce_payment_attempt_events event_row
      join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})),
   'requested_events',(select count(*) from public.commerce_payment_attempt_events event_row
      join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})
        and event_row.event_type='REQUESTED'),
   'accepted_events',(select count(*) from public.commerce_payment_attempt_events event_row
      join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})
        and event_row.event_type='ACCEPTED'),
   'conflict_events',(select count(*) from public.commerce_payment_attempt_events event_row
      join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})
        and event_row.event_type='KEY_CONFLICT'),
   'linked_ledgers',(select count(*) from public.commerce_transactions tx
      join public.commerce_payment_attempts attempt on attempt.id=tx.payment_attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})),
   'ledger_total_cents',(select coalesce(sum(tx.amount_cents),0) from public.commerce_transactions tx
      join public.commerce_payment_attempts attempt on attempt.id=tx.payment_attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})),
   'obligations',(select count(*) from public.commerce_payment_reconciliation obligation
      join public.commerce_payment_attempts attempt on attempt.id=obligation.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})),
   'pending_obligations',(select count(*) from public.commerce_payment_reconciliation obligation
      join public.commerce_payment_attempts attempt on attempt.id=obligation.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})
        and obligation.state='PENDING'),
   'not_required_obligations',(select count(*) from public.commerce_payment_reconciliation obligation
      join public.commerce_payment_attempts attempt on attempt.id=obligation.attempt_id
      where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key in ({keys})
        and obligation.state='NOT_REQUIRED')
 ),
 'c1',{attempt_check},
 'n1_state',(select execution_state from public.commerce_payment_attempts
   where business_id={q(i['business_a'])}::uuid and attempt_key={q(n1_key)}),
 'n1',jsonb_build_object(
   'attempt_count',(select count(*) from public.commerce_payment_attempts
     where business_id={q(i['business_a'])}::uuid and attempt_key={q(n1_key)}
       and source='customer_billing' and customer_id={q(i['customer_a1'])}::uuid
       and appointment_id is null and actor_id={q(i['actor_a'])}::uuid
       and payment_kind='payment' and amount_cents=2500 and currency='cad'
       and method='other' and provider_route='manual' and execution_state='REQUESTED'),
   'event_count',(select count(*) from public.commerce_payment_attempt_events event_row
     join public.commerce_payment_attempts attempt on attempt.id=event_row.attempt_id
     where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key={q(n1_key)}
       and event_row.event_type='REQUESTED' and event_row.money_state='NOT_RECORDED'),
   'ledger_count',(select count(*) from public.commerce_transactions tx
     join public.commerce_payment_attempts attempt on attempt.id=tx.payment_attempt_id
     where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key={q(n1_key)}),
   'obligation_count',(select count(*) from public.commerce_payment_reconciliation obligation
     join public.commerce_payment_attempts attempt on attempt.id=obligation.attempt_id
     where attempt.business_id={q(i['business_a'])}::uuid and attempt.attempt_key={q(n1_key)})
 ),
 'r1_state',(select execution_state from public.commerce_payment_attempts
   where id={q(manifest['retained_financial']['r1']['attempt_id'])}::uuid),
 'global_counts',jsonb_build_object(
   'attempts',(select count(*) from public.commerce_payment_attempts),
   'events',(select count(*) from public.commerce_payment_attempt_events),
   'linked_ledgers',(select count(*) from public.commerce_transactions where payment_attempt_id is not null),
   'obligations',(select count(*) from public.commerce_payment_reconciliation)
 ),
 'auth_users',(select count(*) from auth.users where id in ({q(i['actor_a'])}::uuid,{q(i['actor_b'])}::uuid)),
 'auth_identities',(select count(*) from auth.identities where user_id in ({q(i['actor_a'])}::uuid,{q(i['actor_b'])}::uuid) and provider='email'),
 'cohort_jobs',(select count(*) from public.background_jobs
   where business_id in ({q(i['business_a'])}::uuid,{q(i['business_b'])}::uuid)),
 'cohort_send_intents',(select count(*) from public.communication_send_intents
   where business_id in ({q(i['business_a'])}::uuid,{q(i['business_b'])}::uuid)),
 'sequence',(select jsonb_build_object(
   'last_value',(select last_value::text from {SEQUENCE}),
   'is_called',(select is_called from {SEQUENCE})
   ) from pg_sequence where seqrelid={q(SEQUENCE)}::regclass),
 'cohort_snapshot',{initial_snapshot},
 'noncohort_snapshot',{noncohort}
)::text;
rollback;
"""
