#!/usr/bin/env python3
"""Prepared-only HV134 Staging validator. Default behavior is refusal."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import secrets
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
PACKAGE_FILES = ("PLAN.md", "fixture.json", "hosted_validation.py")
EXPECTED_REF = "wnfahklzaxirftyskctd"
EXPECTED_URL = f"https://{EXPECTED_REF}.supabase.co"
EXPECTED_QUERY_URL = f"https://api.supabase.com/v1/projects/{EXPECTED_REF}/database/query"
FOUNDATION_VERSION = "20261005032107"
FOUNDATION_NAME = "issue_134_payment_attempt_foundation"
FOUNDATION_SHA = "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47"
R1A_VERSION = "20261005170446"
R1A_NAME = "issue_134_r1a_manual_payment_kernel"
R1A_SHA = "4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7"
ADMIT_BODY_SHA = "110485eb1eb2a86fd2eec72507fdf8beb7304aae92251ddef598162d05dd5847"
COMMIT_BODY_SHA = "e6acc9a31613b2f039305cf5169871e9b433839b4077b83d0858246194f46b15"
SEQ = "public.commerce_payment_attempt_events_event_sequence_seq"
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
RUN_RE = re.compile(r"^HV134-[A-Za-z0-9][A-Za-z0-9_-]{5,63}$")


class Stop(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def package_hash() -> tuple[str, dict[str, str]]:
    members: dict[str, str] = {}
    aggregate = hashlib.sha256()
    for name in PACKAGE_FILES:
        data = (ROOT / name).read_bytes()
        digest = sha256_bytes(data)
        members[name] = digest
        aggregate.update(name.encode("utf-8"))
        aggregate.update(b"\0")
        aggregate.update(digest.encode("ascii"))
        aggregate.update(b"\n")
    return aggregate.hexdigest(), members


def q(value: Any) -> str:
    """Strict SQL literal for package-controlled scalar values."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if not isinstance(value, str) or "\x00" in value:
        raise Stop("unsupported SQL literal type")
    return "'" + value.replace("'", "''") + "'"


def require_uuid(value: Any, label: str) -> str:
    text = str(value).lower()
    if not UUID_RE.fullmatch(text):
        raise Stop(f"{label} is not a canonical UUID")
    return text


def load_fixture() -> dict[str, Any]:
    fixture = json.loads((ROOT / "fixture.json").read_text(encoding="utf-8"))
    project = fixture["project"]
    if (
        project["ref"] != EXPECTED_REF
        or project["supabase_url"] != EXPECTED_URL
        or project["management_query_url"] != EXPECTED_QUERY_URL
    ):
        raise Stop("fixture target identity drift")
    for item in fixture["attempts"].values():
        require_uuid(item["attempt_key"], "attempt_key")
    return fixture


class Evidence:
    def __init__(self, run_id: str, pkg_hash: str, members: dict[str, str]):
        parent = ROOT / "evidence"
        parent.mkdir(mode=0o700, exist_ok=True)
        self.directory = parent / run_id
        self.directory.mkdir(mode=0o700, exist_ok=False)
        self.evidence_path = self.directory / "evidence.jsonl"
        self.manifest_path = self.directory / "run-manifest.jsonl"
        self.run_id = run_id
        self.pkg_hash = pkg_hash
        self._append(
            self.manifest_path,
            {
                "event_key": "manifest-000-package",
                "observed_at": utc_now(),
                "run_id": run_id,
                "package_hash": pkg_hash,
                "members": members,
                "target_ref": EXPECTED_REF,
                "status": "STARTED_NOT_ACCEPTED",
            },
        )

    @staticmethod
    def _append(path: Path, value: dict[str, Any]) -> None:
        data = (canonical_json(value) + "\n").encode("utf-8")
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        try:
            os.write(fd, data)
            os.fsync(fd)
        finally:
            os.close(fd)

    def record(self, key: str, classification: str, **fields: Any) -> None:
        self._append(
            self.evidence_path,
            {
                "event_key": key,
                "observed_at": utc_now(),
                "run_id": self.run_id,
                "package_hash": self.pkg_hash,
                "classification": classification,
                **fields,
            },
        )

    def manifest(self, key: str, **fields: Any) -> None:
        self._append(
            self.manifest_path,
            {
                "event_key": key,
                "observed_at": utc_now(),
                "run_id": self.run_id,
                "package_hash": self.pkg_hash,
                **fields,
            },
        )


def execution_env(fixture: dict[str, Any]) -> dict[str, str]:
    names = (
        "HV134_STAGING_MANAGEMENT_TOKEN",
        "HV134_STAGING_SERVICE_ROLE_KEY",
    )
    values = {name: os.environ.get(name, "") for name in names}
    missing = [name for name, value in values.items() if not value]
    if missing:
        raise Stop("missing dedicated execution inputs: " + ", ".join(missing))
    if len(values["HV134_STAGING_MANAGEMENT_TOKEN"]) < 20:
        raise Stop("Management credential shape is invalid")
    if len(values["HV134_STAGING_SERVICE_ROLE_KEY"]) < 20:
        raise Stop("service credential shape is invalid")
    return values


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> None:
        return None


def fixed_https_opener() -> urllib.request.OpenerDirector:
    # Deliberately ignore HTTP(S)_PROXY and reject every redirect. Default CA and
    # hostname verification remain enabled.
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        NoRedirect(),
    )


class ManagementSQL:
    def __init__(self, values: dict[str, str], evidence: Evidence):
        self.token = values["HV134_STAGING_MANAGEMENT_TOKEN"]
        self.evidence = evidence
        self.write_started = False

    def request(
        self,
        key: str,
        sql: str,
        *,
        read_only: bool,
        timeout: int = 30,
        zero_write_probe: bool = False,
    ) -> list[dict[str, Any]]:
        if "\\set" in sql or "\\echo" in sql or "\\q" in sql:
            raise Stop("psql metacommand is forbidden in Management SQL")
        body = canonical_json({"query": sql, "read_only": read_only}).encode("utf-8")
        request = urllib.request.Request(
            EXPECTED_QUERY_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "chasum-hv134-prepared-validator/2",
            },
        )
        if zero_write_probe and read_only:
            raise Stop("zero-write capability probe must exercise the write-capable transport route")
        if zero_write_probe and self.write_started:
            raise Stop("zero-write capability probe cannot run after a possible write")
        if not read_only and not zero_write_probe:
            # A failed write response is ambiguous and can never be described as
            # zero-write. The initial credential/source preflight is read-only.
            self.write_started = True
        try:
            # A fresh opener makes each threaded Management request independent.
            with fixed_https_opener().open(request, timeout=timeout) as response:
                if response.status not in (200, 201):
                    classification = "STOP_ZERO_WRITES" if not self.write_started else "STOP_PRESERVE"
                    self.evidence.record(
                        key, classification, reason="Management SQL returned an unaccepted status"
                    )
                    raise Stop(f"{key}: Management SQL returned an unaccepted status")
                raw = response.read(4_000_001)
            if len(raw) > 4_000_000:
                classification = "STOP_ZERO_WRITES" if not self.write_started else "STOP_PRESERVE"
                self.evidence.record(
                    key, classification, reason="Management SQL response exceeded the bound"
                )
                raise Stop(f"{key}: Management SQL response exceeded the bound")
            value = json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            classification = "STOP_ZERO_WRITES" if not self.write_started else "STOP_PRESERVE"
            self.evidence.record(key, classification, reason=f"Management SQL HTTP {exc.code}")
            raise Stop(f"{key}: Management SQL HTTP {exc.code}") from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            classification = "STOP_ZERO_WRITES" if not self.write_started else "STOP_PRESERVE"
            self.evidence.record(key, classification, reason="Management SQL unavailable")
            raise Stop(f"{key}: Management SQL unavailable") from exc
        if not isinstance(value, list) or not all(isinstance(row, dict) for row in value):
            classification = "STOP_ZERO_WRITES" if not self.write_started else "STOP_PRESERVE"
            self.evidence.record(key, classification, reason="Management SQL response shape drift")
            raise Stop(f"{key}: Management SQL response shape drift")
        return value

    def one_json(
        self,
        key: str,
        sql: str,
        app: str,
        timeout: int = 30,
        read_only: bool | None = None,
        zero_write_probe: bool = False,
    ) -> dict[str, Any]:
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,63}", app):
            raise Stop("unsafe application_name")
        sql = f"set application_name={q(app)};\n{sql}"
        if read_only is None:
            lowered = sql.lower()
            read_only = "begin read only" in lowered or not any(
                token in lowered for token in ("insert ", "update ", "delete ", "perform ", "set local role")
            )
        rows = self.request(
            key,
            sql,
            read_only=read_only,
            timeout=timeout,
            zero_write_probe=zero_write_probe,
        )
        parsed: list[dict[str, Any]] = []
        for row in rows:
            if len(row) != 1:
                continue
            value = next(iter(row.values()))
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    continue
            if isinstance(value, dict):
                parsed.append(value)
        if len(parsed) != 1:
            classification = "STOP_ZERO_WRITES" if zero_write_probe else "STOP"
            self.evidence.record(key, classification, reason="expected exactly one JSON result")
            raise Stop(f"{key}: expected exactly one JSON result")
        return parsed[0]


class AuthAdmin:
    def __init__(self, values: dict[str, str], evidence: Evidence):
        self.url = EXPECTED_URL
        self.key = values["HV134_STAGING_SERVICE_ROLE_KEY"]
        self.evidence = evidence
        self.opener = fixed_https_opener()

    def request(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        url = self.url + path
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != "https" or parsed.netloc != f"{EXPECTED_REF}.supabase.co":
            raise Stop("Auth request escaped the exact Staging origin")
        data = None if body is None else canonical_json(body).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "chasum-hv134-prepared-validator/1",
            },
        )
        try:
            with self.opener.open(request, timeout=15) as response:
                if response.status not in (200, 201):
                    raise Stop("Auth Admin returned an unaccepted status")
                raw = response.read(2_000_001)
                if len(raw) > 2_000_000:
                    raise Stop("Auth response exceeded the bounded size")
                return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # Never expose the provider body or credential-bearing request.
            raise Stop(f"Auth Admin returned HTTP {exc.code}; write outcome may be ambiguous") from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise Stop("Auth Admin result is unavailable or ambiguous; do not retry") from exc

    def list_users(self) -> list[dict[str, Any]]:
        users: list[dict[str, Any]] = []
        for page in range(1, 11):
            value = self.request("GET", f"/auth/v1/admin/users?page={page}&per_page=1000")
            batch = value.get("users") if isinstance(value, dict) else None
            if not isinstance(batch, list):
                raise Stop("Auth Admin user-list shape drift")
            users.extend(item for item in batch if isinstance(item, dict))
            if len(batch) < 1000:
                return users
        raise Stop("Auth Admin user inventory exceeded bounded pagination")

    def create_actor(self, label: str, email: str) -> str:
        password = secrets.token_urlsafe(48)
        try:
            value = self.request(
                "POST",
                "/auth/v1/admin/users",
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"synthetic_scope": "HV134", "label": label},
                },
            )
        finally:
            password = ""
        user = value.get("user", value) if isinstance(value, dict) else {}
        actor_id = require_uuid(user.get("id"), f"{label} actor id")
        if str(user.get("email", "")).lower() != email:
            raise Stop(f"{label} Auth response email mismatch")
        if not user.get("email_confirmed_at"):
            raise Stop(f"{label} Auth response is not email-confirmed")
        return actor_id


def intent_fingerprint(business_id: str, customer_id: str, appointment_id: str | None, item: dict[str, Any]) -> str:
    target = "appointment" if appointment_id else "customer"
    value = [
        "chasum.payment-attempt",
        1,
        business_id,
        customer_id,
        target,
        appointment_id,
        item["amount_cents"],
        item["currency"],
        item["method"],
        item["payment_kind"],
        item["provider_route"],
        None,
    ]
    return "v1:" + sha256_bytes(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def assert_true_map(result: dict[str, Any], keys: list[str], label: str) -> None:
    failed = [key for key in keys if result.get(key) is not True]
    if failed:
        raise Stop(f"{label} failed: {', '.join(failed)}")


def literal_role_transport_probe(db: ManagementSQL) -> dict[str, bool]:
    # Exercise the same write-capable Management route used later, while the
    # database itself enforces a transaction-wide READ ONLY boundary.
    sql = """
begin read only;
set local statement_timeout='10s';
set local role service_role;
select jsonb_build_object(
  'literal_role',current_user='service_role',
  'session_inherit',(
    select rolinherit from pg_roles where rolname=session_user
  )
)::text;
reset role;
commit;
"""
    result = db.one_json(
        "literal-role-transport-probe",
        sql,
        "hv134_role_probe",
        timeout=20,
        read_only=False,
        zero_write_probe=True,
    )
    expected = {"literal_role": True, "session_inherit": True}
    if result != expected:
        db.evidence.record(
            "literal-role-transport-probe",
            "STOP_ZERO_WRITES",
            reason="literal role or session inheritance mismatch",
        )
        raise Stop("literal-role transport probe mismatch; zero writes")
    return result


def readonly_preflight(db: ManagementSQL, fixture: dict[str, Any], emails: list[str]) -> dict[str, Any]:
    keys = ", ".join(q(x["attempt_key"]) for x in fixture["attempts"].values())
    business_emails = ", ".join(q(fixture["businesses"][x]["email"]) for x in ("a", "b"))
    slugs = ", ".join(q(fixture["businesses"][x]["requested_slug"]) for x in ("a", "b"))
    actor_emails = ", ".join(q(value) for value in emails)

    def identity_is_clear(item: dict[str, Any]) -> str:
        # This is the complete candidate predicate from decide_business_identity:
        # business/location phone, email, website/subdomain, name+location,
        # brand+location, and business/alias requested slug.
        name = f"public.tenant_identity_key({q(item['name'])},'name')"
        legal = f"public.tenant_identity_key({q(item['legal_name'])},'name')"
        phone = f"public.tenant_identity_key({q(item['phone'])},'phone')"
        email = f"public.tenant_identity_key({q(item['email'])},'email')"
        host = f"public.tenant_identity_key({q(item['website'])},'website')"
        city = f"public.tenant_identity_key({q(item['city'])},'name')"
        region = f"public.tenant_identity_key({q(item['region'])},'name')"
        slug = q(item["requested_slug"])
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

    identity_a = identity_is_clear(fixture["businesses"]["a"])
    identity_b = identity_is_clear(fixture["businesses"]["b"])
    sql = f"""
begin read only;
set local lock_timeout='5s';
set local statement_timeout='30s';
select jsonb_build_object(
  'server17', current_setting('server_version_num')::integer between 170000 and 179999,
  'role_member', pg_has_role(current_user,'service_role','MEMBER'),
  'foundation_history', exists(
    select 1 from supabase_migrations.schema_migrations
    where version={q(FOUNDATION_VERSION)} and name={q(FOUNDATION_NAME)}
      and octet_length(statements[1])=15667
      and encode(sha256(convert_to(statements[1],'UTF8')),'hex')={q(FOUNDATION_SHA)}
  ),
  'r1a_history', exists(
    select 1 from supabase_migrations.schema_migrations
    where version={q(R1A_VERSION)} and name={q(R1A_NAME)}
      and octet_length(statements[1])=16151
      and encode(sha256(convert_to(statements[1],'UTF8')),'hex')={q(R1A_SHA)}
  ),
  'admit_body', (
    select encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')={q(ADMIT_BODY_SHA)}
      and not p.prosecdef and p.proconfig=array['search_path=pg_catalog, pg_temp']
    from pg_proc p where p.oid='public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)'::regprocedure
  ),
  'commit_body', (
    select encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')={q(COMMIT_BODY_SHA)}
      and not p.prosecdef and p.proconfig=array['search_path=pg_catalog, pg_temp']
    from pg_proc p where p.oid='public.commit_manual_payment_attempt_v1(uuid,uuid)'::regprocedure
  ),
  'execute_acl',
    has_function_privilege('service_role','public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)','EXECUTE')
    and has_function_privilege('service_role','public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE')
    and not has_function_privilege('anon','public.admit_payment_attempt_v1(uuid,uuid,text,text,uuid,uuid,uuid,text,integer,text,text,text)','EXECUTE')
    and not has_function_privilege('authenticated','public.commit_manual_payment_attempt_v1(uuid,uuid)','EXECUTE'),
  'identity_rpc', has_function_privilege('service_role',
    'public.decide_business_identity(uuid,text,text,text,text,text,text,text,text,text,text)','EXECUTE'),
  'identity_a_clear', {identity_a},
  'identity_b_clear', {identity_b},
  'starter_plan', exists(
    select 1 from public.subscription_plans where plan_key='starter' and is_active
  ),
  'service_attempt_acl',
    has_table_privilege('service_role','public.commerce_payment_attempts','SELECT,INSERT')
    and has_column_privilege('service_role','public.commerce_payment_attempts','execution_state','UPDATE')
    and has_column_privilege('service_role','public.commerce_payment_attempts','updated_at','UPDATE')
    and has_column_privilege('service_role','public.commerce_payment_attempts','resolved_at','UPDATE'),
  'service_event_acl',
    has_table_privilege('service_role','public.commerce_payment_attempt_events','SELECT,INSERT')
    and has_sequence_privilege('service_role',{q(SEQ)},'USAGE')
    and has_sequence_privilege('service_role',{q(SEQ)},'SELECT'),
  'service_ledger_acl',
    has_table_privilege('service_role','public.commerce_transactions','SELECT,INSERT')
    and has_table_privilege('service_role','public.commerce_payment_reconciliation','SELECT,INSERT'),
  'service_binding_acl',
    has_table_privilege('service_role','public.customers','SELECT')
    and has_table_privilege('service_role','public.appointments','SELECT')
    and has_column_privilege('service_role','public.appointments','customer_id','UPDATE'),
  'fixture_acl',
    has_table_privilege('service_role','public.businesses','SELECT,UPDATE')
    and has_table_privilege('service_role','public.locations','SELECT,UPDATE')
    and has_table_privilege('service_role','public.business_hours','SELECT')
    and has_table_privilege('service_role','public.location_settings','SELECT')
    and has_table_privilege('service_role','public.location_hours','SELECT')
    and has_table_privilege('service_role','public.tenant_identity_decisions','SELECT')
    and has_table_privilege('service_role','public.business_members','SELECT')
    and has_table_privilege('service_role','public.business_slug_aliases','SELECT')
    and has_table_privilege('service_role','public.customers','SELECT,INSERT')
    and has_table_privilege('service_role','public.services','SELECT,INSERT')
    and has_table_privilege('service_role','public.staff','SELECT,INSERT')
    and has_table_privilege('service_role','public.staff_working_hours','SELECT,UPDATE')
    and has_table_privilege('service_role','public.service_locations','SELECT,INSERT')
    and has_table_privilege('service_role','public.staff_locations','SELECT,INSERT')
    and has_table_privilege('service_role','public.staff_services','SELECT,INSERT')
    and has_table_privilege('service_role','public.appointments','SELECT,INSERT')
    and has_table_privilege('service_role','public.commerce_invoices','SELECT')
    and has_table_privilege('service_role','public.commerce_invoice_lines','SELECT')
    and has_table_privilege('service_role','public.commerce_receipts','SELECT')
    and has_table_privilege('service_role','public.customer_payment_events','SELECT')
    and has_table_privilege('service_role','public.background_jobs','SELECT')
    and has_table_privilege('service_role','public.communication_follow_ups','SELECT')
    and has_table_privilege('service_role','public.communication_send_intents','SELECT')
    and has_table_privilege('service_role','public.communications_audit_log','SELECT')
    and has_table_privilege('service_role','public.notification_logs','SELECT')
    and has_table_privilege('service_role','public.communication_history','SELECT')
    and has_table_privilege('service_role','public.notifications','SELECT')
    and has_table_privilege('service_role','public.calendar_connections','SELECT')
    and has_table_privilege('service_role','public.external_events','SELECT'),
  'authenticated_legacy_acl',
    has_table_privilege('authenticated','public.commerce_transactions','SELECT,INSERT,UPDATE,DELETE'),
  'fixture_columns', not exists(
    select 1 from (values
      ('businesses','currency'),('businesses','timezone'),
      ('businesses','email_notifications_enabled'),('businesses','sms_notifications_enabled'),
      ('businesses','owner_notifications_enabled'),('businesses','staff_notifications_enabled'),
      ('businesses','marketing_email_enabled'),('businesses','online_booking_enabled'),
      ('businesses','public_booking_mode'),('businesses','notification_email'),
      ('businesses','id'),('businesses','owner_id'),('businesses','name'),
      ('businesses','legal_name'),('businesses','slug'),('businesses','email'),
      ('businesses','phone'),('businesses','website'),('businesses','city'),('businesses','state'),
      ('businesses','country'),('businesses','subscription_plan_key'),
      ('locations','id'),('locations','business_id'),('locations','is_default'),
      ('locations','timezone'),('locations','phone'),('locations','city'),('locations','state'),
      ('customers','id'),('customers','business_id'),('customers','name'),('customers','email'),('customers','phone'),
      ('services','id'),('services','business_id'),('services','location_id'),('services','name'),
      ('services','duration_minutes'),('services','price'),('services','deposit_cents'),
      ('services','deposit_required'),('services','is_active'),('services','online_booking'),
      ('services','booking_visibility'),('services','commercial_settings_reviewed'),
      ('staff','id'),('staff','business_id'),('staff','location_id'),('staff','default_location_id'),
      ('staff','name'),('staff','email'),('staff','phone'),('staff','user_id'),
      ('staff','is_active'),('staff','employment_status'),('staff','accept_online_bookings'),
      ('staff','accept_new_clients'),('staff','accept_walk_ins'),
      ('appointments','id'),('appointments','business_id'),('appointments','location_id'),('appointments','service_id'),
      ('appointments','staff_id'),('appointments','customer_id'),('appointments','start_time'),
      ('appointments','end_time'),('appointments','status'),('appointments','price_cents'),
      ('appointments','tax_cents'),('appointments','discount_cents'),('appointments','deposit_cents'),
      ('appointments','amount_paid_cents'),('appointments','amount_refunded_cents'),
      ('appointments','payment_status'),
      ('business_hours','business_id'),('location_settings','location_id'),
      ('location_hours','location_id'),('tenant_identity_decisions','actor_user_id'),
      ('staff_working_hours','staff_id'),('staff_working_hours','is_working'),
      ('business_members','business_id'),('business_members','user_id'),
      ('business_slug_aliases','business_id'),('business_slug_aliases','slug'),
      ('service_locations','service_id'),('service_locations','location_id'),('service_locations','is_primary'),
      ('staff_locations','staff_id'),('staff_locations','location_id'),('staff_locations','is_primary'),
      ('staff_services','staff_id'),('staff_services','service_id'),
      ('commerce_payment_attempts','id'),('commerce_payment_attempts','business_id'),
      ('commerce_payment_attempts','attempt_key'),('commerce_payment_attempts','execution_state'),
      ('commerce_payment_attempts','amount_cents'),('commerce_payment_attempts','updated_at'),
      ('commerce_payment_attempts','resolved_at'),
      ('commerce_payment_attempt_events','id'),('commerce_payment_attempt_events','attempt_id'),
      ('commerce_payment_attempt_events','business_id'),('commerce_payment_attempt_events','event_type'),
      ('commerce_payment_attempt_events','event_sequence'),
      ('commerce_transactions','id'),('commerce_transactions','business_id'),
      ('commerce_transactions','customer_id'),('commerce_transactions','appointment_id'),
      ('commerce_transactions','invoice_id'),('commerce_transactions','kind'),
      ('commerce_transactions','status'),('commerce_transactions','method'),
      ('commerce_transactions','amount_cents'),('commerce_transactions','currency'),
      ('commerce_transactions','provider'),('commerce_transactions','provider_reference'),
      ('commerce_transactions','description'),('commerce_transactions','metadata'),
      ('commerce_transactions','created_by'),('commerce_transactions','payment_attempt_id'),
      ('commerce_payment_reconciliation','business_id'),('commerce_payment_reconciliation','attempt_id'),
      ('commerce_payment_reconciliation','state'),
      ('commerce_invoices','business_id'),('commerce_invoice_lines','business_id'),
      ('commerce_receipts','business_id'),('commerce_receipts','created_at'),
      ('customer_payment_events','business_id'),
      ('background_jobs','business_id'),('background_jobs','created_at'),
      ('communication_follow_ups','business_id'),('communication_follow_ups','created_at'),
      ('communication_send_intents','business_id'),('communication_send_intents','created_at'),
      ('communications_audit_log','business_id'),('communications_audit_log','created_at'),
      ('notification_logs','business_id'),('notification_logs','created_at'),
      ('communication_history','business_id'),('communication_history','created_at'),
      ('notifications','business_id'),('notifications','created_at'),
      ('calendar_connections','business_id'),('calendar_connections','created_at'),
      ('external_events','calendar_connection_id'),('external_events','created_at')
    ) required(table_name,column_name)
    where not exists(
      select 1 from information_schema.columns c
      where c.table_schema='public' and c.table_name=required.table_name
        and c.column_name=required.column_name
    )
  ),
  'auth_inspection',
    has_table_privilege(current_user,'auth.users','SELECT')
    and has_table_privilege(current_user,'auth.identities','SELECT')
    and has_table_privilege(current_user,'auth.audit_log_entries','SELECT'),
  'observer_access', has_table_privilege(current_user,'pg_catalog.pg_stat_activity','SELECT'),
  'required_tables', (
    select count(*)=10 from (values
      (to_regclass('public.background_jobs')),
      (to_regclass('public.communication_follow_ups')),
      (to_regclass('public.communication_send_intents')),
      (to_regclass('public.communications_audit_log')),
      (to_regclass('public.notification_logs')),
      (to_regclass('public.communication_history')),
      (to_regclass('public.notifications')),
      (to_regclass('public.calendar_connections')),
      (to_regclass('public.external_events')),
      (to_regclass('public.commerce_receipts'))
    ) x(r) where r is not null
  ),
  'no_pg_cron', to_regclass('cron.job') is null,
  'no_dispatch_trigger', not exists(
    select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid
    where not t.tgisinternal
      and t.tgrelid in (
        'public.businesses'::regclass,'public.locations'::regclass,
        'public.customers'::regclass,'public.services'::regclass,
        'public.staff'::regclass,'public.appointments'::regclass,
        'public.commerce_transactions'::regclass,
        'public.commerce_payment_attempts'::regclass,
        'public.commerce_payment_attempt_events'::regclass,
        'public.commerce_payment_reconciliation'::regclass
      )
      and lower(pg_get_functiondef(p.oid)) ~
        '(background_jobs|communication_follow_ups|communication_send_intents|communications_audit_log|notification_logs|communication_history|notifications|calendar_connections|external_events|http_|net\\.|webhook|resend|twilio)'
  ),
  'zero_adoption',
    (select count(*) from public.commerce_payment_attempts)=0
    and (select count(*) from public.commerce_payment_attempt_events)=0
    and (select count(*) from public.commerce_payment_reconciliation)=0
    and (select count(*) from public.commerce_transactions where payment_attempt_id is not null)=0,
  'collision_free',
    not exists(select 1 from auth.users where lower(email) in ({actor_emails}))
    and not exists(select 1 from public.businesses where lower(email) in ({business_emails}) or slug in ({slugs}))
    and not exists(select 1 from public.customers where lower(email) like 'hv134-%@customer.invalid')
    and not exists(select 1 from public.commerce_payment_attempts where attempt_key in ({keys}))
    and not exists(select 1 from public.business_members m join auth.users u on u.id=m.user_id
      where lower(u.email) in ({actor_emails}))
    and not exists(select 1 from public.business_slug_aliases where slug in ({slugs})),
  'sequence', (
    select jsonb_build_object(
      'seqstart',s.seqstart::text,'seqmin',s.seqmin::text,'seqincrement',s.seqincrement::text,
      'seqcache',s.seqcache::text,'seqcycle',s.seqcycle,
      'last_value',(select last_value::text from public.commerce_payment_attempt_events_event_sequence_seq),
      'is_called',(select is_called from public.commerce_payment_attempt_events_event_sequence_seq)
    ) from pg_sequence s where s.seqrelid={q(SEQ)}::regclass
  ),
  'auth_audit_diagnostic',(
    select jsonb_build_object('count',count(*),'latest',max(created_at))
    from auth.audit_log_entries
  ),
  'communication_global_diagnostic',jsonb_build_object(
    'background_jobs',(select jsonb_build_array(count(*),max(created_at)) from public.background_jobs),
    'communication_follow_ups',(select jsonb_build_array(count(*),max(created_at)) from public.communication_follow_ups),
    'communication_send_intents',(select jsonb_build_array(count(*),max(created_at)) from public.communication_send_intents),
    'communications_audit_log',(select jsonb_build_array(count(*),max(created_at)) from public.communications_audit_log),
    'notification_logs',(select jsonb_build_array(count(*),max(created_at)) from public.notification_logs),
    'communication_history',(select jsonb_build_array(count(*),max(created_at)) from public.communication_history),
    'notifications',(select jsonb_build_array(count(*),max(created_at)) from public.notifications),
    'calendar_connections',(select jsonb_build_array(count(*),max(created_at)) from public.calendar_connections),
    'external_events',(select jsonb_build_array(count(*),max(created_at)) from public.external_events),
    'receipts',(select jsonb_build_array(count(*),max(created_at)) from public.commerce_receipts)
  ),
  'baseline', jsonb_build_object(
    'businesses',(select jsonb_build_array(count(*)::text,md5(coalesce(string_agg(row_to_json(x)::text,'|' order by id),''))) from public.businesses x),
    'customers',(select jsonb_build_array(count(*)::text,md5(coalesce(string_agg(row_to_json(x)::text,'|' order by id),''))) from public.customers x),
    'appointments',(select jsonb_build_array(count(*)::text,md5(coalesce(string_agg(row_to_json(x)::text,'|' order by id),''))) from public.appointments x),
    'transactions',(select jsonb_build_array(count(*)::text,md5(coalesce(string_agg(row_to_json(x)::text,'|' order by id),''))) from public.commerce_transactions x)
  )
)::text;
rollback;
"""
    result = db.one_json("preflight-db", sql, "hv134_preflight", timeout=30, read_only=True)
    bools = [
        "server17", "role_member", "foundation_history", "r1a_history", "admit_body",
        "commit_body", "execute_acl", "identity_rpc", "identity_a_clear", "identity_b_clear",
        "starter_plan", "service_attempt_acl",
        "service_event_acl", "service_ledger_acl", "service_binding_acl", "fixture_acl",
        "authenticated_legacy_acl", "fixture_columns", "auth_inspection", "observer_access", "required_tables",
        "no_pg_cron", "no_dispatch_trigger", "zero_adoption", "collision_free",
    ]
    assert_true_map(result, bools, "database preflight")
    sequence = result.get("sequence") or {}
    if sequence != {
        "seqstart": "1", "seqmin": "1", "seqincrement": "1", "seqcache": "1",
        "seqcycle": False, "last_value": sequence.get("last_value"),
        "is_called": sequence.get("is_called"),
    }:
        raise Stop("event sequence configuration drift")
    return result


def verify_created_actors(db: ManagementSQL, actor_a: str, actor_b: str, email_a: str, email_b: str) -> None:
    sql = f"""
begin read only; set local statement_timeout='15s';
select jsonb_build_object(
  'users',(
    select count(*) from auth.users
    where (id={q(actor_a)}::uuid and lower(email)={q(email_a)})
       or (id={q(actor_b)}::uuid and lower(email)={q(email_b)})
  ),
  'active_verified',(
    select count(*)=2 from auth.users
    where id in ({q(actor_a)}::uuid,{q(actor_b)}::uuid)
      and email_confirmed_at is not null and is_anonymous is not true
      and (banned_until is null or banned_until<=now())
  ),
  'email_identities',(
    select count(*) from auth.identities
    where user_id in ({q(actor_a)}::uuid,{q(actor_b)}::uuid) and provider='email'
  ),
  'business_ownership',(
    select count(*) from public.businesses where owner_id in ({q(actor_a)}::uuid,{q(actor_b)}::uuid)
  ),
  'memberships',(
    select count(*) from public.business_members where user_id in ({q(actor_a)}::uuid,{q(actor_b)}::uuid)
  ),
  'operator_marker',(
    select count(*) from auth.users
    where id in ({q(actor_a)}::uuid,{q(actor_b)}::uuid)
      and coalesce(raw_app_meta_data,'{{}}'::jsonb) ? 'chasum_operator'
  )
)::text;
rollback;
"""
    result = db.one_json("auth-postcreate-check", sql, "hv134_authcheck")
    expected = {
        "users": 2,
        "active_verified": True,
        "email_identities": 2,
        "business_ownership": 0,
        "memberships": 0,
        "operator_marker": 0,
    }
    if result != expected:
        raise Stop("created Auth actor prerequisites mismatch; retain actors and stop")


def provision(
    db: ManagementSQL,
    fixture: dict[str, Any],
    actor_a: str,
    actor_b: str,
    generated: dict[str, str],
) -> dict[str, Any]:
    ba, bb = fixture["businesses"]["a"], fixture["businesses"]["b"]
    ca, cb = fixture["fixture"]["customers"], fixture["fixture"]["customers"]["b1"]
    service, staff = fixture["fixture"]["service"], fixture["fixture"]["staff"]
    ap1, ap2 = fixture["fixture"]["appointments"]["a1"], fixture["fixture"]["appointments"]["a2"]

    def identity_call(actor: str, business: dict[str, Any]) -> str:
        args = [
            actor, "create_new", business["name"], business["legal_name"], business["email"],
            business["phone"], business["website"], business["city"], business["region"],
            business["country"], business["requested_slug"],
        ]
        return "public.decide_business_identity(" + ",".join(q(x) for x in args) + ")"

    sql = f"""
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local role service_role;
do $hv$
declare
  ra jsonb; rb jsonb; aid uuid; bid uuid; aloc uuid;
  c1 uuid:={q(generated["customer_a1"])}; c2 uuid:={q(generated["customer_a2"])};
  cb1 uuid:={q(generated["customer_b1"])}; svc uuid:={q(generated["service"])};
  st uuid:={q(generated["staff"])};
begin
  ra := {identity_call(actor_a, ba)};
  if ra->>'status' is distinct from 'created' then raise exception 'HV134_IDENTITY_A_NOT_CREATED'; end if;
  aid := (ra->'business'->>'id')::uuid;
  update public.businesses set
    currency='cad', timezone='America/Toronto',
    email_notifications_enabled=false, sms_notifications_enabled=false,
    owner_notifications_enabled=false, staff_notifications_enabled=false,
    marketing_email_enabled=false, online_booking_enabled=false,
    public_booking_mode='staff_only', notification_email=null
  where id=aid and owner_id={q(actor_a)}::uuid;
  if not found then raise exception 'HV134_BUSINESS_A_CONTAINMENT_FAILED'; end if;
  select id into strict aloc from public.locations where business_id=aid and is_default;
  update public.locations set timezone='America/Toronto', phone=null where id=aloc;

  rb := {identity_call(actor_b, bb)};
  if rb->>'status' is distinct from 'created' then raise exception 'HV134_IDENTITY_B_NOT_CREATED'; end if;
  bid := (rb->'business'->>'id')::uuid;
  update public.businesses set
    currency='cad', timezone='America/Toronto',
    email_notifications_enabled=false, sms_notifications_enabled=false,
    owner_notifications_enabled=false, staff_notifications_enabled=false,
    marketing_email_enabled=false, online_booking_enabled=false,
    public_booking_mode='staff_only', notification_email=null
  where id=bid and owner_id={q(actor_b)}::uuid;
  if not found then raise exception 'HV134_BUSINESS_B_CONTAINMENT_FAILED'; end if;
  update public.locations set timezone='America/Toronto', phone=null where business_id=bid and is_default;

  insert into public.customers(id,business_id,name,email,phone)
    values(c1,aid,{q(ca["a1"]["name"])},{q(ca["a1"]["email"])},null);
  insert into public.customers(id,business_id,name,email,phone)
    values(c2,aid,{q(ca["a2"]["name"])},{q(ca["a2"]["email"])},null);
  insert into public.customers(id,business_id,name,email,phone)
    values(cb1,bid,{q(cb["name"])},{q(cb["email"])},null);

  insert into public.services(
    id,business_id,location_id,name,duration_minutes,price,deposit_cents,deposit_required,
    is_active,online_booking,booking_visibility,commercial_settings_reviewed
  ) values (
    svc,aid,aloc,{q(service["name"])},{service["duration_minutes"]},{q(service["price"])}::numeric,
    {service["deposit_cents"]},true,false,false,'internal',false
  );

  insert into public.staff(
    id,business_id,location_id,default_location_id,name,email,phone,user_id,is_active,
    employment_status,accept_online_bookings,accept_new_clients,accept_walk_ins
  ) values (st,aid,aloc,aloc,{q(staff["name"])},null,null,null,false,'active',false,false,false);
  update public.staff_working_hours set is_working=false where staff_id=st;
  if (select count(*) from public.staff_working_hours where staff_id=st)<>7 then
    raise exception 'HV134_STAFF_HOURS_NOT_SEVEN';
  end if;
  insert into public.service_locations(service_id,location_id,is_primary) values(svc,aloc,true);
  insert into public.staff_locations(staff_id,location_id,is_primary) values(st,aloc,true);
  insert into public.staff_services(staff_id,service_id) values(st,svc);

  insert into public.appointments(
    id,business_id,location_id,service_id,staff_id,customer_id,start_time,end_time,status,
    price_cents,tax_cents,discount_cents,deposit_cents,amount_paid_cents,amount_refunded_cents,payment_status
  ) values (
    {q(generated["appointment_a1"])},aid,aloc,svc,st,c1,{q(ap1["start_time"])}::timestamptz,{q(ap1["end_time"])}::timestamptz,
    'confirmed',{ap1["price_cents"]},0,0,{ap1["deposit_cents"]},0,0,{q(ap1["payment_status"])}
  );
  insert into public.appointments(
    id,business_id,location_id,service_id,staff_id,customer_id,start_time,end_time,status,
    price_cents,tax_cents,discount_cents,deposit_cents,amount_paid_cents,amount_refunded_cents,payment_status
  ) values (
    {q(generated["appointment_a2"])},aid,aloc,svc,st,c1,{q(ap2["start_time"])}::timestamptz,{q(ap2["end_time"])}::timestamptz,
    'confirmed',{ap2["price_cents"]},0,0,0,0,0,{q(ap2["payment_status"])}
  );
end
$hv$;
commit;
select jsonb_build_object(
  'actor_a',{q(actor_a)},'actor_b',{q(actor_b)},
  'business_a',(select id from public.businesses where owner_id={q(actor_a)}::uuid),
  'business_b',(select id from public.businesses where owner_id={q(actor_b)}::uuid),
  'location_a',(select id from public.locations where business_id=(select id from public.businesses where owner_id={q(actor_a)}::uuid) and is_default),
  'location_b',(select id from public.locations where business_id=(select id from public.businesses where owner_id={q(actor_b)}::uuid) and is_default),
  'customer_a1',{q(generated["customer_a1"])},'customer_a2',{q(generated["customer_a2"])},
  'customer_b1',{q(generated["customer_b1"])},'service',{q(generated["service"])},
  'staff',{q(generated["staff"])},'appointment_a1',{q(generated["appointment_a1"])},
  'appointment_a2',{q(generated["appointment_a2"])}
)::text;
"""
    result = db.one_json("provision", sql, "hv134_provision", timeout=45)
    for key, value in result.items():
        if key.startswith(("actor_", "business_", "location_", "customer_", "service", "staff", "appointment_")):
            require_uuid(value, key)
    return result


def containment(db: ManagementSQL, ids: dict[str, str], key: str) -> dict[str, Any]:
    businesses = f"{q(ids['business_a'])}::uuid,{q(ids['business_b'])}::uuid"
    sql = f"""
begin read only;
set local statement_timeout='15s';
select jsonb_build_object(
 'tenant',jsonb_build_object(
   'background_jobs',(select count(*) from public.background_jobs where business_id in ({businesses})),
   'communication_follow_ups',(select count(*) from public.communication_follow_ups where business_id in ({businesses})),
   'communication_send_intents',(select count(*) from public.communication_send_intents where business_id in ({businesses})),
   'communications_audit_log',(select count(*) from public.communications_audit_log where business_id in ({businesses})),
   'notification_logs',(select count(*) from public.notification_logs where business_id in ({businesses})),
   'communication_history',(select count(*) from public.communication_history where business_id in ({businesses})),
   'notifications',(select count(*) from public.notifications where business_id in ({businesses})),
   'calendar_connections',(select count(*) from public.calendar_connections where business_id in ({businesses})),
   'external_events',(select count(*) from public.external_events e join public.calendar_connections c
     on c.id=e.calendar_connection_id where c.business_id in ({businesses})),
   'receipts',(select count(*) from public.commerce_receipts where business_id in ({businesses}))
 ),
 'global_diagnostic',jsonb_build_object(
   'background_jobs',(select jsonb_build_array(count(*),max(created_at)) from public.background_jobs),
   'communication_follow_ups',(select jsonb_build_array(count(*),max(created_at)) from public.communication_follow_ups),
   'communication_send_intents',(select jsonb_build_array(count(*),max(created_at)) from public.communication_send_intents),
   'communications_audit_log',(select jsonb_build_array(count(*),max(created_at)) from public.communications_audit_log),
   'notification_logs',(select jsonb_build_array(count(*),max(created_at)) from public.notification_logs),
   'communication_history',(select jsonb_build_array(count(*),max(created_at)) from public.communication_history),
   'notifications',(select jsonb_build_array(count(*),max(created_at)) from public.notifications),
   'calendar_connections',(select jsonb_build_array(count(*),max(created_at)) from public.calendar_connections),
   'external_events',(select jsonb_build_array(count(*),max(created_at)) from public.external_events),
   'receipts',(select jsonb_build_array(count(*),max(created_at)) from public.commerce_receipts)
 )
)::text;
rollback;
"""
    result = db.one_json(key, sql, "hv134_containment", read_only=True)
    tenant = result.get("tenant")
    if not isinstance(tenant, dict) or any(value != 0 for value in tenant.values()):
        raise Stop(f"{key}: containment delta is nonzero")
    return result


def set_claims_sql(actor: str) -> str:
    claims = canonical_json({"sub": actor, "role": "authenticated"})
    return (
        "do $claims$ begin "
        f"perform set_config('request.jwt.claim.sub',{q(actor)},true);"
        "perform set_config('request.jwt.claim.role','authenticated',true);"
        f"perform set_config('request.jwt.claims',{q(claims)},true);"
        "end $claims$;"
    )


def legacy_smoke(db: ManagementSQL, fixture: dict[str, Any], ids: dict[str, str]) -> None:
    item = fixture["legacy_rollback"]
    sql = f"""
begin;
set local lock_timeout='5s'; set local statement_timeout='15s';
set local role authenticated; {set_claims_sql(ids['actor_a'])}
do $hv$
declare tx uuid; n integer;
begin
  insert into public.commerce_transactions(
    business_id,customer_id,appointment_id,invoice_id,kind,status,method,amount_cents,
    currency,provider,provider_reference,description,metadata,created_by,payment_attempt_id
  ) values (
    {q(ids['business_a'])},{q(ids['customer_a1'])},{q(ids['appointment_a1'])},null,
    {q(item['kind'])},{q(item['status'])},{q(item['method'])},{item['amount_cents']},
    {q(item['currency'])},{q(item['provider'])},{q(item['provider_reference'])},
    {q(item['description_before'])},'{{}}'::jsonb,{q(ids['actor_a'])},null
  ) returning id into tx;
  update public.commerce_transactions set description={q(item['description_after'])}
    where id=tx and payment_attempt_id is null;
  get diagnostics n=row_count; if n<>1 then raise exception 'HV134_LEGACY_UPDATE_COUNT'; end if;
  delete from public.commerce_transactions where id=tx and payment_attempt_id is null;
  get diagnostics n=row_count; if n<>1 then raise exception 'HV134_LEGACY_DELETE_COUNT'; end if;
end $hv$;
rollback;
select jsonb_build_object(
  'durable_rows',(select count(*) from public.commerce_transactions where provider_reference={q(item['provider_reference'])}),
  'attempts',(select count(*) from public.commerce_payment_attempts)
)::text;
"""
    result = db.one_json("legacy-null-link", sql, "hv134_legacy")
    if result != {"durable_rows": 0, "attempts": 0}:
        raise Stop("legacy NULL-link rollback left a durable effect")


def resolve_attempt_ids(item: dict[str, Any], ids: dict[str, str]) -> tuple[str, str | None]:
    customer = ids["customer_" + item["customer"]]
    appointment = None if item["appointment"] is None else ids["appointment_" + item["appointment"]]
    return customer, appointment


def admit(db: ManagementSQL, fixture: dict[str, Any], ids: dict[str, str], name: str, key: str) -> dict[str, Any]:
    item = fixture["attempts"][name]
    customer, appointment = resolve_attempt_ids(item, ids)
    fingerprint = intent_fingerprint(ids["business_a"], customer, appointment, item)
    sql = f"""
begin; set local lock_timeout='5s'; set local statement_timeout='15s'; set local role service_role;
select row_to_json(x)::text from public.admit_payment_attempt_v1(
 {q(ids['business_a'])},{q(item['attempt_key'])},{q(fingerprint)},{q(item['source'])},
 {q(customer)},{q(appointment)},{q(ids['actor_a'])},{q(item['payment_kind'])},
 {item['amount_cents']},{q(item['currency'])},{q(item['method'])},{q(item['provider_route'])}
) x;
commit;
"""
    return db.one_json(key, sql, f"hv134_{name}")


def commit_attempt(db: ManagementSQL, ids: dict[str, str], attempt_id: str, key: str, app: str) -> dict[str, Any]:
    sql = f"""
begin; set local lock_timeout='10s'; set local statement_timeout='30s'; set local role service_role;
select row_to_json(x)::text from public.commit_manual_payment_attempt_v1(
 {q(ids['business_a'])},{q(attempt_id)}
) x;
commit;
"""
    return db.one_json(key, sql, app, timeout=35)


def negative_cases(db: ManagementSQL, fixture: dict[str, Any], ids: dict[str, str]) -> None:
    atomic = fixture["attempts"]["atomic_rollback"]
    atomic_customer, atomic_appt = resolve_attempt_ids(atomic, ids)
    atomic_fp = intent_fingerprint(ids["business_a"], atomic_customer, atomic_appt, atomic)
    sql = f"""
begin;
set local lock_timeout='5s'; set local statement_timeout='30s'; set local role service_role;
do $hv$
declare ok integer:=0; a record; c record;
begin
  begin
    perform * from public.admit_payment_attempt_v1(
      {q(ids['business_a'])},'13400000-0000-4000-8000-000000000081',
      'v1:'||repeat('8',64),'collect_payment',{q(ids['customer_b1'])},null,{q(ids['actor_a'])},
      'payment',100,'cad','cash','manual');
  exception when foreign_key_violation then
    if position('PAYMENT_ATTEMPT_CUSTOMER_BINDING_INVALID' in sqlerrm)>0 then ok:=ok+1; else raise; end if;
  end;
  begin
    perform * from public.admit_payment_attempt_v1(
      {q(ids['business_a'])},'13400000-0000-4000-8000-000000000082',
      'v1:'||repeat('8',64),'collect_payment',{q(ids['customer_a1'])},null,{q(ids['actor_a'])},
      'payment',100,'CAD','cash','manual');
  exception when invalid_parameter_value then
    if position('PAYMENT_ATTEMPT_INVALID_R1A_REQUEST' in sqlerrm)>0 then ok:=ok+1; else raise; end if;
  end;
  begin
    perform * from public.admit_payment_attempt_v1(
      {q(ids['business_a'])},'13400000-0000-4000-8000-000000000083',
      'v1:'||repeat('8',64),'collect_payment',{q(ids['customer_a1'])},null,{q(ids['actor_a'])},
      'none',0,'cad',null,null);
  exception when invalid_parameter_value then
    if position('PAYMENT_ATTEMPT_INVALID_R1A_REQUEST' in sqlerrm)>0 then ok:=ok+1; else raise; end if;
  end;
  if ok<>3 then raise exception 'HV134_NEGATIVE_COUNT'; end if;
  select * into a from public.admit_payment_attempt_v1(
    {q(ids['business_a'])},{q(atomic['attempt_key'])},{q(atomic_fp)},{q(atomic['source'])},
    {q(atomic_customer)},{q(atomic_appt)},{q(ids['actor_a'])},{q(atomic['payment_kind'])},
    {atomic['amount_cents']},{q(atomic['currency'])},{q(atomic['method'])},{q(atomic['provider_route'])}
  );
  select * into c from public.commit_manual_payment_attempt_v1({q(ids['business_a'])},a.attempt_id);
  if a.outcome<>'ADMITTED' or c.outcome<>'RECORDED'
    or (select count(*) from public.commerce_payment_attempt_events where attempt_id=a.attempt_id)<>2
    or (select count(*) from public.commerce_transactions where payment_attempt_id=a.attempt_id)<>1
    or (select count(*) from public.commerce_payment_reconciliation where attempt_id=a.attempt_id)<>4
  then raise exception 'HV134_ATOMIC_IN_TRANSACTION'; end if;
end $hv$;
rollback;
select jsonb_build_object(
 'atomic_attempts',(select count(*) from public.commerce_payment_attempts where attempt_key={q(atomic['attempt_key'])}),
 'negative_attempts',(select count(*) from public.commerce_payment_attempts where attempt_key in (
   '13400000-0000-4000-8000-000000000081','13400000-0000-4000-8000-000000000082','13400000-0000-4000-8000-000000000083'
 ))
)::text;
"""
    result = db.one_json("negative-atomic", sql, "hv134_negative")
    if result != {"atomic_attempts": 0, "negative_attempts": 0}:
        raise Stop("negative/atomic rollback residue")


def reassignment_precheck(db: ManagementSQL, fixture: dict[str, Any], ids: dict[str, str]) -> str:
    r1 = admit(db, fixture, ids, "r1", "r1-admit")
    if r1.get("outcome") != "ADMITTED":
        raise Stop("R1 was not newly admitted")
    attempt_id = require_uuid(r1.get("attempt_id"), "R1 attempt")
    sql = f"""
begin; set local lock_timeout='5s'; set local statement_timeout='15s';
set local role authenticated; {set_claims_sql(ids['actor_a'])}
update public.appointments set customer_id={q(ids['customer_a2'])}::uuid
 where id={q(ids['appointment_a2'])}::uuid and business_id={q(ids['business_a'])}::uuid;
reset role; set local role service_role;
select row_to_json(x)::text from public.commit_manual_payment_attempt_v1(
 {q(ids['business_a'])},{q(attempt_id)}
) x;
rollback;
"""
    result = db.one_json("r1-precheck", sql, "hv134_r1pre")
    if result.get("outcome") != "UNKNOWN" or result.get("recorded") is not False:
        raise Stop("R1 mismatch did not return unrecorded UNKNOWN")
    return attempt_id


def run_concurrency(db: ManagementSQL, ids: dict[str, str], attempt_id: str, evidence: Evidence) -> tuple[dict[str, Any], dict[str, Any]]:
    nonce = uuid.uuid4().hex[:8]
    pending_app = f"hv134_h_{nonce}_pending"
    ready_app = f"hv134_h_{nonce}_ready"
    observer_app = f"hv134_o_{nonce}"
    waiter_apps = (f"hv134_w1_{nonce}", f"hv134_w2_{nonce}")
    holder_sql = f"""
begin;
set local lock_timeout='5s'; set local statement_timeout='12s';
set local application_name={q(pending_app)}; set local role service_role;
select id from public.commerce_payment_attempts
 where id={q(attempt_id)}::uuid and business_id={q(ids['business_a'])}::uuid for update;
set local application_name={q(ready_app)};
do $hv$
declare i integer; ok boolean:=false; witness jsonb; holder integer:=pg_backend_pid();
begin
  for i in 1..100 loop
    perform pg_stat_clear_snapshot();
    with recursive chain(root,pid,path) as (
      select a.pid,a.pid,array[a.pid] from pg_stat_activity a
       where a.application_name in ({q(waiter_apps[0])},{q(waiter_apps[1])})
         and a.wait_event_type='Lock'
      union all
      select c.root,b.pid,c.path||b.pid
      from chain c cross join lateral unnest(pg_blocking_pids(c.pid)) b(pid)
      where not b.pid=any(c.path)
    ), roots as (
      select root,bool_or(pid=holder) reaches_holder from chain group by root
    )
    select count(*)=2 and coalesce(bool_and(reaches_holder),false) into ok from roots;
    if ok then
      with recursive chain(root,pid,path) as (
        select a.pid,a.pid,array[a.pid] from pg_stat_activity a
         where a.application_name in ({q(waiter_apps[0])},{q(waiter_apps[1])})
           and a.wait_event_type='Lock'
        union all
        select c.root,b.pid,c.path||b.pid
        from chain c cross join lateral unnest(pg_blocking_pids(c.pid)) b(pid)
        where not b.pid=any(c.path)
      )
      select jsonb_build_object(
        'holder_pid',holder,
        'blocker_chain',(select jsonb_agg(jsonb_build_object(
          'worker_pid',root,'pid',pid,'path',path
        ) order by root,array_length(path,1)) from chain),
        'workers',coalesce(jsonb_agg(jsonb_build_object(
          'application_name',a.application_name,'pid',a.pid,'state',a.state,
          'wait_event_type',a.wait_event_type,'wait_event',a.wait_event,
          'blocking_pids',pg_blocking_pids(a.pid)
        ) order by a.application_name),'[]'::jsonb)
      ) into witness from pg_stat_activity a
       where a.application_name in ({q(waiter_apps[0])},{q(waiter_apps[1])});
      perform set_config('hv134.witness',witness::text,false);
      exit;
    end if;
    perform pg_sleep(0.1);
  end loop;
  if not coalesce(ok,false) then raise exception 'HV134_CONCURRENCY_WITNESS_TIMEOUT'; end if;
end $hv$;
select jsonb_build_object(
 'holder_pid',pg_backend_pid(),'witness',current_setting('hv134.witness')::jsonb
)::text;
commit;
"""
    waiter_sql = f"""
begin; set local lock_timeout='20s'; set local statement_timeout='20s'; set local role service_role;
select row_to_json(x)::text from public.commit_manual_payment_attempt_v1(
 {q(ids['business_a'])},{q(attempt_id)}
) x;
commit;
"""

    futures = []
    with ThreadPoolExecutor(max_workers=3, thread_name_prefix="hv134") as pool:
        holder = pool.submit(
            db.one_json, "concurrency-holder", holder_sql, pending_app, 30, False
        )
        futures.append(holder)

        # The separate read-only request must positively observe holder readiness
        # after the row lock and before either worker request is dispatched.
        ready = False
        observer_deadline = time.monotonic() + 4
        while time.monotonic() < observer_deadline:
            observation = db.one_json(
                "concurrency-ready-observer",
                f"""begin read only; set local statement_timeout='2s';
                select jsonb_build_object('ready',count(*)=1,'pid',min(pid))
                from pg_stat_activity where application_name={q(ready_app)};
                rollback;""",
                observer_app,
                timeout=5,
                read_only=True,
            )
            if observation.get("ready") is True:
                ready = True
                break
            time.sleep(0.2)
        if not ready:
            done, pending = wait(futures, timeout=14)
            raise Stop("holder readiness was not observed; no worker was dispatched")

        # Independent HTTPS requests; both are dispatched only after readiness.
        workers = [
            pool.submit(db.one_json, f"concurrency-worker-{index}", waiter_sql, app, 30, False)
            for index, app in enumerate(waiter_apps, start=1)
        ]
        futures.extend(workers)
        done, pending = wait(futures, timeout=32)
        if pending:
            raise Stop("bounded concurrency request wait expired; preserve evidence")
        try:
            witness = holder.result()
            results = [worker.result() for worker in workers]
        except Exception:
            # The executor has already boundedly awaited every dispatched request.
            raise

    outcomes = sorted(result.get("outcome") for result in results)
    if outcomes != ["RECORDED", "REPLAY"]:
        raise Stop("concurrency outcomes were not exactly RECORDED + REPLAY")
    if (
        results[0].get("attempt_id") != results[1].get("attempt_id")
        or results[0].get("transaction_id") != results[1].get("transaction_id")
    ):
        raise Stop("concurrency evidence identities differ")
    evidence.record(
        "concurrency-overlap",
        "MATCH",
        witness=witness,
        outcomes=results,
        shared_attempt_id=results[0].get("attempt_id"),
        shared_transaction_id=results[0].get("transaction_id"),
    )
    return results[0], results[1]


def retained_matrix(db: ManagementSQL, fixture: dict[str, Any], ids: dict[str, str], evidence: Evidence) -> dict[str, str]:
    retained: dict[str, str] = {}

    d1 = admit(db, fixture, ids, "d1", "d1-admit")
    if d1.get("outcome") != "ADMITTED":
        raise Stop("D1 admission mismatch")
    retained["d1"] = require_uuid(d1.get("attempt_id"), "D1 attempt")
    d1_commit = commit_attempt(db, ids, retained["d1"], "d1-commit", "hv134_d1commit")
    d1_existing = admit(db, fixture, ids, "d1", "d1-readmit")
    d1_replay = commit_attempt(db, ids, retained["d1"], "d1-replay", "hv134_d1replay")
    if (
        d1_commit.get("outcome") != "RECORDED"
        or d1_existing.get("outcome") != "EXISTING"
        or d1_replay.get("outcome") != "REPLAY"
        or d1_commit.get("transaction_id") != d1_replay.get("transaction_id")
    ):
        raise Stop("D1 record/replay mismatch")
    conflict1 = admit(db, fixture, ids, "d1_conflict", "d1-conflict-1")
    conflict2 = admit(db, fixture, ids, "d1_conflict", "d1-conflict-2")
    if (
        conflict1.get("outcome") != "KEY_CONFLICT"
        or conflict2.get("outcome") != "KEY_CONFLICT"
        or conflict1.get("conflict_event_id") != conflict2.get("conflict_event_id")
        or conflict1.get("attempt_id") != retained["d1"]
    ):
        raise Stop("D1 conflict identity mismatch")

    d2 = admit(db, fixture, ids, "d2", "d2-admit")
    if d2.get("outcome") != "ADMITTED":
        raise Stop("D2 admission mismatch")
    retained["d2"] = require_uuid(d2.get("attempt_id"), "D2 attempt")
    d2_commit = commit_attempt(db, ids, retained["d2"], "d2-commit-acknowledged", "hv134_d2commit")
    if d2_commit.get("outcome") != "RECORDED":
        raise Stop("D2 acknowledged commit mismatch")
    evidence.record(
        "d2-response-suppressed",
        "MATCH",
        description="COMMIT returned success; result deliberately withheld from simulated caller",
        attempt_id=retained["d2"],
    )
    d2_recover = admit(db, fixture, ids, "d2", "d2-recover")
    d2_replay = commit_attempt(db, ids, retained["d2"], "d2-replay", "hv134_d2replay")
    if (
        d2_recover.get("outcome") != "EXISTING"
        or d2_replay.get("outcome") != "REPLAY"
        or d2_commit.get("transaction_id") != d2_replay.get("transaction_id")
    ):
        raise Stop("D2 response-suppression recovery mismatch")

    f1 = admit(db, fixture, ids, "f1", "f1-admit")
    if f1.get("outcome") != "ADMITTED":
        raise Stop("F1 admission mismatch")
    retained["f1"] = require_uuid(f1.get("attempt_id"), "F1 attempt")
    run_concurrency(db, ids, retained["f1"], evidence)

    n1 = admit(db, fixture, ids, "n1", "n1-admit")
    if n1.get("outcome") != "ADMITTED":
        raise Stop("N1 admission mismatch")
    retained["n1"] = require_uuid(n1.get("attempt_id"), "N1 attempt")
    return retained


def final_reconciliation(
    db: ManagementSQL,
    fixture: dict[str, Any],
    ids: dict[str, str],
    preflight: dict[str, Any],
) -> dict[str, Any]:
    keys = ", ".join(q(fixture["attempts"][name]["attempt_key"]) for name in ("d1", "d2", "f1", "n1", "r1"))
    businesses = f"{q(ids['business_a'])}::uuid,{q(ids['business_b'])}::uuid"
    sql = f"""
begin read only; set local statement_timeout='30s';
select jsonb_build_object(
 'businesses',(select count(*) from public.businesses where id in ({businesses})),
 'business_hours',(select count(*) from public.business_hours where business_id in ({businesses})),
 'locations',(select count(*) from public.locations where business_id in ({businesses})),
 'location_settings',(select count(*) from public.location_settings s join public.locations l on l.id=s.location_id where l.business_id in ({businesses})),
 'location_hours',(select count(*) from public.location_hours h join public.locations l on l.id=h.location_id where l.business_id in ({businesses})),
 'identity_decisions',(select count(*) from public.tenant_identity_decisions where actor_user_id in ({q(ids['actor_a'])}::uuid,{q(ids['actor_b'])}::uuid)),
 'customers',(select count(*) from public.customers where business_id in ({businesses})),
 'services',(select count(*) from public.services where business_id in ({businesses})),
 'staff',(select count(*) from public.staff where business_id in ({businesses})),
 'staff_hours',(select count(*) from public.staff_working_hours where staff_id={q(ids['staff'])}::uuid),
 'service_locations',(select count(*) from public.service_locations where service_id={q(ids['service'])}::uuid),
 'staff_locations',(select count(*) from public.staff_locations where staff_id={q(ids['staff'])}::uuid),
 'staff_services',(select count(*) from public.staff_services where staff_id={q(ids['staff'])}::uuid),
 'appointments',(select count(*) from public.appointments where business_id in ({businesses})),
 'attempts',(select count(*) from public.commerce_payment_attempts where attempt_key in ({keys})),
 'accepted_attempts',(select count(*) from public.commerce_payment_attempts where attempt_key in ({keys}) and execution_state='ACCEPTED'),
 'requested_attempts',(select count(*) from public.commerce_payment_attempts where attempt_key in ({keys}) and execution_state='REQUESTED'),
 'events',(select count(*) from public.commerce_payment_attempt_events where business_id={q(ids['business_a'])}::uuid),
 'requested_events',(select count(*) from public.commerce_payment_attempt_events where business_id={q(ids['business_a'])}::uuid and event_type='REQUESTED'),
 'accepted_events',(select count(*) from public.commerce_payment_attempt_events where business_id={q(ids['business_a'])}::uuid and event_type='ACCEPTED'),
 'conflict_events',(select count(*) from public.commerce_payment_attempt_events where business_id={q(ids['business_a'])}::uuid and event_type='KEY_CONFLICT'),
 'ledger',(select count(*) from public.commerce_transactions where business_id={q(ids['business_a'])}::uuid and payment_attempt_id is not null),
 'obligations',(select count(*) from public.commerce_payment_reconciliation where business_id={q(ids['business_a'])}::uuid),
 'pending_obligations',(select count(*) from public.commerce_payment_reconciliation where business_id={q(ids['business_a'])}::uuid and state='PENDING'),
 'invoices',(select count(*) from public.commerce_invoices where business_id in ({businesses})),
 'invoice_lines',(select count(*) from public.commerce_invoice_lines where business_id in ({businesses})),
 'receipts',(select count(*) from public.commerce_receipts where business_id in ({businesses})),
 'crm_mirror',(select count(*) from public.customer_payment_events where business_id in ({businesses})),
 'communication_rows',
   (select count(*) from public.background_jobs where business_id in ({businesses}))
   +(select count(*) from public.communication_follow_ups where business_id in ({businesses}))
   +(select count(*) from public.communication_send_intents where business_id in ({businesses}))
   +(select count(*) from public.communications_audit_log where business_id in ({businesses}))
   +(select count(*) from public.notification_logs where business_id in ({businesses}))
   +(select count(*) from public.communication_history where business_id in ({businesses}))
   +(select count(*) from public.notifications where business_id in ({businesses}))
   +(select count(*) from public.calendar_connections where business_id in ({businesses})),
 'cache_unchanged', (
   select bool_and(row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is not distinct from row(0,0,
     case when a.id={q(ids['appointment_a1'])}::uuid then 'deposit_required' else 'unpaid' end))
   from public.appointments a where a.id in ({q(ids['appointment_a1'])}::uuid,{q(ids['appointment_a2'])}::uuid)
 ),
 'r1_exact',(select amount_cents=1300 and execution_state='REQUESTED' from public.commerce_payment_attempts
   where attempt_key={q(fixture['attempts']['r1']['attempt_key'])}),
 'n1_exact',(select amount_cents=2500 and execution_state='REQUESTED' from public.commerce_payment_attempts
   where attempt_key={q(fixture['attempts']['n1']['attempt_key'])}),
 'auth_users',(select count(*) from auth.users where id in ({q(ids['actor_a'])}::uuid,{q(ids['actor_b'])}::uuid)),
 'auth_identities',(select count(*) from auth.identities where user_id in ({q(ids['actor_a'])}::uuid,{q(ids['actor_b'])}::uuid)),
 'auth_audit_diagnostic',(select jsonb_build_object('count',count(*),'latest',max(created_at)) from auth.audit_log_entries),
 'business_members',(select count(*) from public.business_members where business_id in ({businesses})),
 'business_slug_aliases',(select count(*) from public.business_slug_aliases where business_id in ({businesses})),
 'contained',
   not exists(select 1 from public.services where id={q(ids['service'])}::uuid and (is_active or online_booking or booking_visibility<>'internal'))
   and not exists(select 1 from public.staff where id={q(ids['staff'])}::uuid and (is_active or accept_online_bookings or email is not null or phone is not null or user_id is not null))
   and not exists(select 1 from public.staff_working_hours where staff_id={q(ids['staff'])}::uuid and is_working),
 'business_contained', not exists(
   select 1 from public.businesses where id in ({businesses}) and (
     currency<>'cad' or timezone<>'America/Toronto'
     or email_notifications_enabled or sms_notifications_enabled
     or owner_notifications_enabled or staff_notifications_enabled
     or marketing_email_enabled or online_booking_enabled
     or public_booking_mode<>'staff_only' or notification_email is not null
   )
 ),
 'appointment_customer_restored',(select customer_id={q(ids['customer_a1'])}::uuid from public.appointments where id={q(ids['appointment_a2'])}::uuid),
 'sequence',(
   select jsonb_build_object(
    'seqstart',s.seqstart::text,'seqmin',s.seqmin::text,'seqincrement',s.seqincrement::text,
    'seqcache',s.seqcache::text,'seqcycle',s.seqcycle,
    'last_value',(select last_value::text from public.commerce_payment_attempt_events_event_sequence_seq),
    'is_called',(select is_called from public.commerce_payment_attempt_events_event_sequence_seq)
   ) from pg_sequence s where s.seqrelid={q(SEQ)}::regclass
 )
)::text;
rollback;
"""
    result = db.one_json("final-reconciliation", sql, "hv134_final")
    expected = {
        "businesses": 2, "business_hours": 14, "locations": 2, "location_settings": 2,
        "location_hours": 14, "identity_decisions": 2, "customers": 3, "services": 1,
        "staff": 1, "staff_hours": 7, "service_locations": 1, "staff_locations": 1,
        "staff_services": 1, "appointments": 2, "attempts": 5, "accepted_attempts": 3,
        "requested_attempts": 2, "events": 9, "requested_events": 5, "accepted_events": 3,
        "conflict_events": 1, "ledger": 3, "obligations": 12, "pending_obligations": 12,
        "invoices": 0, "invoice_lines": 0, "receipts": 0, "crm_mirror": 0,
        "communication_rows": 0, "auth_users": 2, "auth_identities": 2,
        "business_members": 0, "business_slug_aliases": 0,
        "cache_unchanged": True, "r1_exact": True, "n1_exact": True, "contained": True,
        "business_contained": True, "appointment_customer_restored": True,
    }
    drift = {key: {"expected": value, "observed": result.get(key)} for key, value in expected.items() if result.get(key) != value}
    if drift:
        raise Stop("final reconciliation drift: " + canonical_json(drift))
    before = preflight["sequence"]
    after = result["sequence"]
    pre_last = int(before["last_value"])
    expected_last = pre_last + (11 if before["is_called"] is False else 12)
    if (
        after.get("seqstart") != "1"
        or after.get("seqmin") != "1"
        or after.get("seqincrement") != "1"
        or after.get("seqcache") != "1"
        or after.get("seqcycle") is not False
        or after.get("is_called") is not True
        or int(after.get("last_value")) != expected_last
    ):
        raise Stop("event sequence movement requires investigation; no corruption conclusion")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--approved-package-hash")
    parser.add_argument("--run-id")
    args = parser.parse_args()

    pkg_hash, members = package_hash()
    if not args.execute:
        print("REFUSED: prepared-only runner; no external call or environment read occurred.")
        print(f"aggregate_package_sha256={pkg_hash}")
        return 2
    if args.approved_package_hash != pkg_hash:
        print("STOP: approved package hash does not match exact package bytes.", file=sys.stderr)
        return 3
    if not args.run_id or not RUN_RE.fullmatch(args.run_id):
        print("STOP: run identifier is absent or invalid.", file=sys.stderr)
        return 3

    fixture = load_fixture()
    evidence = Evidence(args.run_id, pkg_hash, members)
    try:
        values = execution_env(fixture)
        evidence.record("gate", "MATCH", approved_hash=pkg_hash, target_ref=EXPECTED_REF)
        db = ManagementSQL(values, evidence)
        auth = AuthAdmin(values, evidence)

        # Management authorization, source hashes, complete SQL surface, exact
        # identity ambiguity, and DB-side collisions precede every Auth call.
        actor_emails = [fixture["actors"][x]["email"] for x in ("a", "b")]
        role_probe = literal_role_transport_probe(db)
        evidence.record(
            "literal-role-transport-probe",
            "MATCH",
            observed=role_probe,
            database_transaction="READ_ONLY",
            management_read_only_flag=False,
        )
        preflight = readonly_preflight(db, fixture, actor_emails)
        evidence.record(
            "preflight-db",
            "MATCH",
            migration_identity=True,
            privilege_identity=True,
            sequence=preflight["sequence"],
            baseline=preflight["baseline"],
            auth_platform_audit_records=preflight["auth_audit_diagnostic"],
            communication_global_diagnostic=preflight["communication_global_diagnostic"],
        )
        users = auth.list_users()
        if any(str(user.get("email", "")).lower() in actor_emails for user in users):
            raise Stop("an exact synthetic Auth email already exists")
        evidence.record("preflight-auth", "MATCH", exact_emails_absent=True, inspected_users=len(users))

        db.write_started = True  # subsequent transport failures cannot claim zero writes
        actor_a = auth.create_actor(fixture["actors"]["a"]["label"], actor_emails[0])
        evidence.manifest("manifest-010-actor-a", actor="a", actor_id=actor_a, email=actor_emails[0], retained=True)
        actor_b = auth.create_actor(fixture["actors"]["b"]["label"], actor_emails[1])
        evidence.manifest("manifest-011-actor-b", actor="b", actor_id=actor_b, email=actor_emails[1], retained=True)
        verify_created_actors(db, actor_a, actor_b, actor_emails[0], actor_emails[1])
        evidence.record("auth-create", "MATCH", actors_created=2, emails_confirmed=True, provider_send_invoked=False)

        generated = {
            key: str(uuid.uuid4())
            for key in (
                "customer_a1", "customer_a2", "customer_b1", "service", "staff",
                "appointment_a1", "appointment_a2",
            )
        }
        evidence.manifest("manifest-015-fixture-ids", **generated, retained=True)
        ids = provision(db, fixture, actor_a, actor_b, generated)
        evidence.manifest(
            "manifest-020-provision-identities",
            business_a=ids["business_a"], business_b=ids["business_b"],
            location_a=ids["location_a"], location_b=ids["location_b"], retained=True,
        )
        evidence.record("provision", "MATCH", public_provisioning_rows=53, generated_ids=ids)
        contained_after_provision = containment(db, ids, "containment-after-provision")
        evidence.record(
            "containment-after-provision", "MATCH",
            all_scoped_counts_zero=True, observed=contained_after_provision,
        )

        legacy_smoke(db, fixture, ids)
        evidence.record(
            "legacy-null-link",
            "MATCH",
            layer="SQL role/RLS/trigger only",
            durable_delta=0,
            api_or_signin_proof=False,
        )
        negative_cases(db, fixture, ids)
        evidence.record(
            "negative-atomic",
            "MATCH",
            currency_scope="RPC lowercase shape only",
            no_payment_scope="unsupported/no-call diagnostic only",
            outer_rollback_only=True,
        )
        r1_id = reassignment_precheck(db, fixture, ids)
        evidence.manifest("manifest-030-r1", attempt_id=r1_id, amount_cents=1300, retained=True)
        evidence.record(
            "r1-precheck",
            "MATCH",
            outcome="UNKNOWN",
            recorded=False,
            concurrent_reassignment_excluded=True,
            adoption_blocker_cleared=False,
        )

        retained = retained_matrix(db, fixture, ids, evidence)
        retained["r1"] = r1_id
        evidence.manifest("manifest-040-retained-attempts", attempts=retained, retained=True)
        contained_after_kernel = containment(db, ids, "containment-after-kernel")
        evidence.record(
            "containment-after-kernel", "MATCH",
            all_scoped_counts_zero=True, observed=contained_after_kernel,
        )
        final = final_reconciliation(db, fixture, ids, preflight)
        evidence.record("final-reconciliation", "MATCH", observed=final)
        evidence.manifest(
            "manifest-999-result",
            status="LIMITED_HOSTED_R1A_KERNEL_PASS",
            legacy_null_link="DB_COMPATIBILITY_PASS",
            end_to_end="NOT_IMPLEMENTED",
            adoption_blockers=["APPOINTMENT_CUSTOMER_REASSIGNMENT", "ISSUE_153"],
            retained_public_rows=82,
            auth_users=2,
            auth_identities=2,
            auth_platform_audit_records=final.get("auth_audit_diagnostic"),
            retained_hv134_worker_gate="REQUIRED_BEFORE_ANY_PROJECTION_OR_COMMUNICATION_ACTIVATION",
        )
        print(
            "LIMITED HOSTED R1a KERNEL PASS / LEGACY NULL-LINK DB COMPATIBILITY PASS / "
            "END-TO-END NOT IMPLEMENTED / ADOPTION BLOCKED BY REASSIGNMENT RACE AND #153"
        )
        print(f"evidence_directory={evidence.directory}")
        return 0
    except Stop as exc:
        evidence.record("run-stop", "STOP", reason=str(exc))
        evidence.manifest("manifest-999-result", status="STOPPED_PRESERVE_ALL_EVIDENCE", reason=str(exc))
        print(f"STOP: {exc}", file=sys.stderr)
        print(f"evidence_directory={evidence.directory}", file=sys.stderr)
        return 1
    except Exception as exc:
        # Deliberately redacted: exception representations may contain connection details.
        evidence.record("run-stop", "STOP", reason="unexpected coordinator failure; preserve all evidence")
        evidence.manifest("manifest-999-result", status="STOPPED_PRESERVE_ALL_EVIDENCE", reason="unexpected coordinator failure")
        print("STOP: unexpected coordinator failure; preserve all evidence and do not retry.", file=sys.stderr)
        print(f"evidence_directory={evidence.directory}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
